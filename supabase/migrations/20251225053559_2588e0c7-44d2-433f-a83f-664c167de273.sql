-- =============================================================
-- PHASE 1: Add org_id columns and create security functions
-- =============================================================

-- Add org_id to tables (some already have it from existing schema)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.telebuy_sessions ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_org_id ON public.orders(org_id);
CREATE INDEX IF NOT EXISTS idx_quotes_org_id ON public.quotes(org_id);
CREATE INDEX IF NOT EXISTS idx_products_org_id ON public.products(org_id);
CREATE INDEX IF NOT EXISTS idx_chats_org_id ON public.chats(org_id);
CREATE INDEX IF NOT EXISTS idx_files_org_id ON public.files(org_id);
CREATE INDEX IF NOT EXISTS idx_folders_org_id ON public.folders(org_id);
CREATE INDEX IF NOT EXISTS idx_telebuy_sessions_org_id ON public.telebuy_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_conversations_org_id ON public.conversations(org_id);
CREATE INDEX IF NOT EXISTS idx_messages_org_id ON public.messages(org_id);

-- Security Definer Functions
CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN p_org_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = p_org_id
        AND user_id = public.current_sub()
        AND status = 'active'
    )
  END
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(p_org_id uuid, p_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN p_org_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_id = p_org_id
        AND user_id = public.current_sub()
        AND role = p_role
        AND status = 'active'
    )
  END
$$;