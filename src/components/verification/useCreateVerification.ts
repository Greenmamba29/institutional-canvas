/**
 * useCreateVerification
 *
 * Inserts a new row into `kyb_verification_queue` via the existing supabase
 * client (mirrors how Verification.tsx reads from the same table), then
 * invalidates the ['kyb-verification'] list query used by the page.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CreateVerificationInput {
  org_id: string;
  verification_tier: string;
  notes?: string | null;
}

export function useCreateVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateVerificationInput) => {
      const { data, error } = await supabase
        .from('kyb_verification_queue')
        .insert({
          org_id: input.org_id,
          verification_tier: input.verification_tier,
          notes: input.notes?.trim() ? input.notes.trim() : null,
          status: 'pending',
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyb-verification'] });
    },
  });
}
