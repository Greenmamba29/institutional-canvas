import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CollectionSite {
  id: string;
  airtable_id: string | null;
  name: string;
  address: string | null;
  partner_type: string | null;
  capacity_kg: number | null;
  status: string;
  org_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollectionWorker {
  id: string;
  airtable_id: string | null;
  name: string;
  partner_id: string | null;
  kyc_status: string;
  training_status: string;
  certifications: string[];
  pay_rate_usd: number | null;
  org_id: string | null;
  active_contracts: number;
  created_at: string;
  updated_at: string;
}

export function useCollectionSites(status?: string) {
  return useQuery<CollectionSite[]>({
    queryKey: ['collection_sites', status],
    queryFn: async () => {
      let q = supabase.from('collection_sites').select('*');
      if (status) q = q.eq('status', status);
      const { data, error } = await q.order('name');
      if (error) throw error;
      return data as CollectionSite[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCollectionWorkers() {
  return useQuery<CollectionWorker[]>({
    queryKey: ['collection_workers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collection_workers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as CollectionWorker[];
    },
    staleTime: 5 * 60 * 1000,
  });
}
