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
export * from './elevenlabs.service';
// Re-export multi-agent without conflicting names
export { getAgentConfig, createAgentSession, startAgentSession, endAgentSession, logAgentMessage, getConversationHistory, isMultiAgentConfigured } from './elevenlabs-multi-agent.service';
export type { AgentRole, AgentLanguage, AgentSession, AgentMessage, AgentSessionStatus } from './elevenlabs-multi-agent.service';
export { searchKnowledgeBase, getKnowledgeByCategory, addKnowledgeEntry, seedKnowledgeBase } from './knowledge-base.service';
export { getAgentKnowledge } from './airtable.service';
export { detectUserLanguage, getSupportedLanguages, getLanguageName, storeLanguagePreference } from './language-detection.service';
export * from './daily.service';
