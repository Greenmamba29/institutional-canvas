import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHasFeature } from '@/hooks/useSubscription';

export interface CustodyRecord {
  id: string;
  airtable_id: string | null;
  inventory_id: string;
  previous_owner: string | null;
  new_owner: string | null;
  transfer_time: string;
  transport_mode: string | null;
  condition: string | null;
  evidence_url: string | null;
  signature_hash: string | null;
  org_id: string | null;
  created_at: string;
}

export function useChainOfCustody(inventoryId: string) {
  const hasAccess = useHasFeature('chain_of_custody');
  const isLocked = !hasAccess;

  const query = useQuery<CustodyRecord[]>({
    queryKey: ['chain_of_custody', inventoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chain_of_custody')
        .select('*')
        .eq('inventory_id', inventoryId)
        .order('transfer_time', { ascending: true });
      if (error) throw error;
      return data as CustodyRecord[];
    },
    enabled: hasAccess && !!inventoryId,
    staleTime: 2 * 60 * 1000,
  });

  return { ...query, isLocked };
}
