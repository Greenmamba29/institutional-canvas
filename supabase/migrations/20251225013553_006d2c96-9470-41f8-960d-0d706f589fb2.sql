-- Fix overly permissive RLS on ai_provider_usage table
-- Current policy allows all authenticated users to see all usage data
-- This migration restricts access to user's own data + admin override

-- Drop the overly permissive policy
DROP POLICY IF EXISTS ai_provider_usage_select_all ON public.ai_provider_usage;

-- Create user-scoped policy: users can only see their own AI usage data
CREATE POLICY ai_provider_usage_own_data ON public.ai_provider_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Create admin override policy for platform administrators
CREATE POLICY ai_provider_usage_admin_read ON public.ai_provider_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

COMMENT ON POLICY ai_provider_usage_own_data ON public.ai_provider_usage 
  IS 'Users can only view their own AI provider usage data';
  
COMMENT ON POLICY ai_provider_usage_admin_read ON public.ai_provider_usage 
  IS 'Admins can view all AI provider usage data for platform monitoring';