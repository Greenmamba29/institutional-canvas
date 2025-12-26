/**
 * Input Validation Schemas - Zod Validation for RPC Calls
 * 
 * SECURITY: All user inputs MUST be validated before sending to RPC functions.
 * This provides defense-in-depth alongside PostgreSQL parameterization.
 */

import { z } from 'zod';

// ============================================
// Common Validation Rules
// ============================================

const MAX_TITLE_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_NOTES_LENGTH = 2000;
const MAX_SEARCH_QUERY_LENGTH = 100;

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Text field schemas
export const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(MAX_TITLE_LENGTH, `Title must be less than ${MAX_TITLE_LENGTH} characters`);

export const descriptionSchema = z
  .string()
  .trim()
  .max(MAX_DESCRIPTION_LENGTH, `Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`)
  .optional()
  .or(z.literal(''));

export const notesSchema = z
  .string()
  .trim()
  .max(MAX_NOTES_LENGTH, `Notes must be less than ${MAX_NOTES_LENGTH} characters`)
  .optional()
  .or(z.literal(''));

export const searchQuerySchema = z
  .string()
  .trim()
  .max(MAX_SEARCH_QUERY_LENGTH, `Search query must be less than ${MAX_SEARCH_QUERY_LENGTH} characters`);

// Numeric schemas
export const positiveNumberSchema = z.number().positive('Value must be positive');
export const nonNegativeNumberSchema = z.number().min(0, 'Value cannot be negative');
export const positiveIntegerSchema = z.number().int().positive('Value must be a positive integer');

// Currency schema
export const currencySchema = z
  .string()
  .trim()
  .length(3, 'Currency must be a 3-letter code')
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, 'Invalid currency code');

// ============================================
// RFQ Validation Schemas
// ============================================

export const createRfqSchema = z.object({
  p_title: titleSchema,
  p_description: descriptionSchema.default(''),
  p_product_id: uuidSchema.nullish(), // Optional - database allows null
  p_target_quantity: positiveNumberSchema,
  p_target_unit: z.string().trim().min(1, 'Unit is required').max(50, 'Unit too long'),
  p_incoterms: z.string().trim().max(50, 'Incoterms too long').optional().default(''),
  p_delivery_location: z.string().trim().max(500, 'Delivery location too long').optional().default(''),
});

export type CreateRfqInput = z.infer<typeof createRfqSchema>;

// ============================================
// Bid Validation Schemas
// ============================================

export const submitBidSchema = z.object({
  p_rfq_id: uuidSchema,
  p_supplier_id: uuidSchema,
  p_price: positiveNumberSchema,
  p_currency: currencySchema,
  p_quantity: positiveNumberSchema,
  p_lead_time_days: positiveIntegerSchema,
  p_notes: notesSchema.default(''),
});

export type SubmitBidInput = z.infer<typeof submitBidSchema>;

// ============================================
// Deal Validation Schemas
// ============================================

export const createDealSchema = z.object({
  p_supplier_id: uuidSchema,
  p_rfq_id: uuidSchema,
  p_title: titleSchema,
});

export type CreateDealInput = z.infer<typeof createDealSchema>;

export const respondToOfferSchema = z.object({
  p_deal_id: uuidSchema,
  p_decision: z.enum(['accepted', 'rejected', 'counter']),
  p_note: notesSchema.default(''),
});

export type RespondToOfferInput = z.infer<typeof respondToOfferSchema>;

// ============================================
// Auction Validation Schemas
// ============================================

export const placeAuctionBidSchema = z.object({
  p_auction_id: uuidSchema,
  p_amount: positiveNumberSchema,
  p_currency: currencySchema,
});

export type PlaceAuctionBidInput = z.infer<typeof placeAuctionBidSchema>;

// ============================================
// Purchase Validation Schemas
// ============================================

export const createPurchaseSchema = z.object({
  p_buyer_org_id: uuidSchema,
  p_supplier_org_id: uuidSchema,
  p_deal_id: uuidSchema.optional(),
  p_total_amount: nonNegativeNumberSchema.optional(),
  p_currency: currencySchema.default('USD'),
  p_payload: z.record(z.unknown()).optional(),
  p_notes: notesSchema.optional(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

// ============================================
// Validation Helper
// ============================================

/**
 * Validate input against schema and throw descriptive error if invalid
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0];
    throw new Error(`Validation failed: ${firstError.path.join('.')} - ${firstError.message}`);
  }
  return result.data;
}
