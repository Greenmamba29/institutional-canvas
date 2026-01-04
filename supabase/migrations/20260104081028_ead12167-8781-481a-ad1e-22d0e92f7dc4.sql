-- Add SOE-specific columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS government_id TEXT,
ADD COLUMN IF NOT EXISTS jurisdiction TEXT,
ADD COLUMN IF NOT EXISTS soe_category TEXT,
ADD COLUMN IF NOT EXISTS parent_ministry TEXT;

-- Update create_organization function to support SOE
CREATE OR REPLACE FUNCTION public.create_organization(
  p_org_type text, 
  p_name text, 
  p_email text DEFAULT NULL::text, 
  p_phone text DEFAULT NULL::text,
  p_government_id text DEFAULT NULL::text,
  p_jurisdiction text DEFAULT NULL::text,
  p_soe_category text DEFAULT NULL::text,
  p_parent_ministry text DEFAULT NULL::text
)
 RETURNS organizations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_org public.organizations;
BEGIN
  -- Get authenticated user ID
  v_user_id := auth.uid();
  
  -- Check authentication
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required. Please sign in.'
      USING HINT = 'User must be authenticated to create an organization';
  END IF;
  
  -- Check if user already has an organization
  IF EXISTS (
    SELECT 1 
    FROM public.org_members 
    WHERE user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'User already belongs to an organization'
      USING HINT = 'Each user can only belong to one active organization';
  END IF;
  
  -- Validate org_type (now includes 'soe')
  IF p_org_type IS NULL OR p_org_type NOT IN ('buyer', 'supplier', 'admin', 'soe') THEN
    RAISE EXCEPTION 'Invalid organization type: %', p_org_type
      USING HINT = 'Organization type must be: buyer, supplier, admin, or soe';
  END IF;
  
  -- Validate name
  IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 THEN
    RAISE EXCEPTION 'Organization name is required'
      USING HINT = 'Please provide a valid organization name';
  END IF;
  
  -- For SOE, validate required fields
  IF p_org_type = 'soe' THEN
    IF p_government_id IS NULL OR LENGTH(TRIM(p_government_id)) = 0 THEN
      RAISE EXCEPTION 'Government ID is required for State Owned Entities'
        USING HINT = 'Please provide a valid government registration ID';
    END IF;
    IF p_jurisdiction IS NULL OR LENGTH(TRIM(p_jurisdiction)) = 0 THEN
      RAISE EXCEPTION 'Jurisdiction is required for State Owned Entities'
        USING HINT = 'Please specify the country or jurisdiction';
    END IF;
  END IF;
  
  -- Create organization
  INSERT INTO public.organizations (
    id, org_type, name, email, phone, status, created_at,
    government_id, jurisdiction, soe_category, parent_ministry
  ) VALUES (
    gen_random_uuid(),
    p_org_type,
    TRIM(p_name),
    p_email,
    p_phone,
    'active',
    NOW(),
    CASE WHEN p_org_type = 'soe' THEN TRIM(p_government_id) ELSE NULL END,
    CASE WHEN p_org_type = 'soe' THEN TRIM(p_jurisdiction) ELSE NULL END,
    CASE WHEN p_org_type = 'soe' THEN TRIM(p_soe_category) ELSE NULL END,
    CASE WHEN p_org_type = 'soe' THEN TRIM(p_parent_ministry) ELSE NULL END
  )
  RETURNING * INTO v_org;
  
  -- Add user as owner
  INSERT INTO public.org_members (
    org_id, user_id, role, created_at
  ) VALUES (
    v_org.id,
    v_user_id,
    'owner',
    NOW()
  );
  
  RETURN v_org;
END;
$function$;

-- Add comment for documentation
COMMENT ON COLUMN public.organizations.government_id IS 'Government registration ID for SOE organizations';
COMMENT ON COLUMN public.organizations.jurisdiction IS 'Country/jurisdiction for SOE organizations';
COMMENT ON COLUMN public.organizations.soe_category IS 'Category: mining_authority, energy_ministry, strategic_reserves, development_bank, commodity_board';
COMMENT ON COLUMN public.organizations.parent_ministry IS 'Parent ministry or government body for SOE';