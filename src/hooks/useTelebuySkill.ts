/**
 * TeleBuy Skill Hook
 * 
 * High-level hook for executing TeleBuy skills with proper
 * error handling and UI feedback.
 */

import { useCallback } from 'react';
import { useSkill } from './useSkill';
import { telebuyStartSkill, telebuyListSkill } from '@/skills/telebuy';
import { toast } from '@/hooks/use-toast';
import type { StartSessionInput, ListSessionsInput } from '@/skills/telebuy/contract';

export function useTelebuyStartSession() {
  const mutation = useSkill(telebuyStartSkill);

  const startSession = useCallback(async (input: StartSessionInput) => {
    const result = await mutation.mutateAsync(input);
    
    if (result.success && result.data) {
      toast({
        title: 'Session Created',
        description: result.data.isDemo 
          ? 'Demo session ready - no video call will be created'
          : 'TeleBuy session scheduled successfully',
      });
      return result.data;
    } else {
      toast({
        title: 'Failed to Start Session',
        description: result.error?.message || 'Unknown error',
        variant: 'destructive',
      });
      return null;
    }
  }, [mutation]);

  return {
    startSession,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useTelebuyListSessions() {
  const mutation = useSkill(telebuyListSkill);

  const listSessions = useCallback(async (input: ListSessionsInput = {}) => {
    const result = await mutation.mutateAsync(input);
    
    if (result.success && result.data) {
      return result.data as unknown[];
    }
    
    return [];
  }, [mutation]);

  return {
    listSessions,
    isLoading: mutation.isPending,
    sessions: (mutation.data?.data as unknown[]) || [],
  };
}
