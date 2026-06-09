import { useQuery } from '@tanstack/react-query';
import { findSupplierMatches } from '@/services/ai/supplier-matcher.service';

/**
 * Hook to find matching suppliers for an RFQ.
 * Runs the real, rule-based matcher over live Supabase RFQ + supplier data.
 */
export function useSupplierMatcher(rfqId: string) {
  return useQuery({
    queryKey: ['supplier-matches', rfqId],
    queryFn: async () => {
      if (!rfqId) return [];
      const { matches, error } = await findSupplierMatches({ rfq_id: rfqId });
      if (error) throw error;
      return matches;
    },
    enabled: !!rfqId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
