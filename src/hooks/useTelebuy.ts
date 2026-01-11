/**
 * React Query hooks for TeleBuy sessions
 * 
 * Org-aware: Query keys include currentOrgId for proper cache isolation.
 * All mutations use authenticated Supabase client for RLS enforcement.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import { useAuthenticatedClient } from '@/hooks/useAuthenticatedClient';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import {
  getTelebuySessions,
  getSessionById,
  getUpcomingSessions,
  getSessionDocuments,
  createTelebuySession,
  updateSessionStatus,
  type TelebuySession,
} from '@/services/telebuy.service';
import { 
  CreateTelebuySessionInput, 
  UpdateSessionStatusInput 
} from '@/lib/validation/telebuy.schemas';
import { toast } from 'sonner';

export const telebuyKeys = {
  all: ['telebuy'] as const,
  sessions: (orgId: string | null) => [...telebuyKeys.all, 'sessions', orgId] as const,
  sessionList: (orgId: string | null, filters: Record<string, unknown>) => [...telebuyKeys.sessions(orgId), filters] as const,
  session: (id: string) => [...telebuyKeys.all, 'session', id] as const,
  upcoming: (orgId: string | null) => [...telebuyKeys.all, 'upcoming', orgId] as const,
  documents: (sessionId: string) => [...telebuyKeys.session(sessionId), 'documents'] as const,
};

// ============================================
// SESSION QUERIES
// ============================================

export function useTelebuySessions(options?: { status?: string; limit?: number }) {
  const { currentOrgId } = useCurrentOrg();
  
  // Subscribe to realtime changes
  useRealtimeSubscription({
    table: 'telebuy_sessions',
    event: '*',
    queryKey: telebuyKeys.sessionList(currentOrgId, options ?? {}),
    enabled: !!currentOrgId,
  });

  return useQuery({
    queryKey: telebuyKeys.sessionList(currentOrgId, options ?? {}),
    queryFn: async () => {
      const { data, error } = await getTelebuySessions(options);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentOrgId,
  });
}

export function useTelebuySession(sessionId: string) {
  return useQuery({
    queryKey: telebuyKeys.session(sessionId),
    queryFn: async () => {
      const { data, error } = await getSessionById(sessionId);
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });
}

export function useUpcomingSessions(limit: number = 5) {
  const { currentOrgId } = useCurrentOrg();
  
  return useQuery({
    queryKey: telebuyKeys.upcoming(currentOrgId),
    queryFn: async () => {
      const { data, error } = await getUpcomingSessions(limit);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!currentOrgId,
  });
}

export function useSessionDocuments(sessionId: string) {
  return useQuery({
    queryKey: telebuyKeys.documents(sessionId),
    queryFn: async () => {
      const { data, error } = await getSessionDocuments(sessionId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!sessionId,
  });
}

// ============================================
// SESSION MUTATIONS (Authenticated)
// ============================================

export function useCreateTelebuySession() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();
  const { getClient } = useAuthenticatedClient();
  
  return useMutation({
    mutationFn: async (params: CreateTelebuySessionInput) => {
      const client = await getClient();
      const { data, error } = await createTelebuySession(client, params);
      if (error) throw error;
      return data as TelebuySession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: telebuyKeys.sessions(currentOrgId) });
      queryClient.invalidateQueries({ queryKey: telebuyKeys.upcoming(currentOrgId) });
      toast.success('TeleBuy session scheduled');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create session');
    },
  });
}

export function useUpdateSessionStatus() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();
  const { getClient } = useAuthenticatedClient();
  
  return useMutation({
    mutationFn: async (params: UpdateSessionStatusInput) => {
      const client = await getClient();
      const { data, error } = await updateSessionStatus(client, params);
      if (error) throw error;
      return data as TelebuySession;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: telebuyKeys.session(variables.p_session_id) });
      queryClient.invalidateQueries({ queryKey: telebuyKeys.sessions(currentOrgId) });
      toast.success('Session status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update session status');
    },
  });
}

export function useCancelSession() {
  const updateStatus = useUpdateSessionStatus();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      return updateStatus.mutateAsync({
        p_session_id: sessionId,
        p_status: 'cancelled',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel session');
    },
  });
}

export function useStartSession() {
  const updateStatus = useUpdateSessionStatus();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      return updateStatus.mutateAsync({
        p_session_id: sessionId,
        p_status: 'in_progress',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start session');
    },
  });
}

export function useCompleteSession() {
  const updateStatus = useUpdateSessionStatus();
  
  return useMutation({
    mutationFn: async (sessionId: string) => {
      return updateStatus.mutateAsync({
        p_session_id: sessionId,
        p_status: 'completed',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete session');
    },
  });
}
