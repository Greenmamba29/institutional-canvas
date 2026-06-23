/**
 * Price Alerts Hook
 *
 * Manages user price alerts. Gracefully handles missing price_alerts table.
 * Returns: { alerts, createAlert(params), deleteAlert(id), isLoading }
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { toast } from 'sonner';

export interface PriceAlert {
  id: string;
  commodity: string;
  alert_type: 'above' | 'below';
  threshold_usd: number;
  created_at: string;
  org_id: string;
}

export interface CreateAlertParams {
  commodity: string;
  alert_type: 'above' | 'below';
  threshold_usd: number;
}

export function usePriceAlerts() {
  const { currentOrgId } = useCurrentOrg();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['price-alerts', currentOrgId],
    queryFn: async (): Promise<PriceAlert[]> => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('price_alerts')
          .select('*')
          .eq('org_id', currentOrgId)
          .order('created_at', { ascending: false });

        if (error) {
          // Table may not exist yet — treat as empty
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            return [];
          }
          throw error;
        }
        return (data ?? []) as PriceAlert[];
      } catch {
        return [];
      }
    },
    enabled: !!currentOrgId,
    staleTime: 2 * 60 * 1000,
  });

  const createAlertMutation = useMutation({
    mutationFn: async (params: CreateAlertParams): Promise<PriceAlert> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('price_alerts')
        .insert({
          org_id: currentOrgId,
          commodity: params.commodity,
          alert_type: params.alert_type,
          threshold_usd: params.threshold_usd,
        })
        .select()
        .single();

      if (error) throw error;
      return data as PriceAlert;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts', currentOrgId] });
      toast.success('Price alert created');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to create alert');
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('price_alerts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alerts', currentOrgId] });
      toast.success('Alert deleted');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete alert');
    },
  });

  return {
    alerts,
    isLoading,
    createAlert: (params: CreateAlertParams) => createAlertMutation.mutate(params),
    deleteAlert: (id: string) => deleteAlertMutation.mutate(id),
    isCreating: createAlertMutation.isPending,
    isDeleting: deleteAlertMutation.isPending,
  };
}
