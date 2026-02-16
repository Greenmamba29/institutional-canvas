-- Seed demo auctions for Thursday demo
-- Uses a system user placeholder for created_by

DO $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
BEGIN
  -- Get any existing org and user for seeding
  SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
  SELECT id INTO v_user_id FROM public.profiles LIMIT 1;

  -- If no org/user exists, create placeholder IDs
  IF v_org_id IS NULL THEN
    v_org_id := gen_random_uuid();
  END IF;
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
  END IF;

  -- Auction 1: Live lithium carbonate auction
  INSERT INTO public.auctions (
    title, description, product_type, quantity, unit,
    starting_bid, current_bid, bid_increment, reserve_price,
    status, start_time, end_time, starts_at, ends_at,
    created_by, org_id, currency
  ) VALUES (
    'Battery-Grade Lithium Carbonate - Q1 2026',
    'Premium 99.5% purity Li₂CO₃ from Salar de Atacama. SGS-certified, delivered CIF Shanghai.',
    'lithium_carbonate', 50, 'MT',
    12000, 14500, 500, 15000,
    'live', now() - interval '2 hours', now() + interval '22 hours',
    now() - interval '2 hours', now() + interval '22 hours',
    v_user_id, v_org_id, 'USD'
  );

  -- Auction 2: Scheduled lithium hydroxide
  INSERT INTO public.auctions (
    title, description, product_type, quantity, unit,
    starting_bid, bid_increment, reserve_price,
    status, start_time, end_time, starts_at, ends_at,
    created_by, org_id, currency
  ) VALUES (
    'Lithium Hydroxide Monohydrate - March Delivery',
    'Battery-grade LiOH·H₂O, 56.5% LiOH content. FOB Pilbara, Western Australia.',
    'lithium_hydroxide', 25, 'MT',
    18000, 1000, 20000,
    'scheduled', now() + interval '2 days', now() + interval '3 days',
    now() + interval '2 days', now() + interval '3 days',
    v_user_id, v_org_id, 'USD'
  );

  -- Auction 3: Live black mass recycling auction
  INSERT INTO public.auctions (
    title, description, product_type, quantity, unit,
    starting_bid, current_bid, bid_increment, reserve_price,
    status, start_time, end_time, starts_at, ends_at,
    created_by, org_id, currency
  ) VALUES (
    'Black Mass - EV Battery Recycling Lot #247',
    'Mixed NMC black mass from end-of-life EV packs. ~12% Li, ~8% Co, ~15% Ni content. ISRI-certified.',
    'black_mass', 100, 'MT',
    3500, 4200, 250, 4000,
    'live', now() - interval '6 hours', now() + interval '18 hours',
    now() - interval '6 hours', now() + interval '18 hours',
    v_user_id, v_org_id, 'USD'
  );

  -- Auction 4: Scheduled spodumene
  INSERT INTO public.auctions (
    title, description, product_type, quantity, unit,
    starting_bid, bid_increment,
    status, start_time, end_time, starts_at, ends_at,
    created_by, org_id, currency
  ) VALUES (
    'Spodumene Concentrate SC6.0 - Spot Lot',
    '6% Li₂O spodumene concentrate. Origin: Greenbushes, WA. CIF Tianjin.',
    'spodumene', 200, 'MT',
    1200, 100,
    'scheduled', now() + interval '5 days', now() + interval '6 days',
    now() + interval '5 days', now() + interval '6 days',
    v_user_id, v_org_id, 'USD'
  );

  -- Auction 5: Ended recycled material auction
  INSERT INTO public.auctions (
    title, description, product_type, quantity, unit,
    starting_bid, current_bid, bid_increment, reserve_price,
    status, start_time, end_time, starts_at, ends_at,
    created_by, org_id, currency
  ) VALUES (
    'Recycled Lithium Carbonate - Circular Economy Lot',
    'Recycled Li₂CO₃ from consumer electronics. 99.2% purity. Carbon-neutral certified.',
    'recycled_material', 10, 'MT',
    9000, 11800, 500, 10000,
    'ended', now() - interval '3 days', now() - interval '1 day',
    now() - interval '3 days', now() - interval '1 day',
    v_user_id, v_org_id, 'USD'
  );

END $$;
