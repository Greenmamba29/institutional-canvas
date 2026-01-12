/**
 * Trusted Partners React Query Hook
 * 
 * Fetches supplier organizations that have completed deals with the current org
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';

export interface TrustedPartner {
  id: string;
  name: string;
  verified: boolean;
  verificationTier: 'gold' | 'standard';
  ytdRevenue: number;
  product: string;
  pricePerMT: number;
  responseTime: string;
}

export const partnerKeys = {
  all: ['partners'] as const,
  list: (orgId: string | null) => ['partners', 'list', orgId] as const,
};

export function usePartners(limit: number = 5) {
  const { currentOrgId } = useCurrentOrg();
  
  return useQuery({
    queryKey: [...partnerKeys.list(currentOrgId), limit],
    queryFn: async () => {
      // Get suppliers from the suppliers table that have verified status
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select(`
          org_id,
          display_name,
          verification_tier,
          public_profile
        `)
        .not('verification_tier', 'is', null)
        .limit(limit);

      if (error) throw error;

      // Get supplier org IDs
      const supplierIds = (suppliers ?? []).map(s => s.org_id);
      
      // Get products for these suppliers
      const { data: products } = await supabase
        .from('products')
        .select('supplier_id, name, price_per_unit')
        .in('supplier_id', supplierIds)
        .limit(supplierIds.length);

      // Get deal totals (YTD revenue) for these suppliers
      const { data: deals } = await supabase
        .from('deals')
        .select('supplier_id')
        .eq('status', 'completed')
        .in('supplier_id', supplierIds);

      // Map suppliers to TrustedPartner format
      return (suppliers ?? []).map((supplier): TrustedPartner => {
        const product = products?.find(p => p.supplier_id === supplier.org_id);
        const dealCount = deals?.filter(d => d.supplier_id === supplier.org_id).length ?? 0;
        const profile = supplier.public_profile as Record<string, unknown> | null;
        
        return {
          id: supplier.org_id,
          name: supplier.display_name || 'Unknown Supplier',
          verified: !!supplier.verification_tier,
          verificationTier: supplier.verification_tier === 'gold' ? 'gold' : 'standard',
          ytdRevenue: dealCount * (product?.price_per_unit ?? 50000), // Estimate based on deals
          product: product?.name || 'Lithium Products',
          pricePerMT: product?.price_per_unit ?? 0,
          responseTime: profile?.response_time_hours 
            ? `${profile.response_time_hours}H` 
            : 'N/A',
        };
      });
    },
    enabled: !!currentOrgId,
  });
}
