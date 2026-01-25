/**
 * Validation Schemas Tests
 * 
 * Tests for Zod validation schemas
 */

import { describe, it, expect } from 'vitest';
import {
  uuidSchema,
  currencySchema,
  notesSchema,
  nonNegativeNumberSchema,
  createRfqSchema,
  submitBidSchema,
  createDealSchema,
  validateInput,
} from './schemas';

describe('Validation Schemas', () => {
  describe('uuidSchema', () => {
    it('should accept valid UUIDs', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      expect(uuidSchema.parse(validUuid)).toBe(validUuid);
    });

    it('should reject invalid UUIDs', () => {
      expect(() => uuidSchema.parse('invalid-uuid')).toThrow();
      expect(() => uuidSchema.parse('')).toThrow();
      expect(() => uuidSchema.parse('123')).toThrow();
    });
  });

  describe('currencySchema', () => {
    it('should accept valid currency codes', () => {
      expect(currencySchema.parse('USD')).toBe('USD');
      expect(currencySchema.parse('EUR')).toBe('EUR');
      expect(currencySchema.parse('GBP')).toBe('GBP');
    });

    it('should reject invalid currency codes', () => {
      expect(() => currencySchema.parse('USDD')).toThrow();
      expect(() => currencySchema.parse('US')).toThrow();
      expect(() => currencySchema.parse('123')).toThrow();
    });
  });

  describe('notesSchema', () => {
    it('should accept valid notes', () => {
      expect(notesSchema.parse('This is a valid note')).toBe('This is a valid note');
    });

    it('should accept empty string', () => {
      expect(notesSchema.parse('')).toBe('');
    });

    it('should reject notes that are too long', () => {
      const longNote = 'a'.repeat(2001);
      expect(() => notesSchema.parse(longNote)).toThrow();
    });
  });

  describe('nonNegativeNumberSchema', () => {
    it('should accept positive numbers', () => {
      expect(nonNegativeNumberSchema.parse(100)).toBe(100);
      expect(nonNegativeNumberSchema.parse(0)).toBe(0);
      expect(nonNegativeNumberSchema.parse(0.5)).toBe(0.5);
    });

    it('should reject negative numbers', () => {
      expect(() => nonNegativeNumberSchema.parse(-1)).toThrow();
      expect(() => nonNegativeNumberSchema.parse(-100)).toThrow();
    });
  });

  describe('createRfqSchema', () => {
    it('should accept valid RFQ data', () => {
      const validRfq = {
        p_title: 'Lithium Carbonate Q1 2026',
        p_description: 'Need 100MT of battery-grade lithium carbonate',
        p_target_quantity: 100,
        p_target_unit: 'MT',
        p_delivery_location: 'Shanghai Port',
        p_incoterms: 'CIF',
      };
      
      const result = createRfqSchema.parse(validRfq);
      expect(result.p_title).toBe(validRfq.p_title);
      expect(result.p_target_quantity).toBe(100);
    });

    it('should reject RFQ with empty title', () => {
      const invalidRfq = {
        p_title: '',
        p_description: 'Description',
      };
      
      expect(() => createRfqSchema.parse(invalidRfq)).toThrow();
    });

    it('should reject RFQ with title too long', () => {
      const invalidRfq = {
        p_title: 'a'.repeat(201),
        p_description: 'Description',
      };
      
      expect(() => createRfqSchema.parse(invalidRfq)).toThrow();
    });
  });

  describe('submitBidSchema', () => {
    it('should accept valid bid data', () => {
      const validBid = {
        p_rfq_id: '123e4567-e89b-12d3-a456-426614174000',
        p_supplier_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        p_price: 85000,
        p_currency: 'USD',
        p_quantity: 100,
        p_lead_time_days: 45,
        p_notes: 'Standard delivery terms',
      };
      
      const result = submitBidSchema.parse(validBid);
      expect(result.p_price).toBe(85000);
      expect(result.p_quantity).toBe(100);
    });

    it('should reject bid with negative price', () => {
      const invalidBid = {
        p_rfq_id: '123e4567-e89b-12d3-a456-426614174000',
        p_price: -100,
        p_quantity: 100,
      };
      
      expect(() => submitBidSchema.parse(invalidBid)).toThrow();
    });
  });

  describe('createDealSchema', () => {
    it('should accept valid deal data', () => {
      const validDeal = {
        p_supplier_id: '123e4567-e89b-12d3-a456-426614174000',
        p_rfq_id: '123e4567-e89b-12d3-a456-426614174000',
        p_title: 'Test Deal',
      };
      
      const result = createDealSchema.parse(validDeal);
      expect(result.p_supplier_id).toBe(validDeal.p_supplier_id);
    });

    it('should reject deal with invalid supplier ID', () => {
      const invalidDeal = {
        p_supplier_id: 'not-a-uuid',
        p_rfq_id: '123e4567-e89b-12d3-a456-426614174000',
        p_title: 'Test Deal',
      };
      
      expect(() => createDealSchema.parse(invalidDeal)).toThrow();
    });
  });

  describe('validateInput', () => {
    it('should return validated data for valid input', () => {
      const result = validateInput(uuidSchema, '123e4567-e89b-12d3-a456-426614174000');
      expect(result).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw validation error for invalid input', () => {
      expect(() => validateInput(uuidSchema, 'invalid')).toThrow();
    });
  });
});
