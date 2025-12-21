/**
 * Documents Service - RPC wrappers for document operations
 * @see ORCHESTRATION/API.openapiv1.yaml
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
import type { Json } from '@/integrations/supabase/types';

export interface ChatDocument {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  created_at: string;
}

export interface MatchedDocument {
  id: string;
  content: string;
  metadata: Json;
  embedding: Json;
  similarity: number;
}

/**
 * Get latest version of a chat document
 */
export async function getLatestChatDocument(docId: string, authUserId: string) {
  return callRpc<ChatDocument[]>('get_latest_chat_document', { doc_id: docId, auth_user_id: authUserId });
}

/**
 * Get the latest version timestamp of a chat document
 */
export async function getChatDocumentLatestVersion(docId: string) {
  return callRpc<string>('get_chat_document_latest_version', { doc_id: docId });
}

/**
 * Match documents using vector similarity search
 */
export async function matchDocuments(
  queryEmbedding: string,
  matchCount?: number,
  filter?: Json
) {
  return callRpc<MatchedDocument[]>('match_documents', {
    query_embedding: queryEmbedding,
    match_count: matchCount ?? null,
    filter: filter ?? {},
  });
}

// ============================================
// READ-ONLY QUERIES (Direct reads are allowed)
// ============================================

/**
 * Get chat documents for a user (read-only)
 */
export async function getChatDocuments(userId: string) {
  const { data, error } = await supabase
    .from('chat_documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return { data, error };
}

/**
 * Get conversations for a user (read-only)
 */
export async function getConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
  return { data, error };
}
