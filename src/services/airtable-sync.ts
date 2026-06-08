/**
 * Airtable Sync Helper
 *
 * Shared best-effort mirror of Supabase mutations to Airtable via the
 * `sync-to-airtable` edge function.
 *
 * Airtable is mandatory as the operational/CRM layer (see CLAUDE.md dual-write
 * pattern), but a sync failure must NEVER block or break the primary Supabase
 * mutation. Every call here swallows + logs its own errors and resolves to a
 * boolean indicating success. Callers should fire-and-forget (or await without
 * branching on the result) after the primary RPC has already succeeded.
 *
 * Request contract (see supabase/functions/sync-to-airtable/index.ts):
 *   { table: string; record: Record<string, any>; action?: 'create' | 'update' | 'delete'; recordId?: string }
 */

import { supabase } from '@/integrations/supabase/client';

export type AirtableSyncAction = 'create' | 'update' | 'delete';

export interface AirtableSyncResult {
  success: boolean;
  error?: string;
}

/**
 * Mirror a single Supabase record to Airtable. Best-effort: never throws.
 *
 * @param table   Supabase table name (maps to an Airtable table inside the edge function)
 * @param record  The full record/fields payload to mirror
 * @param action  create | update | delete (default: create)
 * @param recordId Airtable record id, required for update/delete
 */
export async function syncToAirtable(
  table: string,
  record: Record<string, unknown>,
  action: AirtableSyncAction = 'create',
  recordId?: string
): Promise<AirtableSyncResult> {
  try {
    const { data, error } = await supabase.functions.invoke('sync-to-airtable', {
      body: { table, record, action, recordId },
    });

    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Unknown Airtable sync error');

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Airtable sync error';
    // Swallow + log: the primary mutation has already succeeded and must not be
    // affected by a downstream Airtable failure.
    console.error(`[AirtableSync] Failed to ${action} ${table} record:`, message);
    return { success: false, error: message };
  }
}

/**
 * Convenience wrapper: only attempts the sync when a non-null record is present.
 * Useful right after an RPC that may return null on a no-op.
 */
export async function syncRecordToAirtable(
  table: string,
  record: Record<string, unknown> | null | undefined,
  action: AirtableSyncAction = 'create',
  recordId?: string
): Promise<AirtableSyncResult> {
  if (!record) {
    return { success: false, error: 'No record to sync' };
  }
  return syncToAirtable(table, record, action, recordId);
}
