/**
 * TeleBuy Validation Schemas Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createTelebuySessionSchema,
  updateSessionStatusSchema,
  addSessionTranscriptSchema,
} from './telebuy.schemas';

describe('TeleBuy Validation Schemas', () => {
  describe('createTelebuySessionSchema', () => {
    it('should accept valid session data', () => {
      const validSession = {
        p_supplier_id: '123e4567-e89b-12d3-a456-426614174000',
        p_scheduled_at: '2026-01-15T14:00:00.000Z',
        p_meeting_url: 'https://meet.google.com/abc-defg-hij',
        p_notes: 'Discuss Q1 pricing',
      };
      
      const result = createTelebuySessionSchema.parse(validSession);
      expect(result.p_supplier_id).toBe(validSession.p_supplier_id);
      expect(result.p_scheduled_at).toBe(validSession.p_scheduled_at);
    });

    it('should accept session without optional fields', () => {
      const minimalSession = {
        p_supplier_id: '123e4567-e89b-12d3-a456-426614174000',
        p_scheduled_at: '2026-01-15T14:00:00.000Z',
      };
      
      const result = createTelebuySessionSchema.parse(minimalSession);
      expect(result.p_supplier_id).toBe(minimalSession.p_supplier_id);
    });

    it('should reject session with invalid supplier ID', () => {
      const invalidSession = {
        p_supplier_id: 'not-a-uuid',
        p_scheduled_at: '2026-01-15T14:00:00.000Z',
      };
      
      expect(() => createTelebuySessionSchema.parse(invalidSession)).toThrow();
    });

    it('should reject session with invalid datetime', () => {
      const invalidSession = {
        p_supplier_id: '123e4567-e89b-12d3-a456-426614174000',
        p_scheduled_at: 'not-a-datetime',
      };
      
      expect(() => createTelebuySessionSchema.parse(invalidSession)).toThrow();
    });

    it('should reject session with invalid meeting URL', () => {
      const invalidSession = {
        p_supplier_id: '123e4567-e89b-12d3-a456-426614174000',
        p_scheduled_at: '2026-01-15T14:00:00.000Z',
        p_meeting_url: 'not-a-url',
      };
      
      expect(() => createTelebuySessionSchema.parse(invalidSession)).toThrow();
    });
  });

  describe('updateSessionStatusSchema', () => {
    it('should accept valid status update', () => {
      const validUpdate = {
        p_session_id: '123e4567-e89b-12d3-a456-426614174000',
        p_status: 'in_progress',
      };
      
      const result = updateSessionStatusSchema.parse(validUpdate);
      expect(result.p_status).toBe('in_progress');
    });

    it('should accept all valid status values', () => {
      const sessionId = '123e4567-e89b-12d3-a456-426614174000';
      
      const statuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
      
      for (const status of statuses) {
        const result = updateSessionStatusSchema.parse({
          p_session_id: sessionId,
          p_status: status,
        });
        expect(result.p_status).toBe(status);
      }
    });

    it('should reject invalid status value', () => {
      const invalidUpdate = {
        p_session_id: '123e4567-e89b-12d3-a456-426614174000',
        p_status: 'invalid_status',
      };
      
      expect(() => updateSessionStatusSchema.parse(invalidUpdate)).toThrow();
    });
  });

  describe('addSessionTranscriptSchema', () => {
    it('should accept valid transcript data', () => {
      const validTranscript = {
        p_session_id: '123e4567-e89b-12d3-a456-426614174000',
        p_transcript: {
          speaker: 'John Doe',
          text: 'Welcome to the meeting',
          timestamp: '00:00:05',
        },
      };
      
      const result = addSessionTranscriptSchema.parse(validTranscript);
      expect(result.p_transcript).toEqual(validTranscript.p_transcript);
    });

    it('should accept transcript array', () => {
      const validTranscript = {
        p_session_id: '123e4567-e89b-12d3-a456-426614174000',
        p_transcript: [
          { speaker: 'John', text: 'Hello', timestamp: '00:00:00' },
          { speaker: 'Jane', text: 'Hi there', timestamp: '00:00:02' },
        ],
      };
      
      const result = addSessionTranscriptSchema.parse(validTranscript);
      expect(result.p_transcript).toHaveLength(2);
    });
  });
});
