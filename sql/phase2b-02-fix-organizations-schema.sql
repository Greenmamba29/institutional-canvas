-- ============================================================================
-- PHASE 2B: FIX ORGANIZATIONS TABLE SCHEMA
-- ============================================================================
-- Add missing columns if needed (idempotent - safe to re-run)
-- ============================================================================

-- Add email column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'organizations' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN email TEXT;
    RAISE NOTICE 'Added email column to organizations';
  ELSE
    RAISE NOTICE 'Email column already exists';
  END IF;
END $$;

-- Add updated_at column if missing  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'organizations' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column to organizations';
  ELSE
    RAISE NOTICE 'Updated_at column already exists';
  END IF;
END $$;

-- Add phone column if missing (optional)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'organizations' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN phone TEXT;
    RAISE NOTICE 'Added phone column to organizations';
  ELSE
    RAISE NOTICE 'Phone column already exists';
  END IF;
END $$;

-- Create trigger to auto-update updated_at column
DROP TRIGGER IF EXISTS set_updated_at ON public.organizations;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Verify the changes
SELECT 
  'Organizations table columns:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizations'
ORDER BY ordinal_position;
