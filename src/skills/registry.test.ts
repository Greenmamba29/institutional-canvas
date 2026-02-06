/**
 * Skill Registry Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  registerSkill,
  getSkill,
  hasSkill,
  getAllSkills,
  getAvailableSkills,
  getRegistryStats,
} from './registry';
import type { Skill, SkillContext, SkillContract, SkillResult } from './types';
import { z } from 'zod';

// Mock skill for testing
const mockContract: SkillContract<{ value: string }, { result: string }> = {
  name: 'test.mock',
  version: '1.0.0',
  description: 'Test mock skill',
  inputSchema: z.object({ value: z.string() }) as z.ZodType<{ value: string }>,
  outputSchema: z.object({ result: z.string() }) as z.ZodType<{ result: string }>,
  requiredCapabilities: ['test_cap'],
  requiredTools: ['supabase.read.suppliers'],
  requiredSubscription: 'pro',
};

const mockSkill: Skill<{ value: string }, { result: string }> = {
  contract: mockContract,
  execute: async (input) => ({
    success: true,
    data: { result: `processed: ${input.value}` },
  }),
};

const adminSkillContract: SkillContract<Record<string, never>, Record<string, never>> = {
  name: 'admin_ops.test',
  version: '1.0.0',
  description: 'Admin test skill',
  inputSchema: z.object({}) as z.ZodType<Record<string, never>>,
  outputSchema: z.object({}) as z.ZodType<Record<string, never>>,
  requiredCapabilities: [],
  requiredTools: ['admin_ops.view_logs'],
};

const adminSkill: Skill<Record<string, never>, Record<string, never>> = {
  contract: adminSkillContract,
  execute: async () => ({ success: true, data: {} }),
};

describe('skillRegistry', () => {
  beforeEach(() => {
    // Register test skills
    registerSkill(mockSkill);
    registerSkill(adminSkill);
  });

  describe('registerSkill', () => {
    it('should register a skill', () => {
      expect(hasSkill('test.mock')).toBe(true);
    });

    it('should allow overwriting skills with warning', () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      registerSkill(mockSkill);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('getSkill', () => {
    it('should return registered skill', () => {
      const skill = getSkill('test.mock');
      expect(skill).toBeDefined();
      expect(skill?.contract.name).toBe('test.mock');
    });

    it('should return undefined for unknown skill', () => {
      const skill = getSkill('unknown.skill');
      expect(skill).toBeUndefined();
    });
  });

  describe('getAvailableSkills', () => {
    const buyerContext: SkillContext = {
      userId: 'user-123',
      orgId: 'org-456',
      profile: 'buyer',
      capabilities: ['test_cap'],
      subscriptionTier: 'pro',
      isSuperAdmin: false,
    };

    const superAdminContext: SkillContext = {
      ...buyerContext,
      isSuperAdmin: true,
    };

    it('should filter out admin skills for regular users', () => {
      const skills = getAvailableSkills(buyerContext);
      const skillNames = skills.map(s => s.contract.name);
      
      expect(skillNames).toContain('test.mock');
      expect(skillNames).not.toContain('admin_ops.test');
    });

    it('should show only admin skills for super admins', () => {
      const skills = getAvailableSkills(superAdminContext);
      const skillNames = skills.map(s => s.contract.name);
      
      expect(skillNames).toContain('admin_ops.test');
      expect(skillNames).not.toContain('test.mock');
    });

    it('should filter by subscription tier', () => {
      const freeContext = { ...buyerContext, subscriptionTier: 'free' as const };
      const skills = getAvailableSkills(freeContext);
      const skillNames = skills.map(s => s.contract.name);
      
      // test.mock requires 'pro', so should not be available
      expect(skillNames).not.toContain('test.mock');
    });

    it('should filter by capabilities', () => {
      const noCapContext = { ...buyerContext, capabilities: [] };
      const skills = getAvailableSkills(noCapContext);
      const skillNames = skills.map(s => s.contract.name);
      
      // test.mock requires 'test_cap', so should not be available
      expect(skillNames).not.toContain('test.mock');
    });
  });

  describe('getRegistryStats', () => {
    it('should return skill counts by category', () => {
      const stats = getRegistryStats();
      
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byCategory).toBeDefined();
      expect(stats.byCategory.admin_ops).toBeGreaterThanOrEqual(1);
    });
  });
});
