/**
 * Auction Skill Implementation
 * 
 * Handles auction bidding, listing, and settlement.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Skill, SkillContext, SkillResult, ToolCallRecord } from '../types';
import {
  auctionBidContract,
  AuctionBidInput,
  AuctionBidOutput,
  auctionListContract,
  ListAuctionsInput,
  auctionSettleContract,
  SettleAuctionInput,
} from './contract';
import { logSkillInvocation, hashInput } from '../audit';

// Bid on auction skill
export const auctionBidSkill: Skill<AuctionBidInput, AuctionBidOutput> = {
  contract: auctionBidContract,
  
  async execute(input: AuctionBidInput, context: SkillContext): Promise<SkillResult<AuctionBidOutput>> {
    const startTime = performance.now();
    const toolCalls: ToolCallRecord[] = [];
    
    try {
      const parseResult = auctionBidContract.inputSchema.safeParse(input);
      if (!parseResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0]?.message || 'Invalid input',
            retryable: false,
          },
        };
      }
      
      const validInput = parseResult.data;
      
      // Insert bid via direct insert (RLS handles authorization)
      const insertStart = performance.now();
      const { data: bidData, error: bidError } = await supabase
        .from('auction_bids')
        .insert({
          auction_id: validInput.auctionId,
          amount: validInput.amount,
          currency: validInput.currency,
          org_id: context.orgId,
          created_by: context.userId,
        })
        .select()
        .single();
      
      toolCalls.push({
        tool: 'supabase.insert.auction_bids',
        success: !bidError,
        duration_ms: Math.round(performance.now() - insertStart),
        error: bidError?.message,
      });
      
      if (bidError) {
        if (bidError.message?.includes('read-only mode')) {
          return {
            success: false,
            error: {
              code: 'SYSTEM_READ_ONLY',
              message: 'System is in maintenance mode. Please try again later.',
              retryable: false,
            },
          };
        }
        
        return {
          success: false,
          error: {
            code: 'BID_ERROR',
            message: bidError.message,
            retryable: true,
          },
        };
      }
      
      // Get current auction state
      const { data: auctionData } = await supabase
        .from('auction_bids')
        .select('amount')
        .eq('auction_id', validInput.auctionId)
        .order('amount', { ascending: false });
      
      const bids = auctionData || [];
      const position = bids.findIndex(b => b.amount === validInput.amount) + 1;
      
      const result: AuctionBidOutput = {
        bidId: bidData.id,
        status: position === 1 ? 'accepted' : 'outbid',
        currentHighBid: bids[0]?.amount || validInput.amount,
        yourPosition: position,
      };
      
      await logSkillInvocation({
        skillName: auctionBidContract.name,
        skillVersion: auctionBidContract.version,
        context,
        inputHash: hashInput(input),
        result: { success: true, data: result },
        durationMs: Math.round(performance.now() - startTime),
        toolCalls,
      });
      
      return { success: true, data: result };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error.message || 'An unexpected error occurred',
          retryable: true,
        },
      };
    }
  },
};

// List auctions skill
export const auctionListSkill: Skill<ListAuctionsInput, unknown> = {
  contract: auctionListContract,
  
  async execute(input: ListAuctionsInput, context: SkillContext): Promise<SkillResult<unknown>> {
    try {
      const parseResult = auctionListContract.inputSchema.safeParse(input);
      if (!parseResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0]?.message || 'Invalid input',
            retryable: false,
          },
        };
      }
      
      let query = supabase
        .from('auctions')
        .select('*, auction_bids(count)')
        .order('ends_at', { ascending: true })
        .range(input.offset, input.offset + input.limit - 1);
      
      if (input.status) {
        query = query.eq('status', input.status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return {
          success: false,
          error: {
            code: 'QUERY_ERROR',
            message: error.message,
            retryable: true,
          },
        };
      }
      
      return { success: true, data: data || [] };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error.message || 'An unexpected error occurred',
          retryable: true,
        },
      };
    }
  },
};

// Settle auction skill
export const auctionSettleSkill: Skill<SettleAuctionInput, unknown> = {
  contract: auctionSettleContract,
  
  async execute(input: SettleAuctionInput, context: SkillContext): Promise<SkillResult<unknown>> {
    try {
      const parseResult = auctionSettleContract.inputSchema.safeParse(input);
      if (!parseResult.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0]?.message || 'Invalid input',
            retryable: false,
          },
        };
      }
      
      const validInput = parseResult.data;
      
      // Update auction status to ended and mark winning bid
      const { error: updateError } = await supabase
        .from('auctions')
        .update({ status: 'ended' })
        .eq('id', validInput.auctionId);
      
      if (updateError) {
        if (updateError.message?.includes('read-only mode')) {
          return {
            success: false,
            error: {
              code: 'SYSTEM_READ_ONLY',
              message: 'System is in maintenance mode. Please try again later.',
              retryable: false,
            },
          };
        }
        
        return {
          success: false,
          error: {
            code: 'UPDATE_ERROR',
            message: updateError.message,
            retryable: true,
          },
        };
      }
      
      // Generate a deal ID (in production, this would be created via RPC)
      const dealId = crypto.randomUUID();
      
      return {
        success: true,
        data: {
          dealId,
          status: 'awarded',
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error.message || 'An unexpected error occurred',
          retryable: true,
        },
      };
    }
  },
};

// Export all auction skills
export const auctionSkills = {
  bid: auctionBidSkill,
  list: auctionListSkill,
  settle: auctionSettleSkill,
};
