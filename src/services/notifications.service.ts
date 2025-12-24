/**
 * Notifications Service - Lithium & Lux RPC Layer
 * 
 * Uses get_notifications and mark_notification_read RPCs
 */

import { callRpc } from '@/lib/supabase/rpc';
import type { Tables } from '@/integrations/supabase/types';

export type Notification = Tables<'notifications'>;

/**
 * Get all notifications for the current org
 */
export async function getNotifications() {
  return callRpc<Notification[]>('get_notifications');
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string) {
  return callRpc<boolean>('mark_notification_read', { p_notification_id: notificationId });
}
