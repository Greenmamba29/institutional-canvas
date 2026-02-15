/**
 * Recycling Service - LithiumBuy RPC Layer
 *
 * Uses list_recycling_projects RPC.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { callAuthenticatedRpc } from '@/lib/supabase/authenticated-client';
import type { Tables, Database } from '@/integrations/supabase/types';

export type RecyclingProject = Tables<'recycling_projects'>;

/**
 * List all recycling projects for the current org (authenticated)
 */
export async function listRecyclingProjects(
  client: SupabaseClient<Database>
): Promise<{ data: RecyclingProject[] | null; error: Error | null }> {
  return callAuthenticatedRpc<RecyclingProject[]>(client, 'list_recycling_projects');
}
