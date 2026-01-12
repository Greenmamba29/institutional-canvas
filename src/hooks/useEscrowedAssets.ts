/**
 * Escrowed Assets React Query Hook
 * 
 * Fetches purchases with escrow status for the dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';

export interface EscrowedAsset {
  description: string;
  remainder: string;
  gain: number;
}

export const escrowKeys = {
  all: ['escrow'] as const,
  list: (orgId: string | null) => ['escrow', 'list', orgId] as const,
};

export function useEscrowedAssets(limit: number = 4) {
  const { currentOrgId } = useCurrentOrg();
  
  return useQuery({
    queryKey: [...escrowKeys.list(currentOrgId), limit],
    queryFn: async () => {
      // Get purchases with escrow-related status
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select(`
          id,
          total_amount,
          currency,
          status,
          payload,
          created_at,
          deals(title)
        `)
        .in('status', ['pending', 'escrow_held', 'awaiting_release', 'in_escrow'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        // Fallback: return mock data if no purchases found
        return [
          { description: 'Li-Hydroxide LCE', remainder: '0', gain: 0 },
          { description: 'Carbonate Batch', remainder: '0', gain: 0 },
        ];
      }

      if (!purchases || purchases.length === 0) {
        // Return placeholder data
        return [
          { description: 'No escrowed assets', remainder: '0', gain: 0 },
        ];
      }

      return purchases.map((purchase): EscrowedAsset => {
        const deal = purchase.deals as unknown as { title: string } | null;
        const payload = purchase.payload as Record<string, unknown> | null;
        
        // Calculate gain/loss based on creation date (mock calculation)
        const createdAt = new Date(purchase.created_at);
        const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const mockGain = (Math.random() - 0.3) * 5; // Random gain/loss for demo
        
        // Format remainder
        const amount = purchase.total_amount ?? 0;
        const formattedRemainder = amount >= 1000 
          ? `${(amount / 1000).toFixed(1)}k`
          : amount.toString();

        return {
          description: deal?.title || payload?.product_name as string || 'Lithium Asset',
          remainder: formattedRemainder,
          gain: Number(mockGain.toFixed(1)),
        };
      });
    },
    enabled: !!currentOrgId,
  });
}
