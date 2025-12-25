/**
 * RFQs React Query Hooks
 * 
 * Org-aware: Query keys include currentOrgId for proper cache isolation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { listRfqs, createRfq, getRfqById } from '@/services/rfqs.service';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const rfqKeys = {
  all: ['rfqs'] as const,
  list: (orgId: string | null) => ['rfqs', 'list', orgId] as const,
  detail: (id: string) => ['rfqs', id] as const,
};

export function useRFQs() {
  const { currentOrgId } = useCurrentOrg();
  
  // Subscribe to realtime changes
  useRealtimeSubscription({
    table: 'rfqs',
    event: '*',
    queryKey: rfqKeys.list(currentOrgId),
    enabled: !!currentOrgId,
  });

  return useQuery({
    queryKey: rfqKeys.list(currentOrgId),
    queryFn: async () => {
      const { data, error } = await listRfqs();
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentOrgId,
  });
}

export function useRFQ(rfqId: string) {
  return useQuery({
    queryKey: rfqKeys.detail(rfqId),
    queryFn: async () => {
      const { data, error } = await getRfqById(rfqId);
      if (error) throw error;
      return data;
    },
    enabled: !!rfqId,
  });
}

export function useCreateRFQ() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();
  
  return useMutation({
    mutationFn: createRfq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.list(currentOrgId) });
    },
  });
}
