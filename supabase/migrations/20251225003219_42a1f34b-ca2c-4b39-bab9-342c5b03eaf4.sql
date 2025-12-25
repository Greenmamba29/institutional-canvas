-- Fix Security Definer View issue by recreating views with SECURITY INVOKER
-- This ensures RLS policies are evaluated using the querying user's permissions

-- Recreate suppliers_public view with SECURITY INVOKER
DROP VIEW IF EXISTS public.suppliers_public;
CREATE VIEW public.suppliers_public
WITH (security_barrier = true, security_invoker = true)
AS
SELECT 
  org_id,
  display_name,
  public_profile,
  verification_tier,
  capabilities
FROM suppliers s;

-- Grant select to authenticated and anon users for marketplace browsing
GRANT SELECT ON public.suppliers_public TO authenticated;
GRANT SELECT ON public.suppliers_public TO anon;

-- Recreate v_job_ops view with SECURITY INVOKER
DROP VIEW IF EXISTS public.v_job_ops;
CREATE VIEW public.v_job_ops
WITH (security_invoker = true)
AS
SELECT 
  job_id,
  user_id,
  started_at,
  finished_at,
  completed_stages,
  failed_stages AS errors,
  COALESCE((metrics ->> 'p95_latency')::numeric, 0::numeric) AS p95_latency_ms,
  COALESCE((metrics ->> 'cost_usd')::numeric, 0::numeric) AS cost_usd,
  created_at,
  updated_at
FROM job_summaries j
ORDER BY finished_at DESC NULLS LAST;

-- Grant select to authenticated users only (job ops is internal)
GRANT SELECT ON public.v_job_ops TO authenticated;

COMMENT ON VIEW public.suppliers_public IS 'Public supplier directory view with security_invoker to respect RLS of querying user';
COMMENT ON VIEW public.v_job_ops IS 'Job operations dashboard view with security_invoker to respect RLS of querying user';