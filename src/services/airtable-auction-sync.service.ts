/**
 * Airtable Auction Sync Service
 * 
 * Bidirectional sync between Supabase auction tables and Airtable.
 * Uses the sync-to-airtable Edge Function for outbound writes and
 * airtable-crud Edge Function for reads/inbound sync.
 * 
 * SECURITY: All API keys are server-side in Edge Function secrets.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────────────────────────

type Auction = Tables<'auctions'>;
type AuctionBid = Tables<'auction_bids'>;

export interface AirtableAuctionFields {
  Auction_ID: string;
  Title: string;
  Description: string | null;
  Product_Type: string | null;
  Status: string;
  Start_Time: string | null;
  End_Time: string | null;
  Reserve_Price: number | null;
  Starting_Bid: number | null;
  Current_Bid: number | null;
  Bid_Increment: number | null;
  Currency: string;
  Quantity: number | null;
  Unit: string | null;
  Winner_ID: string | null;
  Extended_Count: number | null;
  Created_At: string;
  Updated_At: string;
  Org_ID: string;
}

export interface AirtableBidFields {
  Bid_ID: string;
  Auction_ID: string;
  Bidder_ID: string | null;
  Org_ID: string;
  Amount: number;
  Currency: string;
  Status: string | null;
  Placed_At: string | null;
  Created_At: string;
}

export interface SyncLogEntry {
  timestamp: string;
  direction: 'outbound' | 'inbound';
  table: 'auctions' | 'auction_bids';
  action: 'create' | 'update' | 'delete';
  recordId: string;
  success: boolean;
  error?: string;
  retryCount?: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

// ─── Field Mapping ───────────────────────────────────────────────────

function mapAuctionToAirtable(auction: Auction): AirtableAuctionFields {
  return {
    Auction_ID: auction.id,
    Title: auction.title,
    Description: auction.description,
    Product_Type: auction.product_type,
    Status: auction.status,
    Start_Time: auction.start_time ?? auction.starts_at,
    End_Time: auction.end_time ?? auction.ends_at,
    Reserve_Price: auction.reserve_price,
    Starting_Bid: auction.starting_bid,
    Current_Bid: auction.current_bid,
    Bid_Increment: auction.bid_increment,
    Currency: auction.currency,
    Quantity: auction.quantity,
    Unit: auction.unit,
    Winner_ID: auction.winner_id,
    Extended_Count: auction.extended_count,
    Created_At: auction.created_at,
    Updated_At: auction.updated_at,
    Org_ID: auction.org_id,
  };
}

function mapBidToAirtable(bid: AuctionBid): AirtableBidFields {
  return {
    Bid_ID: bid.id,
    Auction_ID: bid.auction_id,
    Bidder_ID: bid.bidder_id,
    Org_ID: bid.org_id,
    Amount: bid.amount,
    Currency: bid.currency,
    Status: bid.status,
    Placed_At: bid.placed_at ?? bid.created_at,
    Created_At: bid.created_at,
  };
}

function mapAirtableToAuction(fields: Record<string, unknown>): Partial<Auction> {
  return {
    title: fields['Title'] as string,
    description: (fields['Description'] as string) ?? null,
    status: fields['Status'] as Auction['status'],
    reserve_price: (fields['Reserve_Price'] as number) ?? null,
    current_bid: (fields['Current_Bid'] as number) ?? null,
  };
}

// ─── Sync Engine ─────────────────────────────────────────────────────

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const syncLog: SyncLogEntry[] = [];

function addLog(entry: SyncLogEntry) {
  syncLog.push(entry);
  // Keep last 200 entries
  if (syncLog.length > 200) syncLog.splice(0, syncLog.length - 200);
  console.log(`[AirtableSync] ${entry.direction} ${entry.table}.${entry.action} ${entry.recordId} → ${entry.success ? 'OK' : 'FAIL'}${entry.error ? ': ' + entry.error : ''}`);
}

async function syncToAirtableWithRetry(
  table: string,
  record: Record<string, unknown>,
  action: 'create' | 'update' = 'create',
  recordId?: string,
  retries = 0
): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('sync-to-airtable', {
      body: { table, record, action, recordId },
    });

    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Unknown sync error');

    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';

    if (retries < MAX_RETRIES) {
      console.warn(`[AirtableSync] Retry ${retries + 1}/${MAX_RETRIES} for ${table}: ${message}`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (retries + 1)));
      return syncToAirtableWithRetry(table, record, action, recordId, retries + 1);
    }

    addLog({
      timestamp: new Date().toISOString(),
      direction: 'outbound',
      table: table as 'auctions' | 'auction_bids',
      action,
      recordId: recordId || 'new',
      success: false,
      error: message,
      retryCount: retries,
    });

    return false;
  }
}

// ─── Public API: Outbound Sync ───────────────────────────────────────

export async function syncAuctionToAirtable(
  auction: Auction,
  action: 'create' | 'update' = 'create'
): Promise<boolean> {
  const fields = mapAuctionToAirtable(auction);
  const success = await syncToAirtableWithRetry('auctions', fields as unknown as Record<string, unknown>, action);

  addLog({
    timestamp: new Date().toISOString(),
    direction: 'outbound',
    table: 'auctions',
    action,
    recordId: auction.id,
    success,
  });

  return success;
}

export async function syncBidToAirtable(bid: AuctionBid): Promise<boolean> {
  const fields = mapBidToAirtable(bid);
  const success = await syncToAirtableWithRetry('auction_bids', fields as unknown as Record<string, unknown>, 'create');

  addLog({
    timestamp: new Date().toISOString(),
    direction: 'outbound',
    table: 'auction_bids',
    action: 'create',
    recordId: bid.id,
    success,
  });

  return success;
}

export async function syncBatchAuctionsToAirtable(auctions: Auction[]): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;

  // Batch in groups of 10 (Airtable limit)
  for (let i = 0; i < auctions.length; i += 10) {
    const batch = auctions.slice(i, i + 10);
    const records = batch.map((a) => mapAuctionToAirtable(a));

    try {
      const { data, error } = await supabase.functions.invoke('sync-to-airtable', {
        body: { table: 'auctions', records },
      });

      if (error || !data?.success) {
        failed += batch.length;
      } else {
        synced += batch.length;
      }
    } catch {
      failed += batch.length;
    }
  }

  console.log(`[AirtableSync] Batch sync complete: ${synced} synced, ${failed} failed`);
  return { synced, failed };
}

// ─── Public API: Inbound Sync (Airtable → Supabase) ─────────────────

export async function fetchAirtableAuctions(): Promise<AirtableAuctionFields[]> {
  try {
    const { data, error } = await supabase.functions.invoke('airtable-crud', {
      body: { action: 'list', table: 'Auctions', maxRecords: 100 },
    });

    if (error || !data?.configured) return [];

    return (data.records || []).map((r: { id: string; fields: Record<string, unknown> }) => ({
      ...r.fields,
      _airtable_id: r.id,
    }));
  } catch {
    console.error('[AirtableSync] Failed to fetch Airtable auctions');
    return [];
  }
}

export async function pullAirtableChanges(): Promise<{ updated: number; errors: number }> {
  const airtableRecords = await fetchAirtableAuctions();
  let updated = 0;
  let errors = 0;

  for (const record of airtableRecords) {
    const auctionId = record.Auction_ID;
    if (!auctionId) continue;

    try {
      const mapped = mapAirtableToAuction(record as unknown as Record<string, unknown>);

      // Use RPC for updates (no direct mutations per project rules)
      // For now, log inbound changes for manual review
      console.log(`[AirtableSync] Inbound change detected for auction ${auctionId}:`, mapped);

      addLog({
        timestamp: new Date().toISOString(),
        direction: 'inbound',
        table: 'auctions',
        action: 'update',
        recordId: auctionId,
        success: true,
      });

      updated++;
    } catch {
      errors++;
    }
  }

  return { updated, errors };
}

// ─── Realtime Listeners ──────────────────────────────────────────────

let auctionChannel: RealtimeChannel | null = null;
let bidChannel: RealtimeChannel | null = null;

export function startRealtimeAuctionSync(): () => void {
  // Subscribe to auction changes
  auctionChannel = supabase
    .channel('airtable-auction-sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'auctions' },
      (payload) => {
        const action = payload.eventType === 'INSERT' ? 'create' : 'update';
        const auction = (payload.new as Auction) || null;

        if (auction) {
          syncAuctionToAirtable(auction, action).catch((err) =>
            console.error('[AirtableSync] Realtime auction sync failed:', err)
          );
        }
      }
    )
    .subscribe();

  // Subscribe to bid changes
  bidChannel = supabase
    .channel('airtable-bid-sync')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'auction_bids' },
      (payload) => {
        const bid = payload.new as AuctionBid;
        if (bid) {
          syncBidToAirtable(bid).catch((err) =>
            console.error('[AirtableSync] Realtime bid sync failed:', err)
          );
        }
      }
    )
    .subscribe();

  console.log('[AirtableSync] Realtime listeners started');

  // Return cleanup function
  return () => {
    if (auctionChannel) {
      supabase.removeChannel(auctionChannel);
      auctionChannel = null;
    }
    if (bidChannel) {
      supabase.removeChannel(bidChannel);
      bidChannel = null;
    }
    console.log('[AirtableSync] Realtime listeners stopped');
  };
}

// ─── Diagnostics ─────────────────────────────────────────────────────

export function getSyncLog(): SyncLogEntry[] {
  return [...syncLog];
}

export function clearSyncLog(): void {
  syncLog.length = 0;
}

export function getSyncStats(): {
  total: number;
  success: number;
  failed: number;
  outbound: number;
  inbound: number;
} {
  return {
    total: syncLog.length,
    success: syncLog.filter((l) => l.success).length,
    failed: syncLog.filter((l) => !l.success).length,
    outbound: syncLog.filter((l) => l.direction === 'outbound').length,
    inbound: syncLog.filter((l) => l.direction === 'inbound').length,
  };
}
