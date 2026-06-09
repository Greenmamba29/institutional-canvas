/**
 * Sidebar Counts Hook
 *
 * Provides real-time badge counts for sidebar navigation items.
 * Queries actual database tables instead of hardcoded values.
 *
 * IMPORTANT: Counts MUST use the same org/user scope as the pages they
 * badge. RFQ count is derived from the exact same `list_rfqs` RPC the
 * RFQs page list uses, so the badge always equals the visible list.
 * All other counts use the authenticated client so RLS applies the same
 * org scoping the corresponding pages see (the anon client has no auth
 * context and would return a different — often empty or global — set).
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useAuthenticatedClient } from '@/hooks/useAuthenticatedClient';
import { listRfqs } from '@/services/rfqs.service';
import { Database } from '@/integrations/supabase/types';

export interface SidebarCounts {
  auctions: number;
  recycling: number;
  bids: number;
  rfqs: number;
  orders: number;
  messages: number;
  verification: number;
}

async function fetchSidebarCounts(
  client: SupabaseClient<Database>
): Promise<SidebarCounts> {
  // RFQ count comes from the SAME source as the RFQs page list (org-scoped
  // `list_rfqs` RPC, no status filter) so badge === visible list.
  const [rfqsRes, auctionsRes, bidsRes, ordersRes, messagesRes] = await Promise.all([
    listRfqs(client),
    client
      .from('auctions')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'scheduled']),
    client
      .from('bids')
      .select('id', { count: 'exact', head: true })
      .eq('is_withdrawn', false),
    client
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed', 'processing']),
    client
      .from('direct_messages')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null),
  ]);

  return {
    auctions: auctionsRes.count ?? 0,
    recycling: 0, // No dedicated recycling table yet
    bids: bidsRes.count ?? 0,
    rfqs: rfqsRes.data?.length ?? 0,
    orders: ordersRes.count ?? 0,
    messages: messagesRes.count ?? 0,
    verification: 0, // Admin-only, fetched separately if needed
  };
}

export function useSidebarCounts() {
  const { currentOrgId } = useCurrentOrg();
  const { getClient } = useAuthenticatedClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sidebar-counts', currentOrgId],
    queryFn: async () => {
      const client = await getClient();
      return fetchSidebarCounts(client);
    },
    enabled: !!currentOrgId,
    staleTime: 2 * 60 * 1000,   // 2 minutes — realtime handles live updates
    gcTime: 5 * 60 * 1000,       // 5 minutes garbage collection
    refetchOnWindowFocus: false, // realtime subscriptions handle updates
  });

  // Subscribe to realtime changes on key tables
  useEffect(() => {
    const channel = supabase
      .channel('sidebar-counts-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rfqs' }, () => {
        queryClient.invalidateQueries({ queryKey: ['sidebar-counts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, () => {
        queryClient.invalidateQueries({ queryKey: ['sidebar-counts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auctions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['sidebar-counts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        queryClient.invalidateQueries({ queryKey: ['sidebar-counts'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['sidebar-counts'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
