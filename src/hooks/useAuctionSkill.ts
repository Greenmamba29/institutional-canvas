/**
 * Auction Skill Hook
 * 
 * High-level hook for executing Auction skills with proper
 * error handling and UI feedback.
 */

import { useCallback } from 'react';
import { useSkill } from './useSkill';
import { auctionBidSkill, auctionListSkill, auctionSettleSkill } from '@/skills/auction';
import { toast } from '@/hooks/use-toast';
import type { AuctionBidInput, AuctionBidOutput, ListAuctionsInput, SettleAuctionInput } from '@/skills/auction/contract';

export function useAuctionBid() {
  const mutation = useSkill(auctionBidSkill);

  const placeBid = useCallback(async (input: AuctionBidInput) => {
    const result = await mutation.mutateAsync(input);
    
    if (result.success && result.data) {
      const data = result.data as AuctionBidOutput;
      toast({
        title: 'Bid Placed',
        description: `You are now in position #${data.yourPosition}`,
      });
      return data;
    } else {
      toast({
        title: 'Failed to Place Bid',
        description: result.error?.message || 'Unknown error',
        variant: 'destructive',
      });
      return null;
    }
  }, [mutation]);

  return {
    placeBid,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useAuctionList() {
  const mutation = useSkill(auctionListSkill);

  const listAuctions = useCallback(async (input: ListAuctionsInput = {}) => {
    const result = await mutation.mutateAsync(input);
    
    if (result.success && result.data) {
      return result.data as unknown[];
    }
    
    return [];
  }, [mutation]);

  return {
    listAuctions,
    isLoading: mutation.isPending,
    auctions: (mutation.data?.data as unknown[]) || [],
  };
}

export function useAuctionSettle() {
  const mutation = useSkill(auctionSettleSkill);

  const settleAuction = useCallback(async (input: SettleAuctionInput) => {
    const result = await mutation.mutateAsync(input);
    
    if (result.success && result.data) {
      const data = result.data as { dealId: string; status: string };
      toast({
        title: 'Auction Settled',
        description: `Deal ${data.dealId} created successfully`,
      });
      return data;
    } else {
      toast({
        title: 'Failed to Settle Auction',
        description: result.error?.message || 'Unknown error',
        variant: 'destructive',
      });
      return null;
    }
  }, [mutation]);

  return {
    settleAuction,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
