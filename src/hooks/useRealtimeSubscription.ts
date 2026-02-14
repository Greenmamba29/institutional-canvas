/**
 * Realtime Subscription Hook
 *
 * Subscribes to postgres_changes and auto-invalidates React Query cache
 * when data changes in the database
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/rpc';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSubscriptionOptions {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  queryKey: readonly unknown[];
  enabled?: boolean;
}

/**
 * Subscribe to realtime changes for a specific table
 * and automatically invalidate related React Query cache
 *
 * @example
 * useRealtimeSubscription({
 *   table: 'rfqs',
 *   event: '*',
 *   filter: `org_id=eq.${currentOrgId}`,
 *   queryKey: rfqKeys.all,
 * });
 */
export function useRealtimeSubscription({
  table,
  event = '*',
  filter,
  queryKey,
  enabled = true,
}: RealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    let channel: RealtimeChannel | null = null;

    const setupSubscription = () => {
      // Create a unique channel name
      const channelName = `${table}_${event}_${filter || 'all'}`.replace(/[^a-zA-Z0-9_]/g, '_');

      channel = supabase.channel(channelName);

      // Use type assertion to handle the postgres_changes subscription
      (channel as any).on(
        'postgres_changes',
        {
          event: event,
          schema: 'public',
          table,
          ...(filter ? { filter } : {}),
        },
        () => {
          // Invalidate the related query to trigger a refetch
          queryClient.invalidateQueries({ queryKey });
        }
      ).subscribe();
    };

    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, event, filter, queryKey, enabled, queryClient]);
}

// useRealtimeSubscriptions removed — calling hooks inside .forEach() violates Rules of Hooks.
// Use individual useRealtimeSubscription() calls instead.
