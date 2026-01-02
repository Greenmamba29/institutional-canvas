/**
 * Notifications React Query Hooks
 * 
 * Includes realtime subscription for live updates
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotifications, markNotificationRead } from '@/services/notifications.service';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const notificationKeys = {
  all: ['notifications'] as const,
};

export function useNotifications() {
  // Subscribe to realtime notifications updates
  useRealtimeSubscription({
    table: 'notifications',
    event: '*',
    queryKey: notificationKeys.all,
  });

  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: async () => {
      const { data, error } = await getNotifications();
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
