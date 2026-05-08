import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHasFeature } from '@/hooks/useSubscription';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';

export interface EvidenceDocument {
  id: string;
  org_id: string;
  grant_id: string | null;
  file_path: string;
  document_type: string;
  description: string | null;
  read_only: boolean;
  deletion_scheduled_at: string | null;
  airtable_id: string | null;
  created_at: string;
  updated_at: string;
}

export function useEvidenceDocuments(grantId?: string) {
  const hasAccess = useHasFeature('EVIDENCE_VAULT');
  const { currentOrg } = useCurrentOrg();
  const isLocked = !hasAccess;

  const query = useQuery<EvidenceDocument[]>({
    queryKey: ['evidence_documents', currentOrg?.id, grantId],
    queryFn: async () => {
      let q = supabase.from('evidence_documents').select('*').eq('org_id', currentOrg!.id);
      if (grantId) q = q.eq('grant_id', grantId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data as EvidenceDocument[];
    },
    enabled: hasAccess && !!currentOrg?.id,
    staleTime: 2 * 60 * 1000,
  });

  return { ...query, isLocked };
}

export function useUploadEvidence() {
  const qc = useQueryClient();
  const { currentOrg } = useCurrentOrg();

  return useMutation({
    mutationFn: async (input: { file: File; grant_id?: string; document_type: string; description?: string }) => {
      const path = `${currentOrg?.id}/${Date.now()}_${input.file.name}`;
      const { error: uploadError } = await supabase.storage.from('evidence-vault').upload(path, input.file);
      if (uploadError) throw uploadError;

      const { data, error } = await supabase.from('evidence_documents').insert({
        org_id: currentOrg?.id,
        grant_id: input.grant_id,
        file_path: path,
        document_type: input.document_type,
        description: input.description,
        read_only: false,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evidence_documents'] }),
  });
}

export function useDeleteEvidence() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (doc: EvidenceDocument) => {
      if (doc.read_only) throw new Error('This document is read-only and cannot be deleted.');
      const { error } = await supabase.from('evidence_documents').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['evidence_documents'] }),
  });
}
