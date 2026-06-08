/**
 * LB TeleBuy Skill Contracts (lane: skills-telebuy-custody)
 *
 * Thin orchestration contracts over telebuy.service:
 *   - lb-telebuy-session   : create a session (provisions Daily room + RPC + Airtable)
 *   - lb-telebuy-summarize : attach transcript/summary to a session, then sync Airtable
 *
 * These compose EXISTING services; they do not reimplement business logic.
 */

import { z } from 'zod';
import type { SkillContract } from '../types';

// -------------------- lb-telebuy-session --------------------

export const lbTelebuySessionInputSchema = z.object({
  supplierId: z.string().uuid('Supplier ID must be a valid UUID'),
  scheduledAt: z.string().datetime('Must be a valid ISO datetime'),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
  videoProvider: z.enum(['daily', 'google_meet']).default('daily'),
});

export type LbTelebuySessionInput = z.infer<typeof lbTelebuySessionInputSchema>;

export const lbTelebuySessionOutputSchema = z.object({
  sessionId: z.string().uuid(),
  joinUrl: z.string().url(),
  status: z.string(),
  scheduledAt: z.string(),
});

export type LbTelebuySessionOutput = z.infer<typeof lbTelebuySessionOutputSchema>;

export const lbTelebuySessionContract: SkillContract<
  LbTelebuySessionInput,
  LbTelebuySessionOutput
> = {
  name: 'telebuy.lb_session',
  version: '1.0.0',
  description:
    'Create a TeleBuy session (provisions the video room, persists via RPC, mirrors to Airtable) and return the join URL',
  inputSchema: lbTelebuySessionInputSchema,
  outputSchema: lbTelebuySessionOutputSchema,
  requiredCapabilities: ['use_telebuy'],
  requiredTools: [
    'supabase.rpc.create_telebuy_session',
    'external.daily',
    'external.airtable',
  ],
  requiredSubscription: 'pro',
  featureFlags: ['telebuy_enabled'],
};

// -------------------- lb-telebuy-summarize --------------------

export const lbTelebuySummarizeInputSchema = z.object({
  sessionId: z.string().uuid('Session ID must be a valid UUID'),
  transcript: z.string().min(1, 'Transcript is required').max(100000),
  aiSummary: z.string().max(20000).optional(),
});

export type LbTelebuySummarizeInput = z.infer<typeof lbTelebuySummarizeInputSchema>;

export const lbTelebuySummarizeOutputSchema = z.object({
  sessionId: z.string().uuid(),
  status: z.string(),
  summarized: z.literal(true),
});

export type LbTelebuySummarizeOutput = z.infer<typeof lbTelebuySummarizeOutputSchema>;

export const lbTelebuySummarizeContract: SkillContract<
  LbTelebuySummarizeInput,
  LbTelebuySummarizeOutput
> = {
  name: 'telebuy.lb_summarize',
  version: '1.0.0',
  description:
    'Attach a transcript/AI summary to a TeleBuy session via RPC and mirror the updated session to Airtable',
  inputSchema: lbTelebuySummarizeInputSchema,
  outputSchema: lbTelebuySummarizeOutputSchema,
  requiredCapabilities: ['use_telebuy'],
  requiredTools: ['supabase.rpc.add_session_transcript', 'external.airtable'],
  requiredSubscription: 'pro',
  featureFlags: ['telebuy_enabled'],
};
