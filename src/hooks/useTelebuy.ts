/**
 * React Query hooks for TeleBuy sessions
 * 
 * Org-aware: Query keys include currentOrgId for proper cache isolation.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentOrg } from '@/hooks/useCurrentOrg';
import {
  getTelebuySessions,
  getSessionById,
  getUpcomingSessions,
  getSessionDocuments,
  createTelebuySession,
  updateSessionStatus,
} from '@/services/telebuy.service';
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
  
  return useQuery({
    queryKey: telebuyKeys.sessionList(currentOrgId, options ?? {}),
    queryFn: async () => {
      const { data, error } = await getTelebuySessions(options);
      if (error) throw error;
      return data;
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
      return data;
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
      return data;
    },
    enabled: !!sessionId,
  });
}

// ============================================
// SESSION MUTATIONS (pending backend RPC)
// ============================================

export function useCreateTelebuySession() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();
  
  return useMutation({
    mutationFn: createTelebuySession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: telebuyKeys.sessions(currentOrgId) });
      queryClient.invalidateQueries({ queryKey: telebuyKeys.upcoming(currentOrgId) });
      toast.success('TeleBuy session scheduled');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateSessionStatus() {
  const queryClient = useQueryClient();
  const { currentOrgId } = useCurrentOrg();
  
  return useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string; status: string }) =>
      updateSessionStatus(sessionId, status),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: telebuyKeys.session(sessionId) });
      queryClient.invalidateQueries({ queryKey: telebuyKeys.sessions(currentOrgId) });
      toast.success('Session status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
