import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHasFeature } from '@/hooks/useSubscription';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';

export interface ReadinessScore {
  id: string;
  org_id: string;
  score: number;
  details: Record<string, unknown> | null;
  criteria_met: Record<string, unknown> | null;
  updated_at: string;
}

export function useReadinessScore() {
  const hasAccess = useHasFeature('READINESS_DASHBOARD');
  const { currentOrg } = useCurrentOrg();
  const isLocked = !hasAccess;

  const query = useQuery<ReadinessScore | null>({
    queryKey: ['readiness_score', currentOrg?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('readiness_scores')
        .select('*')
        .eq('org_id', currentOrg!.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ReadinessScore | null;
    },
    enabled: hasAccess && !!currentOrg?.id,
    staleTime: 5 * 60 * 1000,
  });

  return { ...query, isLocked };
}
