
-- Step 1: Update kyb_verification_queue tier constraint to bronze/silver/gold
-- First drop the old constraint, then add the new one
ALTER TABLE public.kyb_verification_queue
  DROP CONSTRAINT IF EXISTS kyb_verification_queue_verification_tier_check;

ALTER TABLE public.kyb_verification_queue
  ADD CONSTRAINT kyb_verification_queue_verification_tier_check
  CHECK (verification_tier IN ('bronze', 'silver', 'gold'));

-- Add UNIQUE constraint on org_id so each org has one active submission
ALTER TABLE public.kyb_verification_queue
  DROP CONSTRAINT IF EXISTS kyb_verification_queue_org_id_key;

ALTER TABLE public.kyb_verification_queue
  ADD CONSTRAINT kyb_verification_queue_org_id_key UNIQUE (org_id);

-- Step 2: Create kyc_documents table
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyb_queue_id     UUID REFERENCES public.kyb_verification_queue(id) ON DELETE CASCADE,
  org_id           UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_type    TEXT NOT NULL CHECK (document_type IN (
    'passport', 'national_id', 'company_registration', 'tax_certificate',
    'bank_statement', 'proof_of_address', 'esg_certification',
    'product_certification', 'articles_of_incorporation', 'other'
  )),
  file_name        TEXT NOT NULL,
  file_url         TEXT,
  file_size_bytes  BIGINT,
  mime_type        TEXT,
  status           TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN (
    'uploaded', 'under_review', 'accepted', 'rejected'
  )),
  rejection_reason TEXT,
  expires_at       TIMESTAMPTZ,
  uploaded_by      UUID,
  reviewed_by      UUID,
  reviewed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  airtable_id      TEXT
);

ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;

-- Org members can SELECT their own documents
CREATE POLICY "org members can view their kyc documents"
  ON public.kyc_documents FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
    )
  );

-- Org members can INSERT their own documents
CREATE POLICY "org members can insert their kyc documents"
  ON public.kyc_documents FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
    )
  );

-- Step 3: Create api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by    UUID NOT NULL,
  name          TEXT NOT NULL,
  key_hash      TEXT NOT NULL UNIQUE,
  key_prefix    TEXT NOT NULL,
  scopes        TEXT[] NOT NULL DEFAULT '{}',
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at    TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Org members can manage their own org's keys
CREATE POLICY "org members can manage their api keys"
  ON public.api_keys FOR ALL
  USING (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT om.org_id FROM public.org_members om WHERE om.user_id = auth.uid()
    )
  );
