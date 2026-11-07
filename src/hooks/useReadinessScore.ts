import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHasFeature } from '@/hooks/useSubscription';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import type { Database } from '@/integrations/supabase/types';

/** A row of public.readiness_scores, typed from the database schema. */
export type ReadinessScore = Database['public']['Tables']['readiness_scores']['Row'];

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
      return data;
    },
    enabled: hasAccess && !!currentOrg?.id,
    staleTime: 5 * 60 * 1000,
  });

  return { ...query, isLocked };
}
