/**
 * lb-auction-monitor Skill
 *
 * Read-only orchestration that summarizes an auction's live state:
 *   1. fetch the auction via auctions.service.getAuctionById
 *   2. fetch its bids via auctions.service.getAuctionBids
 *   3. compute a lightweight summary (status, highest bid, bid count, leader)
 *
 * No mutation occurs, so no Airtable sync is required. The invocation is still
 * audited via the shared audit logger.
 */

import { z } from 'zod';
import type { Skill, SkillContext, SkillContract, SkillResult, ToolCallRecord } from '../types';
import { getAuctionById, getAuctionBids } from '@/services/auctions.service';
import { logSkillInvocation, hashInput } from '../audit';

export const auctionMonitorInputSchema = z.object({
  auctionId: z.string().uuid('Auction ID must be a valid UUID'),
});

export type AuctionMonitorInput = z.infer<typeof auctionMonitorInputSchema>;

export const auctionMonitorOutputSchema = z.object({
  auction: z.record(z.unknown()),
  status: z.string(),
  bidCount: z.number(),
  highestBid: z.number().nullable(),
  leadingBid: z.record(z.unknown()).nullable(),
  recentBids: z.array(z.record(z.unknown())),
});

export type AuctionMonitorOutput = z.infer<typeof auctionMonitorOutputSchema>;

export const auctionMonitorContract: SkillContract<AuctionMonitorInput, AuctionMonitorOutput> = {
  name: 'lb-auction-monitor',
  version: '1.0.0',
  description: 'Summarize an auction\'s live bids and status',
  inputSchema: auctionMonitorInputSchema,
  outputSchema: auctionMonitorOutputSchema,
  requiredCapabilities: ['view_auction'],
  requiredTools: ['supabase.read.auctions', 'supabase.read.auction_bids'],
  featureFlags: [],
};

export const auctionMonitorSkill: Skill<AuctionMonitorInput, AuctionMonitorOutput> = {
  contract: auctionMonitorContract,

  async execute(
    input: AuctionMonitorInput,
    context: SkillContext
  ): Promise<SkillResult<AuctionMonitorOutput>> {
    const startTime = performance.now();
    const toolCalls: ToolCallRecord[] = [];

    const fail = async (
      code: string,
      message: string,
      retryable: boolean
    ): Promise<SkillResult<AuctionMonitorOutput>> => {
      const errorResult: SkillResult<AuctionMonitorOutput> = {
        success: false,
        error: { code, message, retryable },
      };
      await logSkillInvocation({
        skillName: auctionMonitorContract.name,
        skillVersion: auctionMonitorContract.version,
        context,
        inputHash: hashInput(input),
        result: errorResult,
        durationMs: Math.round(performance.now() - startTime),
        toolCalls,
      });
      return errorResult;
    };

    try {
      const parsed = auctionMonitorContract.inputSchema.safeParse(input);
      if (!parsed.success) {
        return fail('VALIDATION_ERROR', parsed.error.errors[0]?.message || 'Invalid input', false);
      }
      const { auctionId } = parsed.data;

      // 1. Fetch auction (existing service).
      const auctionStart = performance.now();
      const { data: auction, error: auctionError } = await getAuctionById(auctionId);
      toolCalls.push({
        tool: 'service.auctions.getAuctionById',
        success: !auctionError,
        duration_ms: Math.round(performance.now() - auctionStart),
        error: auctionError?.message,
      });

      if (auctionError) {
        return fail('QUERY_ERROR', auctionError.message, true);
      }
      if (!auction) {
        return fail('AUCTION_NOT_FOUND', 'Auction not found', false);
      }

      // 2. Fetch bids (existing service, already ordered by amount desc).
      const bidsStart = performance.now();
      const { data: bids, error: bidsError } = await getAuctionBids(auctionId);
      toolCalls.push({
        tool: 'service.auctions.getAuctionBids',
        success: !bidsError,
        duration_ms: Math.round(performance.now() - bidsStart),
        error: bidsError?.message,
      });

      if (bidsError) {
        return fail('QUERY_ERROR', bidsError.message, true);
      }

      // 3. Summarize.
      const bidList = (bids ?? []) as Record<string, unknown>[];
      const auctionRecord = auction as unknown as Record<string, unknown>;
      const leadingBid = bidList[0] ?? null;
      const highestBidRaw = leadingBid?.amount;
      const highestBid = typeof highestBidRaw === 'number' ? highestBidRaw : null;

      const result: AuctionMonitorOutput = {
        auction: auctionRecord,
        status: String(auctionRecord.status ?? 'unknown'),
        bidCount: bidList.length,
        highestBid,
        leadingBid,
        recentBids: bidList.slice(0, 5),
      };

      await logSkillInvocation({
        skillName: auctionMonitorContract.name,
        skillVersion: auctionMonitorContract.version,
        context,
        inputHash: hashInput(input),
        result: { success: true, data: result },
        durationMs: Math.round(performance.now() - startTime),
        toolCalls,
      });

      return { success: true, data: result };
    } catch (error: any) {
      return fail('UNEXPECTED_ERROR', error?.message || 'An unexpected error occurred', true);
    }
  },
};
