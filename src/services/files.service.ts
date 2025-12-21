/**
 * Files Service - RPC wrappers for file operations
 * @see ORCHESTRATION/API.openapiv1.yaml
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
import type { Json } from '@/integrations/supabase/types';

export interface FileActivity {
  id: string;
  file_id: string;
  user_id: string;
  user_name: string;
  activity_type: string;
  details: Json;
  created_at: string;
}

export interface DashboardActivity {
  id: string;
  file_id: string;
  file_name: string;
  activity_type: string;
  user_name: string;
  details: Json;
  created_at: string;
}

export interface DashboardStats {
  total_files: number;
  total_size: number;
  recent_files: number;
  media_files: number;
  document_files: number;
}

/**
 * Get file activities (read via RPC for proper user context)
 */
export async function getFileActivities(fileId?: string, limit: number = 50, offset: number = 0) {
  return callRpc<FileActivity[]>('get_file_activities', {
    p_file_id: fileId ?? null,
    p_limit: limit,
    p_offset: offset,
  });
}

/**
 * Get dashboard activity feed
 */
export async function getDashboardActivity(limit: number = 20) {
  return callRpc<DashboardActivity[]>('get_dashboard_activity', { p_limit: limit });
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  return callRpc<DashboardStats[]>('get_dashboard_stats', {});
}

/**
 * Update file metadata (write via RPC)
 */
export async function updateFileMetadata(
  fileId: string,
  metadata?: Json,
  tags?: string[],
  aiSummary?: string
) {
  return callRpc<Json>('update_file_metadata', {
    p_file_id: fileId,
    p_metadata: metadata ?? null,
    p_tags: tags ?? null,
    p_ai_summary: aiSummary ?? null,
  });
}

/**
 * Ensure folder path exists (creates folders if needed)
 */
export async function ensureFolderPath(userId: string, path: string) {
  return callRpc<string>('ensure_folder_path', { p_user: userId, p_path: path });
}

// ============================================
// READ-ONLY QUERIES (Direct reads are allowed)
// ============================================

/**
 * Get files for a user (read-only)
 */
export async function getFiles(userId: string, limit: number = 50) {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('user_id', userId)
    .order('uploaded_at', { ascending: false })
    .limit(limit);
  
  return { data, error };
}

/**
 * Get file by ID (read-only)
 */
export async function getFileById(fileId: string) {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single();
  
  return { data, error };
}
