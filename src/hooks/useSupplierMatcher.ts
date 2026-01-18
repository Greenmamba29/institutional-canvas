import { useQuery } from '@tanstack/react-query';
import { findSupplierMatches, getMockSupplierMatches, type MatchCriteria } from '@/services/ai/supplier-matcher.service';
import { supabase } from '@/lib/supabase/rpc';

/**
 * Hook to find matching suppliers for an RFQ
 */
export function useSupplierMatcher(rfqId: string) {
  return useQuery({
    queryKey: ['supplier-matches', rfqId],
    queryFn: async () => {
      if (!rfqId) return [];

      // For now, use mock data
      // In production, fetch RFQ details and call findSupplierMatches
      if (rfqId.startsWith('rfq-')) {
        return getMockSupplierMatches(rfqId);
      }

      // Fetch RFQ details from Supabase
      const { data: rfq, error } = await supabase
        .from('rfqs')
        .select('*')
        .eq('id', rfqId)
        .single();

      if (error || !rfq) {
        console.error('Error fetching RFQ:', error);
        return [];
      }

      // Extract criteria from RFQ
      const criteria: MatchCriteria = {
        rfq_id: rfq.id,
        commodity: rfq.commodity_type || 'Lithium Carbonate',
        quantity: rfq.quantity || 1000,
        delivery_location: rfq.delivery_location as any,
        delivery_date: rfq.delivery_date,
        max_price: rfq.target_price,
      };

      const { matches, error: matchError } = await findSupplierMatches(criteria, 10);

      if (matchError) {
        console.error('Error finding matches:', matchError);
        return [];
      }

      return matches;
    },
    enabled: !!rfqId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
