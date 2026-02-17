
# Automatic Auction Close + Full Airtable Sync

## What This Does
When an auction's end time passes, a background job will automatically:
1. Set the auction status to "ended"
2. Pick the highest bidder as winner
3. Mark the winning bid as "won" and all others as "lost"
4. Notify the winner
5. Push all finalized data (auctions + bids) to Airtable

---

## Prerequisites (Done by AI)
- Add the Supabase secret `AIRTABLE_AUCTION_BIDS_TABLE` with value `tbltL0vu4zomBnU3Z`

---

## Implementation Steps

### Step 1: Add the Airtable Bids Table Secret
Set `AIRTABLE_AUCTION_BIDS_TABLE = tbltL0vu4zomBnU3Z` in Supabase Edge Function secrets.

### Step 2: SQL Migration -- Create `close_ended_auctions()` RPC
A new database function that runs server-side to close expired auctions:
- Finds all auctions where `status = 'live'` AND `ends_at <= now()`
- For each, finds the highest bid and sets `winner_id`
- Updates auction status to `ended`
- Marks winning bid status to `won`, all others to `lost`
- Creates a notification for the winner (using the correct `notifications` schema: `org_id`, `body`, `entity_type`, `entity_id`)

### Step 3: SQL Migration -- Enable `pg_cron` + `pg_net` and Schedule Job
- Enable both extensions
- Schedule a cron job running every minute that calls the `close-auctions` Edge Function via HTTP

### Step 4: Create Edge Function `supabase/functions/close-auctions/index.ts`
A lightweight function that:
1. Calls `close_ended_auctions()` RPC using the service role key
2. Fetches all auctions updated to `ended` in the last 2 minutes
3. Pushes each to Airtable via the existing `sync-to-airtable` function
4. Fetches all bids for those auctions and pushes them to Airtable too
5. Returns a summary (how many closed, how many synced)

### Step 5: Update `supabase/config.toml`
Add:
```
[functions.close-auctions]
verify_jwt = false
```

### Step 6: Fix `src/skills/auction/index.ts` -- Remove Direct Mutation
The `settleAuctionSkill` currently uses a forbidden direct `.update()` call. It will be changed to call the `close_ended_auctions` RPC instead, respecting the project's RPC-only write rule.

### Step 7: Update `src/hooks/useAuctions.ts` -- Handle `bidData` as `jsonb`
The `place_auction_bid` RPC now returns `jsonb` (with `bid_id`, `was_extended`, `extended_count`). The `auctionBidSkill` needs to read `bidData.bid_id` instead of `bidData.id`.

---

## Architecture Diagram

```text
Every minute:
  pg_cron --> pg_net HTTP POST --> close-auctions Edge Function
                                      |
                                      v
                              close_ended_auctions() RPC
                                (set winner, update statuses,
                                 notify winner)
                                      |
                                      v
                              Fetch recently closed auctions + bids
                                      |
                                      v
                              Call sync-to-airtable for each
                                (auctions --> tbl4oywNOsuRrvabQ)
                                (bids --> tbltL0vu4zomBnU3Z)
```

---

## Technical Details

**`close_ended_auctions()` function:**
- `SECURITY DEFINER` with `SET search_path = public`
- Loops through expired live auctions
- Uses `ORDER BY amount DESC LIMIT 1` to find the winner
- Notification insert uses `org_id` from the auction record, `body` for message text, `entity_type = 'auction'`, `entity_id = auction.id`

**`close-auctions` Edge Function:**
- No JWT verification (called by pg_cron)
- Uses `SUPABASE_SERVICE_ROLE_KEY` for RPC call
- After closing, queries auctions with `status = 'ended' AND updated_at > now() - interval '2 minutes'`
- For each closed auction, fetches all its bids and syncs both to Airtable

**Settle skill fix:**
- Replace `supabase.from('auctions').update(...)` with `supabase.rpc('close_ended_auctions')`
- Remove the manual `dealId` generation (the RPC handles everything)

**Bid skill fix:**
- Read `bidData.bid_id` instead of `bidData.id` from the jsonb return value
