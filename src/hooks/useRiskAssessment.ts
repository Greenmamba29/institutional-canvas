import { useQuery } from '@tanstack/react-query';
import { assessRisk, getMockRiskAssessment, type EntityType, type RiskSupplierContext } from '@/services/ai/risk-assessment.service';
import { getSupplierById } from '@/services/suppliers.service';
import { getDealById } from '@/services/deals.service';

function toSupplierRiskContext(supplier: Awaited<ReturnType<typeof getSupplierById>>['data']): RiskSupplierContext | null {
  if (!supplier) return null;
  return {
    supplier_id: supplier.org_id,
    supplier_name: supplier.display_name,
    verification_tier: supplier.verification_tier,
    certifications: supplier.certifications ?? [],
    reviews: supplier.reviews ?? [],
    capabilities: supplier.capabilities,
    past_deals_count: supplier.reviews?.length ?? 0,
  };
}

/**
 * Hook to assess risk for an entity using live entity context where available.
 * Demo IDs remain supported as empty-state examples.
 */
export function useRiskAssessment(entityType: EntityType | '', entityId: string) {
  return useQuery({
    queryKey: ['risk-assessment', entityType, entityId],
    queryFn: async () => {
      if (!entityType || !entityId) return null;

      if (entityId.startsWith('mock-') || entityId.startsWith('market-')) {
        return getMockRiskAssessment(entityType as EntityType, entityId);
      }

      if (entityType === 'Supplier') {
        const { data: supplier, error } = await getSupplierById(entityId);
        if (error) throw error;
        const { assessment, error: assessmentError } = await assessRisk(entityType, entityId, {
          supplier: toSupplierRiskContext(supplier),
        });
        if (assessmentError) throw assessmentError;
        return assessment;
      }

      if (entityType === 'Deal') {
        const { data: deal, error } = await getDealById(entityId);
        if (error) throw error;
        const { assessment, error: assessmentError } = await assessRisk(entityType, entityId, {
          deal: {
            status: deal?.status,
            title: deal?.title,
            has_contract: false,
            has_purchase_order: false,
          },
        });
        if (assessmentError) throw assessmentError;
        return assessment;
      }

      const { assessment, error } = await assessRisk(entityType as EntityType, entityId);
      if (error) throw error;
      return assessment;
    },
    enabled: !!entityType && !!entityId,
    staleTime: 1000 * 60 * 30,
  });
}
