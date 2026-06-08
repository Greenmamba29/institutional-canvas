/**
 * Grant Skill Implementation — lb-grant-match
 *
 * THIN orchestration over the existing AirtableGrantsService (airtable-grants
 * edge function). It fetches grants for the caller's org, applies a simple
 * rule-based scoring pass, audits the invocation, and returns ranked matches.
 *
 * No business logic is reinvented: fetching/eligibility lives in the edge fn;
 * this skill only ranks what comes back.
 */

import type { Skill, SkillContext, SkillResult, ToolCallRecord } from '../types';
import { AirtableGrantsService } from '@/services/airtable-grants.service';
import { logSkillInvocation, hashInput } from '../audit';
import {
  grantMatchContract,
  type GrantMatchInput,
  type GrantMatchOutput,
  type GrantMatchItem,
} from './contract';

interface RawGrant {
  id?: string;
  recordId?: string;
  name?: string;
  title?: string;
  funding_source?: string;
  fundingSource?: string;
  status?: string;
  deadline?: string;
  deadline_date?: string;
  award_amount?: number;
  amount?: number;
  description?: string;
  tags?: string[];
  [key: string]: unknown;
}

function num(v: unknown): number | null {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v : null;
}

/**
 * Rule-based score:
 *  - +2 per keyword found in name/description/tags
 *  - +3 if the grant is "open"/"active"
 *  - +2 if a deadline exists in the future (urgency, still actionable)
 *  - +1 if an award amount is present
 */
function scoreGrant(
  grant: RawGrant,
  keywords: string[]
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  const haystack = [
    str(grant.name) ?? str(grant.title) ?? '',
    str(grant.description) ?? '',
    Array.isArray(grant.tags) ? grant.tags.join(' ') : '',
  ]
    .join(' ')
    .toLowerCase();

  const matched = keywords.filter((k) => haystack.includes(k.toLowerCase()));
  if (matched.length > 0) {
    score += matched.length * 2;
    reasons.push(`Matches keywords: ${matched.join(', ')}`);
  }

  const status = (str(grant.status) ?? '').toLowerCase();
  if (status === 'open' || status === 'active') {
    score += 3;
    reasons.push('Grant is currently open');
  }

  const deadline = str(grant.deadline) ?? str(grant.deadline_date);
  if (deadline) {
    const ts = Date.parse(deadline);
    if (!Number.isNaN(ts) && ts > Date.now()) {
      score += 2;
      reasons.push('Deadline is upcoming');
    }
  }

  if (num(grant.award_amount) ?? num(grant.amount)) {
    score += 1;
    reasons.push('Has a defined award amount');
  }

  return { score, reasons };
}

export const grantMatchSkill: Skill<GrantMatchInput, GrantMatchOutput> = {
  contract: grantMatchContract,

  async execute(
    input: GrantMatchInput,
    context: SkillContext
  ): Promise<SkillResult<GrantMatchOutput>> {
    const startTime = performance.now();
    const toolCalls: ToolCallRecord[] = [];

    const parsed = grantMatchContract.inputSchema.safeParse(input);
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

    try {
      const fetchStart = performance.now();
      let rawGrants: RawGrant[] = [];
      try {
        const data = await AirtableGrantsService.listGrants({
          status: validInput.status,
          funding_source: validInput.fundingSource,
          deadline_before: validInput.deadlineBefore,
        });
        // Edge fn may return an array or { grants: [...] } / { records: [...] }.
        if (Array.isArray(data)) rawGrants = data as RawGrant[];
        else if (Array.isArray((data as { grants?: unknown })?.grants))
          rawGrants = (data as { grants: RawGrant[] }).grants;
        else if (Array.isArray((data as { records?: unknown })?.records))
          rawGrants = (data as { records: RawGrant[] }).records;

        toolCalls.push({
          tool: 'edge.airtable-grants',
          success: true,
          duration_ms: Math.round(performance.now() - fetchStart),
        });
      } catch (err) {
        toolCalls.push({
          tool: 'edge.airtable-grants',
          success: false,
          duration_ms: Math.round(performance.now() - fetchStart),
          error: err instanceof Error ? err.message : 'fetch failed',
        });
        const result: SkillResult<GrantMatchOutput> = {
          success: false,
          error: {
            code: 'GRANTS_FETCH_ERROR',
            message: err instanceof Error ? err.message : 'Failed to fetch grants',
            retryable: true,
          },
        };
        await logSkillInvocation({
          skillName: grantMatchContract.name,
          skillVersion: grantMatchContract.version,
          context,
          inputHash: hashInput(input),
          result,
          durationMs: Math.round(performance.now() - startTime),
          toolCalls,
        });
        return result;
      }

      const ranked: GrantMatchItem[] = rawGrants
        .map((grant) => {
          const { score, reasons } = scoreGrant(grant, validInput.keywords);
          return {
            id: str(grant.id) ?? str(grant.recordId) ?? '',
            name: str(grant.name) ?? str(grant.title) ?? 'Untitled grant',
            fundingSource: str(grant.funding_source) ?? str(grant.fundingSource),
            status: str(grant.status),
            deadline: str(grant.deadline) ?? str(grant.deadline_date),
            awardAmount: num(grant.award_amount) ?? num(grant.amount),
            score,
            reasons,
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, validInput.limit);

      const output: GrantMatchOutput = {
        orgId: context.orgId,
        totalConsidered: rawGrants.length,
        matches: ranked,
      };

      const result: SkillResult<GrantMatchOutput> = { success: true, data: output };

      await logSkillInvocation({
        skillName: grantMatchContract.name,
        skillVersion: grantMatchContract.version,
        context,
        inputHash: hashInput(input),
        result,
        durationMs: Math.round(performance.now() - startTime),
        toolCalls,
      });

      return result;
    } catch (err) {
      const result: SkillResult<GrantMatchOutput> = {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: err instanceof Error ? err.message : 'An unexpected error occurred',
          retryable: true,
        },
      };
      await logSkillInvocation({
        skillName: grantMatchContract.name,
        skillVersion: grantMatchContract.version,
        context,
        inputHash: hashInput(input),
        result,
        durationMs: Math.round(performance.now() - startTime),
        toolCalls,
      });
      return result;
    }
  },
};

export const grantSkills = {
  match: grantMatchSkill,
};
