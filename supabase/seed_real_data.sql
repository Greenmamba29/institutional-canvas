-- =========================================
-- LithiumBuy MVP - Real Lithium Market Data
-- Suppliers: Albemarle, SQM, Ganfeng, Tianqi, Pilbara
-- Products: Battery-grade lithium carbonate/hydroxide
-- =========================================

-- =========================================
-- 1) CREATE TEST USERS (Supabase Auth)
-- =========================================
-- Create buyer and supplier test users
-- Passwords are hashed with bcrypt

-- Buyer user: buyer@lithiumbuy.test (password: Test1234!)
-- Supplier user: supplier@lithiumbuy.test (password: Test1234!)

-- Insert users into auth.users (Supabase Auth)
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
) values
  (
    '11111111-aaaa-bbbb-cccc-111111111111'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'buyer@lithiumbuy.test',
    crypt('Test1234!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Tesla Buyer"}',
    'authenticated',
    'authenticated'
  ),
  (
    '22222222-aaaa-bbbb-cccc-222222222222'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'supplier@lithiumbuy.test',
    crypt('Test1234!', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Albemarle Representative"}',
    'authenticated',
    'authenticated'
  )
on conflict (id) do nothing;

-- =========================================
-- 2) ORGANIZATIONS
-- =========================================
-- Buyer organization
insert into public.organizations (id, org_type, name, email, phone, status)
values
  (
    'b0000000-0000-0000-0000-000000000001'::uuid,
    'buyer',
    'Tesla Inc',
    'procurement@tesla.com',
    '+1-512-516-8177',
    'active'
  )
on conflict (id) do nothing;

-- Supplier organizations (Real lithium companies)
insert into public.organizations (id, org_type, name, email, phone, status)
values
  -- Albemarle Corporation (USA)
  (
    's0000000-0000-0000-0000-000000000001'::uuid,
    'supplier',
    'Albemarle Corporation',
    'sales@albemarle.com',
    '+1-980-299-5700',
    'active'
  ),
  -- SQM (Chile)
  (
    's0000000-0000-0000-0000-000000000002'::uuid,
    'supplier',
    'SQM - Sociedad Química y Minera',
    'lithium@sqm.com',
    '+56-2-2425-2000',
    'active'
  ),
  -- Ganfeng Lithium (China)
  (
    's0000000-0000-0000-0000-000000000003'::uuid,
    'supplier',
    'Ganfeng Lithium Co., Ltd.',
    'international@ganfenglithium.com',
    '+86-797-588-8888',
    'active'
  ),
  -- Tianqi Lithium (China)
  (
    's0000000-0000-0000-0000-000000000004'::uuid,
    'supplier',
    'Tianqi Lithium Corporation',
    'sales@tianqilithium.com',
    '+86-28-8531-8888',
    'active'
  ),
  -- Pilbara Minerals (Australia)
  (
    's0000000-0000-0000-0000-000000000005'::uuid,
    'supplier',
    'Pilbara Minerals Limited',
    'info@pilbaraminerals.com.au',
    '+61-8-6266-6266',
    'active'
  )
on conflict (id) do nothing;

-- =========================================
-- 3) ORG MEMBERS (Link users to organizations)
-- =========================================
insert into public.org_members (org_id, user_id, role, status)
values
  -- Buyer user
  ('b0000000-0000-0000-0000-000000000001'::uuid, '11111111-aaaa-bbbb-cccc-111111111111', 'owner', 'active'),
  -- Supplier user (Albemarle)
  ('s0000000-0000-0000-0000-000000000001'::uuid, '22222222-aaaa-bbbb-cccc-222222222222', 'owner', 'active')
on conflict (org_id, user_id) do nothing;

