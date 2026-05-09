import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { toast } from 'sonner';
import {
  listIntroductions,
  getIntroductionById,
  createIntroduction,
  updateIntroductionStatus,
  updatePayoutStatus,
  getIntroductionStats,
  type CreateIntroductionInput,
  type IntroductionStatus,
  type PayoutStatus,
} from '@/services/introductions.service';

export const introductionKeys = {
  all: ['introductions'] as const,
  list: (orgId: string | null) => ['introductions', 'list', orgId] as const,
  detail: (id: string) => ['introductions', id] as const,
  stats: (orgId: string | null) => ['introductions', 'stats', orgId] as const,
};

export function useIntroductions() {
  const { currentOrgId } = useCurrentOrg();

  useRealtimeSubscription({
    table: 'introductions',
    event: '*',
    queryKey: introductionKeys.list(currentOrgId),
    enabled: !!currentOrgId,
  });

  return useQuery({
    queryKey: introductionKeys.list(currentOrgId),
    queryFn: async () => {
      const { data, error } = await listIntroductions(currentOrgId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentOrgId,
  });
}

export function useIntroduction(id: string) {
  return useQuery({
    queryKey: introductionKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await getIntroductionById(id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useIntroductionStats() {
  const { currentOrgId } = useCurrentOrg();

  return useQuery({
    queryKey: introductionKeys.stats(currentOrgId),
    queryFn: async () => {
      const { data, error } = await getIntroductionStats(currentOrgId!);
      if (error) throw error;
      return data;
    },
    enabled: !!currentOrgId,
  });
}

export function useCreateIntroduction() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();

  return useMutation({
    mutationFn: (input: Omit<CreateIntroductionInput, 'org_id'>) =>
      createIntroduction({ ...input, org_id: currentOrgId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: introductionKeys.list(currentOrgId) });
      queryClient.invalidateQueries({ queryKey: introductionKeys.stats(currentOrgId) });
      toast.success('Introduction logged');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create introduction'),
  });
}

export function useUpdateIntroductionStatus() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: IntroductionStatus }) =>
      updateIntroductionStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: introductionKeys.list(currentOrgId) });
      queryClient.invalidateQueries({ queryKey: introductionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: introductionKeys.stats(currentOrgId) });
      toast.success('Status updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update status'),
  });
}

export function useUpdatePayoutStatus() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();

  return useMutation({
    mutationFn: ({ id, payout_status, payout_date }: { id: string; payout_status: PayoutStatus; payout_date?: string }) =>
      updatePayoutStatus(id, payout_status, payout_date),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: introductionKeys.list(currentOrgId) });
      queryClient.invalidateQueries({ queryKey: introductionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: introductionKeys.stats(currentOrgId) });
      toast.success('Payout status updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update payout'),
  });
}
