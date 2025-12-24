-- =========================================
-- Lithium Buy MVP - Seed Data for Testing
-- =========================================

-- Note: Replace Auth0 sub values with real ones from your Auth0 users
-- For testing, you can use placeholder subs like 'auth0|buyer_user_123'

-- =========================================
-- 1) Organizations
-- =========================================
INSERT INTO public.organizations (id, org_type, name, email, phone, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'buyer', 'Tesla Inc', 'procurement@tesla.com', '+1-650-555-0001', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'supplier', 'Albemarle Corporation', 'sales@albemarle.com', '+1-980-555-0002', 'active')
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 2) Org Members (REPLACE WITH REAL AUTH0 SUBS)
-- =========================================
-- Buyer user (e.g., auth0|67890...)
INSERT INTO public.org_members (org_id, user_id, role, status)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'auth0|buyer_test_user', 'owner', 'active')
ON CONFLICT (org_id, user_id) DO NOTHING;

-- Supplier user (e.g., auth0|12345...)
INSERT INTO public.org_members (org_id, user_id, role, status)
VALUES
  ('22222222-2222-2222-2222-222222222222', 'auth0|supplier_test_user', 'owner', 'active')
ON CONFLICT (org_id, user_id) DO NOTHING;

-- =========================================
-- 3) Products (if not already exist)
-- =========================================
INSERT INTO public.products (id, name, description, category, unit, created_at)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'Lithium Carbonate Battery Grade', '99.5% purity, suitable for EV batteries', 'Raw Materials', 'MT', now()),
  ('44444444-4444-4444-4444-444444444444', 'Lithium Hydroxide Monohydrate', '56.5% LiOH content', 'Raw Materials', 'MT', now())
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- 4) RFQs (using RPC for proper notifications)
-- =========================================
-- Set JWT context to buyer user (simulates logged-in buyer)
SELECT set_config('request.jwt.claims', 
  '{"sub": "auth0|buyer_test_user", "org_id": "11111111-1111-1111-1111-111111111111"}', 
  false);

-- Create RFQs via RPC
SELECT create_rfq(
  'Need 100MT Lithium Carbonate Q1 2025',
  'Looking for battery-grade lithium carbonate for EV production. Delivery to Gigafactory Texas.',
  '33333333-3333-3333-3333-333333333333'::uuid,
  100,
  'MT',
  'FOB',
  'Austin, TX'
);

SELECT create_rfq(
  'Lithium Hydroxide 50MT Spot Purchase',
  'Immediate need for 50MT lithium hydroxide. Payment terms: NET 30.',
  '44444444-4444-4444-4444-444444444444'::uuid,
  50,
  'MT',
  'CIF',
  'Shanghai, China'
);

SELECT create_rfq(
  'Long-term Contract: 500MT/year Lithium Carbonate',
  '3-year supply agreement for battery-grade lithium carbonate. Annual volume: 500MT.',
  '33333333-3333-3333-3333-333333333333'::uuid,
  500,
  'MT',
  'FOB',
  'Fremont, CA'
);

-- =========================================
-- 5) Bids (using RPC for proper notifications)
-- =========================================
-- Set JWT context to supplier user
SELECT set_config('request.jwt.claims', 
  '{"sub": "auth0|supplier_test_user", "org_id": "22222222-2222-2222-2222-222222222222"}', 
  false);

-- Get RFQ IDs from created RFQs
DO $$
DECLARE
  rfq1_id uuid;
  rfq2_id uuid;
BEGIN
  SELECT id INTO rfq1_id FROM public.rfqs WHERE title LIKE '%100MT Lithium Carbonate%' LIMIT 1;
  SELECT id INTO rfq2_id FROM public.rfqs WHERE title LIKE '%50MT Spot Purchase%' LIMIT 1;

  -- Submit bids via RPC
  PERFORM submit_bid(
    rfq1_id,
    '22222222-2222-2222-2222-222222222222'::uuid,
    850000,
    'USD',
    100,
    45,
    'Standard delivery terms. Price includes shipping to Texas.'
  );

  PERFORM submit_bid(
    rfq1_id,
    '22222222-2222-2222-2222-222222222222'::uuid,
    825000,
    'USD',
    100,
    60,
    'Discounted price for extended lead time. Volume discount available for future orders.'
  );

  PERFORM submit_bid(
    rfq2_id,
    '22222222-2222-2222-2222-222222222222'::uuid,
    425000,
    'USD',
    50,
    30,
    'Express shipping available. Can deliver within 2 weeks if needed.'
  );
END $$;

