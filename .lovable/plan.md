

# Phase 6: Production-Ready Auction System

This is a large initiative. Given frontend-only constraints (Lovable cannot create backend RPC functions or cron jobs), the plan focuses on **Week 1 MVP items** that are achievable now, clearly marking what requires backend work.

---

## Current State Summary

**Already working:**
- `place_auction_bid` RPC exists and is wired to the UI via `usePlaceAuctionBid` hook
- Realtime subscriptions on `auctions` and `auction_bids` tables (auto-invalidate React Query cache)
- Bid history table with anonymized bidders, rank indicators, and "You" labels
- Bid increment validation in the UI
- Countdown timers on both list and detail pages
- `auction_notifications` table with enum types (outbid, winning, auction_ending, auction_won, auction_lost)
- `extended_count` field on auctions table
- `auction_bid_status` enum (active, outbid, withdrawn, winning)

**What this plan adds (frontend-only):**

---

## Task 1: Live Bid Feed Component

Create `src/components/auction/LiveBidFeed.tsx` -- a compact real-time activity log shown on the AuctionDetail page alongside the existing bid history table.

- Shows last 10 bids as a scrolling feed with animated entry
- Highlights "You were outbid!" alerts inline
- Displays bid count badge that updates in real-time
- Uses existing `useAuctionBids` hook (already has realtime subscription)

**Files:** New `src/components/auction/LiveBidFeed.tsx`, modify `src/pages/AuctionDetail.tsx`

---

## Task 2: Outbid Alert Banner

Add a persistent alert banner on AuctionDetail when the current user was the previous highest bidder but has been outbid.

- Compare `sortedBids[0].org_id` against `currentOrgId`
- If user has bids but is not #1, show a dismissible `Alert` with "You've been outbid! Place a new bid to regain your position."
- Use sonner toast for the initial notification, persistent banner for ongoing state

**Files:** Modify `src/pages/AuctionDetail.tsx`

---

## Task 3: Bid Confirmation Dialog

Add a confirmation step before submitting bids to prevent accidental submissions.

- Show AlertDialog with bid amount, auction title, and minimum increment confirmation
- Include "I understand this bid is binding" checkbox
- Only then call `placeBid.mutate()`

**Files:** New `src/components/auction/BidConfirmDialog.tsx`, modify `src/pages/AuctionDetail.tsx`

---

## Task 4: Auction Extension Indicator

Show visual feedback when an auction has been extended (anti-sniping).

- Display "EXTENDED x{n}" badge next to the countdown when `extended_count > 0`
- Animate the badge on change
- Add tooltip explaining the anti-sniping rule

**Files:** Modify `src/pages/AuctionDetail.tsx`

---

## Task 5: Auction Watch Button

Create a watch/unwatch toggle so users can track auctions they are interested in.

- UI-only for now (localStorage-based watchlist until backend table exists)
- Show filled/outline eye icon
- Filter "Watched" auctions on the Auctions list page
- Prepare for future `auction_watchers` table migration

**Files:** New `src/components/auction/WatchButton.tsx`, modify `src/pages/Auctions.tsx`

---

## Task 6: Auction Status Transitions in UI

Handle auction lifecycle states more gracefully:

- When a live auction's countdown reaches zero, auto-transition the UI to "Ending..." then refetch status
- Show winner announcement card when `status === 'ended'` and `winner_id` is set
- Display "Auction Won" or "Auction Lost" state for participating users

**Files:** Modify `src/pages/AuctionDetail.tsx`

---

## Task 7: Terms Acceptance Before First Bid

Add a one-time T&C acceptance flow before a user can place their first bid on any auction.

- Show a dialog with auction terms on first bid attempt
- Store acceptance in localStorage (keyed by user ID)
- Checkbox: "I agree to the auction terms and conditions"
- Block bid form until accepted

**Files:** New `src/components/auction/AuctionTermsDialog.tsx`, modify `src/pages/AuctionDetail.tsx`

---

## Backend Requirements (NOT in this plan -- requires Replit)

The following items need backend implementation and are documented here for handoff:

1. **Anti-sniping trigger**: DB trigger on `auction_bids` INSERT to extend `end_time` by 2 minutes if bid is within last 2 minutes, increment `extended_count`, cap at 10
2. **Auction close cron**: pg_cron or Edge Function cron to set `status = 'ended'`, determine `winner_id`, insert `auction_notifications`
3. **Auction activate cron**: Set `status = 'live'` when `start_time <= NOW()`
4. **Stripe escrow integration**: Payment intent creation for auction winners
5. **Fraud detection**: Rate limiting, IP tracking, shill bid detection
6. **Bid status management**: Update previous highest bidder's bid status to `outbid` when new bid arrives

---

## Technical Notes

- All new components use shadcn/ui + Tailwind CSS exclusively
- No new dependencies required
- Realtime is already wired via `useRealtimeSubscription` on both `auctions` and `auction_bids` tables
- Bid placement uses `place_auction_bid` RPC through authenticated client (compliant with RPC-only write rule)
- Watch feature uses localStorage as interim storage until `auction_watchers` table is created by backend

