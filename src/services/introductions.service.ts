import { supabase } from '@/lib/supabase/rpc';

export type IntroductionStatus =
  | 'Pending'
  | 'Introduced'
  | 'In Negotiation'
  | 'Deal Closed'
  | 'Fee Due'
  | 'Paid Out'
  | 'Expired'
  | 'Cancelled';

export type PayoutStatus = 'Unpaid' | 'Processing' | 'Paid';

export interface Introduction {
  id: string;
  airtable_id: string | null;
  introduction_id: string | null;
  introducer_name: string | null;
  introducer_email: string | null;
  introducer_org: string | null;
  buyer_org: string | null;
  buyer_org_id: string | null;
  buyer_contact: string | null;
  buyer_email: string | null;
  seller_org: string | null;
  seller_org_id: string | null;
  seller_contact: string | null;
  seller_email: string | null;
  commodity: string | null;
  intro_date: string | null;
  deal_value_usd: number | null;
  intro_fee_percent: number | null;
  intro_fee_amount: number | null;
  status: IntroductionStatus;
  payout_status: PayoutStatus;
  payout_date: string | null;
  deal_id: string | null;
  telebuy_session_id: string | null;
  org_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIntroductionInput {
  introducer_name: string;
  introducer_email?: string;
  introducer_org?: string;
  buyer_org: string;
  buyer_org_id?: string;
  buyer_contact?: string;
  buyer_email?: string;
  seller_org: string;
  seller_org_id?: string;
  seller_contact?: string;
  seller_email?: string;
  commodity?: string;
  intro_date?: string;
  deal_value_usd?: number;
  intro_fee_percent?: number;
  telebuy_session_id?: string;
  notes?: string;
  org_id: string;
}

// Returns all introductions visible to the caller's org —
// either as the creating org, the named buyer org, or the named seller org.
// RLS enforces the visibility; no explicit filter needed.
export async function listIntroductions() {
  return supabase
    .from('introductions')
    .select('*')
    .order('created_at', { ascending: false });
}

// Returns only active introductions where the caller's org is the named buyer or seller.
// Used to show "your matches" to non-admin users.
export async function listMyMatches() {
  return supabase
    .from('introductions')
    .select('*')
    .in('status', ['Pending', 'Introduced', 'In Negotiation'])
    .order('created_at', { ascending: false });
}

export async function getIntroductionById(id: string) {
  return supabase
    .from('introductions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
}

export async function createIntroduction(input: CreateIntroductionInput) {
  return supabase
    .from('introductions')
    .insert({ ...input, intro_fee_percent: input.intro_fee_percent ?? 0.5 })
    .select()
    .single();
}

export async function updateIntroductionStatus(id: string, status: IntroductionStatus) {
  return supabase
    .from('introductions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

export async function updatePayoutStatus(id: string, payout_status: PayoutStatus, payout_date?: string) {
  return supabase
    .from('introductions')
    .update({ payout_status, payout_date: payout_date ?? null, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

export async function getIntroductionStats() {
  const { data, error } = await supabase
    .from('introductions')
    .select('status, payout_status, deal_value_usd, intro_fee_amount');

  if (error || !data) return { error, data: null };

  const stats = {
    total: data.length,
    totalPipelineValue: data.reduce((s, r) => s + (r.deal_value_usd ?? 0), 0),
    totalFeesEarned: data
      .filter(r => r.payout_status === 'Paid')
      .reduce((s, r) => s + (r.intro_fee_amount ?? 0), 0),
    feesDue: data
      .filter(r => r.status === 'Fee Due' && r.payout_status !== 'Paid')
      .reduce((s, r) => s + (r.intro_fee_amount ?? 0), 0),
    byStatus: data.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {}),
  };

  return { data: stats, error: null };
}
