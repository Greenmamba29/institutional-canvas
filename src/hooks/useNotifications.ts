/**
 * Notifications React Query Hooks
 * 
 * Includes realtime subscription for live updates (no polling)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationRead } from '@/services/notifications.service';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { useCurrentOrg } from './useCurrentOrg';

export const notificationKeys = {
  all: ['notifications'] as const,
  byOrg: (orgId: string | null) => ['notifications', orgId] as const,
};

export function useNotifications() {
  const { currentOrgId } = useCurrentOrg();
  
  // Subscribe to realtime notifications updates - replaces polling
  useRealtimeSubscription({
    table: 'notifications',
    event: '*',
    queryKey: notificationKeys.byOrg(currentOrgId),
    enabled: !!currentOrgId,
  });

  return useQuery({
    queryKey: notificationKeys.byOrg(currentOrgId),
    queryFn: async () => {
      const { data, error } = await getNotifications();
      if (error) throw error;
      return data ?? [];
    },
    // No refetchInterval - realtime subscription handles updates
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();
  
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.byOrg(currentOrgId) });
    },
  });
}

export function useUnreadCount() {
  const { data: notifications = [] } = useNotifications();
  return notifications.filter((n) => !n.is_read).length;
}
