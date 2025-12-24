/**
 * RFQs React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listRfqs, createRfq, getRfqById } from '@/services/rfqs.service';

export const rfqKeys = {
  all: ['rfqs'] as const,
  detail: (id: string) => ['rfqs', id] as const,
};

export function useRFQs() {
  return useQuery({
    queryKey: rfqKeys.all,
    queryFn: async () => {
      const { data, error } = await listRfqs();
      if (error) throw error;
      return data ?? [];
    },
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
  
  return useMutation({
    mutationFn: createRfq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rfqKeys.all });
    },
  });
}
