/**
 * useAuctionAirtableSync Hook
 * 
 * Provides manual and automatic Airtable sync for auction data.
 * Starts realtime listeners on mount and cleans up on unmount.
 */

import { useEffect, useCallback, useState, useRef } from 'react';
import {
  startRealtimeAuctionSync,
  syncAuctionToAirtable,
  syncBidToAirtable,
  syncBatchAuctionsToAirtable,
  pullAirtableChanges,
  getSyncLog,
  getSyncStats,
  type SyncLogEntry,
  type SyncStatus,
} from '@/services/airtable-auction-sync.service';
import type { Tables } from '@/integrations/supabase/types';

type Auction = Tables<'auctions'>;
type AuctionBid = Tables<'auction_bids'>;

interface UseAuctionAirtableSyncReturn {
  /** Current sync status */
  status: SyncStatus;
  /** Last sync error message */
  lastError: string | null;
  /** Manually sync a single auction to Airtable */
  syncAuction: (auction: Auction, action?: 'create' | 'update') => Promise<boolean>;
  /** Manually sync a bid to Airtable */
  syncBid: (bid: AuctionBid) => Promise<boolean>;
  /** Batch sync multiple auctions */
  syncAllAuctions: (auctions: Auction[]) => Promise<{ synced: number; failed: number }>;
  /** Pull changes from Airtable into Supabase */
  pullChanges: () => Promise<{ updated: number; errors: number }>;
  /** Recent sync log entries */
  syncLog: SyncLogEntry[];
  /** Sync statistics */
  stats: ReturnType<typeof getSyncStats>;
  /** Whether realtime listeners are active */
  isListening: boolean;
}

export function useAuctionAirtableSync(
  options: { autoStart?: boolean } = { autoStart: true }
): UseAuctionAirtableSyncReturn {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [logVersion, setLogVersion] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Start realtime listeners
  useEffect(() => {
    if (!options.autoStart) return;

    cleanupRef.current = startRealtimeAuctionSync();
    setIsListening(true);

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      setIsListening(false);
    };
  }, [options.autoStart]);

  const syncAuction = useCallback(async (auction: Auction, action: 'create' | 'update' = 'create') => {
    setStatus('syncing');
    setLastError(null);

    try {
      const success = await syncAuctionToAirtable(auction, action);
      setStatus(success ? 'success' : 'error');
      if (!success) setLastError('Auction sync failed after retries');
      setLogVersion((v) => v + 1);
      return success;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setStatus('error');
      setLastError(msg);
      setLogVersion((v) => v + 1);
      return false;
    }
  }, []);

  const syncBid = useCallback(async (bid: AuctionBid) => {
    setStatus('syncing');
    setLastError(null);

    try {
      const success = await syncBidToAirtable(bid);
      setStatus(success ? 'success' : 'error');
      if (!success) setLastError('Bid sync failed after retries');
      setLogVersion((v) => v + 1);
      return success;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setStatus('error');
      setLastError(msg);
      setLogVersion((v) => v + 1);
      return false;
    }
  }, []);

  const syncAllAuctions = useCallback(async (auctions: Auction[]) => {
    setStatus('syncing');
    setLastError(null);

    try {
      const result = await syncBatchAuctionsToAirtable(auctions);
      setStatus(result.failed > 0 ? 'error' : 'success');
      if (result.failed > 0) setLastError(`${result.failed} auctions failed to sync`);
      setLogVersion((v) => v + 1);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setStatus('error');
      setLastError(msg);
      setLogVersion((v) => v + 1);
      return { synced: 0, failed: auctions.length };
    }
  }, []);

  const pullChanges = useCallback(async () => {
    setStatus('syncing');
    setLastError(null);

    try {
      const result = await pullAirtableChanges();
      setStatus(result.errors > 0 ? 'error' : 'success');
      if (result.errors > 0) setLastError(`${result.errors} inbound sync errors`);
      setLogVersion((v) => v + 1);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setStatus('error');
      setLastError(msg);
      setLogVersion((v) => v + 1);
      return { updated: 0, errors: 1 };
    }
  }, []);

  return {
    status,
    lastError,
    syncAuction,
    syncBid,
    syncAllAuctions,
    pullChanges,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    syncLog: logVersion >= 0 ? getSyncLog() : [],
    stats: getSyncStats(),
    isListening,
  };
}
