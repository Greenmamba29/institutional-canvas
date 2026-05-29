import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHasFeature } from '@/hooks/useSubscription';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';

export interface GrantApplication {
  id: string;
  grant_id: string;
  org_id: string;
  status: string;
  submitted_at: string | null;
  awarded_at: string | null;
  award_amount: number | null;
  notes: string | null;
  airtable_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useGrantApplications(grantId?: string) {
  const hasAccess = useHasFeature('GRANT_TRACKER');

  return useQuery<GrantApplication[]>({
    queryKey: ['grant_applications', grantId],
    queryFn: async () => {
      let query = supabase.from('grant_applications').select('*');
      if (grantId) query = query.eq('grant_id', grantId);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data as GrantApplication[];
    },
    enabled: hasAccess,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  const { currentOrg } = useCurrentOrg();

  return useMutation({
    mutationFn: async (input: { grant_id: string; notes?: string }) => {
      const { data, error } = await supabase.from('grant_applications').insert({
        grant_id: input.grant_id,
        org_id: currentOrg?.id,
        status: 'draft',
        notes: input.notes,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grant_applications'] }),
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; status?: string; notes?: string; award_amount?: number }) => {
      const updates: Record<string, unknown> = {};
      if (input.status !== undefined) updates.status = input.status;
      if (input.notes !== undefined) updates.notes = input.notes;
      if (input.award_amount !== undefined) updates.award_amount = input.award_amount;
      const { data, error } = await supabase.from('grant_applications').update(updates).eq('id', input.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grant_applications'] }),
  });
}
