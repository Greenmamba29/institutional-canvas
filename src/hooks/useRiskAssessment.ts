import { useQuery } from '@tanstack/react-query';
import { assessRisk, getMockRiskAssessment, type EntityType } from '@/services/ai/risk-assessment.service';

/**
 * Hook to assess risk for an entity
 */
export function useRiskAssessment(entityType: EntityType | '', entityId: string) {
  return useQuery({
    queryKey: ['risk-assessment', entityType, entityId],
    queryFn: async () => {
      if (!entityType || !entityId) return null;

      // For mock IDs, use mock data
      if (entityId.startsWith('mock-') || entityId.startsWith('deal-') || entityId.startsWith('supplier-')) {
        return getMockRiskAssessment(entityType as EntityType, entityId);
      }

      const { assessment, error } = await assessRisk(entityType as EntityType, entityId);

      if (error) {
        console.error('Error assessing risk:', error);
        return null;
      }

      return assessment;
    },
    enabled: !!entityType && !!entityId,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
