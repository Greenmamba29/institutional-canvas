-- Enable RLS and add restrictive policies for unused tables
-- These tables are empty and not referenced in application code

-- 1. bounties table
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bounties_select_authenticated"
ON public.bounties
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "bounties_insert_authenticated"
ON public.bounties
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "bounties_update_own"
ON public.bounties
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "bounties_delete_own"
ON public.bounties
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- 2. customer_handoffs table
ALTER TABLE public.customer_handoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_handoffs_select_authenticated"
ON public.customer_handoffs
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "customer_handoffs_insert_authenticated"
ON public.customer_handoffs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "customer_handoffs_update_authenticated"
ON public.customer_handoffs
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL);

CREATE POLICY "customer_handoffs_delete_authenticated"
ON public.customer_handoffs
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- 3. secret_access_log table
ALTER TABLE public.secret_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "secret_access_log_select_own"
ON public.secret_access_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "secret_access_log_insert_own"
ON public.secret_access_log
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- No update/delete for audit logs - immutable
CREATE POLICY "secret_access_log_no_update"
ON public.secret_access_log
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "secret_access_log_no_delete"
ON public.secret_access_log
FOR DELETE
TO authenticated
USING (false);

-- 4. user_authz_cache table
ALTER TABLE public.user_authz_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_authz_cache_select_own"
ON public.user_authz_cache
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_authz_cache_insert_own"
ON public.user_authz_cache
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_authz_cache_update_own"
ON public.user_authz_cache
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "user_authz_cache_delete_own"
ON public.user_authz_cache
FOR DELETE
TO authenticated
USING (user_id = auth.uid());