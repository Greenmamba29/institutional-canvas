/**
 * Services Index - Lithium & Lux RPC-Only Architecture
 */

// Core RPC wrapper
export { callRpc, supabase } from '@/lib/supabase/rpc';

// Organization helpers
export * from './org.helper';

// Lithium & Lux Domain Services
export * from './rfqs.service';
export * from './bids.service';
export * from './deals.service';
export * from './auctions.service';
export * from './notifications.service';
export * from './market.service';
export { listListings, getListing } from './listings.service';
export * from './suppliers.service';
export * from './orders.service';
export * from './organizations.service';

// ElevenLabs services - avoid duplicate export by re-exporting specific items
export { 
  createAgent, 
  getSterlingAgentConfig, 
  getAgentId, 
  isConfigured,
  type AgentConfig 
} from './elevenlabs.service';

export {
  type AgentRole,
  type AgentLanguage,
  type AgentSessionStatus,
  type MultiAgentConfig,
  type AgentSession,
  type AgentMessage,
  isMultiAgentConfigured,
  getAgentConfig,
  createAgentSession,
  startAgentSession,
  endAgentSession,
  logAgentMessage,
  getConversationHistory,
  getBuyerAgentConfig,
  getSupplierAgentConfig,
} from './elevenlabs-multi-agent.service';

export * from './knowledge-base.service';
export * from './airtable.service';
export * from './language-detection.service';
