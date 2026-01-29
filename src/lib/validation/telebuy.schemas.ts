/**
 * TeleBuy Validation Schemas
 * 
 * Zod schemas for TeleBuy session operations.
 */

import { z } from 'zod';
import { uuidSchema, notesSchema } from './schemas';

// Session creation schema
export const createTelebuySessionSchema = z.object({
  p_supplier_id: uuidSchema,
  p_scheduled_at: z.string().datetime({ message: 'Invalid datetime format' }),
  p_meeting_url: z.string().url('Invalid meeting URL').optional(),
  p_notes: notesSchema.optional(),
});

export type CreateTelebuySessionInput = z.infer<typeof createTelebuySessionSchema>;

// Session status update schema
export const updateSessionStatusSchema = z.object({
  p_session_id: uuidSchema,
  p_status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
});

export type UpdateSessionStatusInput = z.infer<typeof updateSessionStatusSchema>;

// Transcript entry schema (for JSONB array elements)
const transcriptEntrySchema = z.object({
  speaker: z.string().optional(),
  text: z.string(),
  timestamp: z.string().optional(),
});

// Add transcript schema - accepts JSONB (object or array)
export const addSessionTranscriptSchema = z.object({
  p_session_id: uuidSchema,
  p_transcript: z.union([
    transcriptEntrySchema,
    z.array(transcriptEntrySchema),
  ]),
});

export type AddSessionTranscriptInput = z.infer<typeof addSessionTranscriptSchema>;

// Add document schema
export const addSessionDocumentSchema = z.object({
  p_session_id: uuidSchema,
  p_document_url: z.string().url('Invalid document URL'),
  p_document_type: z.string().max(50, 'Document type too long').optional(),
  p_document_name: z.string().max(255, 'Document name too long').optional(),
});

export type AddSessionDocumentInput = z.infer<typeof addSessionDocumentSchema>;