-- =========================================
-- 4) SUPPLIERS (Real lithium companies)
-- =========================================
insert into public.suppliers (
  id,
  org_id,
  display_name,
  legal_name,
  description,
  website,
  email,
  phone,
  verification_tier,
  logo_url,
  average_rating,
  total_reviews,
  total_deals,
  year_established,
  employee_count,
  annual_capacity_mt,
  esg_certified,
  iso_certified
) values
  -- 1. Albemarle Corporation
  (
    gen_random_uuid(),
    's0000000-0000-0000-0000-000000000001'::uuid,
    'Albemarle Corporation',
    'Albemarle Corporation',
    'World''s largest lithium producer with 17% global market share. Leading supplier of battery-grade lithium carbonate and hydroxide for EV batteries. Operations in Chile (Atacama), Australia, and USA. ISO 9001, ISO 14001, and IATF 16949 certified. Committed to sustainable lithium production with comprehensive ESG programs.',
    'https://www.albemarle.com',
    'sales@albemarle.com',
    '+1-980-299-5700',
    'premium',
    'https://www.albemarle.com/logo.png',
    4.8,
    156,
    487,
    1994,
    '1000+',
    85000,
    true,
    true
  ),
  -- 2. SQM
  (
    gen_random_uuid(),
    's0000000-0000-0000-0000-000000000002'::uuid,
    'SQM',
    'Sociedad Química y Minera de Chile S.A.',
    'Chile''s largest lithium producer with world-class brine operations in the Atacama Salt Flat. Market cap $10.53B USD. Producing high-purity lithium carbonate (99.5%+) and hydroxide for global battery manufacturers. Strategic supplier to Tesla, LG, and CATL. Certified ISO 9001:2015, ISO 14001:2015.',
    'https://www.sqm.com',
    'lithium@sqm.com',
    '+56-2-2425-2000',
    'premium',
    'https://www.sqm.com/logo.png',
    4.7,
    203,
    612,
    1968,
    '1000+',
    120000,
    true,
    true
  ),
  -- 3. Ganfeng Lithium
  (
    gen_random_uuid(),
    's0000000-0000-0000-0000-000000000003'::uuid,
    'Ganfeng Lithium',
    'Jiangxi Ganfeng Lithium Co., Ltd.',
    'China''s largest lithium producer with market cap $9.30B USD. Vertically integrated supply chain from mining to battery production. World''s leading supplier of lithium metal and battery-grade compounds. Operations in China, Australia, and Argentina. Supplier to BMW, Tesla, LG Chem, and Samsung SDI.',
    'https://www.ganfenglithium.com',
    'international@ganfenglithium.com',
    '+86-797-588-8888',
    'premium',
    'https://www.ganfenglithium.com/logo.png',
    4.6,
    178,
    543,
    2000,
    '1000+',
    95000,
    true,
    true
  ),
  -- 4. Tianqi Lithium
  (
    gen_random_uuid(),
    's0000000-0000-0000-0000-000000000004'::uuid,
    'Tianqi Lithium',
    'Tianqi Lithium Corporation',
    'World''s largest hard-rock lithium producer with market cap $6.61B USD. 51% stake in Greenbushes Mine (Australia) - world''s largest hard-rock lithium mine. Advanced processing facilities in China and Australia. Producing battery-grade lithium carbonate and hydroxide meeting 99.9% purity standards.',
    'https://www.tianqilithium.com',
    'sales@tianqilithium.com',
    '+86-28-8531-8888',
    'premium',
    'https://www.tianqilithium.com/logo.png',
    4.7,
    145,
    398,
    1992,
    '1000+',
    70000,
    true,
    true
  ),
  -- 5. Pilbara Minerals
  (
    gen_random_uuid(),
    's0000000-0000-0000-0000-000000000005'::uuid,
    'Pilbara Minerals',
    'Pilbara Minerals Limited',
    'Australia''s leading lithium producer operating the world-class Pilgangoora Project. Producing spodumene concentrate (5.5-6.0% Li2O) for downstream processing into battery-grade lithium. Strategic partnerships with Ganfeng and CATL. Committed to sustainable mining practices with strong ESG focus.',
    'https://www.pilbaraminerals.com.au',
    'info@pilbaraminerals.com.au',
    '+61-8-6266-6266',
    'verified',
    'https://www.pilbaraminerals.com.au/logo.png',
    4.5,
    89,
    267,
    2005,
    '201-500',
    45000,
    true,
    true
  );

-- =========================================
-- 5) PRODUCTS (Real battery-grade lithium)
-- =========================================

-- Get supplier IDs for product insertion
do $$
declare
  albemarle_id uuid;
  sqm_id uuid;
  ganfeng_id uuid;
  tianqi_id uuid;
  pilbara_id uuid;
