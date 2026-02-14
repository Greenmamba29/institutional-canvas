/**
 * Airtable CRUD Service
 * Full CRUD operations via the airtable-crud edge function.
 */

import { supabase } from '@/integrations/supabase/client';

export type AirtableTable = 'Market_Intelligence' | 'Auction_Companies' | 'Auction_Contacts' | 'FAQs' | 'Products';

export interface AirtableCrudOptions {
  table: AirtableTable;
  action?: 'list' | 'create' | 'update' | 'delete';
  filter?: string;
  maxRecords?: number;
  sort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  record?: Record<string, unknown>;
  recordId?: string;
}

export interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}

export interface AirtableCrudResponse {
  configured: boolean;
  records?: AirtableRecord[];
  error?: string;
}

export async function airtableCrud(options: AirtableCrudOptions): Promise<AirtableCrudResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('airtable-crud', {
      body: options,
    });

    if (error) {
      console.error('Airtable CRUD error:', error);
      return { configured: false, error: error.message };
    }

    return data as AirtableCrudResponse;
  } catch (err) {
    console.error('Airtable CRUD exception:', err);
    return { configured: false, error: String(err) };
  }
}

export async function listAirtableRecords(table: AirtableTable, filter?: string, maxRecords = 100) {
  return airtableCrud({ table, action: 'list', filter, maxRecords });
}

export async function createAirtableRecord(table: AirtableTable, record: Record<string, unknown>) {
  return airtableCrud({ table, action: 'create', record });
}

export async function updateAirtableRecord(table: AirtableTable, recordId: string, record: Record<string, unknown>) {
  return airtableCrud({ table, action: 'update', recordId, record });
}

export async function deleteAirtableRecord(table: AirtableTable, recordId: string) {
  return airtableCrud({ table, action: 'delete', recordId });
}
