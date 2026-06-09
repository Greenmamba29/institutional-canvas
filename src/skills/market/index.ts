/**
 * Market Skill Implementation — lb-market-pulse
 *
 * THIN orchestration over existing market services:
 *   - getPriceIndicators (market.service / get_price_indicators RPC) for the data
 *   - market-intel-ingest edge fn (Firecrawl) for the optional best-effort refresh
 *
 * No business logic is reinvented here. The skill validates input, composes the
 * existing reads, derives a concise summary, audits the invocation, and returns
 * a typed SkillResult.
 */

import type { Skill, SkillContext, SkillResult, ToolCallRecord } from '../types';
import { getPriceIndicators, type PriceIndicator } from '@/services/market.service';
import { supabase } from '@/integrations/supabase/client';
import { logSkillInvocation, hashInput } from '../audit';
import {
  marketPulseContract,
  type MarketPulseInput,
  type MarketPulseOutput,
} from './contract';

function buildSummary(symbol: string, indicators: PriceIndicator[]): {
  summary: string;
  latestPrice: number | null;
  currency: string | null;
  unit: string | null;
  changePct: number | null;
  trend: MarketPulseOutput['trend'];
  observedAt: string | null;
} {
  if (indicators.length === 0) {
    return {
      summary: `No recent price indicators found for ${symbol}.`,
      latestPrice: null,
      currency: null,
      unit: null,
      changePct: null,
      trend: 'unknown',
      observedAt: null,
    };
  }

  // Indicators are returned most-recent-first.
  const latest = indicators[0];
  const previous = indicators[1];

  let changePct: number | null = null;
  let trend: MarketPulseOutput['trend'] = 'unknown';
  if (previous && previous.price !== 0) {
    changePct = ((latest.price - previous.price) / previous.price) * 100;
    if (changePct > 0.05) trend = 'up';
    else if (changePct < -0.05) trend = 'down';
    else trend = 'stable';
  }

  const changeText =
    changePct === null
      ? ''
      : ` (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}% vs prior)`;

  const summary =
    `${symbol} (${latest.region}): ${latest.price} ${latest.currency}/${latest.unit}` +
    `${changeText} as of ${latest.observed_at}.`;

  return {
    summary,
    latestPrice: latest.price,
    currency: latest.currency,
    unit: latest.unit,
    changePct,
    trend,
    observedAt: latest.observed_at,
  };
}

export const marketPulseSkill: Skill<MarketPulseInput, MarketPulseOutput> = {
  contract: marketPulseContract,

  async execute(
    input: MarketPulseInput,
    context: SkillContext
  ): Promise<SkillResult<MarketPulseOutput>> {
    const startTime = performance.now();
    const toolCalls: ToolCallRecord[] = [];

    const parsed = marketPulseContract.inputSchema.safeParse(input);
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
      // 1. Best-effort refresh via the Firecrawl-powered market-intel-ingest
      //    edge fn (pulls fresh prices -> price_indicators and news -> market_news).
      let refreshed = false;
      if (validInput.refresh) {
        const refreshStart = performance.now();
        try {
          await supabase.functions.invoke('market-intel-ingest', { body: {} });
          refreshed = true;
          toolCalls.push({
            tool: 'edge.market-intel-ingest',
            success: true,
            duration_ms: Math.round(performance.now() - refreshStart),
          });
        } catch (err) {
          // Best-effort: never fail the pulse on a refresh error.
          toolCalls.push({
            tool: 'edge.market-intel-ingest',
            success: false,
            duration_ms: Math.round(performance.now() - refreshStart),
            error: err instanceof Error ? err.message : 'refresh failed',
          });
        }
      }

      // 2. Read latest price indicators.
      const rpcStart = performance.now();
      const { data, error } = await getPriceIndicators({
        p_symbol: validInput.symbol,
        p_region: (validInput.region ?? null) as unknown as string,
        p_limit: validInput.limit,
      });
      toolCalls.push({
        tool: 'supabase.rpc.get_price_indicators',
        success: !error,
        duration_ms: Math.round(performance.now() - rpcStart),
        error: error?.message,
      });

      if (error) {
        const result: SkillResult<MarketPulseOutput> = {
          success: false,
          error: {
            code: 'RPC_ERROR',
            message: error.message,
            retryable: true,
          },
        };
        await logSkillInvocation({
          skillName: marketPulseContract.name,
          skillVersion: marketPulseContract.version,
          context,
          inputHash: hashInput(input),
          result,
          durationMs: Math.round(performance.now() - startTime),
          toolCalls,
        });
        return result;
      }

      const indicators = data ?? [];
      const derived = buildSummary(validInput.symbol, indicators);

      const output: MarketPulseOutput = {
        symbol: validInput.symbol,
        region: validInput.region ?? null,
        summary: derived.summary,
        latestPrice: derived.latestPrice,
        currency: derived.currency,
        unit: derived.unit,
        changePct: derived.changePct,
        trend: derived.trend,
        indicatorCount: indicators.length,
        indicators: indicators.map((i) => ({
          symbol: i.symbol,
          region: i.region,
          price: i.price,
          currency: i.currency,
          unit: i.unit,
          observedAt: i.observed_at,
          source: i.source,
        })),
        refreshed,
        observedAt: derived.observedAt,
      };

      const result: SkillResult<MarketPulseOutput> = { success: true, data: output };

      await logSkillInvocation({
        skillName: marketPulseContract.name,
        skillVersion: marketPulseContract.version,
        context,
        inputHash: hashInput(input),
        result,
        durationMs: Math.round(performance.now() - startTime),
        toolCalls,
      });

      return result;
    } catch (err) {
      const result: SkillResult<MarketPulseOutput> = {
        success: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: err instanceof Error ? err.message : 'An unexpected error occurred',
          retryable: true,
        },
      };
      await logSkillInvocation({
        skillName: marketPulseContract.name,
        skillVersion: marketPulseContract.version,
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

export const marketSkills = {
  pulse: marketPulseSkill,
};
