/**
 * Airtable Sync Helper Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const invokeMock = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
  },
}));

describe('airtable-sync helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('syncToAirtable', () => {
    it('invokes the sync-to-airtable edge function with the correct contract', async () => {
      invokeMock.mockResolvedValue({ data: { success: true }, error: null });
      const { syncToAirtable } = await import('./airtable-sync');

      const result = await syncToAirtable('rfqs', { id: 'r1', title: 'x' }, 'create');

      expect(invokeMock).toHaveBeenCalledWith('sync-to-airtable', {
        body: { table: 'rfqs', record: { id: 'r1', title: 'x' }, action: 'create', recordId: undefined },
      });
      expect(result).toEqual({ success: true });
    });

    it('passes recordId and action for updates', async () => {
      invokeMock.mockResolvedValue({ data: { success: true }, error: null });
      const { syncToAirtable } = await import('./airtable-sync');

      await syncToAirtable('deals', { status: 'closed' }, 'update', 'recXYZ');

      expect(invokeMock).toHaveBeenCalledWith('sync-to-airtable', {
        body: { table: 'deals', record: { status: 'closed' }, action: 'update', recordId: 'recXYZ' },
      });
    });

    it('defaults the action to create', async () => {
      invokeMock.mockResolvedValue({ data: { success: true }, error: null });
      const { syncToAirtable } = await import('./airtable-sync');

      await syncToAirtable('bids', { id: 'b1' });

      expect(invokeMock).toHaveBeenCalledWith(
        'sync-to-airtable',
        expect.objectContaining({ body: expect.objectContaining({ action: 'create' }) })
      );
    });

    it('swallows invoke errors and returns success: false (never throws)', async () => {
      invokeMock.mockResolvedValue({ data: null, error: { message: 'network down' } });
      const { syncToAirtable } = await import('./airtable-sync');

      const result = await syncToAirtable('rfqs', { id: 'r1' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('network down');
      expect(console.error).toHaveBeenCalled();
    });

    it('treats a non-success edge response as a (swallowed) failure', async () => {
      invokeMock.mockResolvedValue({ data: { success: false, error: 'Unknown table' }, error: null });
      const { syncToAirtable } = await import('./airtable-sync');

      const result = await syncToAirtable('rfqs', { id: 'r1' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown table');
    });

    it('swallows thrown/rejected invoke promises', async () => {
      invokeMock.mockRejectedValue(new Error('boom'));
      const { syncToAirtable } = await import('./airtable-sync');

      const result = await syncToAirtable('rfqs', { id: 'r1' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('boom');
    });
  });

  describe('syncRecordToAirtable', () => {
    it('skips the invoke when the record is null/undefined', async () => {
      const { syncRecordToAirtable } = await import('./airtable-sync');

      const result = await syncRecordToAirtable('rfqs', null, 'create');

      expect(invokeMock).not.toHaveBeenCalled();
      expect(result).toEqual({ success: false, error: 'No record to sync' });
    });

    it('forwards to syncToAirtable when a record is present', async () => {
      invokeMock.mockResolvedValue({ data: { success: true }, error: null });
      const { syncRecordToAirtable } = await import('./airtable-sync');

      const result = await syncRecordToAirtable('purchases', { id: 'p1' }, 'create');

      expect(invokeMock).toHaveBeenCalledWith('sync-to-airtable', {
        body: { table: 'purchases', record: { id: 'p1' }, action: 'create', recordId: undefined },
      });
      expect(result.success).toBe(true);
    });
  });
});
