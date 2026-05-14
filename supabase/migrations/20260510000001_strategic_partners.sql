-- =====================================================
-- Strategic Partners CRM
-- Admin-only table for outreach pipeline tracking.
-- Seeded with 25 companies from the LithiumBuy
-- Strategic Intelligence Brief (May 2026).
-- =====================================================

create table if not exists public.strategic_partners (
  id                 uuid primary key default gen_random_uuid(),
  airtable_id        text unique,
  organization_name  text not null,
  partner_tier       text,
  segment            text,
  revenue_streams    text[],
  outreach_status    text default 'Not Started',
  priority_score     integer,
  contact_name       text,
  contact_email      text,
  linkedin_url       text,
  website            text,
  country            text,
  hq_city            text,
  key_opportunity    text,
  next_action        text,
  next_action_date   date,
  last_contact_date  date,
  notes              text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create or replace function public.set_strategic_partners_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger strategic_partners_updated_at
  before update on public.strategic_partners
  for each row execute function public.set_strategic_partners_updated_at();

alter table public.strategic_partners enable row level security;

create policy "service role full access strategic_partners"
  on public.strategic_partners for all to service_role
  using (true) with check (true);

create policy "super admins can read strategic_partners"
  on public.strategic_partners for select
  using (auth.uid() in (select user_id from public.super_admins));

create policy "super admins can write strategic_partners"
  on public.strategic_partners for all
  using (auth.uid() in (select user_id from public.super_admins))
  with check (auth.uid() in (select user_id from public.super_admins));

create index strategic_partners_tier_idx    on public.strategic_partners(partner_tier);
create index strategic_partners_status_idx  on public.strategic_partners(outreach_status);
create index strategic_partners_segment_idx on public.strategic_partners(segment);

-- ─── Seed: Tier 1 — High Priority ───────────────────────────────────────────

insert into public.strategic_partners
  (organization_name, partner_tier, segment, revenue_streams, outreach_status, priority_score,
   website, country, hq_city, key_opportunity, next_action, next_action_date)
values
  ('Li-Cycle Holdings', 'Tier 1 — High Priority', 'Battery Recycler',
   array['Matchmaking','Black Mass Exchange','Procurement Intelligence'],
   'Not Started', 5, 'https://li-cycle.com', 'USA / Canada', 'Rochester, NY',
   'North America''s largest Li-ion battery recycler. Black Mass Exchange anchor partner — spoke-and-hub black mass output directly connected to downstream refiners via LithiumBuy.',
   'LinkedIn outreach to VP Commercial Operations', '2026-05-14'),

  ('Redwood Materials', 'Tier 1 — High Priority', 'Battery Recycler',
   array['Matchmaking','Black Mass Exchange','Supplier Verification'],
   'Researching', 5, 'https://redwoodmaterials.com', 'USA', 'Carson City, NV',
   'JB Straubel closed-loop recycling. Scaling domestic anode/cathode precursor production. Raised $1B+. Procurement partnership for upstream feedstock sourcing.',
   'Identify VP Business Development — research procurement structure', '2026-05-13'),

  ('Ascend Elements', 'Tier 1 — High Priority', 'Battery Recycler',
   array['Matchmaking','Supplier Verification','Compliance Automation','Grant Consortium Matching'],
   'Not Started', 5, 'https://ascendelements.com', 'USA', 'Westborough, MA',
   'Hydro-to-Cathode direct precursor synthesis. DOE $480M grant recipient (Hopkinsville KY). Position LithiumBuy as consortium matchmaking partner for DOE follow-on rounds.',
   'LinkedIn outreach to Chief Commercial Officer', '2026-05-15'),

  ('Cirba Solutions', 'Tier 1 — High Priority', 'Battery Recycler',
   array['Black Mass Exchange','Matchmaking','Compliance Automation'],
   'Not Started', 4, 'https://cirbasolutions.com', 'USA', 'Anaheim, CA',
   'Largest end-of-life battery management provider in North America. 150,000 MT/year processing capacity. Direct integration into LithiumBuy Black Mass Exchange pricing intelligence.',
   'Email VP Commercial — Black Mass Exchange intro', '2026-05-16'),

  ('Syrah Resources', 'Tier 1 — High Priority', 'Graphite Processor',
   array['Matchmaking','Procurement Intelligence','Supplier Verification'],
   'Not Started', 5, 'https://syrahresources.com.au', 'Australia', 'Melbourne (Vidalia, LA facility)',
   'World''s largest natural graphite deposit (Balama). Only non-China AAM producer in the USA (Vidalia, LA). Critical FEOC-compliant graphite — connect with US anode manufacturers.',
   'Outreach to Head of Sales AAM division — FEOC compliance angle', '2026-05-14'),

  ('Novonix', 'Tier 1 — High Priority', 'Graphite Processor',
   array['Matchmaking','Supplier Verification','Grant Consortium Matching'],
   'Not Started', 4, 'https://novonix.com', 'USA', 'Nashville, TN',
   'Synthetic graphite manufacturer with ALTAIR purification. DOE $103M grant recipient. FEOC-compliant synthetic graphite for US battery supply chain.',
   'LinkedIn outreach to VP Sales — DOE grant consortium angle', '2026-05-17'),

  ('Anovion Technologies', 'Tier 1 — High Priority', 'Graphite Processor',
   array['Matchmaking','Grant Consortium Matching','Supplier Verification'],
   'Not Started', 4, 'https://anovion.com', 'USA', 'Deerfield Beach, FL',
   'Synthetic graphite anode producer backed by $150M DOE grant. Partnership for DOE consortium coordination, subcontractor sourcing, and downstream buyer matching.',
   'Email Chief Revenue Officer — DOE subcontractor matchmaking pitch', '2026-05-19'),

  ('Piedmont Lithium', 'Tier 1 — High Priority', 'Lithium Refiner',
   array['Matchmaking','Procurement Intelligence','Supplier Verification'],
   'Not Started', 5, 'https://piedmontlithium.com', 'USA', 'Belmont, NC',
   'Domestic lithium hydroxide with Tesla offtake. DOE loan applicant for Carolina Lithium project. LithiumBuy procurement intelligence layer — connect with battery cell manufacturers.',
   'LinkedIn outreach to VP Commercial Development', '2026-05-14'),

  ('Standard Lithium', 'Tier 1 — High Priority', 'Lithium Refiner',
   array['Matchmaking','Procurement Intelligence','RFQ Generation'],
   'Not Started', 4, 'https://standardlithium.com', 'Canada', 'Vancouver, BC',
   'Direct lithium extraction (DLE) from Arkansas brine with LANXESS partnership. 30,000 tpa LiOH target. Connect with downstream US battery manufacturers.',
   'LinkedIn outreach to VP Business Development', '2026-05-20'),

  ('Sila Nanotechnologies', 'Tier 1 — High Priority', 'Anode Manufacturer',
   array['Matchmaking','Supplier Verification','Procurement Intelligence'],
   'Researching', 5, 'https://silanano.com', 'USA', 'Alameda, CA',
   'Silicon anode technology with 20-40% energy density improvement. BMW and Mercedes partnerships. $375M raised. Matchmake with silicon/graphite feedstock suppliers and cell manufacturers.',
   'Research VP Commercial contact via LinkedIn', '2026-05-16'),

  ('Group14 Technologies', 'Tier 1 — High Priority', 'Anode Manufacturer',
   array['Matchmaking','Grant Consortium Matching','Supplier Verification'],
   'Not Started', 4, 'https://group14.technology', 'USA', 'Woodinville, WA',
   'Silicon-carbon composite anode (SCC55). DOE grant recipient with Microsoft investment. Partnership for graphite/silicon feedstock supplier matching and DOE consortium coordination.',
   'Email VP Partnerships — feedstock supplier matching opportunity', '2026-05-21'),

  ('ACE Green Recycling', 'Tier 1 — High Priority', 'Black Mass Trader',
   array['Black Mass Exchange','Matchmaking','Compliance Automation'],
   'Not Started', 4, 'https://acegreenrecycling.com', 'USA', 'Dallas, TX',
   'Modular black mass processing plants deployable across US and Southeast Asia. Anchor partner for LithiumBuy Black Mass Exchange — pricing intelligence, logistics, compliance tracking.',
   'LinkedIn outreach to CEO — Black Mass Exchange anchor partner pitch', '2026-05-15'),

  ('Westwater Resources', 'Tier 1 — High Priority', 'Graphite Processor',
   array['Matchmaking','Supplier Verification','Procurement Intelligence'],
   'Not Started', 3, 'https://westwaterresources.net', 'USA', 'Tuscaloosa, AL',
   'Alabama Graphite Products — FEOC-compliant natural graphite purification. Processing US domestic graphite for battery anode supply chain.',
   'Email VP Sales — FEOC-compliant sourcing positioning', '2026-05-22'),

-- ─── Seed: Tier 2 — Medium Priority ─────────────────────────────────────────

  ('California Energy Commission', 'Tier 2 — Medium Priority', 'State Energy Office',
   array['Grant Consortium Matching','Procurement Intelligence'],
   'Researching', 4, 'https://energy.ca.gov', 'USA', 'Sacramento, CA',
   '$1.5B EPIC program for clean energy R&D. CA-funded battery supply chain grants active. LithiumBuy as compliance and procurement partner for state-funded battery projects.',
   'Research program officer for battery storage and critical materials', '2026-05-17'),

  ('NYSERDA', 'Tier 2 — Medium Priority', 'State Energy Office',
   array['Grant Consortium Matching','Matchmaking'],
   'Not Started', 4, 'https://nyserda.ny.gov', 'USA', 'Albany, NY',
   'NY Battery Storage roadmap: 6GW by 2030. Active supply chain development grants. Consortium partner for battery material procurement and supplier qualification.',
   'LinkedIn outreach to Director of Clean Transportation & Energy Storage', '2026-05-19'),

  ('Argonne National Laboratory', 'Tier 2 — Medium Priority', 'University / National Lab',
   array['Grant Consortium Matching','Supplier Verification','Compliance Automation'],
   'Not Started', 5, 'https://anl.gov', 'USA', 'Lemont, IL',
   'DOE ReCell Center — national battery recycling R&D hub. Multiple active consortium grants. Position LithiumBuy as commercialization/procurement partner for lab spinouts.',
   'Contact Technology Commercialization & Partnerships office', '2026-05-15'),

  ('Oak Ridge National Laboratory', 'Tier 2 — Medium Priority', 'University / National Lab',
   array['Grant Consortium Matching','Compliance Automation','Supplier Verification'],
   'Not Started', 4, 'https://ornl.gov', 'USA', 'Oak Ridge, TN',
   'Battery manufacturing R&D and Manufacturing Demonstration Facility for DOE. Partnership for supply chain intelligence and commercialization support for spinout companies.',
   'Email Technology Transfer Office — commercialization partnership', '2026-05-20'),

  ('Pacific Northwest National Laboratory', 'Tier 2 — Medium Priority', 'University / National Lab',
   array['Grant Consortium Matching','Compliance Automation','Supplier Verification'],
   'Not Started', 3, 'https://pnnl.gov', 'USA', 'Richland, WA',
   'Battery500 consortium lead. Grid energy storage R&D. Partnership for supply chain compliance tools and sourcing workflows for spinout companies.',
   'Reach out to Technology Commercialization office', '2026-05-23'),

  ('Michigan Economic Development Corporation', 'Tier 2 — Medium Priority', 'State Energy Office',
   array['Grant Consortium Matching','Matchmaking','Procurement Intelligence'],
   'Not Started', 4, 'https://michiganbusiness.org', 'USA', 'Lansing, MI',
   'Michigan is the largest US EV battery manufacturing hub: Ford BlueOval SK, GM Ultium, Samsung SDI. MEDC as ecosystem partner for supply chain development.',
   'LinkedIn outreach to Director of Energy & Mobility', '2026-05-18'),

  ('University of Michigan Battery Lab', 'Tier 2 — Medium Priority', 'University / National Lab',
   array['Grant Consortium Matching','Compliance Automation'],
   'Not Started', 3, 'https://batterycenter.umich.edu', 'USA', 'Ann Arbor, MI',
   'DOE-funded Battery Readiness Center. Commercialization pipeline for next-gen battery materials. LithiumBuy as consortium partner for grant applications and market access.',
   'Email Director of Research Partnerships', '2026-05-22'),

-- ─── Seed: Tier 3 — Long Horizon ─────────────────────────────────────────────

  ('Amazon Web Services (Sustainability)', 'Tier 3 — Long Horizon', 'Hyperscaler / Data Center',
   array['Procurement Intelligence','Matchmaking','Sourcing Workflow'],
   'Not Started', 3, 'https://sustainability.aboutamazon.com', 'USA', 'Seattle, WA',
   'Deploying massive battery storage for data centers under Climate Pledge. Second-life battery procurement opportunity. LithiumBuy sourcing and traceability tools for hyperscale procurement.',
   'Research Amazon Energy storage procurement team contacts', '2026-05-25'),

  ('Google (Alphabet) Energy', 'Tier 3 — Long Horizon', 'Hyperscaler / Data Center',
   array['Procurement Intelligence','Compliance Automation','Sourcing Workflow'],
   'Not Started', 3, 'https://sustainability.google', 'USA', 'Mountain View, CA',
   'Google 24/7 carbon-free energy — battery storage at datacenter scale. Battery traceability and FEOC compliance directly relevant as ESG reporting tightens.',
   'LinkedIn research on Google Energy storage team', '2026-05-26'),

  ('Fluence Energy', 'Tier 3 — Long Horizon', 'Grid Storage Operator',
   array['Procurement Intelligence','Matchmaking','Sourcing Workflow','RFQ Generation'],
   'Not Started', 4, 'https://fluenceenergy.com', 'USA', 'Arlington, VA',
   'AES/Siemens JV — global grid-scale battery storage. Massive cell procurement at scale. LithiumBuy procurement intelligence, supplier matching, RFQ generation, and FEOC risk scoring.',
   'LinkedIn outreach to VP Supply Chain', '2026-05-20'),

  ('BAE Systems', 'Tier 3 — Long Horizon', 'Defense Supplier',
   array['Supplier Verification','Compliance Automation','Matchmaking'],
   'Not Started', 3, 'https://baesystems.com', 'UK', 'London (US HQ: Falls Church, VA)',
   'Defense-grade battery procurement for submarines, vehicles, and aircraft. FEOC compliance is contractually mandated for DoD suppliers. LithiumBuy supplier verification and FEOC risk scoring.',
   'Research US BAE Systems Electronic Systems procurement contacts', '2026-05-28'),

  ('L3Harris Technologies', 'Tier 3 — Long Horizon', 'Defense Supplier',
   array['Supplier Verification','Compliance Automation','Procurement Intelligence'],
   'Not Started', 3, 'https://l3harris.com', 'USA', 'Melbourne, FL',
   'Defense electronics and battery power systems. DoD NDAA battery supply chain compliance requirements. FEOC risk scoring and supplier verification as pre-bid compliance tool.',
   'Research L3Harris battery/power systems procurement contacts', '2026-05-27');
