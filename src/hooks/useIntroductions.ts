import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { toast } from 'sonner';
import {
  listIntroductions,
  listMyMatches,
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
  list: () => ['introductions', 'list'] as const,
  matches: () => ['introductions', 'matches'] as const,
  detail: (id: string) => ['introductions', id] as const,
  stats: () => ['introductions', 'stats'] as const,
};

// All introductions visible to the caller (creating org + involved buyer/seller orgs via RLS)
export function useIntroductions() {
  useRealtimeSubscription({
    table: 'introductions',
    event: '*',
    queryKey: introductionKeys.list(),
    enabled: true,
  });

  return useQuery({
    queryKey: introductionKeys.list(),
    queryFn: async () => {
      const { data, error } = await listIntroductions();
      if (error) throw error;
      return data ?? [];
    },
  });
}

// Active introductions where the caller is a named buyer or seller — "your matches"
export function useMyMatches() {
  return useQuery({
    queryKey: introductionKeys.matches(),
    queryFn: async () => {
      const { data, error } = await listMyMatches();
      if (error) throw error;
      return data ?? [];
    },
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
  return useQuery({
    queryKey: introductionKeys.stats(),
    queryFn: async () => {
      const { data, error } = await getIntroductionStats();
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateIntroduction() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();

  return useMutation({
    mutationFn: (input: Omit<CreateIntroductionInput, 'org_id'>) =>
      createIntroduction({ ...input, org_id: currentOrgId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: introductionKeys.list() });
      queryClient.invalidateQueries({ queryKey: introductionKeys.stats() });
      toast.success('Introduction logged');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create introduction'),
  });
}

export function useUpdateIntroductionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: IntroductionStatus }) =>
      updateIntroductionStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: introductionKeys.list() });
      queryClient.invalidateQueries({ queryKey: introductionKeys.matches() });
      queryClient.invalidateQueries({ queryKey: introductionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: introductionKeys.stats() });
      toast.success('Status updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update status'),
  });
}

export function useUpdatePayoutStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payout_status, payout_date }: { id: string; payout_status: PayoutStatus; payout_date?: string }) =>
      updatePayoutStatus(id, payout_status, payout_date),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: introductionKeys.list() });
      queryClient.invalidateQueries({ queryKey: introductionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: introductionKeys.stats() });
      toast.success('Payout status updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update payout'),
  });
}
