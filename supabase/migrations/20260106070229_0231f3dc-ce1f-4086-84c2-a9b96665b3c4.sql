-- Create deal_signatures table for digital signature storage
CREATE TABLE IF NOT EXISTS public.deal_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE CASCADE,
  signer_user_id uuid NOT NULL,
  signer_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  signature_data text, -- Base64 encoded signature image
  signature_type text DEFAULT 'drawn' CHECK (signature_type IN ('drawn', 'typed', 'uploaded')),
  ip_address inet,
  user_agent text,
  signed_at timestamptz NOT NULL DEFAULT now(),
  document_hash text, -- Hash of the document signed
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deal_signatures ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only see signatures for their org's deals
CREATE POLICY "Users can view signatures for their deals"
  ON public.deal_signatures FOR SELECT
  USING (
    signer_org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
    OR deal_id IN (SELECT id FROM public.deals WHERE org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()))
  );

CREATE POLICY "Users can insert signatures for their org"
  ON public.deal_signatures FOR INSERT
  WITH CHECK (
    signer_org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

-- Create RFQ documents table for AI-processed documents
CREATE TABLE IF NOT EXISTS public.rfq_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid REFERENCES public.rfqs(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  document_type text DEFAULT 'specification' CHECK (document_type IN ('specification', 'certificate', 'pricing', 'contract', 'other')),
  ai_summary text,
  ai_extracted_data jsonb DEFAULT '{}',
  ai_processed_at timestamptz,
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rfq_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view RFQ documents for their org"
  ON public.rfq_documents FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert RFQ documents for their org"
  ON public.rfq_documents FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their org's RFQ documents"
  ON public.rfq_documents FOR UPDATE
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

-- Create TeleBuy session transcripts table
CREATE TABLE IF NOT EXISTS public.telebuy_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  transcript_text text,
  ai_summary text,
  ai_action_items jsonb DEFAULT '[]',
  ai_key_points jsonb DEFAULT '[]',
  language text DEFAULT 'en',
  duration_seconds integer,
  speaker_segments jsonb DEFAULT '[]',
  processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telebuy_transcripts ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view transcripts for their org sessions"
  ON public.telebuy_transcripts FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert transcripts for their org"
  ON public.telebuy_transcripts FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update their org's transcripts"
  ON public.telebuy_transcripts FOR UPDATE
  USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

-- Create storage buckets for signatures and RFQ documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('rfq-documents', 'rfq-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('telebuy-assets', 'telebuy-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for signatures bucket
CREATE POLICY "Users can upload signatures for their org"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'signatures' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view signatures they have access to"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'signatures' AND
    auth.uid() IS NOT NULL
  );

-- Storage policies for rfq-documents bucket
CREATE POLICY "Users can upload RFQ documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'rfq-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view RFQ documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'rfq-documents' AND
    auth.uid() IS NOT NULL
  );

-- Storage policies for telebuy-assets bucket (public)
CREATE POLICY "Anyone can view telebuy assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'telebuy-assets');

CREATE POLICY "Authenticated users can upload telebuy assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'telebuy-assets' AND
    auth.uid() IS NOT NULL
  );

-- Create RPC function to add signature
CREATE OR REPLACE FUNCTION public.add_deal_signature(
  p_deal_id uuid DEFAULT NULL,
  p_purchase_id uuid DEFAULT NULL,
  p_signature_data text DEFAULT NULL,
  p_signature_type text DEFAULT 'drawn',
  p_document_hash text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS public.deal_signatures
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_signature public.deal_signatures;
BEGIN
  -- Get user's org_id
  SELECT org_id INTO v_org_id FROM public.org_members WHERE user_id = v_user_id LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User is not a member of any organization';
  END IF;

  INSERT INTO public.deal_signatures (
    deal_id,
    purchase_id,
    signer_user_id,
    signer_org_id,
    signature_data,
    signature_type,
    document_hash,
    metadata
  )
  VALUES (
    p_deal_id,
    p_purchase_id,
    v_user_id,
    v_org_id,
    p_signature_data,
    p_signature_type,
    p_document_hash,
    p_metadata
  )
  RETURNING * INTO v_signature;

  -- Log audit event
  INSERT INTO public.audit_log (user_id, org_id, action, entity_type, entity_id, outcome)
  VALUES (v_user_id, v_org_id, 'sign', 'deal_signature', v_signature.id, 'success');

  RETURN v_signature;
END;
$$;

-- Create RPC function to save transcript with AI processing
CREATE OR REPLACE FUNCTION public.save_telebuy_transcript(
  p_session_id uuid,
  p_transcript_text text,
  p_ai_summary text DEFAULT NULL,
  p_ai_action_items jsonb DEFAULT '[]',
  p_ai_key_points jsonb DEFAULT '[]',
  p_duration_seconds integer DEFAULT NULL,
  p_speaker_segments jsonb DEFAULT '[]'
)
RETURNS public.telebuy_transcripts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_transcript public.telebuy_transcripts;
BEGIN
  -- Get user's org_id
  SELECT org_id INTO v_org_id FROM public.org_members WHERE user_id = v_user_id LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User is not a member of any organization';
  END IF;

  INSERT INTO public.telebuy_transcripts (
    session_id,
    org_id,
    transcript_text,
    ai_summary,
    ai_action_items,
    ai_key_points,
    duration_seconds,
    speaker_segments,
    processing_status
  )
  VALUES (
    p_session_id,
    v_org_id,
    p_transcript_text,
    p_ai_summary,
    p_ai_action_items,
    p_ai_key_points,
    p_duration_seconds,
    p_speaker_segments,
    CASE WHEN p_ai_summary IS NOT NULL THEN 'completed' ELSE 'pending' END
  )
  RETURNING * INTO v_transcript;

  RETURN v_transcript;
END;
$$;