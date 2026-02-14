/**
 * Auction Participants Service - Company and Contact lead management
 *
 * Uses list_auction_companies, upsert_auction_company, and list_auction_contacts RPCs.
 * All write operations require an authenticated Supabase client.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { callAuthenticatedRpc } from '@/lib/supabase/authenticated-client';
import type { Database } from '@/integrations/supabase/types';

export interface AuctionCompany {
  id: string;
  company_name: string;
  company_type: string;
  auction_role: string;
  country: string;
  verification_tier: string;
  kyc_status: string;
  is_broker: boolean;
  is_active: boolean;
  [key: string]: unknown;
}

export interface AuctionContact {
  id: string;
  company_id: string;
  company_name: string;
  contact_full_name: string;
  job_title: string;
  lead_status: string;
  activity_status: string;
  [key: string]: unknown;
}

/**
 * List auction companies with optional filters (public read)
 */
export async function listAuctionCompanies(
  options?: { company_type?: string; auction_role?: string; country?: string }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('list_auction_companies', {
    p_company_type: options?.company_type ?? null,
    p_auction_role: options?.auction_role ?? null,
    p_country: options?.country ?? null,
  });

  return { data: data as AuctionCompany[] | null, error: error ? new Error(error.message) : null };
}

/**
 * Create or update an auction company (authenticated)
 */
export async function upsertAuctionCompany(
  client: SupabaseClient<Database>,
  params: {
    p_id?: string;
    p_company_name: string;
    p_company_type: string;
    p_auction_role: string;
    p_country?: string;
    p_company_website?: string;
    p_verification_tier?: string;
    p_kyc_status?: string;
    p_is_broker?: boolean;
    [key: string]: unknown;
  }
) {
  return callAuthenticatedRpc<AuctionCompany>(client, 'upsert_auction_company' as keyof Database['public']['Functions'], params);
}

/**
 * List auction contacts with optional filters (public read)
 */
export async function listAuctionContacts(
  options?: { company_id?: string; lead_status?: string }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('list_auction_contacts', {
    p_company_id: options?.company_id ?? null,
    p_lead_status: options?.lead_status ?? null,
  });

  return { data: data as AuctionContact[] | null, error: error ? new Error(error.message) : null };
}
