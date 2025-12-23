# Lithium Buy Schema Verification Checklist

## Quick Verification Steps

1. **Run the automated tests:**
   - Open: https://supabase.com/dashboard/project/vuekwckknfjivjighhfd/sql/new
   - Copy/paste from: `VERIFICATION_TESTS.sql`
   - Run all tests and check results

2. **Expected Test Results:**
   - ✅ Tables Check: 8 tables found
   - ✅ Enums Check: 5 enums found  
   - ✅ RLS Enabled Check: 8 tables with RLS
   - ✅ RLS Policies Check: >=10 policies
   - ✅ Indexes Check: >=15 indexes
   - ✅ JWT Functions Check: 3 functions
   - ✅ RPC Functions Check: >=15 functions
   - ✅ Triggers Check: 4 triggers

## Schema Components

### Tables (8)
- [x] `rfqs` - Request for Quotes
- [x] `deals` - Deal management
- [x] `bids` - Supplier bids on RFQs
- [x] `auctions` - Auction listings
- [x] `auction_bids` - Auction bids
- [x] `notifications` - System notifications
- [x] `price_indicators` - Market intelligence
- [x] `purchases` - Purchase orders

### Enums (5)
- [x] `rfq_status` - draft, submitted, closed, cancelled
- [x] `deal_status` - pending, active, rejected, expired, completed, cancelled
- [x] `offer_decision` - accepted, rejected
- [x] `auction_status` - scheduled, live, ended, cancelled
- [x] `notification_type` - rfq_submitted, rfq_awarded, deal_created, etc.

### JWT Helper Functions (3)
- [x] `jwt_claim(text)` - Extract JWT claims
- [x] `jwt_org_id()` - Get org_id from JWT
- [x] `jwt_user_id()` - Get user_id from JWT

### RPC Functions (18)

#### RFQs
- [x] `create_rfq()` - Create new RFQ
- [x] `list_rfqs()` - List org's RFQs

#### Bids
- [x] `submit_bid()` - Submit bid on RFQ
- [x] `withdraw_bid()` - Withdraw bid

#### Deals
- [x] `create_deal()` - Create deal from RFQ
- [x] `update_deal_status()` - Update deal status
- [x] `respond_to_offer()` - Supplier accept/reject

#### Auctions
- [x] `list_auctions()` - List active auctions
- [x] `place_auction_bid()` - Place bid on auction

#### Notifications
- [x] `get_notifications()` - Get org's notifications
- [x] `mark_notification_read()` - Mark notification as read

#### Market Intel
- [x] `get_price_indicators()` - Get price data

#### Listings
- [x] `list_listings()` - List all products
- [x] `get_listing()` - Get single product

#### Purchases
- [x] `create_purchase()` - Create purchase order
- [x] `update_purchase_status()` - Update PO status
- [x] `list_purchases()` - List org's purchases
- [x] `get_purchase_by_id()` - Get PO by ID

## Security Verification

### RLS Policies (Expected: 10+)
Each table should have:
- SELECT policy for org isolation
- Revoked INSERT/UPDATE/DELETE for direct access

### Key Security Features
- [x] All tables have RLS enabled
- [x] Direct mutations revoked (anon, authenticated roles)
- [x] All writes through SECURITY DEFINER RPCs
- [x] Org-level isolation via `jwt_org_id()`
- [x] Supplier dual-access on purchases

## Performance Verification

### Critical Indexes
- [x] `rfqs_org_id_idx`, `rfqs_status_idx`
- [x] `deals_org_id_idx`, `deals_supplier_id_idx`, `deals_status_idx`
- [x] `bids_rfq_id_idx`, `bids_supplier_id_idx`
- [x] `auctions_status_idx`, `auctions_org_id_idx`
- [x] `auction_bids_auction_id_idx`, `auction_bids_org_id_idx`
- [x] `notifications_org_id_idx`, `notifications_user_id_idx`, `notifications_is_read_idx`
- [x] `price_indicators_symbol_idx`, `price_indicators_region_idx`, `price_indicators_observed_at_idx`
- [x] `idx_purchases_purchase_id_unique` (UNIQUE)
- [x] `idx_purchases_org_id`, `idx_purchases_supplier_id`, etc.

### Triggers
- [x] `trg_rfqs_updated_at` - Auto-update timestamp
- [x] `trg_deals_updated_at` - Auto-update timestamp
- [x] `trg_bids_updated_at` - Auto-update timestamp
- [x] `trg_auctions_updated_at` - Auto-update timestamp

## Common Issues to Check

### Missing Purchases Table?
If the purchases table is not showing up:
1. Check if it was created in a separate migration
2. Verify the table exists: `SELECT * FROM public.purchases LIMIT 0;`
3. Check if RLS is enabled
4. Verify indexes and policies

### JWT Functions Not Working?
- These functions return NULL outside of authenticated requests
- Test with actual Auth0 JWT containing org_id claim
- Verify claim path: `org_id` or `https://lithiumbuy.com/org_id`

### RPC Functions Failing?
Common issues:
- Missing `org_id` in JWT → "Missing org_id in JWT" error
- Accessing another org's data → Returns empty/null
- Direct table access → Blocked by RLS

## Integration Testing

Once verification passes, test with Lovable:

```typescript
// Example: Create RFQ from Lovable
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.rpc('create_rfq', {
  p_title: 'Lithium Carbonate - 100MT',
  p_description: 'Battery grade, 99.5% purity',
  p_product_id: null,
  p_target_quantity: 100,
  p_target_unit: 'MT',
  p_incoterms: 'CIF',
  p_delivery_location: 'Rotterdam'
});
```

## Final Steps

After all tests pass:

1. **Regenerate types:**
   ```bash
   cd ~/institutional-canvas
   supabase gen types typescript --linked > src/integrations/supabase/types.ts
   ```

2. **Commit types:**
   ```bash
   git add src/integrations/supabase/types.ts
   git commit -m "chore: regenerate types after schema verification

Co-Authored-By: Warp <agent@warp.dev>"
   git push origin main
   ```

3. **Update Lovable:**
   - Pull latest from GitHub in Lovable
   - Start using RPC functions in components
   - Test end-to-end workflows

## Status

- [x] Schema created
- [ ] Tests run and passed
- [ ] Types regenerated
- [ ] Lovable integration tested
- [ ] End-to-end workflows verified

---

**Questions or issues?** Run the test SQL and share the output!
