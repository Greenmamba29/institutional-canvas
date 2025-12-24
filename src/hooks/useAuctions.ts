/**
 * Auctions React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAuctions, getAuctionById, getAuctionBids, placeAuctionBid } from '@/services/auctions.service';

export const auctionKeys = {
  all: ['auctions'] as const,
  detail: (id: string) => ['auctions', id] as const,
  bids: (id: string) => ['auctions', id, 'bids'] as const,
};

export function useAuctions() {
  return useQuery({
    queryKey: auctionKeys.all,
    queryFn: async () => {
      const { data, error } = await listAuctions();
      if (error) throw error;
      return data ?? [];
    },
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
  
  return useMutation({
    mutationFn: placeAuctionBid,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: auctionKeys.bids(variables.p_auction_id) });
      queryClient.invalidateQueries({ queryKey: auctionKeys.all });
    },
  });
}
