import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useHasFeature } from '@/hooks/useSubscription';

export interface FlashAlert {
  id: string;
  org_id: string | null;
  title: string;
  message: string | null;
  type: 'info' | 'warning' | 'critical' | 'opportunity';
  source: 'airtable' | 'system';
  airtable_id: string | null;
  dismissed_at: string | null;
  created_at: string;
}

export function useFlashAlerts() {
  const hasAccess = useHasFeature('market_intelligence');
  const isLocked = !hasAccess;
  const qc = useQueryClient();

  const query = useQuery<FlashAlert[]>({
    queryKey: ['flash_alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('flash_alerts')
        .select('*')
        .is('dismissed_at', null)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as FlashAlert[];
    },
    enabled: hasAccess,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!hasAccess) return;
    const channel = supabase
      .channel('flash-alerts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'flash_alerts' }, () => {
        qc.invalidateQueries({ queryKey: ['flash_alerts'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [hasAccess, qc]);

  return { ...query, isLocked };
}

export function useDismissAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('flash_alerts')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['flash_alerts'] }),
  });
}
