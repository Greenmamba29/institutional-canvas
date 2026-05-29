import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHasFeature } from '@/hooks/useSubscription';

export interface Grant {
  id: string;
  title: string;
  funding_source: string;
  category: string;
  amount_min: number | null;
  amount_max: number | null;
  deadline: string | null;
  status: string;
  eligibility_criteria: Record<string, unknown> | null;
  external_url: string | null;
  notes: string | null;
  airtable_id: string | null;
  created_at: string;
  updated_at: string;
}

interface GrantFilters {
  status?: string;
  funding_source?: string;
  deadline_before?: string;
}

export function useGrants(filters?: GrantFilters) {
  const hasAccess = useHasFeature('GRANT_TRACKER');

  return useQuery<Grant[]>({
    queryKey: ['grants', filters],
    queryFn: async () => {
      let query = supabase.from('grants').select('*');
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.funding_source) query = query.eq('funding_source', filters.funding_source);
      if (filters?.deadline_before) query = query.lte('deadline', filters.deadline_before);
      const { data, error } = await query.order('deadline', { ascending: true });
      if (error) throw error;
      return data as Grant[];
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
      return data as Grant;
    },
    enabled: hasAccess && !!id,
    staleTime: 5 * 60 * 1000,
  });
}
