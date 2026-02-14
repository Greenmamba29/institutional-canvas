-- =========================================
-- Auction Participant Infrastructure: Companies, Contacts, Lot Definitions
-- Extends the existing auctions/auction_bids domain with CRM-grade
-- company and contact (lead) management for the LithiumBuy platform.
-- =========================================

-- =========================================
-- 1) auction_companies
-- =========================================

CREATE TABLE IF NOT EXISTS public.auction_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id),
  company_name TEXT NOT NULL,
  company_website TEXT,
  linkedin_company_url TEXT,
  company_type TEXT NOT NULL CHECK (company_type IN (
    'OEM', 'Cell Maker', 'Miner', 'Refiner', 'Chemical Converter',
    'Broker/Trader', 'Recycler', 'ESS Integrator', 'Utility',
    'Industrial', 'Logistics', 'Other'
  )),
  segment_detail TEXT,
  is_broker BOOLEAN DEFAULT FALSE,
  auction_role TEXT NOT NULL CHECK (auction_role IN ('Buyer', 'Seller', 'Both', 'Broker')),
  country TEXT,
  region TEXT,
  city TEXT,
  stock_ticker TEXT,
  employee_range TEXT,
  annual_revenue_range TEXT,
  primary_lithium_activity TEXT,
  products_of_interest TEXT,
  min_tonnage_per_auction NUMERIC,
  max_tonnage_per_auction NUMERIC,
  preferred_contract_tenor_months INTEGER,
  incoterms TEXT,
  preferred_pricing_basis TEXT,
  credit_rating_tier TEXT CHECK (credit_rating_tier IN ('A', 'B', 'C', 'D')),
  kyc_status TEXT DEFAULT 'Pending' CHECK (kyc_status IN ('Pending', 'Approved', 'Rejected')),
  kyc_last_review_date DATE,
  compliance_risk_flag BOOLEAN DEFAULT FALSE,
  verification_tier TEXT DEFAULT 'basic' CHECK (verification_tier IN (
    'gold', 'silver', 'bronze', 'standard', 'basic', 'kyc', 'lithiumbuy'
  )),
  priority_tier TEXT DEFAULT 'C' CHECK (priority_tier IN ('A', 'B', 'C')),
  notes TEXT,
  source_system TEXT,
  source_url TEXT,
  first_seen_date DATE DEFAULT CURRENT_DATE,
  last_enriched_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================
-- 2) auction_contacts (lead slots)
-- =========================================

CREATE TABLE IF NOT EXISTS public.auction_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.auction_companies(id) ON DELETE CASCADE,
  company_name TEXT,
  contact_full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  job_title TEXT,
  job_function TEXT CHECK (job_function IN (
    'Procurement', 'Trading', 'Sales', 'Treasury', 'Executive',
    'Operations', 'Finance', 'Legal', 'Other'
  )),
  seniority_level TEXT CHECK (seniority_level IN (
    'C-level', 'VP', 'Director', 'Manager', 'IC'
  )),
  department TEXT,
  is_broker_contact BOOLEAN DEFAULT FALSE,
  primary_role_in_auction TEXT CHECK (primary_role_in_auction IN (
    'Buyer', 'Seller', 'Broker', 'Both'
  )),
  work_email TEXT,
  work_phone TEXT,
  linkedin_profile_url TEXT,
  location_city TEXT,
  location_country TEXT,
  timezone TEXT,
  language TEXT DEFAULT 'EN',
  activity_status TEXT DEFAULT 'Active' CHECK (activity_status IN (
    'Active', 'Moved', 'Bounced', 'Retired'
  )),
  lead_status TEXT DEFAULT 'New' CHECK (lead_status IN (
    'New', 'Working', 'Qualified', 'Nurture', 'Disqualified', 'Customer'
  )),
  lead_source TEXT,
  lead_owner TEXT,
  lead_score INTEGER DEFAULT 0,
  do_not_contact BOOLEAN DEFAULT FALSE,
  gdpr_opt_in BOOLEAN DEFAULT FALSE,
  do_not_call BOOLEAN DEFAULT FALSE,
  last_contact_date DATE,
  last_contact_channel TEXT,
  next_action_date DATE,
  next_action_type TEXT,
  broker_desk TEXT,
  coverage_region TEXT,
  coverage_products TEXT,
  notes TEXT,
  source_system TEXT,
  source_record_id TEXT,
  first_seen_date DATE DEFAULT CURRENT_DATE,
  last_enriched_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================
