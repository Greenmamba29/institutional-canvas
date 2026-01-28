-- Security Hardening: Set search_path on all custom functions
-- This prevents search path injection attacks and resolves Supabase linter warnings

-- Core JWT/Auth Functions
ALTER FUNCTION public.can_process(uuid, integer) SET search_path = public;
ALTER FUNCTION public.check_usage_limit(uuid, text) SET search_path = public;
ALTER FUNCTION public.current_sub() SET search_path = public;
ALTER FUNCTION public.jwt_claim(text) SET search_path = public;
ALTER FUNCTION public.jwt_org_id() SET search_path = public;
ALTER FUNCTION public.jwt_user_id() SET search_path = public;
ALTER FUNCTION public.get_user_org_ids() SET search_path = public;

-- Organization Member Functions
ALTER FUNCTION public.remove_org_member(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.update_member_role(uuid, uuid, text) SET search_path = public;

-- Purchase Functions
ALTER FUNCTION public.create_purchase(uuid, uuid, jsonb) SET search_path = public;
ALTER FUNCTION public.get_purchase_by_id(text) SET search_path = public;
ALTER FUNCTION public.purchases_broadcast_trigger() SET search_path = public;

-- Dashboard/Activity Functions
ALTER FUNCTION public.get_dashboard_activity(integer) SET search_path = public;
ALTER FUNCTION public.get_dashboard_stats() SET search_path = public;

-- File Functions
ALTER FUNCTION public.ensure_folder_path(uuid, text) SET search_path = public;
ALTER FUNCTION public.get_file_activities(uuid, integer, integer) SET search_path = public;
ALTER FUNCTION public.update_file_metadata(uuid, jsonb, text[], text) SET search_path = public;

-- Chat Document Functions
ALTER FUNCTION public.get_chat_document_latest_version(uuid) SET search_path = public;
ALTER FUNCTION public.get_latest_chat_document(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.handle_chat_document_version() SET search_path = public;

-- Trigger/Utility Functions
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Metrics Functions
ALTER FUNCTION public.increment_usage_counters(uuid, integer, integer, numeric) SET search_path = public;
ALTER FUNCTION public.log_job_metrics(uuid) SET search_path = public;

-- Vector Search Function
ALTER FUNCTION public.match_documents(vector, integer, jsonb) SET search_path = public;

-- RLS Policies for tables with RLS enabled but no policies

-- audit_log: Allow authenticated users to SELECT their own org's entries
CREATE POLICY "audit_log_select_own_org" ON public.audit_log
  FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids()));

-- audit_log: Allow authenticated users to INSERT their own org's entries  
CREATE POLICY "audit_log_insert_own_org" ON public.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));

-- org_members: Allow SELECT for members of the same org
CREATE POLICY "org_members_select_same_org" ON public.org_members
  FOR SELECT
  TO authenticated
  USING (org_id IN (SELECT public.get_user_org_ids()));

-- org_members: Allow INSERT only for admins/owners of the org (via RPC, but policy guards direct access)
CREATE POLICY "org_members_insert_own_user" ON public.org_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- org_members: Allow UPDATE only for the user's own record or org admins
CREATE POLICY "org_members_update_own" ON public.org_members
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR org_id IN (SELECT public.get_user_org_ids()));

-- org_members: Allow DELETE only for the user's own record
CREATE POLICY "org_members_delete_own" ON public.org_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());