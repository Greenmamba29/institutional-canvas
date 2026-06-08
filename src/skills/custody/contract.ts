/**
 * LB Custody Skill Contract (lane: skills-telebuy-custody)
 *
 * lb-procure-custody: append a chain-of-custody event for an order via
 * custody.service.addCustodyEvent (create_custody_event RPC -> Airtable sync).
 */

import { z } from 'zod';
import type { SkillContract } from '../types';
import type { CustodyEventType } from '@/services/custody.service';

const custodyEventTypes = [
  'origin',
  'extraction',
  'processing',
  'transport',
  'storage',
  'inspection',
  'delivery',
] as const satisfies readonly CustodyEventType[];

const custodyDocumentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['certificate', 'bill_of_lading', 'inspection_report', 'customs', 'other']),
  url: z.string().url(),
  uploadedAt: z.string(),
});

export const lbProcureCustodyInputSchema = z.object({
  orderId: z.string().uuid('Order ID must be a valid UUID'),
  eventType: z.enum(custodyEventTypes),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  location: z.string().max(500).optional(),
  dealId: z.string().uuid().optional(),
  occurredAt: z.string().datetime().optional(),
  verifiedBy: z.string().optional(),
  documents: z.array(custodyDocumentSchema).optional(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type LbProcureCustodyInput = z.infer<typeof lbProcureCustodyInputSchema>;

export const lbProcureCustodyOutputSchema = z.object({
  eventId: z.string().uuid(),
  orderId: z.string().uuid(),
  eventType: z.enum(custodyEventTypes),
  occurredAt: z.string(),
});

export type LbProcureCustodyOutput = z.infer<typeof lbProcureCustodyOutputSchema>;

export const lbProcureCustodyContract: SkillContract<
  LbProcureCustodyInput,
  LbProcureCustodyOutput
> = {
  name: 'order.lb_procure_custody',
  version: '1.0.0',
  description:
    'Append a chain-of-custody event to an order (create_custody_event RPC) and mirror it to Airtable',
  inputSchema: lbProcureCustodyInputSchema,
  outputSchema: lbProcureCustodyOutputSchema,
  requiredCapabilities: ['manage_orders'],
  requiredTools: ['supabase.rpc.create_custody_event', 'external.airtable'],
  requiredSubscription: 'pro',
};