begin
  select id into albemarle_id from public.suppliers where display_name = 'Albemarle Corporation';
  select id into sqm_id from public.suppliers where display_name = 'SQM';
  select id into ganfeng_id from public.suppliers where display_name = 'Ganfeng Lithium';
  select id into tianqi_id from public.suppliers where display_name = 'Tianqi Lithium';
  select id into pilbara_id from public.suppliers where display_name = 'Pilbara Minerals';

  -- Albemarle Products
  insert into public.products (supplier_id, name, description, category, grade, purity_percentage, li2co3_content, unit, min_order_quantity, lead_time_days, available_quantity, certifications, esg_compliant, specifications, pricing, status) values
    (
      albemarle_id,
      'Battery Grade Lithium Carbonate 99.5%',
      'Premium battery-grade lithium carbonate meeting strictest EV battery specifications. Purity ≥99.5% with ultra-low impurities (Na, Mg, Ca, Fe <0.0001%). Ideal for NMC and LFP cathode production. Consistent particle size distribution. Meets YS/T 582-2013 standard.',
      'Lithium Carbonate',
      'Battery Grade',
      99.50,
      99.50,
      'MT',
      20,
      45,
      5000,
      ARRAY['ISO 9001:2015', 'IATF 16949:2016', 'REACH', 'RoHS'],
      true,
      '{"Na": "≤0.0001%", "Mg": "≤0.0001%", "Ca": "≤0.0001%", "Fe": "≤0.0001%", "Cl": "≤0.001%", "SO4": "≤0.03%", "H2O": "≤0.07%", "particle_size": "D50: 10-50μm"}'::jsonb,
      '{"base_price": 12500, "currency": "USD", "unit": "MT", "incoterms": "FOB", "volume_discounts": [{"min_quantity": 100, "discount_pct": 3}, {"min_quantity": 500, "discount_pct": 7}]}'::jsonb,
      'active'
    ),
    (
      albemarle_id,
      'Battery Grade Lithium Hydroxide Monohydrate 56.5%',
      'High-purity lithium hydroxide monohydrate for NCM cathodes. LiOH content ≥56.5% with minimal transition metal contamination. Optimized for high-nickel NMC 811 and NCA batteries. Excellent solubility and consistent quality.',
      'Lithium Hydroxide',
      'Battery Grade',
      99.90,
      null,
      'MT',
      20,
      60,
      3500,
      ARRAY['ISO 9001:2015', 'IATF 16949:2016', 'REACH'],
      true,
      '{"LiOH_H2O": "≥56.5%", "Na": "≤0.001%", "K": "≤0.001%", "Ca": "≤0.002%", "Mg": "≤0.001%", "Fe": "≤0.0005%", "Ni": "≤0.0005%", "particle_size": "D50: 15-60μm"}'::jsonb,
      '{"base_price": 15800, "currency": "USD", "unit": "MT", "incoterms": "FOB"}'::jsonb,
      'active'
    );

  -- SQM Products
  insert into public.products (supplier_id, name, description, category, grade, purity_percentage, li2co3_content, unit, min_order_quantity, lead_time_days, available_quantity, certifications, esg_compliant, specifications, pricing, status) values
    (
      sqm_id,
      'Premium Lithium Carbonate 99.5% (Atacama)',
      'Ultra-pure lithium carbonate from world-class Atacama brine operations. Guaranteed ≥99.5% purity with industry-leading consistency. Low magnesium and calcium content. Preferred by top-tier battery manufacturers globally.',
      'Lithium Carbonate',
      'Battery Grade',
      99.60,
      99.60,
      'MT',
      25,
      40,
      8000,
      ARRAY['ISO 9001:2015', 'ISO 14001:2015', 'REACH'],
      true,
      '{"purity": "99.6%", "Na": "≤0.0001%", "Mg": "≤0.00008%", "Ca": "≤0.00005%", "Fe": "≤0.00005%", "moisture": "≤0.05%"}'::jsonb,
      '{"base_price": 12200, "currency": "USD", "unit": "MT", "incoterms": "FOB", "location": "Antofagasta, Chile"}'::jsonb,
      'active'
    ),
    (
      sqm_id,
      'Lithium Hydroxide Monohydrate 56.5% Battery Grade',
      'High-specification lithium hydroxide for premium EV batteries. Sourced from sustainable Atacama brine. Exceptional purity and low impurities ensure superior battery performance and cycle life.',
      'Lithium Hydroxide',
      'Battery Grade',
      99.85,
      null,
      'MT',
      25,
      50,
      6000,
      ARRAY['ISO 9001:2015', 'ISO 14001:2015'],
      true,
      '{"LiOH_H2O": "≥56.5%", "purity": "99.85%", "Na": "≤0.0008%", "Ca": "≤0.001%", "Fe": "≤0.0003%"}'::jsonb,
      '{"base_price": 15500, "currency": "USD", "unit": "MT", "incoterms": "FOB"}'::jsonb,
      'active'
    );

  -- Ganfeng Products
  insert into public.products (supplier_id, name, description, category, grade, purity_percentage, unit, min_order_quantity, lead_time_days, available_quantity, certifications, esg_compliant, specifications, pricing, status) values
    (
      ganfeng_id,
      'Battery Grade Lithium Carbonate 99.8%',
      'Ultra-high purity lithium carbonate exceeding industry standards. 99.8% purity for demanding battery applications. Vertically integrated supply chain ensures consistent quality. Approved supplier for Tesla, BMW, and LG.',
      'Lithium Carbonate',
      'Battery Grade',
      99.80,
      'MT',
      30,
      35,
      12000,
      ARRAY['ISO 9001:2015', 'ISO 14001:2015', 'IATF 16949'],
      true,
      '{"purity": "99.8%", "impurities": "ultra-low", "particle_distribution": "optimized"}'::jsonb,
      '{"base_price": 13000, "currency": "USD", "unit": "MT", "incoterms": "CIF"}'::jsonb,
      'active'
    ),
    (
      ganfeng_id,
      'Lithium Metal 99.9% for Advanced Batteries',
      'High-purity lithium metal for next-generation solid-state and lithium-metal batteries. Purity ≥99.9%. Argon-protected packaging. Strategic material for future battery technology.',
      'Other',
      'Battery Grade',
      99.90,
      'kg',
      100,
      90,
      5000,
      ARRAY['ISO 9001:2015'],
      true,
      '{"purity": "99.9%", "form": "ingots", "packaging": "argon_protected"}'::jsonb,
      '{"base_price": 85, "currency": "USD", "unit": "kg", "incoterms": "CIF"}'::jsonb,
      'active'
    );

  -- Tianqi Products
  insert into public.products (supplier_id, name, description, category, grade, purity_percentage, unit, min_order_quantity, lead_time_days, available_quantity, certifications, esg_compliant, specifications, pricing, status) values
    (
      tianqi_id,
      'Battery Grade Lithium Hydroxide 99.9%',
      'Premium lithium hydroxide monohydrate from Greenbushes hard-rock source. Purity ≥99.9% with exceptional low transition metal content. Ideal for high-nickel cathodes (NCM 811, NCA). Consistent quality backed by decades of expertise.',
      'Lithium Hydroxide',
      'Battery Grade',
      99.90,
      'MT',
      20,
      55,
      4500,
      ARRAY['ISO 9001:2015', 'ISO 14001:2015'],
      true,
      '{"LiOH_H2O": "≥56.5%", "purity": "99.9%", "Fe": "≤0.0002%", "Ni": "≤0.0003%"}'::jsonb,
      '{"base_price": 16200, "currency": "USD", "unit": "MT", "incoterms": "FOB", "location": "Kwinana, Australia"}'::jsonb,
      'active'
    ),
    (
      tianqi_id,
      'Lithium Carbonate 99.5% Ex-Greenbushes',
      'Battery-grade lithium carbonate processed from Greenbushes spodumene. Meeting 99.5% purity specification. Proven track record supplying major battery manufacturers. Reliable quality and delivery.',
      'Lithium Carbonate',
      'Battery Grade',
      99.55,
      'MT',
      20,
      50,
      3800,
      ARRAY['ISO 9001:2015'],
      true,
      '{"purity": "99.55%", "source": "hard_rock", "consistency": "excellent"}'::jsonb,
      '{"base_price": 12800, "currency": "USD", "unit": "MT", "incoterms": "FOB"}'::jsonb,
      'active'
    );

  -- Pilbara Products
  insert into public.products (supplier_id, name, description, category, grade, purity_percentage, li2o_content, unit, min_order_quantity, lead_time_days, available_quantity, certifications, esg_compliant, specifications, pricing, status) values
    (
      pilbara_id,
      'Spodumene Concentrate 5.5-6.0% Li2O',
      'High-grade spodumene concentrate from Pilgangoora Project. Li2O content 5.5-6.0%. Feedstock for downstream lithium chemical production. Consistent quality with low impurities. Sustainable mining with strong ESG credentials.',
      'Lithium Spodumene',
      'Technical Grade',
      null,
      5.75,
      'MT',
      500,
      30,
      50000,
      ARRAY['ISO 14001:2015'],
      true,
      '{"Li2O_content": "5.5-6.0%", "Fe2O3": "≤1.5%", "moisture": "≤10%", "particle_size": "-10mm"}'::jsonb,
      '{"base_price": 850, "currency": "USD", "unit": "MT", "incoterms": "FOB", "location": "Port Hedland, Australia"}'::jsonb,
      'active'
    );
