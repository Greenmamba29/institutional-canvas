/**
 * Grant Skill Contract
 *
 * Defines the input/output schemas for lb-grant-match, which fetches grants from
 * the airtable-grants edge function and returns ranked matches for the caller's
 * org using simple rule-based scoring.
 */

import { z } from 'zod';
import type { SkillContract } from '../types';

export const grantMatchInputSchema = z.object({
  /** Optional status filter passed through to the grants service. */
  status: z.string().min(1).optional(),
  /** Optional funding source filter. */
  fundingSource: z.string().min(1).optional(),
  /** Only return grants with a deadline before this ISO date. */
  deadlineBefore: z.string().min(1).optional(),
  /** Free-text keywords describing the org's focus, used for scoring. */
  keywords: z.array(z.string().min(1)).max(20).default([]),
  /** Max number of ranked matches to return. */
  limit: z.number().int().min(1).max(50).default(10),
});

export type GrantMatchInput = z.infer<typeof grantMatchInputSchema>;

export const grantMatchItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  fundingSource: z.string().nullable(),
  status: z.string().nullable(),
  deadline: z.string().nullable(),
  awardAmount: z.number().nullable(),
  score: z.number(),
  reasons: z.array(z.string()),
});

export type GrantMatchItem = z.infer<typeof grantMatchItemSchema>;

export const grantMatchOutputSchema = z.object({
  orgId: z.string(),
  totalConsidered: z.number(),
  matches: z.array(grantMatchItemSchema),
});

export type GrantMatchOutput = z.infer<typeof grantMatchOutputSchema>;

export const grantMatchContract: SkillContract<GrantMatchInput, GrantMatchOutput> = {
  name: 'grant.match',
  version: '1.0.0',
  description: 'Fetch grants and return ranked matches for the org using rule-based scoring',
  inputSchema: grantMatchInputSchema,
  outputSchema: grantMatchOutputSchema,
  requiredCapabilities: ['view_grants'],
  requiredTools: ['edge.airtable-grants'],
  requiredSubscription: 'pro',
  featureFlags: ['GRANT_TRACKER'],
  maxExecutionMs: 15000,
};
