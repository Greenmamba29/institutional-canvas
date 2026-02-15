/**
 * Auctions React Query Hooks
 * 
 * Org-aware: Query keys include currentOrgId for proper cache isolation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { listAuctions, getAuctionById, getAuctionBids, placeAuctionBid } from '@/services/auctions.service';

export const auctionKeys = {
  all: ['auctions'] as const,
  list: (orgId: string | null) => ['auctions', 'list', orgId] as const,
  detail: (id: string) => ['auctions', id] as const,
  bids: (id: string) => ['auctions', id, 'bids'] as const,
};

export function useAuctions() {
  const { currentOrgId } = useCurrentOrg();
  
  return useQuery({
    queryKey: auctionKeys.list(currentOrgId),
    queryFn: async () => {
      const { data, error } = await listAuctions();
      if (error) throw error;
      return data ?? [];
    },
    enabled: true,
  });
}

export function useAuction(auctionId: string) {
  return useQuery({
    queryKey: auctionKeys.detail(auctionId),
    queryFn: async () => {
      const { data, error } = await getAuctionById(auctionId);
      if (error) throw error;
      return data;
    },
    enabled: !!auctionId,
  });
}

export function useAuctionBids(auctionId: string) {
  return useQuery({
    queryKey: auctionKeys.bids(auctionId),
    queryFn: async () => {
      const { data, error } = await getAuctionBids(auctionId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!auctionId,
  });
}

export function usePlaceAuctionBid() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();
  
  return useMutation({
    mutationFn: placeAuctionBid,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: auctionKeys.bids(variables.p_auction_id) });
      queryClient.invalidateQueries({ queryKey: auctionKeys.list(currentOrgId) });
    },
  });
}
