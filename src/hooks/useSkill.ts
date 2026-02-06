/**
 * useSkill Hook
 * 
 * React hook for executing skills with automatic context building,
 * policy enforcement, and audit logging.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Skill, SkillResult, SkillContext, ToolCallRecord } from '@/skills/types';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { logSkillInvocation, hashInput, createToolCallTracker } from '@/skills/audit';
import { isSystemReadOnly } from '@/policy/killSwitch';
import { canUseTool } from '@/policy/toolPolicy';
import { supabase } from '@/integrations/supabase/client';
import type { OnboardingProfile, SubscriptionTier } from '@/policy/types';

interface UseSkillOptions {
  /** Called when skill execution starts */
  onStart?: () => void;
  /** Called when skill execution completes (success or failure) */
  onComplete?: (result: SkillResult<unknown>) => void;
  /** Skip kill switch check (for read-only skills) */
  skipKillSwitch?: boolean;
}

/**
 * Hook for executing a skill with full policy enforcement
 */
export function useSkill<TInput, TOutput>(
  skill: Skill<TInput, TOutput>,
  options: UseSkillOptions = {}
) {
  const { user, session } = useAuth();
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['skill', skill.contract.name],
    mutationFn: async (input: TInput): Promise<SkillResult<TOutput>> => {
      const startTime = performance.now();
      const tracker = createToolCallTracker();

      options.onStart?.();

      // Build context from current state
      const context = await buildSkillContext(user?.id, currentOrg?.id);

      // 1. Kill switch check (unless skipped for read-only operations)
      if (!options.skipKillSwitch && skill.contract.requiredTools.some(t => t.includes('write'))) {
        if (await isSystemReadOnly()) {
          const result: SkillResult<TOutput> = {
            success: false,
            error: {
              code: 'SYSTEM_READ_ONLY',
              message: 'System is in read-only mode. Write operations are temporarily disabled.',
              retryable: true,
            },
          };
          options.onComplete?.(result);
          return result;
        }
      }

      // 2. Super admin skill restriction
      if (context.isSuperAdmin && !skill.contract.name.startsWith('admin_ops.')) {
        const result: SkillResult<TOutput> = {
          success: false,
          error: {
            code: 'SUPER_ADMIN_WRONG_SKILL',
            message: 'Super admins can only execute admin_ops.* skills',
            retryable: false,
          },
        };
        options.onComplete?.(result);
        return result;
      }

      // 3. Non-admin cannot use admin skills
      if (!context.isSuperAdmin && skill.contract.name.startsWith('admin_ops.')) {
        const result: SkillResult<TOutput> = {
          success: false,
          error: {
            code: 'ADMIN_ONLY',
            message: 'This operation requires super admin privileges',
            retryable: false,
          },
        };
        options.onComplete?.(result);
        return result;
      }

      // 4. Check all required tools
      for (const toolName of skill.contract.requiredTools) {
        const toolCheck = canUseTool(toolName, skill.contract.name, context);
        if (!toolCheck.allowed) {
          const result: SkillResult<TOutput> = {
            success: false,
            error: {
              code: toolCheck.code || 'TOOL_DENIED',
              message: toolCheck.reason || `Tool ${toolName} not allowed`,
              retryable: false,
            },
          };
          options.onComplete?.(result);
          return result;
        }
      }

      // 5. Validate input
      const parseResult = skill.contract.inputSchema.safeParse(input);
      if (!parseResult.success) {
        const result: SkillResult<TOutput> = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0]?.message || 'Invalid input',
            retryable: false,
          },
        };
        options.onComplete?.(result);
        return result;
      }

      // 6. Execute skill
      let result: SkillResult<TOutput>;
      try {
        result = await skill.execute(parseResult.data, context);
      } catch (error) {
        result = {
          success: false,
          error: {
            code: 'EXECUTION_ERROR',
            message: error instanceof Error ? error.message : 'Skill execution failed',
            retryable: true,
          },
        };
      }

      // 7. Log invocation
      const durationMs = Math.round(performance.now() - startTime);
      await logSkillInvocation({
        skillName: skill.contract.name,
        skillVersion: skill.contract.version,
        context,
        inputHash: hashInput(input),
        result,
        durationMs,
        toolCalls: tracker.getRecords(),
      });

      options.onComplete?.(result);
      return result;
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate related queries based on skill category
        const category = skill.contract.name.split('.')[0];
        queryClient.invalidateQueries({ queryKey: [category] });
      }
    },
  });
}

/**
 * Build skill context from current auth state
 */
async function buildSkillContext(
  userId?: string,
  orgId?: string
): Promise<SkillContext> {
  if (!userId) {
    return {
      userId: '',
      orgId: '',
      profile: 'buyer' as OnboardingProfile,
      capabilities: [],
      subscriptionTier: 'free' as SubscriptionTier,
      isSuperAdmin: false,
    };
  }

  // Fetch profile
  let profile: OnboardingProfile = 'buyer';
  try {
    const { data } = await supabase.rpc('get_user_profile');
    if (data) profile = data as OnboardingProfile;
  } catch {
    // Use default
  }

  // Fetch super admin status
  let isSuperAdmin = false;
  try {
    const { data } = await supabase.rpc('is_super_admin');
    isSuperAdmin = Boolean(data);
  } catch {
    // Use default
  }

  // Fetch capabilities for org
  let capabilities: string[] = [];
  if (orgId) {
    try {
      const { data } = await supabase
        .from('profile_capabilities')
        .select('capability_key')
        .eq('profile', profile);
      capabilities = data?.map(c => c.capability_key) || [];
    } catch {
      // Use default
    }
  }

  // Determine subscription tier
  let subscriptionTier: SubscriptionTier = 'free';
  if (orgId) {
    try {
      const { data } = await supabase.rpc('get_user_org_role', { p_org_id: orgId });
      const roleData = data as { subscription_tier?: string } | null;
      if (roleData?.subscription_tier === 'pro' || roleData?.subscription_tier === 'enterprise') {
        subscriptionTier = roleData.subscription_tier as SubscriptionTier;
      }
    } catch {
      // Use default
    }
  }

  return {
    userId,
    orgId: orgId || '',
    profile,
    capabilities,
    subscriptionTier,
    isSuperAdmin,
  };
}

/**
 * Hook for checking if a skill can be executed
 */
export function useCanExecuteSkill<TInput, TOutput>(
  skill: Skill<TInput, TOutput>
): {
  canExecute: boolean;
  reason?: string;
  isLoading: boolean;
} {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();

  // Simple check based on available context
  if (!user) {
    return { canExecute: false, reason: 'Authentication required', isLoading: false };
  }

  if (!currentOrg && skill.contract.requiredTools.some(t => t.includes('org_scoped'))) {
    return { canExecute: false, reason: 'Organization required', isLoading: false };
  }

  // For more detailed checks, use the mutation and check result
  return { canExecute: true, isLoading: false };
}
