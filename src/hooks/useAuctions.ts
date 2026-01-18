/**
 * Auctions React Query Hooks
 * 
 * Org-aware: Query keys include currentOrgId for proper cache isolation.
 * All mutations use authenticated Supabase client for RLS enforcement.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useAuthenticatedClient } from '@/hooks/useAuthenticatedClient';
import { 
  listAuctions, 
  getAuctionById, 
  getAuctionBids, 
  placeAuctionBid,
  type AuctionBid 
} from '@/services/auctions.service';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { PlaceAuctionBidInput } from '@/lib/validation/schemas';
import { toast } from 'sonner';

export const auctionKeys = {
  all: ['auctions'] as const,
  list: (orgId: string | null) => ['auctions', 'list', orgId] as const,
  detail: (id: string) => ['auctions', id] as const,
  bids: (id: string) => ['auctions', id, 'bids'] as const,
};

export function useAuctions() {
  const { currentOrgId } = useCurrentOrg();
  const { getClient } = useAuthenticatedClient();
  
  // Subscribe to realtime changes
  useRealtimeSubscription({
    table: 'auctions',
    event: '*',
    queryKey: auctionKeys.list(currentOrgId),
    enabled: !!currentOrgId,
  });

  return useQuery({
    queryKey: auctionKeys.list(currentOrgId),
    queryFn: async () => {
      const client = await getClient();
      const { data, error } = await listAuctions(client);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentOrgId,
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
  // Subscribe to realtime changes on bids
  useRealtimeSubscription({
    table: 'auction_bids',
    event: '*',
    queryKey: auctionKeys.bids(auctionId),
    enabled: !!auctionId,
  });

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
  const { getClient } = useAuthenticatedClient();
  
  return useMutation({
    mutationFn: async (params: PlaceAuctionBidInput) => {
      const client = await getClient();
      const { data, error } = await placeAuctionBid(client, params);
      if (error) throw error;
      return data as AuctionBid;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: auctionKeys.bids(variables.p_auction_id) });
      queryClient.invalidateQueries({ queryKey: auctionKeys.list(currentOrgId) });
      toast.success('Bid placed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to place bid');
    },
  });
}
