/**
 * Tool Manifest - Defines all available tools and their access policies
 * 
 * SECURITY: Deny by default - tools not in manifest are blocked
 * All writes MUST go through RPC functions
 */

import type { ToolDefinition } from './types';

export const TOOL_MANIFEST: Record<string, ToolDefinition> = {
  // ============================================
  // PUBLIC READ (all authenticated users)
  // ============================================
  'supabase.read.suppliers': {
    name: 'supabase.read.suppliers',
    category: 'supabase.read.public',
    description: 'Read supplier directory',
    allowedSkills: ['*'],  // Marketplace is public
  },
  'supabase.read.products': {
    name: 'supabase.read.products',
    category: 'supabase.read.public',
    description: 'Read product listings',
    allowedSkills: ['*'],
  },
  'supabase.read.market_prices': {
    name: 'supabase.read.market_prices',
    category: 'supabase.read.public',
    description: 'Read market price data',
    allowedSkills: ['*'],
  },
  'supabase.read.certifications': {
    name: 'supabase.read.certifications',
    category: 'supabase.read.public',
    description: 'Read supplier certifications',
    allowedSkills: ['*'],
  },

  // ============================================
  // ORG-SCOPED READ (RLS enforces org isolation)
  // ============================================
  'supabase.read.rfqs': {
    name: 'supabase.read.rfqs',
    category: 'supabase.read.org_scoped',
    description: 'Read RFQs for user orgs only',
    allowedSkills: ['rfq.list', 'rfq.view', 'match.rank'],
  },
  'supabase.read.bids': {
    name: 'supabase.read.bids',
    category: 'supabase.read.org_scoped',
    description: 'Read bids for user orgs only',
    allowedSkills: ['auction.list', 'auction.view', 'rfq.view'],
  },
  'supabase.read.deals': {
    name: 'supabase.read.deals',
    category: 'supabase.read.org_scoped',
    description: 'Read deals for user orgs only',
    allowedSkills: ['deal.list', 'deal.view', 'telebuy.start'],
  },
  'supabase.read.telebuy_sessions': {
    name: 'supabase.read.telebuy_sessions',
    category: 'supabase.read.org_scoped',
    description: 'Read TeleBuy sessions for user orgs only',
    allowedSkills: ['telebuy.list', 'telebuy.view'],
  },
  'supabase.read.orders': {
    name: 'supabase.read.orders',
    category: 'supabase.read.org_scoped',
    description: 'Read orders for user orgs only',
    allowedSkills: ['order.list', 'order.view'],
  },
  'supabase.read.auctions': {
    name: 'supabase.read.auctions',
    category: 'supabase.read.org_scoped',
    description: 'Read auctions for user orgs only',
    allowedSkills: ['auction.list', 'auction.view'],
  },

  // ============================================
  // WRITE VIA RPC ONLY (no direct table writes)
  // ============================================
  'supabase.rpc.create_rfq': {
    name: 'supabase.rpc.create_rfq',
    category: 'supabase.write.rpc',
    description: 'Create a new RFQ',
    allowedSkills: ['rfq.create'],
    requiresCapability: 'create_rfq',
  },
  'supabase.rpc.submit_bid': {
    name: 'supabase.rpc.submit_bid',
    category: 'supabase.write.rpc',
    description: 'Submit a bid on an auction/RFQ',
    allowedSkills: ['auction.bid', 'rfq.respond'],
    requiresCapability: 'submit_bid',
  },
  'supabase.rpc.create_telebuy_session': {
    name: 'supabase.rpc.create_telebuy_session',
    category: 'supabase.write.rpc',
    description: 'Start a TeleBuy video session',
    allowedSkills: ['telebuy.start'],
    requiresCapability: 'use_telebuy',
    requiresSubscription: 'pro',
  },
  'supabase.rpc.update_telebuy_notes': {
    name: 'supabase.rpc.update_telebuy_notes',
    category: 'supabase.write.rpc',
    description: 'Update TeleBuy session notes',
    allowedSkills: ['telebuy.update'],
    requiresCapability: 'use_telebuy',
  },
  'supabase.rpc.award_deal': {
    name: 'supabase.rpc.award_deal',
    category: 'supabase.write.rpc',
    description: 'Award a deal to winning bidder',
    allowedSkills: ['auction.settle', 'deal.award'],
    requiresCapability: 'award_deal',
  },
  'supabase.rpc.create_auction': {
    name: 'supabase.rpc.create_auction',
    category: 'supabase.write.rpc',
    description: 'Create a new auction',
    allowedSkills: ['auction.create'],
    requiresCapability: 'create_auction',
  },
  'supabase.rpc.create_order': {
    name: 'supabase.rpc.create_order',
    category: 'supabase.write.rpc',
    description: 'Create a purchase order',
    allowedSkills: ['order.create'],
    requiresCapability: 'create_order',
  },

  // ============================================
  // EXTERNAL INTEGRATIONS
  // ============================================
  'external.daily.create_room': {
    name: 'external.daily.create_room',
    category: 'external.daily',
    description: 'Create Daily.co video room',
    allowedSkills: ['telebuy.start'],
    requiresSubscription: 'enterprise',
  },
  'external.airtable.sync': {
    name: 'external.airtable.sync',
    category: 'external.airtable',
    description: 'Sync data to Airtable',
    allowedSkills: ['threepl.sync', 'admin_ops.sync_airtable'],
  },
  'external.make.webhook': {
    name: 'external.make.webhook',
    category: 'external.make',
    description: 'Trigger Make.com webhook',
    allowedSkills: ['threepl.notify', 'admin_ops.webhook'],
  },

  // ============================================
  // ADMIN-ONLY OPERATIONS
  // ============================================
  'admin_ops.view_logs': {
    name: 'admin_ops.view_logs',
    category: 'admin_ops',
    description: 'View system audit logs',
    allowedSkills: ['admin_ops.audit'],
    superAdminOnly: true,
  },
  'admin_ops.toggle_feature_flag': {
    name: 'admin_ops.toggle_feature_flag',
    category: 'admin_ops',
    description: 'Enable/disable feature flags',
    allowedSkills: ['admin_ops.flags'],
    superAdminOnly: true,
  },
  'admin_ops.pause_auction': {
    name: 'admin_ops.pause_auction',
    category: 'admin_ops',
    description: 'Pause an active auction',
    allowedSkills: ['admin_ops.auction_control'],
    superAdminOnly: true,
  },
  'admin_ops.view_skill_invocations': {
    name: 'admin_ops.view_skill_invocations',
    category: 'admin_ops',
    description: 'View skill invocation audit trail',
    allowedSkills: ['admin_ops.audit'],
    superAdminOnly: true,
  },
};

/**
 * Check if a tool is registered in the manifest
 * SECURITY: Unknown tools are denied by default
 */
export function isToolKnown(toolName: string): boolean {
  return toolName in TOOL_MANIFEST;
}

/**
 * Get tool definition from manifest
 */
export function getToolDefinition(toolName: string): ToolDefinition | undefined {
  return TOOL_MANIFEST[toolName];
}

/**
 * List all tools in a category
 */
export function getToolsByCategory(category: string): ToolDefinition[] {
  return Object.values(TOOL_MANIFEST).filter(tool => tool.category === category);
}

/**
 * List all tools that a skill is allowed to use
 */
export function getToolsForSkill(skillName: string): ToolDefinition[] {
  return Object.values(TOOL_MANIFEST).filter(
    tool => tool.allowedSkills.includes('*') || tool.allowedSkills.includes(skillName)
  );
}
