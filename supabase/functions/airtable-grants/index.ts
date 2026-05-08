import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

  const token = authHeader.replace('Bearer ', '');
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) return json({ error: 'Invalid token' }, 401);

  // Use user-scoped client for RPC (respects RLS)
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: tierData } = await userClient.rpc('get_subscription_tier');
  const tier: string = tierData || 'free';
  const isPro = tier === 'pro' || tier === 'enterprise' || tier === 'admin';
  const isEnterprise = tier === 'enterprise' || tier === 'admin';

  const body = await req.json();
  const { action, ...params } = body;

  if (!action) return json({ error: 'action is required' }, 400);

  // Resolve org_id for this user
  const { data: orgMember } = await userClient
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .single();
  const orgId = orgMember?.org_id;

  try {
    switch (action) {
      case 'list_grants': {
        if (!isPro) return json({ error: 'Pro subscription required' }, 403);
        let query = userClient.from('grants').select('*');
        if (params.status) query = query.eq('status', params.status);
        if (params.funding_source) query = query.eq('funding_source', params.funding_source);
        if (params.deadline_before) query = query.lte('deadline', params.deadline_before);
        query = query.order('deadline', { ascending: true }).limit(params.limit || 50);
        const { data, error } = await query;
        if (error) throw error;
        return json({ success: true, grants: data });
      }

      case 'get_grant': {
        if (!isPro) return json({ error: 'Pro subscription required' }, 403);
        if (!params.id) return json({ error: 'id is required' }, 400);
        const { data, error } = await userClient.from('grants').select('*').eq('id', params.id).single();
        if (error) throw error;
        return json({ success: true, grant: data });
      }

      case 'check_eligibility': {
        if (!isPro) return json({ error: 'Pro subscription required' }, 403);
        if (!params.grant_id || !orgId) return json({ error: 'grant_id and org context required' }, 400);
        const { data: grant } = await userClient.from('grants').select('eligibility_criteria').eq('id', params.grant_id).single();
        const criteria = grant?.eligibility_criteria || {};
        // Simple scoring: count matched keys
        const orgData = params.org_data || {};
        const keys = Object.keys(criteria);
        const matched = keys.filter(k => orgData[k] !== undefined && orgData[k] !== null && orgData[k] !== '');
        const score = keys.length > 0 ? Math.round((matched.length / keys.length) * 100) : 0;
        return json({ success: true, score, matched_criteria: matched, total_criteria: keys.length });
      }

      case 'list_applications': {
        if (!isPro) return json({ error: 'Pro subscription required' }, 403);
        let query = userClient.from('grant_applications').select('*, grants(title, funding_source, deadline)');
        if (params.grant_id) query = query.eq('grant_id', params.grant_id);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return json({ success: true, applications: data });
      }

      case 'create_application': {
        if (!isPro) return json({ error: 'Pro subscription required' }, 403);
        if (!params.grant_id || !orgId) return json({ error: 'grant_id required' }, 400);
        const { data, error } = await userClient.from('grant_applications').insert({
          grant_id: params.grant_id,
          org_id: orgId,
          status: params.status || 'draft',
          notes: params.notes,
        }).select().single();
        if (error) throw error;
        return json({ success: true, application: data });
      }

      case 'update_application': {
        if (!isPro) return json({ error: 'Pro subscription required' }, 403);
        if (!params.id) return json({ error: 'id is required' }, 400);
        const updates: Record<string, unknown> = {};
        if (params.status) updates.status = params.status;
        if (params.notes !== undefined) updates.notes = params.notes;
        if (params.award_amount !== undefined) updates.award_amount = params.award_amount;
        const { data, error } = await userClient.from('grant_applications').update(updates).eq('id', params.id).select().single();
        if (error) throw error;
        return json({ success: true, application: data });
      }

      case 'list_partner_matches': {
        if (!isEnterprise) return json({ error: 'Enterprise subscription required' }, 403);
        let query = userClient.from('partner_matching').select('*').eq('org_id', orgId);
        if (params.grant_id) query = query.eq('grant_id', params.grant_id);
        const { data, error } = await query.order('match_score', { ascending: false });
        if (error) throw error;
        return json({ success: true, matches: data });
      }

      case 'create_partner_match': {
        if (!isEnterprise) return json({ error: 'Enterprise subscription required' }, 403);
        if (!params.partner_org_id) return json({ error: 'partner_org_id required' }, 400);
        const { data, error } = await userClient.from('partner_matching').insert({
          org_id: orgId,
          partner_org_id: params.partner_org_id,
          grant_id: params.grant_id,
          role: params.role || 'co-applicant',
          status: 'proposed',
          notes: params.notes,
        }).select().single();
        if (error) throw error;
        return json({ success: true, match: data });
      }

      case 'get_funding_pipeline': {
        if (!isEnterprise) return json({ error: 'Enterprise subscription required' }, 403);
        const { data, error } = await userClient.from('funding_pipeline')
          .select('*, grants(title, funding_source)')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return json({ success: true, pipeline: data });
      }

      default:
        return json({ error: `Unknown action "${action}"` }, 400);
    }
  } catch (err) {
    console.error('[airtable-grants] Error:', err);
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
