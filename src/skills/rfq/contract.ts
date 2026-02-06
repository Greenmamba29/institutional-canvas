/**
 * RFQ Skill Contract
 * 
 * Defines the input/output schemas for RFQ (Request for Quote) operations.
 */

import { z } from 'zod';
import type { SkillContract } from '../types';

// Create RFQ input schema (matching backend RPC)
export const createRfqInputSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  productId: z.string().uuid('Product ID must be a valid UUID'),
  description: z.string().max(5000).optional(),
  targetQuantity: z.number().positive('Quantity must be positive'),
  targetUnit: z.enum(['kg', 'mt', 'lb']).default('mt'),
  deliveryLocation: z.string().min(3),
  incoterms: z.enum(['EXW', 'FOB', 'CIF', 'DDP']).default('FOB'),
});

export type CreateRfqInput = z.infer<typeof createRfqInputSchema>;

export const createRfqOutputSchema = z.object({
  rfqId: z.string().uuid(),
  status: z.enum(['draft', 'submitted']),
  createdAt: z.string().datetime(),
});

export type CreateRfqOutput = z.infer<typeof createRfqOutputSchema>;

export const rfqCreateContract: SkillContract<CreateRfqInput, CreateRfqOutput> = {
  name: 'rfq.create',
  version: '1.0.0',
  description: 'Create a new Request for Quote for lithium products',
  inputSchema: createRfqInputSchema,
  outputSchema: createRfqOutputSchema,
  requiredCapabilities: ['create_rfq'],
  requiredTools: ['supabase.rpc.create_rfq'],
  // No subscription required - free feature
  featureFlags: [],
};

// List RFQs input schema
export const listRfqsInputSchema = z.object({
  status: z.enum(['draft', 'submitted', 'closed', 'cancelled']).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export type ListRfqsInput = z.infer<typeof listRfqsInputSchema>;

export const rfqListContract: SkillContract<ListRfqsInput, unknown> = {
  name: 'rfq.list',
  version: '1.0.0',
  description: 'List RFQs for the current organization',
  inputSchema: listRfqsInputSchema,
  outputSchema: z.array(z.object({
    id: z.string().uuid(),
    title: z.string(),
    status: z.string(),
    bidCount: z.number(),
    createdAt: z.string().datetime(),
  })),
  requiredCapabilities: ['view_rfq'],
  requiredTools: ['supabase.read.rfqs'],
  featureFlags: [],
};

// Submit bid input schema (matching backend RPC)
export const submitBidInputSchema = z.object({
  rfqId: z.string().uuid(),
  supplierId: z.string().uuid(),
  price: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'CNY']).default('USD'),
  quantity: z.number().positive(),
  leadTimeDays: z.number().int().positive(),
  notes: z.string().max(2000).optional(),
});

export type SubmitBidInput = z.infer<typeof submitBidInputSchema>;

export const rfqRespondContract: SkillContract<SubmitBidInput, unknown> = {
  name: 'rfq.respond',
  version: '1.0.0',
  description: 'Submit a bid in response to an RFQ',
  inputSchema: submitBidInputSchema,
  outputSchema: z.object({
    bidId: z.string().uuid(),
    status: z.literal('submitted'),
  }),
  requiredCapabilities: ['submit_bid'],
  requiredTools: ['supabase.rpc.submit_bid'],
  featureFlags: [],
};
