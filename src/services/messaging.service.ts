/**
 * Messaging Service - Direct messaging with follow-gating
 * 
 * Messaging is only allowed between organizations that have mutually followed each other.
 */

import { supabase } from '@/integrations/supabase/client';

export interface DMConversation {
  id: string;
  org_a_id: string;
  org_b_id: string;
  last_message_at: string | null;
  created_at: string;
  other_org?: {
    id: string;
    name: string;
    org_type: string;
  };
  last_message?: DirectMessage;
  unread_count?: number;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_org_id: string;
  sender_user_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  attachments: unknown[];
  sender_profile?: {
    full_name: string;
  };
}

export interface FollowStatus {
  i_follow_them: boolean;
  they_follow_me: boolean;
  my_follow_status: string | null;
  their_follow_status: string | null;
  can_message: boolean;
}

export interface UserFollow {
  id: string;
  follower_org_id: string;
  following_org_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  accepted_at: string | null;
  follower_org?: {
    id: string;
    name: string;
    org_type: string;
  };
}

// ============ FOLLOW OPERATIONS ============

/**
 * Follow an organization - initiates a follow request
 */
export async function followOrg(targetOrgId: string): Promise<string> {
  const { data, error } = await supabase.rpc('follow_org', {
    p_target_org_id: targetOrgId
  });

  if (error) throw new Error(error.message);
  return data as string;
}

/**
 * Respond to a follow request (accept or decline)
 */
export async function respondToFollow(followId: string, accept: boolean): Promise<boolean> {
  const { data, error } = await supabase.rpc('respond_to_follow', {
    p_follow_id: followId,
    p_accept: accept
  });

  if (error) throw new Error(error.message);
  return data as boolean;
}

/**
 * Get follow status between current org and target org
 */
export async function getFollowStatus(targetOrgId: string): Promise<FollowStatus> {
  const { data, error } = await supabase.rpc('get_follow_status', {
    p_target_org_id: targetOrgId
  });

  if (error) throw new Error(error.message);
  
  // RPC returns array, take first row
  const result = Array.isArray(data) ? data[0] : data;
  return result as FollowStatus;
}

/**
 * Get pending follow requests to current org
 */
export async function getPendingFollowRequests(): Promise<UserFollow[]> {
  const { data, error } = await supabase
    .from('user_follows')
    .select(`
      *,
      follower_org:organizations!user_follows_follower_org_id_fkey (
        id, name, org_type
      )
    `)
    .eq('status', 'pending');

  if (error) throw new Error(error.message);
  return (data || []) as unknown as UserFollow[];
}

/**
 * Get organizations current org is following
 */
export async function getFollowing(): Promise<UserFollow[]> {
  const { data, error } = await supabase
    .from('user_follows')
    .select(`
      *,
      following_org:organizations!user_follows_following_org_id_fkey (
        id, name, org_type
      )
    `);

  if (error) throw new Error(error.message);
  return (data || []) as unknown as UserFollow[];
}

// ============ CONVERSATION OPERATIONS ============

/**
 * Get all conversations for current org
 */
export async function getConversations(myOrgId: string): Promise<DMConversation[]> {
  const { data, error } = await supabase
    .from('dm_conversations')
    .select(`
      *,
      org_a:organizations!dm_conversations_org_a_id_fkey (id, name, org_type),
      org_b:organizations!dm_conversations_org_b_id_fkey (id, name, org_type)
    `)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);

  // Map to add other_org for easier display
  return (data || []).map((conv: any) => {
    const otherOrg = conv.org_a_id === myOrgId ? conv.org_b : conv.org_a;
    return {
      ...conv,
      other_org: otherOrg
    };
  }) as DMConversation[];
}

/**
 * Get or create conversation with an org (validates mutual follow)
 */
export async function getOrCreateConversation(otherOrgId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    p_other_org_id: otherOrgId
  });

  if (error) throw new Error(error.message);
  return data as string;
}

// ============ MESSAGE OPERATIONS ============

/**
 * Get messages for a conversation
 */
export async function getMessages(conversationId: string, limit = 50): Promise<DirectMessage[]> {
  const { data, error } = await supabase
    .from('direct_messages')
    .select(`
      *,
      sender_profile:profiles!direct_messages_sender_user_id_fkey (
        full_name
      )
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data || []) as unknown as DirectMessage[];
}

/**
 * Send a message (validates mutual follow)
 */
export async function sendMessage(
  conversationId: string, 
  content: string, 
  attachments: object[] = []
): Promise<string> {
  const { data, error } = await supabase.rpc('send_direct_message', {
    p_conversation_id: conversationId,
    p_content: content,
    p_attachments: JSON.stringify(attachments)
  });

  if (error) throw new Error(error.message);
  return data as string;
}

/**
 * Mark messages as read (uses backend RPC for secure validation)
 * Note: myOrgId parameter is kept for backwards compatibility but not used
 * (the RPC extracts org from JWT token)
 */
export async function markMessagesAsRead(conversationId: string, _myOrgId?: string): Promise<number> {
  const { data, error } = await supabase.rpc('mark_messages_read', {
    p_conversation_id: conversationId
  });

  if (error) throw new Error(error.message);
  return data as number;
}

/**
 * Get unread message count for an org
 */
export async function getUnreadCount(myOrgId: string): Promise<number> {
  const { count, error } = await supabase
    .from('direct_messages')
    .select('*', { count: 'exact', head: true })
    .neq('sender_org_id', myOrgId)
    .is('read_at', null);

  if (error) throw new Error(error.message);
  return count || 0;
}
