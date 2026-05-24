/**
 * RFQ Skill Implementation
 * 
 * Handles RFQ creation, listing, and bid submission.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Skill, SkillContext, SkillResult, ToolCallRecord } from '../types';
import {
  rfqCreateContract,
  CreateRfqInput,
  CreateRfqOutput,
  rfqListContract,
  ListRfqsInput,
  rfqRespondContract,
  SubmitBidInput,
} from './contract';
import { logSkillInvocation, hashInput } from '../audit';

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'An unexpected error occurred';

// Create RFQ skill
export const rfqCreateSkill: Skill<CreateRfqInput, CreateRfqOutput> = {
  contract: rfqCreateContract,
  
  async execute(input: CreateRfqInput, context: SkillContext): Promise<SkillResult<CreateRfqOutput>> {
    const startTime = performance.now();
    const toolCalls: ToolCallRecord[] = [];
    
    try {
      const parseResult = rfqCreateContract.inputSchema.safeParse(input);
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
      
      // Call RPC to create RFQ (backend validates and enforces RLS)
      const rpcStart = performance.now();
      const { data, error } = await supabase.rpc('create_rfq', {
        p_title: validInput.title,
        p_product_id: validInput.productId,
        p_description: validInput.description || '',
        p_target_quantity: validInput.targetQuantity,
        p_target_unit: validInput.targetUnit,
        p_delivery_location: validInput.deliveryLocation,
        p_incoterms: validInput.incoterms,
      });
      
      toolCalls.push({
        tool: 'supabase.rpc.create_rfq',
        success: !error,
        duration_ms: Math.round(performance.now() - rpcStart),
        error: error?.message,
      });
      
      if (error) {
        // Handle kill switch error
        if (error.message?.includes('read-only mode')) {
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
            code: 'RPC_ERROR',
            message: error.message,
            retryable: true,
          },
        };
      }
      
      const result: CreateRfqOutput = {
        rfqId: data?.id || crypto.randomUUID(),
        status: 'submitted', // Always return 'submitted' for new RFQs
        createdAt: new Date().toISOString(),
      };
      
      await logSkillInvocation({
        skillName: rfqCreateContract.name,
        skillVersion: rfqCreateContract.version,
        context,
        inputHash: hashInput(input),
        result: { success: true, data: result },
        durationMs: Math.round(performance.now() - startTime),
        toolCalls,
      });
      
      return { success: true, data: result };
    } catch (error: unknown) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: getErrorMessage(error),
          retryable: true,
        },
      };
    }
  },
};

// List RFQs skill
export const rfqListSkill: Skill<ListRfqsInput, unknown> = {
  contract: rfqListContract,
  
  async execute(input: ListRfqsInput, context: SkillContext): Promise<SkillResult<unknown>> {
    try {
      const parseResult = rfqListContract.inputSchema.safeParse(input);
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
        .from('rfqs')
        .select('*, bids(count)')
        .order('created_at', { ascending: false })
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
    } catch (error: unknown) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: getErrorMessage(error),
          retryable: true,
        },
      };
    }
  },
};

// Submit bid skill
export const rfqRespondSkill: Skill<SubmitBidInput, unknown> = {
  contract: rfqRespondContract,
  
  async execute(input: SubmitBidInput, context: SkillContext): Promise<SkillResult<unknown>> {
    try {
      const parseResult = rfqRespondContract.inputSchema.safeParse(input);
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
      
      const { data, error } = await supabase.rpc('submit_bid', {
        p_rfq_id: validInput.rfqId,
        p_supplier_id: validInput.supplierId,
        p_price: validInput.price,
        p_currency: validInput.currency,
        p_quantity: validInput.quantity,
        p_lead_time_days: validInput.leadTimeDays,
        p_notes: validInput.notes || '',
      });
      
      if (error) {
        if (error.message?.includes('read-only mode')) {
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
            code: 'RPC_ERROR',
            message: error.message,
            retryable: true,
          },
        };
      }
      
      return {
        success: true,
        data: {
          bidId: data?.id || crypto.randomUUID(),
          status: 'submitted',
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: getErrorMessage(error),
          retryable: true,
        },
      };
    }
  },
};

// Export all RFQ skills
export const rfqSkills = {
  create: rfqCreateSkill,
  list: rfqListSkill,
  respond: rfqRespondSkill,
};
