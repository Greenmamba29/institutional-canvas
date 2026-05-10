import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listStrategicPartners,
  updateStrategicPartner,
  getStrategicPartnerStats,
  type StrategicPartnerFilters,
} from '@/services/strategicPartners.service';

export function useStrategicPartners(filters?: StrategicPartnerFilters) {
  return useQuery({
    queryKey: ['strategic-partners', filters],
    queryFn: () => listStrategicPartners(filters),
  });
}

export function useStrategicPartnerStats() {
  return useQuery({
    queryKey: ['strategic-partner-stats'],
    queryFn: getStrategicPartnerStats,
  });
}

export function useUpdateStrategicPartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateStrategicPartner>[1] }) =>
      updateStrategicPartner(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strategic-partners'] });
      qc.invalidateQueries({ queryKey: ['strategic-partner-stats'] });
    },
  });
}