end $$;

-- =========================================
-- 6) CERTIFICATIONS
-- =========================================
do $$
declare
  albemarle_id uuid;
  sqm_id uuid;
  ganfeng_id uuid;
begin
  select id into albemarle_id from public.suppliers where display_name = 'Albemarle Corporation';
  select id into sqm_id from public.suppliers where display_name = 'SQM';
  select id into ganfeng_id from public.suppliers where display_name = 'Ganfeng Lithium';

  insert into public.certifications (supplier_id, name, certificate_type, issuing_body, certificate_number, issue_date, expiry_date, verified) values
    (albemarle_id, 'ISO 9001:2015', 'Quality Management', 'ISO', 'ISO9001-ALB-2023', '2023-01-15', '2026-01-15', true),
    (albemarle_id, 'ISO 14001:2015', 'Environmental', 'ISO', 'ISO14001-ALB-2023', '2023-01-15', '2026-01-15', true),
    (albemarle_id, 'IATF 16949:2016', 'Industry Specific', 'IATF', 'IATF16949-ALB-2023', '2023-03-10', '2026-03-10', true),
    (sqm_id, 'ISO 9001:2015', 'Quality Management', 'ISO', 'ISO9001-SQM-2024', '2024-02-20', '2027-02-20', true),
    (sqm_id, 'ISO 14001:2015', 'Environmental', 'ISO', 'ISO14001-SQM-2024', '2024-02-20', '2027-02-20', true),
    (ganfeng_id, 'ISO 9001:2015', 'Quality Management', 'ISO', 'ISO9001-GFL-2023', '2023-06-01', '2026-06-01', true),
    (ganfeng_id, 'IATF 16949:2016', 'Industry Specific', 'IATF', 'IATF16949-GFL-2023', '2023-06-01', '2026-06-01', true);
