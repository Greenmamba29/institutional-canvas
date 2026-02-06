/**
 * Policy Audit Logging
 * 
 * Logs all policy decisions for debugging and compliance.
 * Non-blocking - failures don't affect the policy decision.
 */

import type { PolicyDecision, ToolPolicyErrorCode } from './types';

// In-memory buffer for batching audit logs
const auditBuffer: PolicyDecision[] = [];
const BUFFER_SIZE = 10;
const FLUSH_INTERVAL_MS = 5000;

let flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Log a policy decision
 */
export function logPolicyDecision(decision: PolicyDecision): void {
  // Add to buffer
  auditBuffer.push(decision);

  // Log immediately to console in development
  if (import.meta.env.DEV) {
    const status = decision.allowed ? '✓ ALLOWED' : '✗ DENIED';
    const details = decision.allowed 
      ? ''
      : ` [${decision.code}]: ${decision.reason}`;
    
    console.log(
      `[PolicyAudit] ${status} tool="${decision.toolName}" skill="${decision.skillName}"${details}`
    );
  }

  // Flush if buffer is full
  if (auditBuffer.length >= BUFFER_SIZE) {
    flushAuditBuffer();
  }

  // Schedule flush if not already scheduled
  if (!flushTimer) {
    flushTimer = setTimeout(flushAuditBuffer, FLUSH_INTERVAL_MS);
  }
}

/**
 * Create and log a policy decision
 */
export function createPolicyDecision(params: {
  toolName: string;
  skillName: string;
  userId: string;
  orgId: string;
  allowed: boolean;
  reason?: string;
  code?: ToolPolicyErrorCode;
}): PolicyDecision {
  const decision: PolicyDecision = {
    timestamp: new Date(),
    ...params,
  };

  logPolicyDecision(decision);
  return decision;
}

/**
 * Flush the audit buffer to backend
 */
async function flushAuditBuffer(): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  if (auditBuffer.length === 0) return;

  // Take current buffer contents
  const decisions = auditBuffer.splice(0, auditBuffer.length);

  try {
    // In production, this would send to an Edge Function
    // For now, we aggregate and log
    const summary = {
      total: decisions.length,
      allowed: decisions.filter(d => d.allowed).length,
      denied: decisions.filter(d => !d.allowed).length,
      byCode: decisions.reduce((acc, d) => {
        if (d.code) {
          acc[d.code] = (acc[d.code] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
    };

    if (import.meta.env.DEV) {
      console.log('[PolicyAudit] Buffer flush:', summary);
    }

    // TODO: Send to backend when log-policy-decisions Edge Function is available
    // await supabase.functions.invoke('log-policy-decisions', { body: { decisions } });
  } catch (error) {
    console.error('[PolicyAudit] Flush error:', error);
    // Don't re-add to buffer - accept loss of audit logs over memory pressure
  }
}

/**
 * Force flush the audit buffer (for shutdown/page unload)
 */
export function forceFlushAuditBuffer(): void {
  flushAuditBuffer();
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', forceFlushAuditBuffer);
}
