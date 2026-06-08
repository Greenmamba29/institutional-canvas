/**
 * Market Skill Contract
 *
 * Defines the input/output schemas for the lb-market-pulse skill, which
 * returns a concise summary of the latest lithium price indicators.
 */

import { z } from 'zod';
import type { SkillContract } from '../types';

export const marketPulseInputSchema = z.object({
  /** Price indicator symbol to summarize (e.g. 'Li2CO3'). */
  symbol: z.string().min(1).default('Li2CO3'),
  /** Optional region filter; null/omit = all regions. */
  region: z.string().min(1).nullable().optional(),
  /** Max number of indicator observations to consider. */
  limit: z.number().int().min(1).max(100).default(20),
  /**
   * When true, best-effort trigger of the perplexity market-intel refresh
   * before reading. Never blocks the result.
   */
  refresh: z.boolean().default(false),
});

export type MarketPulseInput = z.infer<typeof marketPulseInputSchema>;

export const marketPulseIndicatorSchema = z.object({
  symbol: z.string(),
  region: z.string(),
  price: z.number(),
  currency: z.string(),
  unit: z.string(),
  observedAt: z.string(),
  source: z.string().nullable(),
});

export const marketPulseOutputSchema = z.object({
  symbol: z.string(),
  region: z.string().nullable(),
  /** Human-readable one-line market summary. */
  summary: z.string(),
  /** Latest observed price, if any indicators were found. */
  latestPrice: z.number().nullable(),
  currency: z.string().nullable(),
  unit: z.string().nullable(),
  /** Simple change vs the next-most-recent observation. */
  changePct: z.number().nullable(),
  trend: z.enum(['up', 'down', 'stable', 'unknown']),
  indicatorCount: z.number(),
  indicators: z.array(marketPulseIndicatorSchema),
  /** Whether the best-effort refresh was attempted/succeeded. */
  refreshed: z.boolean(),
  observedAt: z.string().nullable(),
});

export type MarketPulseOutput = z.infer<typeof marketPulseOutputSchema>;

export const marketPulseContract: SkillContract<MarketPulseInput, MarketPulseOutput> = {
  name: 'market.pulse',
  version: '1.0.0',
  description: 'Fetch the latest lithium price indicators and return a concise market summary',
  inputSchema: marketPulseInputSchema,
  outputSchema: marketPulseOutputSchema,
  requiredCapabilities: ['view_market'],
  requiredTools: ['supabase.rpc.get_price_indicators'],
  requiredSubscription: 'pro',
  featureFlags: [],
  maxExecutionMs: 15000,
};
