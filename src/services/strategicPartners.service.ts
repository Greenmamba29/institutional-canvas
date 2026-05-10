import { supabase } from '@/integrations/supabase/client';

export interface StrategicPartner {
  id: string;
  airtable_id: string | null;
  organization_name: string;
  partner_tier: string | null;
  segment: string | null;
  revenue_streams: string[] | null;
  outreach_status: string | null;
  priority_score: number | null;
  contact_name: string | null;
  contact_email: string | null;
  linkedin_url: string | null;
  website: string | null;
  country: string | null;
  hq_city: string | null;
  key_opportunity: string | null;
  next_action: string | null;
  next_action_date: string | null;
  last_contact_date: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface StrategicPartnerFilters {
  tier?: string;
  segment?: string;
  status?: string;
}

export async function listStrategicPartners(filters?: StrategicPartnerFilters) {
  let query = supabase
    .from('strategic_partners')
    .select('*')
    .order('priority_score', { ascending: false })
    .order('next_action_date', { ascending: true });

  if (filters?.tier) query = query.eq('partner_tier', filters.tier);
  if (filters?.segment) query = query.eq('segment', filters.segment);
  if (filters?.status) query = query.eq('outreach_status', filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return data as StrategicPartner[];
}

export async function updateStrategicPartner(id: string, updates: Partial<StrategicPartner>) {
  const { data, error } = await supabase
    .from('strategic_partners')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as StrategicPartner;
}

export async function getStrategicPartnerStats() {
  const { data, error } = await supabase
    .from('strategic_partners')
    .select('partner_tier, outreach_status, segment');
  if (error) throw error;

  const partners = data ?? [];
  const byStatus = partners.reduce<Record<string, number>>((acc, p) => {
    const s = p.outreach_status ?? 'Not Started';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const bySegment = partners.reduce<Record<string, number>>((acc, p) => {
    const s = p.segment ?? 'Other';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total: partners.length,
    tier1: partners.filter(p => p.partner_tier?.includes('Tier 1')).length,
    inProgress: (byStatus['Outreach Sent'] ?? 0) + (byStatus['In Conversation'] ?? 0),
    activePartners: (byStatus['Partnership Agreed'] ?? 0) + (byStatus['Active Partner'] ?? 0),
    byStatus,
    bySegment,
  };
}