-- 3) auction_lot_definitions
-- =========================================

CREATE TABLE IF NOT EXISTS public.auction_lot_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID REFERENCES public.auctions(id) ON DELETE CASCADE,
  volume_tonnes NUMERIC,
  grade_specs TEXT,
  product_type TEXT,
  delivery_terms TEXT,
  delivery_location TEXT,
  incoterms TEXT,
  min_bid_increment NUMERIC,
  anti_snipe_minutes INTEGER DEFAULT 2,
  qualification_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =========================================
-- 4) Indexes
-- =========================================

-- auction_companies indexes
CREATE INDEX IF NOT EXISTS auction_companies_company_type_idx
  ON public.auction_companies(company_type);
CREATE INDEX IF NOT EXISTS auction_companies_auction_role_idx
  ON public.auction_companies(auction_role);
CREATE INDEX IF NOT EXISTS auction_companies_country_idx
  ON public.auction_companies(country);
CREATE INDEX IF NOT EXISTS auction_companies_kyc_status_idx
  ON public.auction_companies(kyc_status);
CREATE INDEX IF NOT EXISTS auction_companies_org_id_idx
  ON public.auction_companies(org_id);

-- auction_contacts indexes
CREATE INDEX IF NOT EXISTS auction_contacts_company_id_idx
  ON public.auction_contacts(company_id);
CREATE INDEX IF NOT EXISTS auction_contacts_lead_status_idx
  ON public.auction_contacts(lead_status);
CREATE INDEX IF NOT EXISTS auction_contacts_activity_status_idx
  ON public.auction_contacts(activity_status);

-- auction_lot_definitions indexes
CREATE INDEX IF NOT EXISTS auction_lot_definitions_auction_id_idx
  ON public.auction_lot_definitions(auction_id);

-- =========================================
-- 5) Updated-at triggers
-- =========================================

DO $$ BEGIN
  CREATE TRIGGER trg_auction_companies_updated_at
    BEFORE UPDATE ON public.auction_companies
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_auction_contacts_updated_at
    BEFORE UPDATE ON public.auction_contacts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================
-- 6) RLS
-- =========================================

ALTER TABLE public.auction_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_lot_definitions ENABLE ROW LEVEL SECURITY;

-- auction_companies: readable by any authenticated user
CREATE POLICY auction_companies_select_authenticated
  ON public.auction_companies FOR SELECT
  USING (public.current_sub() IS NOT NULL);

-- auction_contacts: readable by org members only
-- A user can see contacts that belong to a company linked to their org,
-- or contacts that are not linked to any company (orphan leads visible to
-- any authenticated user for marketplace discovery).
CREATE POLICY auction_contacts_select_org_member
  ON public.auction_contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.auction_companies ac
      JOIN public.org_members om ON om.org_id = ac.org_id
      WHERE ac.id = auction_contacts.company_id
        AND om.user_id::text = public.current_sub()
        AND om.status = 'active'
    )
    OR auction_contacts.company_id IS NULL
       AND public.current_sub() IS NOT NULL
  );

-- auction_lot_definitions: readable by any authenticated user
CREATE POLICY auction_lot_definitions_select_authenticated
  ON public.auction_lot_definitions FOR SELECT
  USING (public.current_sub() IS NOT NULL);

-- Lock down direct mutations (writes go through RPCs only)
REVOKE INSERT, UPDATE, DELETE ON public.auction_companies FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.auction_contacts FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.auction_lot_definitions FROM anon, authenticated;

-- =========================================
-- 7) RPC Functions (SECURITY DEFINER)
-- =========================================