-- =========================================
-- 6) Award Deal (buyer awards lowest bid)
-- =========================================
-- Set JWT context back to buyer
SELECT set_config('request.jwt.claims', 
  '{"sub": "auth0|buyer_test_user", "org_id": "11111111-1111-1111-1111-111111111111"}', 
  false);

DO $$
DECLARE
  rfq1_id uuid;
  best_bid_id uuid;
BEGIN
  SELECT id INTO rfq1_id FROM public.rfqs WHERE title LIKE '%100MT Lithium Carbonate%' LIMIT 1;
  
  -- Get lowest bid
  SELECT id INTO best_bid_id 
  FROM public.bids 
  WHERE rfq_id = rfq1_id 
  ORDER BY price ASC 
  LIMIT 1;

  -- Award deal via RPC
  PERFORM create_deal(
    '22222222-2222-2222-2222-222222222222'::uuid,
    rfq1_id,
    'Q1 2025 Lithium Carbonate Supply'
  );
END $$;

-- =========================================
-- 7) Supplier Accepts Deal
-- =========================================
-- Set JWT context to supplier
SELECT set_config('request.jwt.claims', 
  '{"sub": "auth0|supplier_test_user", "org_id": "22222222-2222-2222-2222-222222222222"}', 
  false);

DO $$
DECLARE
  deal_id uuid;
BEGIN
  SELECT id INTO deal_id FROM public.deals WHERE status = 'pending' LIMIT 1;

  IF deal_id IS NOT NULL THEN
    PERFORM respond_to_offer(
      deal_id,
      'accepted'::offer_decision,
      'Confirmed. Production scheduled for Q1 2025. Will provide shipping details by EOW.'
    );
  END IF;
END $$;

-- =========================================
-- 8) Create Purchase Order
-- =========================================
-- Set JWT context back to buyer
SELECT set_config('request.jwt.claims', 
  '{"sub": "auth0|buyer_test_user", "org_id": "11111111-1111-1111-1111-111111111111"}', 
  false);

DO $$
DECLARE
  deal_id uuid;
BEGIN
  SELECT id INTO deal_id FROM public.deals WHERE status = 'active' LIMIT 1;

  IF deal_id IS NOT NULL THEN
    PERFORM create_purchase(
      '11111111-1111-1111-1111-111111111111'::uuid,  -- buyer
      '22222222-2222-2222-2222-222222222222'::uuid,  -- supplier
      deal_id,
      825000,
      'USD',
      jsonb_build_object(
        'line_items', jsonb_build_array(
          jsonb_build_object('product', 'Lithium Carbonate Battery Grade', 'quantity', 100, 'unit', 'MT', 'unit_price', 8250)
        ),
        'payment_terms', 'NET 30',
        'delivery_date', '2025-03-15'
      ),
      'Initial PO for Q1 2025 supply. Delivery to Gigafactory Texas.'
    );
  END IF;
END $$;

-- =========================================
-- 9) Add Price Indicators (Market Data)
-- =========================================
INSERT INTO public.price_indicators (symbol, region, price, currency, unit, observed_at, source, metadata)
VALUES
  ('LITHIUM_CARBONATE_BATTERY_GRADE', 'CN', 8500, 'USD', 'USD/MT', now() - interval '1 day', 'SPOT.ai', '{"confidence": 0.95, "volume": "high"}'::jsonb),
  ('LITHIUM_CARBONATE_BATTERY_GRADE', 'US', 8750, 'USD', 'USD/MT', now() - interval '1 day', 'SPOT.ai', '{"confidence": 0.92, "volume": "medium"}'::jsonb),
  ('LITHIUM_HYDROXIDE', 'CN', 8200, 'USD', 'USD/MT', now() - interval '1 day', 'SPOT.ai', '{"confidence": 0.90, "volume": "high"}'::jsonb),
  ('LITHIUM_HYDROXIDE', 'US', 8400, 'USD', 'USD/MT', now() - interval '1 day', 'SPOT.ai', '{"confidence": 0.88, "volume": "low"}'::jsonb)
ON CONFLICT DO NOTHING;

-- =========================================
-- Verification Queries
-- =========================================
-- Run these to verify seed data:

-- Check organizations
-- SELECT * FROM organizations;

-- Check org members
-- SELECT * FROM org_members;

-- Check RFQs
-- SELECT * FROM rfqs;

-- Check bids
-- SELECT * FROM bids;

-- Check deals
-- SELECT * FROM deals;

-- Check purchases
-- SELECT * FROM purchases;

-- Check notifications (should have been created automatically)
-- SELECT * FROM notifications ORDER BY created_at DESC;