end $$;

-- =========================================
-- 7) LOCATIONS
-- =========================================
do $$
declare
  albemarle_id uuid;
  sqm_id uuid;
  pilbara_id uuid;
begin
  select id into albemarle_id from public.suppliers where display_name = 'Albemarle Corporation';
  select id into sqm_id from public.suppliers where display_name = 'SQM';
  select id into pilbara_id from public.suppliers where display_name = 'Pilbara Minerals';

  insert into public.locations (supplier_id, location_type, name, address_line1, city, state_province, postal_code, country, latitude, longitude, capacity_mt, operational_since) values
    (albemarle_id, 'headquarters', 'Global Headquarters', '4250 Congress Street', 'Charlotte', 'North Carolina', '28209', 'United States', 35.1852900, -80.8398400, null, 1994),
    (albemarle_id, 'mining_operation', 'Atacama Lithium Operations', 'Salar de Atacama', 'Antofagasta', 'Antofagasta', null, 'Chile', -23.5000000, -68.2500000, 85000, 1984),
    (sqm_id, 'headquarters', 'Corporate Headquarters', 'El Trovador 4285', 'Santiago', 'Región Metropolitana', '7551518', 'Chile', -33.4489000, -70.6693000, null, 1968),
    (sqm_id, 'mining_operation', 'Salar de Atacama Operations', 'Salar de Atacama', 'Calama', 'Antofagasta', null, 'Chile', -23.6500000, -68.3000000, 120000, 1996),
    (pilbara_id, 'headquarters', 'Perth Office', 'Level 2, 88 Colin Street', 'West Perth', 'Western Australia', '6005', 'Australia', -31.9523000, 115.8402000, null, 2005),
    (pilbara_id, 'mining_operation', 'Pilgangoora Lithium Project', 'Pilgangoora Road', 'Pilbara', 'Western Australia', null, 'Australia', -21.2800000, 118.7100000, 45000, 2018);
end $$;

-- =========================================
-- 8) REVIEWS (Realistic buyer reviews)
-- =========================================
do $$
declare
  albemarle_id uuid;
  sqm_id uuid;
  ganfeng_id uuid;
  tianqi_id uuid;
  buyer_org_id uuid := 'b0000000-0000-0000-0000-000000000001'::uuid;
  buyer_user_id uuid := '11111111-aaaa-bbbb-cccc-111111111111'::uuid;
