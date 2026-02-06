/**
 * TeleBuy Skill Contract
 * 
 * Defines the input/output schemas and requirements for TeleBuy video sessions.
 */

import { z } from 'zod';
import type { SkillContract } from '../types';

// Input schema for starting a TeleBuy session
export const startSessionInputSchema = z.object({
  supplierId: z.string().uuid('Supplier ID must be a valid UUID'),
  scheduledAt: z.string().datetime('Must be a valid ISO datetime'),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
  videoProvider: z.enum(['daily', 'google_meet']).default('google_meet'),
  demoMode: z.boolean().optional().default(false),
});

export type StartSessionInput = z.infer<typeof startSessionInputSchema>;

// Output schema for session creation
export const startSessionOutputSchema = z.object({
  sessionId: z.string().uuid(),
  meetingUrl: z.string().url(),
  status: z.literal('scheduled'),
  isDemo: z.boolean(),
  scheduledAt: z.string().datetime(),
});

export type StartSessionOutput = z.infer<typeof startSessionOutputSchema>;

// The skill contract
export const telebuyStartContract: SkillContract<StartSessionInput, StartSessionOutput> = {
  name: 'telebuy.start',
  version: '1.0.0',
  description: 'Start a new TeleBuy video negotiation session with a supplier',
  inputSchema: startSessionInputSchema,
  outputSchema: startSessionOutputSchema,
  requiredCapabilities: ['use_telebuy'],
  requiredTools: ['supabase.rpc.create_telebuy_session'],
  requiredSubscription: 'pro',
  featureFlags: ['telebuy_enabled'],
};

// List sessions contract
export const listSessionsInputSchema = z.object({
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type ListSessionsInput = z.infer<typeof listSessionsInputSchema>;

export const telebuyListContract: SkillContract<ListSessionsInput, unknown> = {
  name: 'telebuy.list',
  version: '1.0.0',
  description: 'List TeleBuy sessions for the current organization',
  inputSchema: listSessionsInputSchema,
  outputSchema: z.array(z.object({
    id: z.string().uuid(),
    supplierId: z.string().uuid(),
    supplierName: z.string(),
    status: z.string(),
    scheduledAt: z.string().datetime(),
    meetingUrl: z.string().url().optional(),
  })),
  requiredCapabilities: ['use_telebuy'],
  requiredTools: ['supabase.read.telebuy_sessions'],
  requiredSubscription: 'pro',
  featureFlags: ['telebuy_enabled'],
};
