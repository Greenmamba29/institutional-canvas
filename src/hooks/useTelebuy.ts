/**
 * React Query hooks for TeleBuy sessions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  sessions: () => [...telebuyKeys.all, 'sessions'] as const,
  sessionList: (filters: Record<string, unknown>) => [...telebuyKeys.sessions(), filters] as const,
  session: (id: string) => [...telebuyKeys.sessions(), id] as const,
  upcoming: () => [...telebuyKeys.all, 'upcoming'] as const,
  documents: (sessionId: string) => [...telebuyKeys.session(sessionId), 'documents'] as const,
};

// ============================================
// SESSION QUERIES
// ============================================

export function useTelebuySessions(options?: { status?: string; limit?: number }) {
  return useQuery({
    queryKey: telebuyKeys.sessionList(options ?? {}),
    queryFn: async () => {
      const { data, error } = await getTelebuySessions(options);
      if (error) throw error;
      return data;
    },
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
  return useQuery({
    queryKey: telebuyKeys.upcoming(),
    queryFn: async () => {
      const { data, error } = await getUpcomingSessions(limit);
      if (error) throw error;
      return data;
    },
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
  
  return useMutation({
    mutationFn: createTelebuySession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: telebuyKeys.sessions() });
      queryClient.invalidateQueries({ queryKey: telebuyKeys.upcoming() });
      toast.success('TeleBuy session scheduled');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateSessionStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, status }: { sessionId: string; status: string }) =>
      updateSessionStatus(sessionId, status),
    onSuccess: (_, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: telebuyKeys.session(sessionId) });
      queryClient.invalidateQueries({ queryKey: telebuyKeys.sessions() });
      toast.success('Session status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
