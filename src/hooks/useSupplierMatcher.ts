import { useQuery } from '@tanstack/react-query';
import { findSupplierMatches, getMockSupplierMatches, type MatchCriteria } from '@/services/ai/supplier-matcher.service';

/**
 * Hook to find matching suppliers for an RFQ
 */
export function useSupplierMatcher(rfqId: string) {
  return useQuery({
    queryKey: ['supplier-matches', rfqId],
    queryFn: async () => {
      if (!rfqId) return [];

      // Use mock data for demo
      // In production, would fetch RFQ details and call findSupplierMatches
      return getMockSupplierMatches(rfqId);
    },
    enabled: !!rfqId,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
