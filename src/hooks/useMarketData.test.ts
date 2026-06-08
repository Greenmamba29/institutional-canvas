/**
 * Tests for the price-indicator data fetching used by usePriceIndicators.
 * The RPC layer and supabase realtime client are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/rpc', () => ({
  callRpc: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
}));

const ROW = {
  symbol: 'LITHIUM_CARBONATE_BATTERY_GRADE',
  region: 'CN',
  price: 8500,
  currency: 'USD',
  unit: 'USD/MT',
  observed_at: '2026-06-07T00:00:00.000Z',
  source: 'SPOT.ai',
  metadata: { confidence: 0.95 },
};

describe('fetchPriceIndicators', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls get_price_indicators RPC with mapped params and returns parsed rows', async () => {
    const { callRpc } = await import('@/lib/supabase/rpc');
    (callRpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [ROW], error: null });

    const { fetchPriceIndicators } = await import('./useMarketData');
    const result = await fetchPriceIndicators({
      symbol: 'LITHIUM_CARBONATE_BATTERY_GRADE',
      region: 'CN',
      limit: 10,
    });

    expect(callRpc).toHaveBeenCalledWith('get_price_indicators', {
      p_symbol: 'LITHIUM_CARBONATE_BATTERY_GRADE',
      p_region: 'CN',
      p_limit: 10,
    });
    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe('LITHIUM_CARBONATE_BATTERY_GRADE');
    expect(result[0].price).toBe(8500);
  });

  it('defaults p_limit to 50 when not provided', async () => {
    const { callRpc } = await import('@/lib/supabase/rpc');
    (callRpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], error: null });

    const { fetchPriceIndicators } = await import('./useMarketData');
    await fetchPriceIndicators({ symbol: 'LITHIUM_HYDROXIDE', region: 'US' });

    expect(callRpc).toHaveBeenCalledWith('get_price_indicators', {
      p_symbol: 'LITHIUM_HYDROXIDE',
      p_region: 'US',
      p_limit: 50,
    });
  });

  it('passes p_region null when region is null (all regions)', async () => {
    const { callRpc } = await import('@/lib/supabase/rpc');
    (callRpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], error: null });

    const { fetchPriceIndicators } = await import('./useMarketData');
    await fetchPriceIndicators({
      symbol: 'LITHIUM_CARBONATE_BATTERY_GRADE',
      region: null,
      limit: 200,
    });

    expect(callRpc).toHaveBeenCalledWith('get_price_indicators', {
      p_symbol: 'LITHIUM_CARBONATE_BATTERY_GRADE',
      p_region: null,
      p_limit: 200,
    });
  });

  it('passes p_region null when region is omitted (all regions)', async () => {
    const { callRpc } = await import('@/lib/supabase/rpc');
    (callRpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: [], error: null });

    const { fetchPriceIndicators } = await import('./useMarketData');
    await fetchPriceIndicators({ symbol: 'LITHIUM_HYDROXIDE' });

    expect(callRpc).toHaveBeenCalledWith('get_price_indicators', {
      p_symbol: 'LITHIUM_HYDROXIDE',
      p_region: null,
      p_limit: 50,
    });
  });

  it('treats a null RPC payload (no rows) as an empty array', async () => {
    const { callRpc } = await import('@/lib/supabase/rpc');
    (callRpc as ReturnType<typeof vi.fn>).mockResolvedValue({ data: null, error: null });

    const { fetchPriceIndicators } = await import('./useMarketData');
    const result = await fetchPriceIndicators({ symbol: 'X', region: 'CN' });

    expect(result).toEqual([]);
  });

  it('throws when the RPC returns an error', async () => {
    const { callRpc } = await import('@/lib/supabase/rpc');
    (callRpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: new Error('boom'),
    });

    const { fetchPriceIndicators } = await import('./useMarketData');
    await expect(
      fetchPriceIndicators({ symbol: 'X', region: 'CN' })
    ).rejects.toThrow('boom');
  });

  it('throws when the payload fails schema validation', async () => {
    const { callRpc } = await import('@/lib/supabase/rpc');
    (callRpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [{ symbol: 'X' }],
      error: null,
    });

    const { fetchPriceIndicators } = await import('./useMarketData');
    await expect(
      fetchPriceIndicators({ symbol: 'X', region: 'CN' })
    ).rejects.toThrow(/Invalid price indicator payload/);
  });
});
