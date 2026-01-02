-- Add RLS policy to allow public read access to suppliers for marketplace
-- This is public directory data visible to all authenticated users

CREATE POLICY "suppliers_select_all" ON public.suppliers
  FOR SELECT
  USING (true);