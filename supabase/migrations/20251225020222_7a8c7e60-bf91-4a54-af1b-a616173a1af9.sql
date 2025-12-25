-- Enable Row Level Security (idempotent)
ALTER TABLE public.telebuy_sessions ENABLE ROW LEVEL SECURITY;

-- Participants can view their TeleBuy sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'telebuy_sessions'
      AND policyname = 'telebuy_sessions_participant_select'
  ) THEN
    CREATE POLICY telebuy_sessions_participant_select
    ON public.telebuy_sessions
    FOR SELECT
    USING (
      -- Session creator (Auth0/Supabase user)
      (public.jwt_user_id() IS NOT NULL AND public.jwt_user_id() = user_id)
      OR
      -- Member of supplier org involved in the session
      EXISTS (
        SELECT 1
        FROM public.org_members m
        WHERE m.org_id = telebuy_sessions.supplier_id
          AND m.user_id = public.current_sub()
          AND m.status = 'active'
      )
    );
  END IF;
END $$;

-- Participants can update their TeleBuy sessions (e.g. status/notes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'telebuy_sessions'
      AND policyname = 'telebuy_sessions_participant_update'
  ) THEN
    CREATE POLICY telebuy_sessions_participant_update
    ON public.telebuy_sessions
    FOR UPDATE
    USING (
      (public.jwt_user_id() IS NOT NULL AND public.jwt_user_id() = user_id)
      OR EXISTS (
        SELECT 1
        FROM public.org_members m
        WHERE m.org_id = telebuy_sessions.supplier_id
          AND m.user_id = public.current_sub()
          AND m.status = 'active'
      )
    )
    WITH CHECK (
      (public.jwt_user_id() IS NOT NULL AND public.jwt_user_id() = user_id)
      OR EXISTS (
        SELECT 1
        FROM public.org_members m
        WHERE m.org_id = telebuy_sessions.supplier_id
          AND m.user_id = public.current_sub()
          AND m.status = 'active'
      )
    );
  END IF;
END $$;

-- Session creator can delete their own sessions (optional but safer than global delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'telebuy_sessions'
      AND policyname = 'telebuy_sessions_creator_delete'
  ) THEN
    CREATE POLICY telebuy_sessions_creator_delete
    ON public.telebuy_sessions
    FOR DELETE
    USING (
      public.jwt_user_id() IS NOT NULL AND public.jwt_user_id() = user_id
    );
  END IF;
END $$;

-- Allow inserts only when the row is owned by the caller (keeps backend/RPC compatible)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'telebuy_sessions'
      AND policyname = 'telebuy_sessions_creator_insert'
  ) THEN
    CREATE POLICY telebuy_sessions_creator_insert
    ON public.telebuy_sessions
    FOR INSERT
    WITH CHECK (
      public.jwt_user_id() IS NOT NULL AND public.jwt_user_id() = user_id
    );
  END IF;
END $$;