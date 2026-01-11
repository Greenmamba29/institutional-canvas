/**
 * RFQs React Query Hooks
 * 
 * Org-aware: Query keys include currentOrgId for proper cache isolation.
 * All mutations use authenticated Supabase client for RLS enforcement.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useAuthenticatedClient } from '@/hooks/useAuthenticatedClient';
import { listRfqs, createRfq, getRfqById, type RFQ } from '@/services/rfqs.service';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { CreateRfqInput } from '@/lib/validation/schemas';
import { toast } from 'sonner';

export const rfqKeys = {
  all: ['rfqs'] as const,
  list: (orgId: string | null) => ['rfqs', 'list', orgId] as const,
  detail: (id: string) => ['rfqs', id] as const,
};

export function useRFQs() {
  const { currentOrgId } = useCurrentOrg();
  const { getClient } = useAuthenticatedClient();
  
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
      const client = await getClient();
      const { data, error } = await listRfqs(client);
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
  const { getClient } = useAuthenticatedClient();
  
  return useMutation({
    mutationFn: async (params: CreateRfqInput) => {
      const client = await getClient();
      const { data, error } = await createRfq(client, params);
      if (error) throw error;
      return data as RFQ;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.list(currentOrgId) });
      toast.success('RFQ created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create RFQ');
    },
  });
}
