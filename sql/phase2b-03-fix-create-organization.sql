-- ============================================================================
-- PHASE 2B: RECREATE create_organization FUNCTION
-- ============================================================================
-- Uses auth.uid() for reliable authentication
-- Proper error handling and validation
-- ============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.create_organization(TEXT, TEXT, TEXT, TEXT);

-- Create improved version
CREATE OR REPLACE FUNCTION public.create_organization(
  p_org_type TEXT,
  p_name TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS public.organizations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_org public.organizations;
BEGIN
  -- Get authenticated user ID using Supabase's auth.uid()
  v_user_id := auth.uid();
  
  -- Check authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required. Please sign in.'
      USING HINT = 'User must be authenticated to create an organization';
  END IF;
  
  -- Check if user already has an active organization
  IF EXISTS (
    SELECT 1 FROM public.org_members 
    WHERE user_id = v_user_id::text 
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'User already belongs to an organization'
      USING HINT = 'Each user can only belong to one active organization';
  END IF;
  
  -- Validate org_type
  IF p_org_type IS NULL OR p_org_type NOT IN ('buyer', 'supplier', 'admin') THEN
    RAISE EXCEPTION 'Invalid organization type: %', p_org_type
      USING HINT = 'Organization type must be: buyer, supplier, or admin';
  END IF;
  
  -- Validate name
  IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 THEN
    RAISE EXCEPTION 'Organization name is required'
      USING HINT = 'Please provide a valid organization name';
  END IF;
  
  -- Create organization
  INSERT INTO public.organizations (
    id,
    org_type,
    name,
    email,
    phone,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    p_org_type,
    TRIM(p_name),
    p_email,
    p_phone,
    'active',
    NOW(),
    NOW()
  )
  RETURNING * INTO v_org;
  
  -- Add user as owner
  INSERT INTO public.org_members (
    org_id,
    user_id,
    role,
    status,
    joined_at,
    created_at
  ) VALUES (
    v_org.id,
    v_user_id::text,
    'owner',
    'active',
    NOW(),
    NOW()
  );
  
  -- Log success
  RAISE NOTICE 'Organization created successfully: % (ID: %)', v_org.name, v_org.id;
  
  RETURN v_org;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details for debugging
    RAISE NOTICE 'Error creating organization: % - %', SQLSTATE, SQLERRM;
    -- Re-raise the exception
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_organization(TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.create_organization IS 
  'Creates a new organization and adds the current user as owner. Each user can only belong to one active organization.';

-- Test the function is created
SELECT 
  'Function created successfully:' as status,
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'create_organization';
