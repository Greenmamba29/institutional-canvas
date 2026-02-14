/**
 * Airtable CRUD Service - Full CRUD operations with subscription gating
 * Connects to airtable-crud Edge Function for create/read/update/delete
 *
 * SECURITY: API keys are stored server-side in Edge Function secrets, not exposed to client
 */

import { supabase } from '@/integrations/supabase/client';

type AirtableAction = 'create' | 'read' | 'update' | 'delete' | 'list';
type AirtableTable = 'FAQs' | 'Products' | 'Market_Intelligence' | 'Auction_Companies' | 'Auction_Contacts' | 'Prompt_Executions' | 'Decision_Log' | 'Blockers' | 'Analytics_Events' | 'GMV_Metrics';

interface AirtableCrudParams {
  action: AirtableAction;
  table: AirtableTable;
  record_id?: string;
  fields?: Record<string, unknown>;
  filter?: string;
  maxRecords?: number;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  subscription_tier?: 'free' | 'pro' | 'enterprise';
  records?: Array<{ fields: Record<string, unknown> }>; // enterprise batch
}

/**
 * Generic Airtable CRUD operation via Edge Function proxy
 */
export async function airtableCrud<T = unknown>(params: AirtableCrudParams): Promise<{
  records?: T[];
  record?: T;
  deleted?: boolean;
  configured: boolean;
}> {
  const { data, error } = await supabase.functions.invoke('airtable-crud', {
    body: params,
  });

  if (error) {
    console.error('Airtable CRUD error:', error);
    throw new Error(error.message || 'Airtable operation failed');
  }

  return data;
}

// Convenience wrappers

export const listAirtableRecords = <T>(
  table: AirtableTable,
  options?: {
    filter?: string;
    maxRecords?: number;
    sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
    subscription_tier?: 'free' | 'pro' | 'enterprise';
  }
) => airtableCrud<T>({ action: 'list', table, ...options });

export const createAirtableRecord = <T>(
  table: AirtableTable,
  fields: Record<string, unknown>,
  subscription_tier: 'pro' | 'enterprise' = 'pro'
) => airtableCrud<T>({ action: 'create', table, fields, subscription_tier });

export const updateAirtableRecord = <T>(
  table: AirtableTable,
  record_id: string,
  fields: Record<string, unknown>,
  subscription_tier: 'pro' | 'enterprise' = 'pro'
) => airtableCrud<T>({ action: 'update', table, record_id, fields, subscription_tier });

export const deleteAirtableRecord = (
  table: AirtableTable,
  record_id: string,
  subscription_tier: 'pro' | 'enterprise' = 'pro'
) => airtableCrud({ action: 'delete', table, record_id, subscription_tier });
