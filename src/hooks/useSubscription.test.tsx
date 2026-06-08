/**
 * useSubscription — trial logic tests
 *
 * Verifies the self-serve free-trial path:
 *   - Active trial → full (pro-equivalent) access, tier 'trial', isTrialActive
 *   - Expired trial + no paid plan → no access (null)
 *   - Active paid subscription beats any trial
 *   - Admin org → enterprise bypass (never a trial)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ── Mocks ──────────────────────────────────────────────────────────────────────

let mockOrg: { id: string; org_type: string } | null = { id: 'org-1', org_type: 'buyer' };

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/context/OrganizationContext', () => ({
  useOrganization: () => ({ currentOrg: mockOrg }),
}));

const maybeSingle = vi.fn();
const rpc = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: () => maybeSingle(),
          }),
        }),
      }),
    }),
    rpc: (...args: unknown[]) => rpc(...args),
  },
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

async function loadHook() {
  const { useSubscription } = await import('./useSubscription');
  return renderHook(() => useSubscription(), { wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockOrg = { id: 'org-1', org_type: 'buyer' };
  maybeSingle.mockResolvedValue({ data: null, error: null });
  rpc.mockResolvedValue({ data: null, error: null });
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('useSubscription — trial logic', () => {
  it('treats an active trial as full pro-equivalent access', async () => {
    const trialEnds = new Date(Date.now() + 3 * 86400_000).toISOString();
    rpc.mockResolvedValue({
      data: [{ is_trial_active: true, trial_ends_at: trialEnds, trial_days_left: 3 }],
      error: null,
    });

    const { result } = await loadHook();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const sub = result.current.data!;
    expect(sub.tier).toBe('trial');
    expect(sub.isTrialActive).toBe(true);
    expect(sub.trialDaysLeft).toBe(3);
    expect(sub.trialEndsAt).toBe(trialEnds);
    // Trial unlocks the full Pro feature set
    expect(sub.features).toContain('unlimited_rfqs');
    expect(sub.features).toContain('grant_tracker');
    // ...but not enterprise-only features
    expect(sub.features).not.toContain('telebuy');
  });

  it('returns null when the trial has expired and there is no paid plan', async () => {
    rpc.mockResolvedValue({
      data: [{ is_trial_active: false, trial_ends_at: null, trial_days_left: 0 }],
      error: null,
    });

    const { result } = await loadHook();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

  it('prefers an active paid subscription over any trial', async () => {
    maybeSingle.mockResolvedValue({
      data: { price_id: 'price_pro_monthly', status: 'active', expires_at: null },
      error: null,
    });
    // Even if a trial were active, the paid sub should win — RPC must not decide.
    rpc.mockResolvedValue({
      data: [{ is_trial_active: true, trial_ends_at: new Date().toISOString(), trial_days_left: 2 }],
      error: null,
    });

    const { result } = await loadHook();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const sub = result.current.data!;
    expect(sub.tier).toBe('pro');
    expect(sub.isTrialActive).toBe(false);
    expect(sub.status).toBe('active');
    // Trial RPC should never be consulted once a paid sub is found.
    expect(rpc).not.toHaveBeenCalled();
  });

  it('admin org gets enterprise access and is never on a trial', async () => {
    mockOrg = { id: 'org-admin', org_type: 'admin' };

    const { result } = await loadHook();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const sub = result.current.data!;
    expect(sub.tier).toBe('enterprise');
    expect(sub.isTrialActive).toBe(false);
    expect(sub.features).toContain('telebuy');
  });
});
