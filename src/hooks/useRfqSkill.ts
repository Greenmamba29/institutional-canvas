/**
 * RFQ Skill Hook
 * 
 * High-level hook for executing RFQ skills with proper
 * error handling and UI feedback.
 */

import { useCallback } from 'react';
import { useSkill } from './useSkill';
import { rfqCreateSkill, rfqListSkill, rfqRespondSkill } from '@/skills/rfq';
import { toast } from '@/hooks/use-toast';
import type { CreateRfqInput, ListRfqsInput, SubmitBidInput } from '@/skills/rfq/contract';

export function useRfqCreate() {
  const mutation = useSkill(rfqCreateSkill);

  const createRfq = useCallback(async (input: CreateRfqInput) => {
    const result = await mutation.mutateAsync(input);
    
    if (result.success && result.data) {
      toast({
        title: 'RFQ Created',
        description: `RFQ "${input.title}" submitted successfully`,
      });
      return result.data;
    } else {
      toast({
        title: 'Failed to Create RFQ',
        description: result.error?.message || 'Unknown error',
        variant: 'destructive',
      });
      return null;
    }
  }, [mutation]);

  return {
    createRfq,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}

export function useRfqList() {
  const mutation = useSkill(rfqListSkill);

  const listRfqs = useCallback(async (input: ListRfqsInput = {}) => {
    const result = await mutation.mutateAsync(input);
    
    if (result.success && result.data) {
      return result.data as unknown[];
    }
    
    return [];
  }, [mutation]);

  return {
    listRfqs,
    isLoading: mutation.isPending,
    rfqs: (mutation.data?.data as unknown[]) || [],
  };
}

export function useRfqRespond() {
  const mutation = useSkill(rfqRespondSkill);

  const respondToRfq = useCallback(async (input: SubmitBidInput) => {
    const result = await mutation.mutateAsync(input);
    
    if (result.success && result.data) {
      toast({
        title: 'Bid Submitted',
        description: 'Your response has been submitted successfully',
      });
      return result.data;
    } else {
      toast({
        title: 'Failed to Submit Bid',
        description: result.error?.message || 'Unknown error',
        variant: 'destructive',
      });
      return null;
    }
  }, [mutation]);

  return {
    respondToRfq,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