-- -----------------------------------------
-- 7a) list_auction_companies
-- -----------------------------------------
CREATE OR REPLACE FUNCTION public.list_auction_companies(
  p_company_type TEXT DEFAULT NULL,
  p_auction_role TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL
)
RETURNS SETOF public.auction_companies
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.auction_companies
  WHERE is_active = TRUE
    AND (p_company_type IS NULL OR company_type = p_company_type)
    AND (p_auction_role IS NULL OR auction_role = p_auction_role)
    AND (p_country IS NULL OR country = p_country)
  ORDER BY company_name ASC;
$$;

-- -----------------------------------------
-- 7b) upsert_auction_company
-- -----------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_auction_company(
  p_id UUID DEFAULT NULL,
  p_company_name TEXT DEFAULT NULL,
  p_company_website TEXT DEFAULT NULL,
  p_linkedin_company_url TEXT DEFAULT NULL,
  p_company_type TEXT DEFAULT NULL,
  p_segment_detail TEXT DEFAULT NULL,
  p_is_broker BOOLEAN DEFAULT FALSE,
  p_auction_role TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_region TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_stock_ticker TEXT DEFAULT NULL,
  p_employee_range TEXT DEFAULT NULL,
  p_annual_revenue_range TEXT DEFAULT NULL,
  p_primary_lithium_activity TEXT DEFAULT NULL,
  p_products_of_interest TEXT DEFAULT NULL,
  p_min_tonnage_per_auction NUMERIC DEFAULT NULL,
  p_max_tonnage_per_auction NUMERIC DEFAULT NULL,
  p_preferred_contract_tenor_months INTEGER DEFAULT NULL,
  p_incoterms TEXT DEFAULT NULL,
  p_preferred_pricing_basis TEXT DEFAULT NULL,
  p_credit_rating_tier TEXT DEFAULT NULL,
  p_kyc_status TEXT DEFAULT 'Pending',
  p_verification_tier TEXT DEFAULT 'basic',
  p_priority_tier TEXT DEFAULT 'C',
  p_notes TEXT DEFAULT NULL,
  p_source_system TEXT DEFAULT NULL,
  p_source_url TEXT DEFAULT NULL
)
RETURNS public.auction_companies
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_sub TEXT := public.current_sub();
  v_org_id UUID;
  v_row public.auction_companies;
