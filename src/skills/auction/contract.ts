/**
 * Auction Skill Contract
 * 
 * Defines the input/output schemas for auction operations.
 */

import { z } from 'zod';
import type { SkillContract } from '../types';

// Bid on auction input schema
export const auctionBidInputSchema = z.object({
  auctionId: z.string().uuid(),
  amount: z.number().positive('Bid amount must be positive'),
  currency: z.enum(['USD', 'EUR', 'CNY']).default('USD'),
  notes: z.string().max(500).optional(),
});

export type AuctionBidInput = z.infer<typeof auctionBidInputSchema>;

export const auctionBidOutputSchema = z.object({
  bidId: z.string().uuid(),
  status: z.enum(['accepted', 'outbid', 'pending']),
  currentHighBid: z.number(),
  yourPosition: z.number(),
});

export type AuctionBidOutput = z.infer<typeof auctionBidOutputSchema>;

export const auctionBidContract: SkillContract<AuctionBidInput, AuctionBidOutput> = {
  name: 'auction.bid',
  version: '1.0.0',
  description: 'Place a bid on an active auction',
  inputSchema: auctionBidInputSchema,
  outputSchema: auctionBidOutputSchema,
  requiredCapabilities: ['submit_bid'],
  requiredTools: ['supabase.rpc.submit_bid'],
  // No subscription required - free feature
  featureFlags: [],
};

// List auctions input schema
export const listAuctionsInputSchema = z.object({
  status: z.enum(['scheduled', 'live', 'ended', 'cancelled']).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type ListAuctionsInput = z.infer<typeof listAuctionsInputSchema>;

export const auctionListContract: SkillContract<ListAuctionsInput, unknown> = {
  name: 'auction.list',
  version: '1.0.0',
  description: 'List available auctions',
  inputSchema: listAuctionsInputSchema,
  outputSchema: z.array(z.object({
    id: z.string().uuid(),
    title: z.string(),
    currentBid: z.number().optional(),
    bidCount: z.number(),
    endsAt: z.string().datetime(),
    status: z.string(),
  })),
  requiredCapabilities: ['view_auction'],
  requiredTools: ['supabase.read.auctions'],
  featureFlags: [],
};

// Settle auction input schema
export const settleAuctionInputSchema = z.object({
  auctionId: z.string().uuid(),
  winningBidId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

export type SettleAuctionInput = z.infer<typeof settleAuctionInputSchema>;

export const auctionSettleContract: SkillContract<SettleAuctionInput, unknown> = {
  name: 'auction.settle',
  version: '1.0.0',
  description: 'Settle an auction and award to winning bidder',
  inputSchema: settleAuctionInputSchema,
  outputSchema: z.object({
    dealId: z.string().uuid(),
    status: z.literal('awarded'),
  }),
  requiredCapabilities: ['award_deal'],
  requiredTools: ['supabase.rpc.award_deal'],
  requiredSubscription: 'pro',
  featureFlags: [],
};
