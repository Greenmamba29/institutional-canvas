-- ============================================
-- MVP Gap Analysis: Phase 1 Database Schema (Fixed)
-- ============================================

-- 1. USER FOLLOWS TABLE (for messaging gating)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  following_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE(follower_org_id, following_org_id)
);

-- Index for efficient follow lookups
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_org_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_org_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_status ON public.user_follows(status);

-- RLS for user_follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own follows"
ON public.user_follows FOR SELECT
USING (
  follower_org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  OR following_org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create follows from their org"
ON public.user_follows FOR INSERT
WITH CHECK (
  follower_org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update follows to their org"
ON public.user_follows FOR UPDATE
USING (
  following_org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their own follows"
ON public.user_follows FOR DELETE
USING (
  follower_org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
);

-- 2. DM CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.dm_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_a_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  org_b_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_a_id, org_b_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_conversations_org_a ON public.dm_conversations(org_a_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_org_b ON public.dm_conversations(org_b_id);
CREATE INDEX IF NOT EXISTS idx_dm_conversations_last_message ON public.dm_conversations(last_message_at DESC);

ALTER TABLE public.dm_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
ON public.dm_conversations FOR SELECT
USING (
  org_a_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  OR org_b_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
);

CREATE POLICY "Users can create conversations for their org"
ON public.dm_conversations FOR INSERT
WITH CHECK (
  org_a_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  OR org_b_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
);

-- 3. DIRECT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.dm_conversations(id) ON DELETE CASCADE,
  sender_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attachments JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON public.direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON public.direct_messages(sender_org_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON public.direct_messages(created_at DESC);

ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM public.dm_conversations 
    WHERE org_a_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
       OR org_b_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages from their org"
ON public.direct_messages FOR INSERT
WITH CHECK (
  sender_org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  AND sender_user_id = auth.uid()
);

CREATE POLICY "Users can update their own messages"
ON public.direct_messages FOR UPDATE
USING (sender_user_id = auth.uid());

-- 4. TELEBUY VIDEO PROVIDER COLUMNS
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'telebuy_sessions' 
    AND column_name = 'video_provider'
  ) THEN
    ALTER TABLE public.telebuy_sessions 
    ADD COLUMN video_provider TEXT NOT NULL DEFAULT 'google_meet';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'telebuy_sessions' 
    AND column_name = 'google_meet_link'
  ) THEN
    ALTER TABLE public.telebuy_sessions 
    ADD COLUMN google_meet_link TEXT;
  END IF;
END $$;

-- Add constraint for video_provider values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'telebuy_sessions_video_provider_check'
  ) THEN
    ALTER TABLE public.telebuy_sessions
    ADD CONSTRAINT telebuy_sessions_video_provider_check
    CHECK (video_provider IN ('google_meet', 'daily_co'));
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. APP ROLES ENUM AND USER_ROLES TABLE (Security)
-- ============================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- Only admins can manage roles (via has_role function)
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- 6. HAS_ROLE SECURITY DEFINER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 7. GET USER ORG ROLE RPC FUNCTION (Fixed - subscriptions uses user_id not org_id)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_org_role(p_user_id UUID DEFAULT NULL, p_org_id UUID DEFAULT NULL)
RETURNS TABLE(
  org_id UUID,
  org_type TEXT,
  org_name TEXT,
  member_role TEXT,
  subscription_tier TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    o.id as org_id,
    o.org_type,
    o.name as org_name,
    om.role as member_role,
    COALESCE(s.status, 'free') as subscription_tier
  FROM public.organizations o
  JOIN public.org_members om ON om.org_id = o.id
  LEFT JOIN public.subscriptions s ON s.user_id = om.user_id AND s.status = 'active'
  WHERE 
    om.user_id = COALESCE(p_user_id, auth.uid())
    AND (p_org_id IS NULL OR o.id = p_org_id)
$$;

-- 8. CHECK MUTUAL FOLLOW RPC (for messaging gate)
-- ============================================
CREATE OR REPLACE FUNCTION public.check_mutual_follow(p_org_a UUID, p_org_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_follows f1
    JOIN public.user_follows f2 
      ON f1.follower_org_id = f2.following_org_id 
      AND f1.following_org_id = f2.follower_org_id
    WHERE f1.follower_org_id = p_org_a 
      AND f1.following_org_id = p_org_b
      AND f1.status = 'accepted'
      AND f2.status = 'accepted'
  )
$$;

-- 9. CREATE/GET CONVERSATION RPC (validates mutual follow)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_other_org_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_my_org_id UUID;
  v_conversation_id UUID;
  v_can_message BOOLEAN;
BEGIN
  -- Get caller's org
  SELECT org_id INTO v_my_org_id
  FROM public.org_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  IF v_my_org_id IS NULL THEN
    RAISE EXCEPTION 'User not in any organization';
  END IF;
  
  -- Check mutual follow
  SELECT public.check_mutual_follow(v_my_org_id, p_other_org_id) INTO v_can_message;
  
  IF NOT v_can_message THEN
    RAISE EXCEPTION 'Messaging requires mutual follow acceptance';
  END IF;
  
  -- Find existing conversation (check both orderings)
  SELECT id INTO v_conversation_id
  FROM public.dm_conversations
  WHERE (org_a_id = v_my_org_id AND org_b_id = p_other_org_id)
     OR (org_a_id = p_other_org_id AND org_b_id = v_my_org_id)
  LIMIT 1;
  
  -- Create if not exists
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.dm_conversations (org_a_id, org_b_id)
    VALUES (LEAST(v_my_org_id, p_other_org_id), GREATEST(v_my_org_id, p_other_org_id))
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$;

-- 10. SEND MESSAGE RPC (validates mutual follow)
-- ============================================
CREATE OR REPLACE FUNCTION public.send_direct_message(
  p_conversation_id UUID,
  p_content TEXT,
  p_attachments JSONB DEFAULT '[]'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_my_org_id UUID;
  v_other_org_id UUID;
  v_message_id UUID;
  v_can_message BOOLEAN;
BEGIN
  -- Get caller's org
  SELECT org_id INTO v_my_org_id
  FROM public.org_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  IF v_my_org_id IS NULL THEN
    RAISE EXCEPTION 'User not in any organization';
  END IF;
  
  -- Get other org from conversation
  SELECT CASE 
    WHEN org_a_id = v_my_org_id THEN org_b_id 
    ELSE org_a_id 
  END INTO v_other_org_id
  FROM public.dm_conversations
  WHERE id = p_conversation_id
    AND (org_a_id = v_my_org_id OR org_b_id = v_my_org_id);
    
  IF v_other_org_id IS NULL THEN
    RAISE EXCEPTION 'Conversation not found or access denied';
  END IF;
  
  -- Verify mutual follow still valid
  SELECT public.check_mutual_follow(v_my_org_id, v_other_org_id) INTO v_can_message;
  
  IF NOT v_can_message THEN
    RAISE EXCEPTION 'Messaging requires mutual follow acceptance';
  END IF;
  
  -- Insert message
  INSERT INTO public.direct_messages (conversation_id, sender_org_id, sender_user_id, content, attachments)
  VALUES (p_conversation_id, v_my_org_id, auth.uid(), p_content, p_attachments)
  RETURNING id INTO v_message_id;
  
  -- Update conversation last_message_at
  UPDATE public.dm_conversations
  SET last_message_at = NOW()
  WHERE id = p_conversation_id;
  
  RETURN v_message_id;
END;
$$;

-- 11. FOLLOW ORG RPC
-- ============================================
CREATE OR REPLACE FUNCTION public.follow_org(p_target_org_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_my_org_id UUID;
  v_follow_id UUID;
BEGIN
  -- Get caller's org
  SELECT org_id INTO v_my_org_id
  FROM public.org_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  IF v_my_org_id IS NULL THEN
    RAISE EXCEPTION 'User not in any organization';
  END IF;
  
  IF v_my_org_id = p_target_org_id THEN
    RAISE EXCEPTION 'Cannot follow your own organization';
  END IF;
  
  -- Insert or update follow
  INSERT INTO public.user_follows (follower_org_id, following_org_id, status)
  VALUES (v_my_org_id, p_target_org_id, 'pending')
  ON CONFLICT (follower_org_id, following_org_id) 
  DO UPDATE SET status = 'pending', created_at = NOW()
  RETURNING id INTO v_follow_id;
  
  RETURN v_follow_id;
END;
$$;

-- 12. ACCEPT/DECLINE FOLLOW RPC
-- ============================================
CREATE OR REPLACE FUNCTION public.respond_to_follow(p_follow_id UUID, p_accept BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_my_org_id UUID;
BEGIN
  -- Get caller's org
  SELECT org_id INTO v_my_org_id
  FROM public.org_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  -- Update the follow request (only if this org is the target)
  UPDATE public.user_follows
  SET 
    status = CASE WHEN p_accept THEN 'accepted' ELSE 'blocked' END,
    accepted_at = CASE WHEN p_accept THEN NOW() ELSE NULL END
  WHERE id = p_follow_id
    AND following_org_id = v_my_org_id
    AND status = 'pending';
    
  RETURN FOUND;
END;
$$;

-- 13. GET FOLLOW STATUS RPC
-- ============================================
CREATE OR REPLACE FUNCTION public.get_follow_status(p_target_org_id UUID)
RETURNS TABLE(
  i_follow_them BOOLEAN,
  they_follow_me BOOLEAN,
  my_follow_status TEXT,
  their_follow_status TEXT,
  can_message BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_my_org_id UUID;
  v_my_follow_status TEXT;
  v_their_follow_status TEXT;
BEGIN
  -- Get caller's org
  SELECT org_id INTO v_my_org_id
  FROM public.org_members
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  IF v_my_org_id IS NULL THEN
    RETURN QUERY SELECT false, false, NULL::TEXT, NULL::TEXT, false;
    RETURN;
  END IF;
  
  -- Get my follow status to them
  SELECT status INTO v_my_follow_status
  FROM public.user_follows
  WHERE follower_org_id = v_my_org_id AND following_org_id = p_target_org_id;
  
  -- Get their follow status to me
  SELECT status INTO v_their_follow_status
  FROM public.user_follows
  WHERE follower_org_id = p_target_org_id AND following_org_id = v_my_org_id;
  
  RETURN QUERY SELECT 
    v_my_follow_status IS NOT NULL,
    v_their_follow_status IS NOT NULL,
    v_my_follow_status,
    v_their_follow_status,
    (v_my_follow_status = 'accepted' AND v_their_follow_status = 'accepted');
END;
$$;