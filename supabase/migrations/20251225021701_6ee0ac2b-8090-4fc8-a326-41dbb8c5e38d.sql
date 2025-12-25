
-- Add SELECT RLS policies for orders table

-- Users can view orders they created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname = 'orders_select_own'
  ) THEN
    CREATE POLICY orders_select_own
    ON public.orders
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Supplier org members can view orders for their org
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
      AND policyname = 'orders_select_supplier_org'
  ) THEN
    CREATE POLICY orders_select_supplier_org
    ON public.orders
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.org_members m
        JOIN public.suppliers s ON s.org_id = m.org_id
        WHERE m.user_id = public.current_sub()
          AND s.org_id = orders.supplier_id
          AND m.status = 'active'
      )
    );
  END IF;
END $$;
