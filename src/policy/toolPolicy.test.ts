/**
 * Tool Policy Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canUseTool, canUseTools, getAllowedToolsForSkill } from './toolPolicy';
import type { SkillContext } from './types';

describe('toolPolicy', () => {
  const mockBuyerContext: SkillContext = {
    userId: 'user-123',
    orgId: 'org-456',
    profile: 'buyer',
    capabilities: ['create_rfq', 'submit_bid', 'use_telebuy'],
    subscriptionTier: 'pro',
    isSuperAdmin: false,
  };

  const mockFreeContext: SkillContext = {
    ...mockBuyerContext,
    subscriptionTier: 'free',
    capabilities: ['create_rfq'],
  };

  const mockSuperAdminContext: SkillContext = {
    ...mockBuyerContext,
    isSuperAdmin: true,
  };

  describe('canUseTool', () => {
    it('should deny unknown tools', () => {
      const result = canUseTool('unknown.tool', 'some.skill', mockBuyerContext);
      
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('UNKNOWN_TOOL');
    });

    it('should allow public read tools for any skill', () => {
      const result = canUseTool('supabase.read.suppliers', 'any.skill', mockBuyerContext);
      
      expect(result.allowed).toBe(true);
    });

    it('should deny tools when skill is not in allowlist', () => {
      const result = canUseTool('supabase.rpc.create_rfq', 'wrong.skill', mockBuyerContext);
      
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('SKILL_NOT_ALLOWED');
    });

    it('should allow tools when skill is in allowlist', () => {
      const result = canUseTool('supabase.rpc.create_rfq', 'rfq.create', mockBuyerContext);
      
      expect(result.allowed).toBe(true);
    });

    it('should deny when capability is missing', () => {
      const noCapContext = { ...mockBuyerContext, capabilities: [] };
      const result = canUseTool('supabase.rpc.create_rfq', 'rfq.create', noCapContext);
      
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('CAPABILITY_DENIED');
    });

    it('should deny when subscription tier is insufficient', () => {
      const result = canUseTool('supabase.rpc.create_telebuy_session', 'telebuy.start', mockFreeContext);
      
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('SUBSCRIPTION_REQUIRED');
    });

    it('should allow with sufficient subscription tier', () => {
      const result = canUseTool('supabase.rpc.create_telebuy_session', 'telebuy.start', mockBuyerContext);
      
      expect(result.allowed).toBe(true);
    });

    it('should deny super admin for non-admin skills', () => {
      const result = canUseTool('supabase.read.suppliers', 'marketplace.view', mockSuperAdminContext);
      
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('SUPER_ADMIN_WRONG_SKILL');
    });

    it('should allow super admin for admin_ops skills', () => {
      const result = canUseTool('admin_ops.view_logs', 'admin_ops.audit', mockSuperAdminContext);
      
      expect(result.allowed).toBe(true);
    });

    it('should deny non-admin for admin-only tools', () => {
      const result = canUseTool('admin_ops.view_logs', 'admin_ops.audit', mockBuyerContext);
      
      expect(result.allowed).toBe(false);
      expect(result.code).toBe('SUPER_ADMIN_ONLY');
    });
  });

  describe('canUseTools', () => {
    it('should check multiple tools at once', () => {
      const results = canUseTools(
        ['supabase.read.suppliers', 'supabase.read.products', 'unknown.tool'],
        'any.skill',
        mockBuyerContext
      );
      
      expect(results.get('supabase.read.suppliers')?.allowed).toBe(true);
      expect(results.get('supabase.read.products')?.allowed).toBe(true);
      expect(results.get('unknown.tool')?.allowed).toBe(false);
    });
  });

  describe('getAllowedToolsForSkill', () => {
    it('should return allowed tools for a skill', () => {
      const tools = getAllowedToolsForSkill('rfq.create', mockBuyerContext);
      
      // Should include public reads and rfq-specific writes
      expect(tools).toContain('supabase.read.suppliers');
      expect(tools).toContain('supabase.rpc.create_rfq');
    });

    it('should exclude tools requiring higher subscription', () => {
      const tools = getAllowedToolsForSkill('telebuy.start', mockFreeContext);
      
      // Should not include enterprise-only tools
      expect(tools).not.toContain('external.daily.create_room');
    });
  });
});
