/**
 * Audit Log React Query Hook
 * 
 * Fetches activity log entries for the dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';

export interface AuditEntry {
  id: string;
  type: 'approved' | 'cancelled' | 'flagged' | 'withdrawal';
  title: string;
  description: string;
  timestamp: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
}

export const auditLogKeys = {
  all: ['auditLog'] as const,
  list: (orgId: string | null) => ['auditLog', 'list', orgId] as const,
};

// Map action types to UI categories
function mapActionToType(action: string): AuditEntry['type'] {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('approve') || actionLower.includes('verify')) return 'approved';
  if (actionLower.includes('cancel') || actionLower.includes('reject')) return 'cancelled';
  if (actionLower.includes('flag') || actionLower.includes('warn')) return 'flagged';
  return 'withdrawal'; // Default to withdrawal for other actions
}

// Format timestamp to relative time
function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
  
  if (months > 0) return `${months}M AGO`;
  if (days > 0) return `${days}D AGO`;
  if (hours > 0) return `${hours}H AGO`;
  if (minutes > 0) return `${minutes}M AGO`;
  return 'JUST NOW';
}

// Get action button text based on resource type
function getActionText(resourceType: string): string {
  switch (resourceType.toLowerCase()) {
    case 'deal':
      return 'VIEW DEAL';
    case 'rfq':
      return 'VIEW RFQ';
    case 'escrow':
    case 'purchase':
      return 'ESCROW DETAILS';
    case 'kyb':
    case 'verification':
      return 'REVIEW';
    case 'order':
      return 'VIEW ORDER';
    case 'settlement':
      return 'SETTLEMENT';
    default:
      return 'VIEW';
  }
}

export function useAuditLog(limit: number = 10) {
  const { currentOrgId } = useCurrentOrg();
  
  return useQuery({
    queryKey: [...auditLogKeys.list(currentOrgId), limit],
    queryFn: async () => {
      // First try activity_log, fall back to audit_log
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        // Try audit_log table as fallback
        const { data: auditData, error: auditError } = await supabase
          .from('audit_log')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (auditError) throw auditError;

        return (auditData ?? []).map((entry): AuditEntry => ({
          id: entry.id,
          type: mapActionToType(entry.action),
          title: entry.action,
          description: `${entry.entity_type} ${entry.outcome}`,
          timestamp: formatRelativeTime(entry.created_at),
          action: getActionText(entry.entity_type),
          resourceType: entry.entity_type,
          resourceId: entry.entity_id ?? undefined,
        }));
      }

      return (data ?? []).map((entry): AuditEntry => ({
        id: entry.id,
        type: mapActionToType(entry.action),
        title: entry.action,
        description: typeof entry.details === 'object' && entry.details !== null 
          ? (entry.details as Record<string, unknown>).message as string || entry.resource_type
          : entry.resource_type,
        timestamp: formatRelativeTime(entry.timestamp || new Date().toISOString()),
        action: getActionText(entry.resource_type),
        resourceType: entry.resource_type,
        resourceId: entry.resource_id ?? undefined,
      }));
    },
    enabled: !!currentOrgId,
  });
}
