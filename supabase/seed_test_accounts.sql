-- ============================================================================
-- Test Data Bootstrap Script for Lithium & Lux
-- ============================================================================
-- Purpose: Create test organizations, memberships, and sample data
-- Safe to run multiple times (idempotent)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. Get or create test user IDs
-- ============================================================================
-- Note: You need to create these users via Supabase Auth UI first:
-- - test-buyer@lithiumbuy.com
-- - test-supplier@lithiumbuy.com

DO $$
DECLARE
  v_buyer_user_id UUID;
  v_supplier_user_id UUID;
  v_buyer_org_id UUID;
  v_supplier_org_id UUID;
  v_admin_buyer_org_id UUID;
BEGIN
  -- Get user IDs from auth.users (these should already exist)
  SELECT id INTO v_buyer_user_id FROM auth.users WHERE email = 'test-buyer@lithiumbuy.com' LIMIT 1;
  SELECT id INTO v_supplier_user_id FROM auth.users WHERE email = 'test-supplier@lithiumbuy.com' LIMIT 1;

  RAISE NOTICE 'Buyer User ID: %', v_buyer_user_id;
  RAISE NOTICE 'Supplier User ID: %', v_supplier_user_id;

  -- ============================================================================
  -- 2. Create Test Organizations (if they don't exist)
  -- ============================================================================

  -- Buyer Organization
  INSERT INTO public.organizations (
    id,
    name,
    org_type,
    email,
    created_at,
    updated_at
  ) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Test Buyer Corp',
    'buyer',
    'test-buyer@lithiumbuy.com',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();

  v_buyer_org_id := '11111111-1111-1111-1111-111111111111';
  RAISE NOTICE 'Buyer Org ID: %', v_buyer_org_id;

  -- Supplier Organization
  INSERT INTO public.organizations (
    id,
    name,
    org_type,
    email,
    created_at,
    updated_at
  ) VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Test Supplier LLC',
    'supplier',
    'test-supplier@lithiumbuy.com',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();

  v_supplier_org_id := '22222222-2222-2222-2222-222222222222';
  RAISE NOTICE 'Supplier Org ID: %', v_supplier_org_id;

  -- Admin/Buyer Organization (for comprehensive testing)
  INSERT INTO public.organizations (
    id,
    name,
    org_type,
    email,
    created_at,
    updated_at
  ) VALUES (
    '33333333-3333-3333-3333-333333333333',
    'Lithium & Lux Admin',
    'admin',
    'admin@lithiumbuy.com',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    updated_at = NOW();

  v_admin_buyer_org_id := '33333333-3333-3333-3333-333333333333';
  RAISE NOTICE 'Admin Org ID: %', v_admin_buyer_org_id;

  -- ============================================================================
  -- 3. Create Organization Memberships (if users exist)
  -- ============================================================================

  -- Buyer user membership
  IF v_buyer_user_id IS NOT NULL THEN
    INSERT INTO public.org_members (
      org_id,
      user_id,
      role,
      created_at
    ) VALUES (
      v_buyer_org_id,
      v_buyer_user_id,
      'owner',
      NOW()
    )
    ON CONFLICT (org_id, user_id) DO UPDATE SET
      role = EXCLUDED.role,
      updated_at = NOW();
    
    RAISE NOTICE 'Created buyer membership';
  ELSE
    RAISE WARNING 'Buyer user not found - please create test-buyer@lithiumbuy.com in Supabase Auth';
  END IF;

  -- Supplier user membership
  IF v_supplier_user_id IS NOT NULL THEN
    INSERT INTO public.org_members (
      org_id,
      user_id,
      role,
      created_at
    ) VALUES (
      v_supplier_org_id,
      v_supplier_user_id,
      'owner',
      NOW()
    )
    ON CONFLICT (org_id, user_id) DO UPDATE SET
      role = EXCLUDED.role,
      updated_at = NOW();
    
    RAISE NOTICE 'Created supplier membership';
  ELSE
    RAISE WARNING 'Supplier user not found - please create test-supplier@lithiumbuy.com in Supabase Auth';
  END IF;

  -- ============================================================================
  -- 4. Create Sample RFQs (Buyer perspective)
  -- ============================================================================

  IF v_buyer_user_id IS NOT NULL THEN
    -- Sample RFQ 1
    INSERT INTO public.rfqs (
      id,
      org_id,
      created_by,
      title,
      material_type,
      quantity_mt,
      target_price,
      delivery_location,
      delivery_date,
      status,
      created_at
    ) VALUES (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      v_buyer_org_id,
      v_buyer_user_id,
      'Lithium Carbonate - Q1 2025',
      'Lithium Carbonate',
      100,
      65000,
      'Rotterdam, Netherlands',
      (NOW() + INTERVAL '60 days')::date,
      'open',
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Sample RFQ 2
    INSERT INTO public.rfqs (
      id,
      org_id,
      created_by,
      title,
      material_type,
      quantity_mt,
      target_price,
      delivery_location,
      delivery_date,
      status,
      created_at
    ) VALUES (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      v_buyer_org_id,
      v_buyer_user_id,
      'Spodumene Concentrate - Urgent',
      'Spodumene',
      250,
      2800,
      'Shanghai, China',
      (NOW() + INTERVAL '30 days')::date,
      'open',
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Created sample RFQs';
  END IF;

  -- ============================================================================
  -- 5. Create Sample Listings (Supplier perspective)
  -- ============================================================================

  IF v_supplier_user_id IS NOT NULL THEN
    -- Sample Listing 1
    INSERT INTO public.listings (
      id,
      org_id,
      created_by,
      title,
      material_type,
      quantity_mt,
      price_per_mt,
      origin_country,
      available_from,
      status,
      created_at
    ) VALUES (
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
      v_supplier_org_id,
      v_supplier_user_id,
      'Premium Lithium Hydroxide - Battery Grade',
      'Lithium Hydroxide',
      75,
      24500,
      'Chile',
      NOW()::date,
      'active',
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- Sample Listing 2
    INSERT INTO public.listings (
      id,
      org_id,
      created_by,
      title,
      material_type,
      quantity_mt,
      price_per_mt,
      origin_country,
      available_from,
      status,
      created_at
    ) VALUES (
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      v_supplier_org_id,
      v_supplier_user_id,
      'Spodumene Concentrate 6% Li2O',
      'Spodumene',
      150,
      2950,
      'Australia',
      NOW()::date,
      'active',
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Created sample listings';
  END IF;

  -- ============================================================================
  -- Success message
  -- ============================================================================
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Test data bootstrap completed!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Organizations created:';
  RAISE NOTICE '  - Test Buyer Corp (ID: %)', v_buyer_org_id;
  RAISE NOTICE '  - Test Supplier LLC (ID: %)', v_supplier_org_id;
  RAISE NOTICE '  - Lithium & Lux Admin (ID: %)', v_admin_buyer_org_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Create auth users: test-buyer@lithiumbuy.com and test-supplier@lithiumbuy.com';
  RAISE NOTICE '  2. Set passwords via Supabase Auth dashboard';
  RAISE NOTICE '  3. Run this script again to create memberships';
  RAISE NOTICE '  4. Test login at https://lithiumbuy.com/auth';
  RAISE NOTICE '============================================';

END $$;

COMMIT;

-- ============================================================================
-- Verification Queries (run these to check the data)
-- ============================================================================

-- Check organizations
-- SELECT id, name, org_type, email FROM public.organizations WHERE name LIKE 'Test%' OR name LIKE '%Admin%';

-- Check memberships
-- SELECT om.*, u.email FROM public.org_members om
-- JOIN auth.users u ON om.user_id = u.id
-- WHERE om.org_id IN (
--   SELECT id FROM public.organizations WHERE name LIKE 'Test%' OR name LIKE '%Admin%'
-- );

-- Check RFQs
-- SELECT id, title, material_type, quantity_mt, status FROM public.rfqs
-- WHERE org_id = '11111111-1111-1111-1111-111111111111';

-- Check Listings
-- SELECT id, title, material_type, quantity_mt, status FROM public.listings
-- WHERE org_id = '22222222-2222-2222-2222-222222222222';
