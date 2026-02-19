/**
 * Messaging Hooks - React Query hooks for messaging with follow-gating
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/context/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import * as messagingService from '@/services/messaging.service';
import type { DMConversation, DirectMessage, FollowStatus, UserFollow } from '@/services/messaging.service';

// Query keys
const messagingKeys = {
  conversations: (orgId: string | undefined) => ['conversations', orgId] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  followStatus: (targetOrgId: string) => ['followStatus', targetOrgId] as const,
  pendingFollows: (orgId: string | undefined) => ['pendingFollows', orgId] as const,
  following: (orgId: string | undefined) => ['following', orgId] as const,
  unreadCount: (orgId: string | undefined) => ['unreadCount', orgId] as const,
};

// ============ FOLLOW HOOKS ============

export function useFollowStatus(targetOrgId: string | undefined) {
  return useQuery<FollowStatus | null>({
    queryKey: messagingKeys.followStatus(targetOrgId || ''),
    queryFn: async () => {
      if (!targetOrgId) return null;
      return messagingService.getFollowStatus(targetOrgId);
    },
    enabled: !!targetOrgId,
  });
}

export function usePendingFollowRequests() {
  const { currentOrg } = useOrganization();
  
  return useQuery<UserFollow[]>({
    queryKey: messagingKeys.pendingFollows(currentOrg?.id),
    queryFn: () => messagingService.getPendingFollowRequests(),
    enabled: !!currentOrg,
  });
}

export function useFollowing() {
  const { currentOrg } = useOrganization();
  
  return useQuery<UserFollow[]>({
    queryKey: messagingKeys.following(currentOrg?.id),
    queryFn: () => messagingService.getFollowing(),
    enabled: !!currentOrg,
  });
}

export function useFollowOrg() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (targetOrgId: string) => messagingService.followOrg(targetOrgId),
    onSuccess: (_, targetOrgId) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.followStatus(targetOrgId) });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      toast({
        title: 'Follow request sent',
        description: 'You will be notified when they accept.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to follow',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRespondToFollow() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ followId, accept }: { followId: string; accept: boolean }) =>
      messagingService.respondToFollow(followId, accept),
    onSuccess: (_, { accept }) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.pendingFollows(currentOrg?.id) });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast({
        title: accept ? 'Follow accepted' : 'Follow declined',
        description: accept ? 'You can now message each other.' : 'Request has been declined.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to respond',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============ CONVERSATION HOOKS ============

export function useConversations() {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery<DMConversation[]>({
    queryKey: messagingKeys.conversations(currentOrg?.id),
    queryFn: () => messagingService.getConversations(currentOrg!.id),
    enabled: !!currentOrg,
  });

  // Real-time subscription — invalidate cache instead of calling refetch directly
  useEffect(() => {
    if (!currentOrg) return;

    const channel = supabase
      .channel('dm_conversations_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dm_conversations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: messagingKeys.conversations(currentOrg.id) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrg, queryClient]);

  return query;
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (otherOrgId: string) => messagingService.getOrCreateConversation(otherOrgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations(currentOrg?.id) });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cannot start conversation',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ============ MESSAGE HOOKS ============

export function useMessages(conversationId: string | undefined) {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery<DirectMessage[]>({
    queryKey: messagingKeys.messages(conversationId || ''),
    queryFn: () => messagingService.getMessages(conversationId!),
    enabled: !!conversationId,
  });

  // Real-time subscription — invalidate cache on new messages
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: messagingKeys.messages(conversationId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  // Mark as read when viewing
  useEffect(() => {
    if (conversationId && currentOrg) {
      messagingService.markMessagesAsRead(conversationId, currentOrg.id);
    }
  }, [conversationId, currentOrg]);

  return query;
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { currentOrg } = useOrganization();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      messagingService.sendMessage(conversationId, content),
    onSuccess: (_, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages(conversationId) });
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations(currentOrg?.id) });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUnreadCount() {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();

  const query = useQuery<number>({
    queryKey: messagingKeys.unreadCount(currentOrg?.id),
    queryFn: () => messagingService.getUnreadCount(currentOrg!.id),
    enabled: !!currentOrg,
    staleTime: 0,
  });

  // Real-time subscription — invalidate on new/updated messages
  useEffect(() => {
    if (!currentOrg) return;

    const channel = supabase
      .channel('unread_messages_count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, () => {
        queryClient.invalidateQueries({ queryKey: messagingKeys.unreadCount(currentOrg.id) });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages' }, () => {
        queryClient.invalidateQueries({ queryKey: messagingKeys.unreadCount(currentOrg.id) });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentOrg, queryClient]);

  return query;
}
