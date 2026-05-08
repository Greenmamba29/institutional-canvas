import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHasFeature } from '@/hooks/useSubscription';

export interface ComplianceAuditLog {
  id: string;
  entity_id: string;
  entity_type: string;
  action: string;
  performed_by: string | null;
  compliance_result: 'pass' | 'fail' | 'warning' | 'pending' | null;
  regulation_refs: string[] | null;
  notes: string | null;
  org_id: string | null;
  created_at: string;
}

export function useComplianceAuditLogs(entityId?: string) {
  const hasAccess = useHasFeature('compliance_audit');
  const isLocked = !hasAccess;

  const query = useQuery<ComplianceAuditLog[]>({
    queryKey: ['compliance_audit_logs', entityId],
    queryFn: async () => {
      let q = supabase.from('compliance_audit_logs').select('*');
      if (entityId) q = q.eq('entity_id', entityId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data as ComplianceAuditLog[];
    },
    enabled: hasAccess,
    staleTime: 2 * 60 * 1000,
  });

  return { ...query, isLocked };
}

export function useCreateAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      entity_id: string;
      entity_type: string;
      action: string;
      regulation_refs: string[];
      compliance_result: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc('create_compliance_audit', {
        p_entity_id: input.entity_id,
        p_entity_type: input.entity_type,
        p_action: input.action,
        p_regulation_refs: input.regulation_refs,
        p_compliance_result: input.compliance_result,
        p_notes: input.notes ?? null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compliance_audit_logs'] }),
  });
}
