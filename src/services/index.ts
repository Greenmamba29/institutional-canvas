/**
 * Services Index - RPC-Only Write Architecture
 * 
 * CRITICAL RULES (from ORCHESTRATION/SOT_CONTRACT.md):
 * 1. No direct table writes. Ever.
 * 2. All writes are RPC calls only.
 * 3. New UI features needing backend actions must update API.openapiv1.yaml first.
 * 
 * Services are organized by domain:
 * - usage.service.ts: Usage tracking and limits
 * - files.service.ts: File operations and metadata
 * - documents.service.ts: Chat documents and embeddings
 * - jobs.service.ts: Agent job tracking
 * - suppliers.service.ts: Supplier directory
 * - orders.service.ts: Orders and quotes
 * - telebuy.service.ts: Video session management
 */

// Core RPC wrapper
export { callRpc, supabase } from '@/lib/supabase/rpc';

// Domain services
export * from './usage.service';
export * from './files.service';
export * from './documents.service';
export * from './jobs.service';
export * from './suppliers.service';
export * from './orders.service';
export * from './telebuy.service';
