/**
 * LB TeleBuy Skill Implementations (lane: skills-telebuy-custody)
 *
 * THIN orchestration over the existing telebuy.service:
 *   - lbTelebuySessionSkill   composes createTelebuySession (Daily room + RPC + Airtable)
 *   - lbTelebuySummarizeSkill composes addSessionTranscript + syncTelebuySessionToAirtable
 *
 * Both validate input with their Zod contract, run the service, audit-log the
 * invocation via log-skill-invocation, and return a typed SkillResult.
 */

import type { Skill, SkillContext, SkillResult, ToolCallRecord } from '../types';
import { logSkillInvocation, hashInput } from '../audit';
import {
  createTelebuySession,
  addSessionTranscript,
  syncTelebuySessionToAirtable,
  type TelebuySession,
} from '@/services/telebuy.service';
import {
  lbTelebuySessionContract,
  lbTelebuySummarizeContract,
  type LbTelebuySessionInput,
  type LbTelebuySessionOutput,
  type LbTelebuySummarizeInput,
  type LbTelebuySummarizeOutput,
} from './lb-telebuy.contract';

// -------------------- lb-telebuy-session --------------------

export const lbTelebuySessionSkill: Skill<
  LbTelebuySessionInput,
  LbTelebuySessionOutput
> = {
  contract: lbTelebuySessionContract,

  async execute(
    input: LbTelebuySessionInput,
    context: SkillContext
  ): Promise<SkillResult<LbTelebuySessionOutput>> {
    const startTime = performance.now();
    const toolCalls: ToolCallRecord[] = [];

    const finish = async (
      result: SkillResult<LbTelebuySessionOutput>
    ): Promise<SkillResult<LbTelebuySessionOutput>> => {
      await logSkillInvocation({
        skillName: lbTelebuySessionContract.name,
        skillVersion: lbTelebuySessionContract.version,
        context,
        inputHash: hashInput(input),
        result,
        durationMs: Math.round(performance.now() - startTime),
        toolCalls,
      });
      return result;
    };

    try {
      const parsed = lbTelebuySessionContract.inputSchema.safeParse(input);
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

      // Compose the existing service: it provisions the video room via the
      // VideoProviderAdapter, persists the row via create_telebuy_session, and
      // mirrors to Airtable. meetingUrl is supplied by the adapter; we pass an
      // empty seed since the service overwrites it for provisioned providers.
      const rpcStart = performance.now();
      const { data: session, error } = await createTelebuySession({
        supplierId: validInput.supplierId,
        scheduledAt: validInput.scheduledAt,
        meetingUrl: '',
        notes: validInput.notes,
        videoProvider: validInput.videoProvider,
      });
      toolCalls.push({
        tool: 'service.createTelebuySession',
        success: !error && !!session,
        duration_ms: Math.round(performance.now() - rpcStart),
        error: error?.message,
      });

      if (error || !session) {
        return finish({
          success: false,
          error: {
            code: 'SESSION_CREATE_FAILED',
            message: error?.message || 'Failed to create TeleBuy session',
            retryable: true,
          },
        });
      }

      const joinUrl = session.meeting_url ?? '';
      const result: LbTelebuySessionOutput = {
        sessionId: session.id,
        joinUrl,
        status: session.status ?? 'scheduled',
        scheduledAt: session.scheduled_at,
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

// -------------------- lb-telebuy-summarize --------------------

export const lbTelebuySummarizeSkill: Skill<
  LbTelebuySummarizeInput,
  LbTelebuySummarizeOutput
> = {
  contract: lbTelebuySummarizeContract,

  async execute(
    input: LbTelebuySummarizeInput,
    context: SkillContext
  ): Promise<SkillResult<LbTelebuySummarizeOutput>> {
    const startTime = performance.now();
    const toolCalls: ToolCallRecord[] = [];

    const finish = async (
      result: SkillResult<LbTelebuySummarizeOutput>
    ): Promise<SkillResult<LbTelebuySummarizeOutput>> => {
      await logSkillInvocation({
        skillName: lbTelebuySummarizeContract.name,
        skillVersion: lbTelebuySummarizeContract.version,
        context,
        inputHash: hashInput(input),
        result,
        durationMs: Math.round(performance.now() - startTime),
        toolCalls,
      });
      return result;
    };

    try {
      const parsed = lbTelebuySummarizeContract.inputSchema.safeParse(input);
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

      // 1. Attach transcript/summary via the existing RPC wrapper.
      const rpcStart = performance.now();
      const { data: session, error } = await addSessionTranscript(
        validInput.sessionId,
        validInput.transcript,
        validInput.aiSummary
      );
      toolCalls.push({
        tool: 'supabase.rpc.add_session_transcript',
        success: !error && !!session,
        duration_ms: Math.round(performance.now() - rpcStart),
        error: error?.message,
      });

      if (error || !session) {
        return finish({
          success: false,
          error: {
            code: 'TRANSCRIPT_ATTACH_FAILED',
            message: error?.message || 'Failed to attach transcript to session',
            retryable: true,
          },
        });
      }

      // 2. Mirror the updated session to Airtable (best-effort, never throws).
      const syncStart = performance.now();
      await syncTelebuySessionToAirtable(session as TelebuySession);
      toolCalls.push({
        tool: 'external.airtable.sync',
        success: true,
        duration_ms: Math.round(performance.now() - syncStart),
      });

      const result: LbTelebuySummarizeOutput = {
        sessionId: session.id,
        status: session.status ?? 'completed',
        summarized: true,
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
