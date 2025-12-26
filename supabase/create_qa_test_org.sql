-- ============================================================================
-- Quick Test Organization Creation for QA
-- ============================================================================
-- Run this in Supabase SQL Editor to create test org for qa-test-buyer
-- ============================================================================

DO $$
DECLARE
  v_user_id TEXT;
  v_org_id UUID;
BEGIN
  -- Get the user ID for qa-test-buyer@lithiumbuy.com
  SELECT id::text INTO v_user_id 
  FROM auth.users 
  WHERE email = 'qa-test-buyer@lithiumbuy.com' 
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User qa-test-buyer@lithiumbuy.com not found. Please create this user first in Supabase Auth.';
  END IF;

  RAISE NOTICE 'Found user: %', v_user_id;

  -- Check if user already has an organization
  IF EXISTS (
    SELECT 1 FROM public.org_members WHERE user_id = v_user_id AND status = 'active'
  ) THEN
    RAISE NOTICE 'User already has an organization. Skipping creation.';
    RETURN;
  END IF;

  -- Create test buyer organization
  -- NOTE: Only insert columns that exist in the actual schema
  -- The organizations table has: id, org_type, name, status, created_at
  -- It does NOT have: email, phone, address, metadata, updated_at
  INSERT INTO public.organizations (
    id,
    org_type,
    name,
    status,
    created_at
  ) VALUES (
    gen_random_uuid(),
    'buyer',
    'QA Test Buyer Corp',
    'active',
    NOW()
  )
  RETURNING id INTO v_org_id;

  RAISE NOTICE 'Created organization: %', v_org_id;

  -- Add user as owner
  INSERT INTO public.org_members (
    org_id,
    user_id,
    role,
    status,
    joined_at,
    created_at
  ) VALUES (
    v_org_id,
    v_user_id,
    'owner',
    'active',
    NOW(),
    NOW()
  );

  RAISE NOTICE 'Added user as owner of organization';
  RAISE NOTICE '✅ SUCCESS! User can now access dashboard at https://lithiumbuy.com/dashboard';

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ ERROR: %', SQLERRM;
  RAISE;
END $$;

-- ============================================================================
-- Verification Query - Run this to check the results
-- ============================================================================
/*
SELECT 
  u.email,
  o.id as org_id,
  o.name as org_name,
  o.org_type,
  om.role,
  om.status
FROM auth.users u
JOIN public.org_members om ON om.user_id = u.id::text
JOIN public.organizations o ON o.id = om.org_id
WHERE u.email = 'qa-test-buyer@lithiumbuy.com';
*/
