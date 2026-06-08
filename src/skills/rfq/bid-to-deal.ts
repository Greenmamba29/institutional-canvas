/**
 * lb-bid-to-deal Skill
 *
 * Thin orchestration that turns RFQ bids into a deal:
 *   1. read the RFQ's bids via bids.service.getBidsByRfq
 *   2. rank them (lowest price first, tie-broken by shorter lead time)
 *   3. create a deal for the chosen bid via deals.service.createDeal
 *      (authenticated RPC + best-effort Airtable mirror inside the service)
 *
 * No new business logic: ranking is a simple deterministic sort over existing
 * bid fields; the deal is created by the existing create_deal RPC.
 */

import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import type { Skill, SkillContext, SkillContract, SkillResult, ToolCallRecord } from '../types';
import { getBidsByRfq } from '@/services/bids.service';
import { createDeal } from '@/services/deals.service';
import { logSkillInvocation, hashInput } from '../audit';

export const bidToDealInputSchema = z.object({
  rfqId: z.string().uuid('RFQ ID must be a valid UUID'),
  dealTitle: z.string().min(1, 'Deal title is required').max(500),
  // Optional explicit winner; when omitted the top-ranked bid is chosen.
  bidId: z.string().uuid('Bid ID must be a valid UUID').optional(),
});

export type BidToDealInput = z.infer<typeof bidToDealInputSchema>;

export const bidToDealOutputSchema = z.object({
  deal: z.record(z.unknown()),
  chosenBid: z.record(z.unknown()),
  rankedBids: z.array(
    z.object({
      bidId: z.string(),
      supplierId: z.string().nullable(),
      price: z.number().nullable(),
      leadTimeDays: z.number().nullable(),
      rank: z.number(),
    })
  ),
});

export type BidToDealOutput = z.infer<typeof bidToDealOutputSchema>;

export const bidToDealContract: SkillContract<BidToDealInput, BidToDealOutput> = {
  name: 'lb-bid-to-deal',
  version: '1.0.0',
  description: 'Rank an RFQ\'s bids and create a deal for the chosen bid, mirrored to Airtable',
  inputSchema: bidToDealInputSchema,
  outputSchema: bidToDealOutputSchema,
  requiredCapabilities: ['award_deal'],
  requiredTools: ['supabase.read.bids', 'supabase.rpc.create_deal'],
  requiredSubscription: 'pro',
  featureFlags: [],
};

type BidRecord = Record<string, unknown>;

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Deterministic ranking: lowest price wins, tie-broken by shorter lead time. */
function rankBids(bids: BidRecord[]): BidRecord[] {
  return [...bids].sort((a, b) => {
    const pa = num(a.price);
    const pb = num(b.price);
    if (pa !== pb) {
      if (pa === null) return 1;
      if (pb === null) return -1;
      return pa - pb;
    }
    const la = num(a.lead_time_days);
    const lb = num(b.lead_time_days);
    if (la === lb) return 0;
    if (la === null) return 1;
    if (lb === null) return -1;
    return la - lb;
  });
}

export const bidToDealSkill: Skill<BidToDealInput, BidToDealOutput> = {
  contract: bidToDealContract,

  async execute(
    input: BidToDealInput,
    context: SkillContext
  ): Promise<SkillResult<BidToDealOutput>> {
    const startTime = performance.now();
    const toolCalls: ToolCallRecord[] = [];

    const fail = async (
      code: string,
      message: string,
      retryable: boolean
    ): Promise<SkillResult<BidToDealOutput>> => {
      const errorResult: SkillResult<BidToDealOutput> = {
        success: false,
        error: { code, message, retryable },
      };
      await logSkillInvocation({
        skillName: bidToDealContract.name,
        skillVersion: bidToDealContract.version,
        context,
        inputHash: hashInput(input),
        result: errorResult,
        durationMs: Math.round(performance.now() - startTime),
        toolCalls,
      });
      return errorResult;
    };

    try {
      const parsed = bidToDealContract.inputSchema.safeParse(input);
      if (!parsed.success) {
        return fail('VALIDATION_ERROR', parsed.error.errors[0]?.message || 'Invalid input', false);
      }
      const validInput = parsed.data;

      // 1. Read bids for the RFQ (existing service).
      const readStart = performance.now();
      const { data: bids, error: bidsError } = await getBidsByRfq(validInput.rfqId);
      toolCalls.push({
        tool: 'service.bids.getBidsByRfq',
        success: !bidsError,
        duration_ms: Math.round(performance.now() - readStart),
        error: bidsError?.message,
      });

      if (bidsError) {
        return fail('QUERY_ERROR', bidsError.message, true);
      }
      const bidList = (bids ?? []) as BidRecord[];
      if (bidList.length === 0) {
        return fail('NO_BIDS', 'No bids found for this RFQ', false);
      }

      // 2. Rank and select the winning bid.
      const ranked = rankBids(bidList);
      const chosen = validInput.bidId
        ? ranked.find((b) => String(b.id) === validInput.bidId)
        : ranked[0];

      if (!chosen) {
        return fail('BID_NOT_FOUND', 'Specified bid does not belong to this RFQ', false);
      }

      const supplierId = chosen.supplier_id;
      if (typeof supplierId !== 'string') {
        return fail('INVALID_BID', 'Chosen bid is missing a supplier reference', false);
      }

      // 3. Create the deal via existing service (RPC + Airtable sync inside it).
      const dealStart = performance.now();
      const { data: deal, error: dealError } = await createDeal(supabase, {
        p_supplier_id: supplierId,
        p_rfq_id: validInput.rfqId,
        p_title: validInput.dealTitle,
      });
      toolCalls.push({
        tool: 'service.deals.createDeal',
        success: !dealError,
        duration_ms: Math.round(performance.now() - dealStart),
        error: dealError?.message,
      });

      if (dealError || !deal) {
        const isReadOnly = dealError?.message?.includes('read-only mode');
        return fail(
          isReadOnly ? 'SYSTEM_READ_ONLY' : 'RPC_ERROR',
          isReadOnly
            ? 'System is in maintenance mode. Please try again later.'
            : dealError?.message || 'Failed to create deal',
          !isReadOnly
        );
      }

      const result: BidToDealOutput = {
        deal: deal as unknown as Record<string, unknown>,
        chosenBid: chosen,
        rankedBids: ranked.map((b, i) => ({
          bidId: String(b.id ?? ''),
          supplierId: typeof b.supplier_id === 'string' ? b.supplier_id : null,
          price: num(b.price),
          leadTimeDays: num(b.lead_time_days),
          rank: i + 1,
        })),
      };

      await logSkillInvocation({
        skillName: bidToDealContract.name,
        skillVersion: bidToDealContract.version,
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
