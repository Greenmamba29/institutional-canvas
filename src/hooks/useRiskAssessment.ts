import { useQuery } from '@tanstack/react-query';
import { assessRisk, type EntityType } from '@/services/ai/risk-assessment.service';

/**
 * Hook to assess risk for a real entity using the deterministic, rule-based
 * risk-assessment service (no mock data).
 */
export function useRiskAssessment(entityType: EntityType | '', entityId: string) {
  return useQuery({
    queryKey: ['risk-assessment', entityType, entityId],
    queryFn: async () => {
      if (!entityType || !entityId) return null;

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
