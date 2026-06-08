/**
 * LB Custody Skill Implementation (lane: skills-telebuy-custody)
 *
 * lb-procure-custody: THIN orchestration over custody.service.addCustodyEvent,
 * which appends a custody event via the create_custody_event RPC and best-effort
 * mirrors the row to Airtable. Validates input, audit-logs via
 * log-skill-invocation, and returns a typed SkillResult.
 *
 * The custody RPCs are org-scoped (RLS), so we pass the session-authenticated
 * default Supabase client — the same client used across the frontend that
 * carries the user's JWT for jwt_user_id()/jwt_org_id().
 */

import { supabase } from '@/integrations/supabase/client';
import type { Skill, SkillContext, SkillResult, ToolCallRecord } from '../types';
import { logSkillInvocation, hashInput } from '../audit';
import { addCustodyEvent } from '@/services/custody.service';
import {
  lbProcureCustodyContract,
  type LbProcureCustodyInput,
  type LbProcureCustodyOutput,
} from './contract';

export const lbProcureCustodySkill: Skill<
  LbProcureCustodyInput,
  LbProcureCustodyOutput
> = {
  contract: lbProcureCustodyContract,

  async execute(
    input: LbProcureCustodyInput,
    context: SkillContext
  ): Promise<SkillResult<LbProcureCustodyOutput>> {
    const startTime = performance.now();
    const toolCalls: ToolCallRecord[] = [];

    const finish = async (
      result: SkillResult<LbProcureCustodyOutput>
    ): Promise<SkillResult<LbProcureCustodyOutput>> => {
      await logSkillInvocation({
        skillName: lbProcureCustodyContract.name,
        skillVersion: lbProcureCustodyContract.version,
        context,
        inputHash: hashInput(input),
        result,
        durationMs: Math.round(performance.now() - startTime),
        toolCalls,
      });
      return result;
    };

    try {
      const parsed = lbProcureCustodyContract.inputSchema.safeParse(input);
      if (!parsed.success) {
        return finish({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.errors[0]?.message || 'Invalid input',
            retryable: false,
          },
        });
      }
      const validInput = parsed.data;

      // Compose the existing service: create_custody_event RPC + Airtable sync.
      const rpcStart = performance.now();
      const { data: event, error } = await addCustodyEvent(supabase, {
        orderId: validInput.orderId,
        eventType: validInput.eventType,
        title: validInput.title,
        description: validInput.description,
        location: validInput.location,
        dealId: validInput.dealId,
        occurredAt: validInput.occurredAt,
        verifiedBy: validInput.verifiedBy,
        documents: validInput.documents,
        coordinates: validInput.coordinates,
        metadata: validInput.metadata,
      });
      toolCalls.push({
        tool: 'supabase.rpc.create_custody_event',
        success: !error && !!event,
        duration_ms: Math.round(performance.now() - rpcStart),
        error: error?.message,
      });

      if (error || !event) {
        return finish({
          success: false,
          error: {
            code: 'CUSTODY_EVENT_FAILED',
            message: error?.message || 'Failed to append custody event',
            retryable: true,
          },
        });
      }

      const result: LbProcureCustodyOutput = {
        eventId: event.id,
        orderId: event.orderId,
        eventType: event.eventType,
        occurredAt: event.timestamp,
      };

      return finish({ success: true, data: result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      return finish({
        success: false,
        error: { code: 'UNEXPECTED_ERROR', message, retryable: true },
      });
    }
  },
};

// Export all custody skills
export const custodySkills = {
  procureCustody: lbProcureCustodySkill,
};
