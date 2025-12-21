/**
 * Jobs Service - RPC wrappers for job/agent operations
 * @see ORCHESTRATION/API.openapiv1.yaml
 */

import { callRpc, supabase } from '@/lib/supabase/rpc';
import type { Json } from '@/integrations/supabase/types';

export interface JobMetrics {
  success: boolean;
  job_id: string;
  metrics: {
    total_events: number;
    duration_ms: number;
    p95_latency: number;
    cost_usd: number;
    error_rate: number;
    completion_rate: number;
    stages_data: {
      total_stages: number;
      stages_list: string[];
    };
  };
}

/**
 * Log and calculate metrics for a job
 */
export async function logJobMetrics(jobId: string) {
  return callRpc<Json>('log_job_metrics', { p_job: jobId });
}

// ============================================
// READ-ONLY QUERIES (Direct reads are allowed)
// ============================================

/**
 * Get job summary by job ID (read-only)
 */
export async function getJobSummary(jobId: string) {
  const { data, error } = await supabase
    .from('job_summaries')
    .select('*')
    .eq('job_id', jobId)
    .single();
  
  return { data, error };
}

/**
 * Get agent events for a job (read-only)
 */
export async function getAgentEvents(jobId: string) {
  const { data, error } = await supabase
    .from('agent_events')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: true });
  
  return { data, error };
}

/**
 * Get job ops view (read-only)
 */
export async function getJobOps(limit: number = 50) {
  const { data, error } = await supabase
    .from('v_job_ops')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  return { data, error };
}
