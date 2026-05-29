import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHasFeature } from '@/hooks/useSubscription';

export interface BatteryInventoryItem {
  id: string;
  airtable_id: string | null;
  collection_id: string | null;
  battery_type: string;
  chemistry: string | null;
  weight_kg: number | null;
  state_of_charge: number | null;
  status: string;
  location_id: string | null;
  org_id: string | null;
  collected_at: string;
  created_at: string;
  updated_at: string;
}

interface BatteryFilters {
  status?: string;
  battery_type?: string;
  location_id?: string;
}

export function useBatteryInventory(filters?: BatteryFilters) {
  const hasAccess = useHasFeature('recycling_registry');
  const isLocked = !hasAccess;

  const query = useQuery<BatteryInventoryItem[]>({
    queryKey: ['battery_inventory', filters],
    queryFn: async () => {
      let q = supabase.from('battery_inventory').select('*');
      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.battery_type) q = q.eq('battery_type', filters.battery_type);
      if (filters?.location_id) q = q.eq('location_id', filters.location_id);
      const { data, error } = await q.order('collected_at', { ascending: false });
      if (error) throw error;
      return data as BatteryInventoryItem[];
    },
    enabled: hasAccess,
    staleTime: 60 * 1000,
  });

  return { ...query, isLocked };
}

export function useTransferCustody() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      inventory_id: string;
      new_owner: string;
      transport_mode: string;
      condition: string;
      evidence_url?: string;
    }) => {
      const { data, error } = await supabase.rpc('transfer_battery_custody', {
        p_inventory_id: input.inventory_id,
        p_new_owner: input.new_owner,
        p_transport_mode: input.transport_mode,
        p_condition: input.condition,
        p_evidence_url: input.evidence_url ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['battery_inventory'] });
      qc.invalidateQueries({ queryKey: ['chain_of_custody'] });
    },
  });
}
