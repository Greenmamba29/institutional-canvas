import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHasFeature } from '@/hooks/useSubscription';

import type { Database } from '@/integrations/supabase/types';

/** A row of public.grants, typed from the database schema. */
export type Grant = Database['public']['Tables']['grants']['Row'];

interface GrantFilters {
  /** grants.application_status: open | closed | awarded */
  application_status?: string;
  funding_source?: string;
  deadline_before?: string;
}

export function useGrants(filters?: GrantFilters) {
  const hasAccess = useHasFeature('GRANT_TRACKER');

  return useQuery<Grant[]>({
    queryKey: ['grants', filters],
    queryFn: async () => {
      const base = supabase
        .from('grants')
        .select('*')
        .match({
          ...(filters?.application_status ? { application_status: filters.application_status } : {}),
          ...(filters?.funding_source ? { funding_source: filters.funding_source } : {}),
        });
      const filtered = filters?.deadline_before ? base.lte('deadline', filters.deadline_before) : base;
      const { data, error } = await filtered.order('deadline', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: hasAccess,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGrant(id: string) {
  const hasAccess = useHasFeature('GRANT_TRACKER');

  return useQuery<Grant>({
    queryKey: ['grants', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('grants').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: hasAccess && !!id,
    staleTime: 5 * 60 * 1000,
  });
}
