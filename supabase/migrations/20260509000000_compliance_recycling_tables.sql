-- collection_sites (public read — directory)
CREATE TABLE IF NOT EXISTS public.collection_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE,
  name text NOT NULL,
  address text,
  partner_type text CHECK (partner_type IN ('rideshare','municipal','corporate','drop_point')),
  capacity_kg numeric(10,2),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','full')),
  org_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.collection_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collection_sites_public_read" ON public.collection_sites FOR SELECT USING (true);
CREATE POLICY "collection_sites_org_write" ON public.collection_sites FOR ALL
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- collection_workers (own org RLS)
CREATE TABLE IF NOT EXISTS public.collection_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE,
  name text NOT NULL,
  partner_id text,
  kyc_status text NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending','approved','rejected')),
  training_status text NOT NULL DEFAULT 'incomplete' CHECK (training_status IN ('incomplete','complete')),
  certifications jsonb DEFAULT '[]',
  pay_rate_usd numeric(8,2),
  org_id uuid,
  active_contracts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.collection_workers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collection_workers_own_org" ON public.collection_workers
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- battery_inventory (own org RLS)
CREATE TABLE IF NOT EXISTS public.battery_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE,
  collection_id uuid,
  battery_type text NOT NULL,
  chemistry text,
  weight_kg numeric(8,3),
  state_of_charge numeric(5,2),
  status text NOT NULL DEFAULT 'collected' CHECK (status IN ('collected','in_transit','at_processor','processed','sold')),
  location_id uuid REFERENCES public.collection_sites(id) ON DELETE SET NULL,
  org_id uuid,
  collected_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.battery_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "battery_inventory_own_org" ON public.battery_inventory
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- chain_of_custody (own org RLS)
CREATE TABLE IF NOT EXISTS public.chain_of_custody (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE,
  inventory_id uuid REFERENCES public.battery_inventory(id) ON DELETE CASCADE,
  previous_owner uuid,
  new_owner uuid,
  transfer_time timestamptz NOT NULL DEFAULT now(),
  transport_mode text CHECK (transport_mode IN ('rideshare','courier','truck','rail')),
  condition text,
  evidence_url text,
  signature_hash text,
  org_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chain_of_custody ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chain_of_custody_own_org" ON public.chain_of_custody
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- processing_orders (own org RLS)
CREATE TABLE IF NOT EXISTS public.processing_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE,
  inventory_id uuid REFERENCES public.battery_inventory(id) ON DELETE SET NULL,
  processor_id uuid,
  processing_method text,
  processed_output text,
  output_weight_kg numeric(8,3),
  output_value_usd numeric(12,2),
  processing_date timestamptz,
  org_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.processing_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "processing_orders_own_org" ON public.processing_orders
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

-- compliance_audit_logs (own org RLS)
CREATE TABLE IF NOT EXISTS public.compliance_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id text UNIQUE,
  entity_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('battery','collection','chain_of_custody','processing_order','worker')),
  action text NOT NULL,
  performed_by uuid,
  compliance_result text CHECK (compliance_result IN ('pass','fail','warning','pending')),
  regulation_refs text[],
  notes text,
  org_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.compliance_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compliance_audit_logs_own_org" ON public.compliance_audit_logs
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));
