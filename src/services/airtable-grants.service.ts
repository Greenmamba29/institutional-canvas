import { supabase } from '@/integrations/supabase/client';

const FUNCTION_NAME = 'airtable-grants';

async function getAuthToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return session.access_token;
}

async function callGrantsFunction(action: string, params: Record<string, unknown> = {}) {
  const token = await getAuthToken();
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body: { action, ...params },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (error) throw error;
  return data;
}

export const AirtableGrantsService = {
  listGrants: (filters?: { status?: string; funding_source?: string; deadline_before?: string }) =>
    callGrantsFunction('list_grants', filters || {}),

  getGrant: (id: string) =>
    callGrantsFunction('get_grant', { id }),

  checkEligibility: (grant_id: string, org_data: Record<string, unknown>) =>
    callGrantsFunction('check_eligibility', { grant_id, org_data }),

  listApplications: (grant_id?: string) =>
    callGrantsFunction('list_applications', grant_id ? { grant_id } : {}),

  createApplication: (grant_id: string, notes?: string) =>
    callGrantsFunction('create_application', { grant_id, notes }),

  updateApplication: (id: string, updates: { status?: string; notes?: string; award_amount?: number }) =>
    callGrantsFunction('update_application', { id, ...updates }),

  listPartnerMatches: (grant_id?: string) =>
    callGrantsFunction('list_partner_matches', grant_id ? { grant_id } : {}),

  createPartnerMatch: (partner_org_id: string, options?: { grant_id?: string; role?: string; notes?: string }) =>
    callGrantsFunction('create_partner_match', { partner_org_id, ...options }),

  getFundingPipeline: () =>
    callGrantsFunction('get_funding_pipeline'),
};
