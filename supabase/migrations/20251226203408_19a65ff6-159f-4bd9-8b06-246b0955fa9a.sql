-- Fix supplier_profiles: Make sensitive contact info private
-- Keep basic profile info publicly viewable for marketplace, but hide contact details

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Supplier profiles are viewable by everyone" ON public.supplier_profiles;

-- Allow viewing profiles only by authenticated users (basic marketplace access)
CREATE POLICY "Authenticated users can view supplier profiles" ON public.supplier_profiles
  FOR SELECT USING (
    public.current_sub() IS NOT NULL
  );

-- Create a public view with limited fields (no sensitive contact info)
DROP VIEW IF EXISTS public.supplier_profiles_public;
CREATE VIEW public.supplier_profiles_public 
WITH (security_invoker = true)
AS
SELECT
  sp.id,
  sp.supplier_id,
  sp.description,
  sp.website,
  sp.specialties,
  sp.created_at
  -- NO contact_email, NO phone - sensitive PII hidden
FROM public.supplier_profiles sp;

GRANT SELECT ON public.supplier_profiles_public TO authenticated;