/**
 * lb-rfq-orchestrate Skill
 *
 * Thin orchestration over the existing RFQ service:
 *   1. create RFQ via rfqs.service.createRfq (authenticated RPC + best-effort
 *      Airtable mirror handled inside the service)
 *   2. return the created RFQ plus suggested next steps for the user.
 *
 * Business logic lives in the service/RPC; this skill only composes, audits,
 * and returns a typed SkillResult.
 */

import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import type { Skill, SkillContext, SkillContract, SkillResult, ToolCallRecord } from '../types';
import { createRfq } from '@/services/rfqs.service';
import type { CreateRfqInput } from '@/lib/validation/schemas';
import { logSkillInvocation, hashInput } from '../audit';

// Input mirrors the create_rfq RPC contract (see createRfqSchema).
export const orchestrateRfqInputSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional(),
  productId: z.string().uuid('Product ID must be a valid UUID').nullish(),
  targetQuantity: z.number().positive('Quantity must be positive'),
  targetUnit: z.string().min(1, 'Unit is required').max(50).default('mt'),
  incoterms: z.string().max(50).optional().default(''),
  deliveryLocation: z.string().max(500).optional().default(''),
});

export type OrchestrateRfqInput = z.infer<typeof orchestrateRfqInputSchema>;

export const orchestrateRfqOutputSchema = z.object({
  rfq: z.record(z.unknown()),
  nextSteps: z.array(
    z.object({
      skill: z.string(),
      label: z.string(),
      reason: z.string(),
    })
  ),
});

export type OrchestrateRfqOutput = z.infer<typeof orchestrateRfqOutputSchema>;

export const rfqOrchestrateContract: SkillContract<OrchestrateRfqInput, OrchestrateRfqOutput> = {
  name: 'lb-rfq-orchestrate',
  version: '1.0.0',
  description: 'Create an RFQ, mirror it to Airtable, and return the RFQ with suggested next steps',
  inputSchema: orchestrateRfqInputSchema,
  outputSchema: orchestrateRfqOutputSchema,
  requiredCapabilities: ['create_rfq'],
  requiredTools: ['supabase.rpc.create_rfq'],
  featureFlags: [],
};

function buildNextSteps(rfqId: string): OrchestrateRfqOutput['nextSteps'] {
  return [
    {
      skill: 'rfq.respond',
      label: 'Invite supplier bids',
      reason: `RFQ ${rfqId} is open — collect bids from matched suppliers`,
    },
    {
      skill: 'lb-bid-to-deal',
      label: 'Convert a bid to a deal',
      reason: 'Once bids arrive, rank them and award the best one as a deal',
    },
  ];
}

export const rfqOrchestrateSkill: Skill<OrchestrateRfqInput, OrchestrateRfqOutput> = {
  contract: rfqOrchestrateContract,

  async execute(
    input: OrchestrateRfqInput,
    context: SkillContext
  ): Promise<SkillResult<OrchestrateRfqOutput>> {
    const startTime = performance.now();
    const toolCalls: ToolCallRecord[] = [];

    try {
      const parsed = rfqOrchestrateContract.inputSchema.safeParse(input);
      if (!parsed.success) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0]?.message || 'Invalid input',
            retryable: false,
          },
        };
      }
      const validInput = parsed.data;

      // Map skill input -> service/RPC input shape.
      const rpcParams: CreateRfqInput = {
        p_title: validInput.title,
        p_description: validInput.description ?? '',
        p_product_id: validInput.productId ?? null,
        p_target_quantity: validInput.targetQuantity,
        p_target_unit: validInput.targetUnit,
        p_incoterms: validInput.incoterms ?? '',
        p_delivery_location: validInput.deliveryLocation ?? '',
      };

      // Compose existing service: create_rfq RPC + Airtable sync (inside service).
      const rpcStart = performance.now();
      const { data: rfq, error } = await createRfq(supabase, rpcParams);
      toolCalls.push({
        tool: 'service.rfqs.createRfq',
        success: !error,
        duration_ms: Math.round(performance.now() - rpcStart),
        error: error?.message,
      });

      if (error || !rfq) {
        const isReadOnly = error?.message?.includes('read-only mode');
        const errorResult: SkillResult<OrchestrateRfqOutput> = {
          success: false,
          error: {
            code: isReadOnly ? 'SYSTEM_READ_ONLY' : 'RPC_ERROR',
            message: isReadOnly
              ? 'System is in maintenance mode. Please try again later.'
              : error?.message || 'Failed to create RFQ',
            retryable: !isReadOnly,
          },
        };
        await logSkillInvocation({
          skillName: rfqOrchestrateContract.name,
          skillVersion: rfqOrchestrateContract.version,
          context,
          inputHash: hashInput(input),
          result: errorResult,
          durationMs: Math.round(performance.now() - startTime),
          toolCalls,
        });
        return errorResult;
      }

      const rfqRecord = rfq as unknown as Record<string, unknown>;
      const result: OrchestrateRfqOutput = {
        rfq: rfqRecord,
        nextSteps: buildNextSteps(String(rfqRecord.id ?? '')),
      };

      await logSkillInvocation({
        skillName: rfqOrchestrateContract.name,
        skillVersion: rfqOrchestrateContract.version,
        context,
        inputHash: hashInput(input),
        result: { success: true, data: result },
        durationMs: Math.round(performance.now() - startTime),
        toolCalls,
      });

      return { success: true, data: result };
    } catch (error: any) {
      const errorResult: SkillResult<OrchestrateRfqOutput> = {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error?.message || 'An unexpected error occurred',
          retryable: true,
        },
      };
      await logSkillInvocation({
        skillName: rfqOrchestrateContract.name,
        skillVersion: rfqOrchestrateContract.version,
        context,
        inputHash: hashInput(input),
        result: errorResult,
        durationMs: Math.round(performance.now() - startTime),
        toolCalls,
      });
      return errorResult;
    }
  },
};
