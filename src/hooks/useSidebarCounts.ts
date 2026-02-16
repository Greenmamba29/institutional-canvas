/**
 * Sidebar Counts Hook
 * 
 * Provides real-time badge counts for sidebar navigation items.
 * Queries actual database tables instead of hardcoded values.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';

export interface SidebarCounts {
  auctions: number;
  recycling: number;
  bids: number;
  rfqs: number;
  orders: number;
  messages: number;
  verification: number;
}

async function fetchSidebarCounts(orgId: string | null): Promise<SidebarCounts> {
  // Run all count queries in parallel
  const [auctionsRes, bidsRes, rfqsRes, ordersRes, messagesRes] = await Promise.all([
    supabase
      .from('auctions')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'scheduled']),
    supabase
      .from('bids')
      .select('id', { count: 'exact', head: true })
      .eq('is_withdrawn', false),
    supabase
      .from('rfqs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'submitted'),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'confirmed', 'processing']),
    supabase
      .from('direct_messages')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null),
  ]);

  return {
    auctions: auctionsRes.count ?? 0,
    recycling: 0, // No dedicated recycling table yet
    bids: bidsRes.count ?? 0,
    rfqs: rfqsRes.count ?? 0,
    orders: ordersRes.count ?? 0,
    messages: messagesRes.count ?? 0,
    verification: 0, // Admin-only, fetched separately if needed
  };
}

export function useSidebarCounts() {
  const { currentOrgId } = useCurrentOrg();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['sidebar-counts', currentOrgId],
    queryFn: () => fetchSidebarCounts(currentOrgId),
    staleTime: 30000, // 30s
    refetchOnWindowFocus: true,
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
