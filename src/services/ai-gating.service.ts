/**
 * AI Gating Service
 * Provides frontend access to AI feature flags, run ledger, and release gates
 */

import { supabase } from '@/integrations/supabase/client';

export interface AIFeatureFlag {
  id: string;
  feature_key: string;
  name: string;
  description: string | null;
  status: 'on' | 'off' | 'shadow';
  org_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIRunLedger {
  id: string;
  run_id: string;
  feature_key: string;
  status: 'started' | 'completed' | 'failed' | 'shadow';
  trigger_source: 'human' | 'system' | 'ai';
  actor_id: string | null;
  org_id: string | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface ReleaseGate {
  id: string;
  gate_id: string;
  name: string;
  description: string | null;
  gate_type: 'ui' | 'api' | 'ai' | 'financial';
  status: 'open' | 'closed' | 'review_required';
  created_at: string;
  updated_at: string;
}

export interface RiskFlag {
  id: string;
  flag_type: string;
  severity: string;
  entity_type: string;
  entity_id: string;
  description: string;
  status: string;
  flagged_at: string;
}

export async function getAIFeatureFlags(): Promise<AIFeatureFlag[]> {
  const { data, error } = await supabase.from('ai_feature_flags').select('*').order('feature_key');
  if (error) return [];
  return data as AIFeatureFlag[];
}

export async function updateAIFeatureFlag(featureKey: string, status: 'on' | 'off' | 'shadow'): Promise<boolean> {
  const { error } = await supabase.from('ai_feature_flags').update({ status, updated_at: new Date().toISOString() }).eq('feature_key', featureKey);
  return !error;
}

export async function getReleaseGates(): Promise<ReleaseGate[]> {
  const { data, error } = await supabase.from('release_gates').select('*').order('gate_type, gate_id');
  if (error) return [];
  return data as ReleaseGate[];
}

export async function updateReleaseGate(gateId: string, status: 'open' | 'closed' | 'review_required'): Promise<boolean> {
  const { error } = await supabase.from('release_gates').update({ status, updated_at: new Date().toISOString() }).eq('gate_id', gateId);
  return !error;
}

export async function getAIRunHistory(limit = 50): Promise<AIRunLedger[]> {
  const { data, error } = await supabase.from('ai_run_ledger').select('*').order('started_at', { ascending: false }).limit(limit);
  if (error) return [];
  return data as AIRunLedger[];
}

export async function getRiskFlags(limit = 20): Promise<RiskFlag[]> {
  const { data, error } = await supabase.from('risk_flags').select('*').order('flagged_at', { ascending: false }).limit(limit);
  if (error) return [];
  return data as RiskFlag[];
}

export async function getAIGatingStats() {
  const [features, runs, riskFlags] = await Promise.all([
    getAIFeatureFlags(),
    getAIRunHistory(100),
    getRiskFlags(50),
  ]);
  return {
    totalFeatures: features.length,
    enabledFeatures: features.filter((f) => f.status === 'on').length,
    shadowFeatures: features.filter((f) => f.status === 'shadow').length,
    totalRuns: runs.length,
    failedRuns: runs.filter((r) => r.status === 'failed').length,
    openRiskFlags: riskFlags.filter((r) => r.status === 'open').length,
    pendingKYB: 0,
  };
}