BEGIN
  IF v_user_sub IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Resolve the caller's org
  SELECT om.org_id INTO v_org_id
  FROM public.org_members om
  WHERE om.user_id = v_user_sub
    AND om.status = 'active'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User must belong to an organization';
  END IF;

  IF p_company_name IS NULL OR p_company_type IS NULL OR p_auction_role IS NULL THEN
    RAISE EXCEPTION 'company_name, company_type, and auction_role are required';
  END IF;

  IF p_id IS NOT NULL THEN
    -- Update existing
    UPDATE public.auction_companies SET
      company_name                   = COALESCE(p_company_name, company_name),
      company_website                = COALESCE(p_company_website, company_website),
      linkedin_company_url           = COALESCE(p_linkedin_company_url, linkedin_company_url),
      company_type                   = COALESCE(p_company_type, company_type),
      segment_detail                 = COALESCE(p_segment_detail, segment_detail),
      is_broker                      = COALESCE(p_is_broker, is_broker),
      auction_role                   = COALESCE(p_auction_role, auction_role),
      country                        = COALESCE(p_country, country),
      region                         = COALESCE(p_region, region),
      city                           = COALESCE(p_city, city),
      stock_ticker                   = COALESCE(p_stock_ticker, stock_ticker),
      employee_range                 = COALESCE(p_employee_range, employee_range),
      annual_revenue_range           = COALESCE(p_annual_revenue_range, annual_revenue_range),
      primary_lithium_activity       = COALESCE(p_primary_lithium_activity, primary_lithium_activity),
      products_of_interest           = COALESCE(p_products_of_interest, products_of_interest),
      min_tonnage_per_auction        = COALESCE(p_min_tonnage_per_auction, min_tonnage_per_auction),
      max_tonnage_per_auction        = COALESCE(p_max_tonnage_per_auction, max_tonnage_per_auction),
      preferred_contract_tenor_months = COALESCE(p_preferred_contract_tenor_months, preferred_contract_tenor_months),
      incoterms                      = COALESCE(p_incoterms, incoterms),
      preferred_pricing_basis        = COALESCE(p_preferred_pricing_basis, preferred_pricing_basis),
      credit_rating_tier             = COALESCE(p_credit_rating_tier, credit_rating_tier),
      kyc_status                     = COALESCE(p_kyc_status, kyc_status),
      verification_tier              = COALESCE(p_verification_tier, verification_tier),
      priority_tier                  = COALESCE(p_priority_tier, priority_tier),
      notes                          = COALESCE(p_notes, notes),
      source_system                  = COALESCE(p_source_system, source_system),
      source_url                     = COALESCE(p_source_url, source_url),
      last_enriched_date             = CURRENT_DATE
    WHERE id = p_id
    RETURNING * INTO v_row;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Auction company not found: %', p_id;
    END IF;
  ELSE
    -- Insert new
    INSERT INTO public.auction_companies (
      org_id, company_name, company_website, linkedin_company_url,
      company_type, segment_detail, is_broker, auction_role,
      country, region, city, stock_ticker,
      employee_range, annual_revenue_range,
      primary_lithium_activity, products_of_interest,
      min_tonnage_per_auction, max_tonnage_per_auction,
      preferred_contract_tenor_months, incoterms, preferred_pricing_basis,
      credit_rating_tier, kyc_status, verification_tier, priority_tier,
      notes, source_system, source_url
    ) VALUES (
      v_org_id, p_company_name, p_company_website, p_linkedin_company_url,
      p_company_type, p_segment_detail, p_is_broker, p_auction_role,
      p_country, p_region, p_city, p_stock_ticker,
      p_employee_range, p_annual_revenue_range,
      p_primary_lithium_activity, p_products_of_interest,
      p_min_tonnage_per_auction, p_max_tonnage_per_auction,
      p_preferred_contract_tenor_months, p_incoterms, p_preferred_pricing_basis,
      p_credit_rating_tier, p_kyc_status, p_verification_tier, p_priority_tier,
      p_notes, p_source_system, p_source_url
    )
    RETURNING * INTO v_row;
  END IF;

  RETURN v_row;
END;
$$;

-- -----------------------------------------
-- 7c) list_auction_contacts
-- -----------------------------------------
CREATE OR REPLACE FUNCTION public.list_auction_contacts(
  p_company_id UUID DEFAULT NULL,
  p_lead_status TEXT DEFAULT NULL
)
RETURNS SETOF public.auction_contacts
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_sub TEXT := public.current_sub();
  v_org_id UUID;
BEGIN
  IF v_user_sub IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Resolve the caller's org
  SELECT om.org_id INTO v_org_id
  FROM public.org_members om
  WHERE om.user_id = v_user_sub
    AND om.status = 'active'
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User must belong to an organization';
  END IF;

  RETURN QUERY
  SELECT c.*
  FROM public.auction_contacts c
  LEFT JOIN public.auction_companies ac ON ac.id = c.company_id
  WHERE (ac.org_id = v_org_id OR c.company_id IS NULL)
    AND (p_company_id IS NULL OR c.company_id = p_company_id)
    AND (p_lead_status IS NULL OR c.lead_status = p_lead_status)
  ORDER BY c.created_at DESC;
END;
$$;

-- -----------------------------------------
-- 7d) get_auction_lot
-- -----------------------------------------
CREATE OR REPLACE FUNCTION public.get_auction_lot(
  p_auction_id UUID
)
RETURNS SETOF public.auction_lot_definitions
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.auction_lot_definitions
  WHERE auction_id = p_auction_id
  ORDER BY created_at ASC;
$$;

-- =========================================
-- 8) Grant execute on RPCs to authenticated role
-- =========================================

GRANT EXECUTE ON FUNCTION public.list_auction_companies(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_auction_company(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT,
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
  NUMERIC, NUMERIC, INTEGER, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_auction_contacts(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auction_lot(UUID) TO authenticated;
