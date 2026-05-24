import { useQuery } from '@tanstack/react-query';
import { findSupplierMatches, type MatchCriteria, type SupplierMatchInput } from '@/services/ai/supplier-matcher.service';
import { getRfqById } from '@/services/rfqs.service';
import { getSupplierMatchCandidates } from '@/services/suppliers.service';

function inferCommodity(text: string): string {
  const value = text.toLowerCase();
  if (value.includes('black mass')) return 'Black Mass';
  if (value.includes('lithium hydroxide')) return 'Lithium Hydroxide';
  if (value.includes('lithium carbonate')) return 'Lithium Carbonate';
  if (value.includes('battery')) return 'Battery Material';
  if (value.includes('cobalt')) return 'Cobalt';
  if (value.includes('nickel')) return 'Nickel';
  return text.split(':').pop()?.trim() || 'Lithium Material';
}

function toMatchCriteria(rfqId: string, rfq: Awaited<ReturnType<typeof getRfqById>>['data'] | null): MatchCriteria {
  const text = `${rfq?.title ?? ''} ${rfq?.description ?? ''}`.trim();
  return {
    rfq_id: rfqId,
    commodity: inferCommodity(text),
    quantity: rfq?.target_quantity ?? 0,
  };
}

function toSupplierInput(candidate: Awaited<ReturnType<typeof getSupplierMatchCandidates>>['data'][number]): SupplierMatchInput {
  return {
    supplier_id: candidate.org_id,
    supplier_name: candidate.display_name ?? candidate.invited_email ?? 'Unnamed supplier',
    verification_tier: candidate.verification_tier,
    products: candidate.products ?? [],
    certifications: candidate.certifications ?? [],
    reviews: candidate.reviews ?? [],
    locations: candidate.locations ?? [],
  };
}

/**
 * Hook to find matching suppliers for an RFQ using live tenant-scoped data when
 * available. Empty workspaces fall back to deterministic demo matches.
 */
export function useSupplierMatcher(rfqId: string) {
  return useQuery({
    queryKey: ['supplier-matches', rfqId],
    queryFn: async () => {
      if (!rfqId) return [];
      if (rfqId.startsWith('mock-')) {
        const { matches, error } = await findSupplierMatches({
          rfq_id: rfqId,
          commodity: inferCommodity(rfqId),
          quantity: 0,
        });
        if (error) throw error;
        return matches;
      }

      const [{ data: rfq, error: rfqError }, { data: candidates, error: supplierError }] = await Promise.all([
        getRfqById(rfqId),
        getSupplierMatchCandidates({ limit: 50 }),
      ]);

      if (rfqError) throw rfqError;
      if (supplierError) throw supplierError;

      const criteria = toMatchCriteria(rfqId, rfq);
      const supplierInputs = candidates?.map(toSupplierInput) ?? [];
      const { matches, error } = await findSupplierMatches(criteria, 10, supplierInputs);
      if (error) throw error;
      return matches;
    },
    enabled: !!rfqId,
    staleTime: 1000 * 60 * 30,
  });
}
