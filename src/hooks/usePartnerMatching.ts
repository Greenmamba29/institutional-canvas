import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHasFeature } from '@/hooks/useSubscription';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';

export interface PartnerMatch {
  id: string;
  org_id: string;
  partner_org_id: string;
  grant_id: string | null;
  role: string;
  status: string;
  match_score: number | null;
  notes: string | null;
  airtable_id: string | null;
  created_at: string;
  updated_at: string;
}

export function usePartnerMatches(grantId?: string) {
  const hasAccess = useHasFeature('PARTNER_MATCHING');
  const { currentOrg } = useCurrentOrg();
  const isLocked = !hasAccess;

  const query = useQuery<PartnerMatch[]>({
    queryKey: ['partner_matches', currentOrg?.id, grantId],
    queryFn: async () => {
      let q = supabase.from('partner_matching').select('*').eq('org_id', currentOrg!.id);
      if (grantId) q = q.eq('grant_id', grantId);
      const { data, error } = await q.order('match_score', { ascending: false });
      if (error) throw error;
      return data as PartnerMatch[];
    },
    enabled: hasAccess && !!currentOrg?.id,
    staleTime: 5 * 60 * 1000,
  });

  return { ...query, isLocked };
}

export function useCreatePartnerMatch() {
  const qc = useQueryClient();
  const { currentOrg } = useCurrentOrg();

  return useMutation({
    mutationFn: async (input: { partner_org_id: string; grant_id?: string; role?: string; notes?: string }) => {
      const { data, error } = await supabase.from('partner_matching').insert({
        org_id: currentOrg?.id,
        partner_org_id: input.partner_org_id,
        grant_id: input.grant_id,
        role: input.role || 'co-applicant',
        status: 'proposed',
        notes: input.notes,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner_matches'] }),
  });
}
