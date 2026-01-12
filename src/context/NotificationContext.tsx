import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { getNotifications, markNotificationRead } from '@/services/notifications.service';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import type { Database } from '@/integrations/supabase/types';

type DbNotification = Database['public']['Tables']['notifications']['Row'];

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Map DB notification type to UI type
function mapNotificationType(dbType: string): 'info' | 'success' | 'warning' | 'error' {
  switch (dbType) {
    case 'deal_accepted':
    case 'bid_accepted':
    case 'escrow_released':
      return 'success';
    case 'deal_rejected':
    case 'bid_rejected':
    case 'escrow_failed':
      return 'error';
    case 'kyb_required':
    case 'verification_pending':
      return 'warning';
    default:
      return 'info';
  }
}

// Map entity type to action href
function getActionForEntity(entityType: string | null, entityId: string | null): { label: string; href: string } | undefined {
  if (!entityType || !entityId) return undefined;
  
  switch (entityType) {
    case 'rfq':
      return { label: 'View RFQ', href: `/rfqs/${entityId}` };
    case 'deal':
      return { label: 'View Deal', href: `/deals/${entityId}` };
    case 'bid':
      return { label: 'View Bids', href: '/bids' };
    case 'order':
      return { label: 'View Order', href: `/orders` };
    case 'auction':
      return { label: 'View Auction', href: `/auctions` };
    case 'verification':
      return { label: 'Review', href: '/verification' };
    default:
      return undefined;
  }
}

// Transform DB notification to UI notification
function transformNotification(dbNotification: DbNotification): Notification {
  return {
    id: dbNotification.id,
    title: dbNotification.title,
    message: dbNotification.body || '',
    type: mapNotificationType(dbNotification.type),
    timestamp: new Date(dbNotification.created_at),
    read: dbNotification.is_read,
    action: getActionForEntity(dbNotification.entity_type, dbNotification.entity_id),
  };
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Only subscribe to realtime when authenticated
  useRealtimeSubscription({
    table: 'notifications',
    event: '*',
    queryKey: ['notifications'],
    enabled: isAuthenticated,
  });

  // Only query notifications when authenticated
  const { data: dbNotifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await getNotifications();
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAuthenticated, // Only run when authenticated
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Transform DB notifications to UI format
  const notifications = useMemo(() => 
    dbNotifications.map(transformNotification),
    [dbNotifications]
  );

  const unreadCount = useMemo(() => 
    notifications.filter(n => !n.read).length,
    [notifications]
  );

  // Note: addNotification is a no-op since we use backend-driven notifications
  // This maintains API compatibility but notifications should be created via RPC
  const addNotification = useCallback((_notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    console.warn('addNotification is deprecated. Use backend RPC to create notifications.');
  }, []);

  const markAsRead = useCallback((id: string) => {
    markReadMutation.mutate(id);
  }, [markReadMutation]);

  const markAllAsRead = useCallback(() => {
    // Mark each unread notification as read
    notifications
      .filter(n => !n.read)
      .forEach(n => markReadMutation.mutate(n.id));
  }, [notifications, markReadMutation]);

  // Note: These are no-ops since notifications are managed by backend
  const removeNotification = useCallback((_id: string) => {
    console.warn('removeNotification is deprecated. Notifications are managed by backend.');
  }, []);

  const clearAll = useCallback(() => {
    console.warn('clearAll is deprecated. Notifications are managed by backend.');
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