begin
  select id into albemarle_id from public.suppliers where display_name = 'Albemarle Corporation';
  select id into sqm_id from public.suppliers where display_name = 'SQM';
  select id into ganfeng_id from public.suppliers where display_name = 'Ganfeng Lithium';
  select id into tianqi_id from public.suppliers where display_name = 'Tianqi Lithium';

  -- Albemarle reviews
  insert into public.reviews (supplier_id, buyer_org_id, rating, title, comment, verified_purchase, created_by, created_at) values
    (albemarle_id, buyer_org_id, 5, 'Outstanding quality and reliability', 'We''ve been sourcing battery-grade lithium carbonate from Albemarle for over 3 years. Product consistently exceeds 99.5% purity specs. Their ESG documentation is thorough and transparent. Delivery is always on schedule. Highly recommended for large-scale EV battery production.', true, buyer_user_id, now() - interval '45 days'),
    (albemarle_id, buyer_org_id, 5, 'Best-in-class technical support', 'Albemarle''s technical team provided excellent guidance during our NMC 811 cathode development. Their battery-grade hydroxide performed flawlessly with minimal impurities. Great partner for innovation.', true, buyer_user_id, now() - interval '120 days'),
    (albemarle_id, buyer_org_id, 4, 'Excellent product, premium pricing', 'Product quality is exceptional - no complaints there. However, pricing is at the higher end of the market. Worth it for the consistency and reliability, but be prepared for premium costs.', true, buyer_user_id, now() - interval '200 days');

  -- SQM reviews
  insert into public.reviews (supplier_id, buyer_org_id, rating, title, comment, verified_purchase, created_by, created_at) values
    (sqm_id, buyer_org_id, 5, 'Atacama quality - world class', 'SQM''s lithium from Atacama is consistently top-tier. Purity regularly exceeds 99.6%. Their brine-based process results in ultra-low magnesium content which is critical for our application. Competitive pricing for the quality delivered.', true, buyer_user_id, now() - interval '60 days'),
    (sqm_id, buyer_org_id, 5, 'Reliable global supplier', 'Ordered 500MT of battery-grade carbonate. Logistics were smooth, documentation was perfect, product arrived on spec. SQM is a reliable partner for our European gigafactory supply chain.', true, buyer_user_id, now() - interval '150 days'),
    (sqm_id, buyer_org_id, 4, 'Good product, lead times can vary', 'Product quality is excellent and meets all our specs. Only minor issue is lead times can extend during high demand periods. Plan ahead and you''ll be fine.', true, buyer_user_id, now() - interval '280 days');

  -- Ganfeng reviews
  insert into public.reviews (supplier_id, buyer_org_id, rating, title, comment, verified_purchase, created_by, created_at) values
    (ganfeng_id, buyer_org_id, 5, 'Vertically integrated excellence', 'Ganfeng''s control of the entire supply chain from mine to battery-grade product is impressive. Quality is consistent, pricing is competitive, and they understand battery manufacturer needs. Their 99.8% purity carbonate is exceptional.', true, buyer_user_id, now() - interval '90 days'),
    (ganfeng_id, buyer_org_id, 4, 'Innovative product portfolio', 'Ganfeng offers a wide range of lithium products including their lithium metal for next-gen batteries. Good innovation partner. Communication across time zones can be challenging but they are responsive.', true, buyer_user_id, now() - interval '180 days');

  -- Tianqi reviews
  insert into public.reviews (supplier_id, buyer_org_id, rating, title, comment, verified_purchase, created_by, created_at) values
    (tianqi_id, buyer_org_id, 5, 'Greenbushes quality speaks for itself', 'Tianqi''s hydroxide from their Greenbushes/Kwinana operations is premium quality. Ultra-low transition metal content perfect for high-nickel cathodes. Price is fair given the quality. Delivery from Australia to our US facility was well-managed.', true, buyer_user_id, now() - interval '75 days'),
    (tianqi_id, buyer_org_id, 5, 'Technical expertise and quality', 'Tianqi''s technical team helped us optimize our cathode formulation. Their understanding of battery chemistry is deep. Product quality is consistent batch-to-batch. Great long-term supplier relationship.', true, buyer_user_id, now() - interval '195 days');
end $$;

-- =========================================
-- 9) UPDATE SUPPLIER STATISTICS
-- =========================================
do $$
declare
  supplier_rec record;
begin
  for supplier_rec in select id from public.suppliers
  loop
    perform public.update_supplier_stats(supplier_rec.id);
  end loop;
end $$;
