-- Introductions table: tracks buyer-seller introductions and platform intro fees

create table if not exists public.introductions (
  id                  uuid primary key default gen_random_uuid(),
  airtable_id         text unique,
  introduction_id     text,

  -- Parties
  introducer_name     text,
  introducer_email    text,
  introducer_org      text,
  buyer_org           text,
  buyer_contact       text,
  buyer_email         text,
  seller_org          text,
  seller_contact      text,
  seller_email        text,

  -- Deal details
  commodity           text,
  intro_date          date,
  deal_value_usd      numeric(15,2),
  intro_fee_percent   numeric(5,2) default 0.50,
  intro_fee_amount    numeric(15,2) generated always as
                        (deal_value_usd * intro_fee_percent / 100) stored,

  -- Status
  status              text default 'Pending'
                        check (status in ('Pending','Introduced','In Negotiation',
                                          'Deal Closed','Fee Due','Paid Out',
                                          'Expired','Cancelled')),
  payout_status       text default 'Unpaid'
                        check (payout_status in ('Unpaid','Processing','Paid')),
  payout_date         date,

  -- Links
  deal_id             uuid references public.deals(id) on delete set null,
  telebuy_session_id  uuid references public.telebuy_sessions(id) on delete set null,
  org_id              uuid references public.organizations(id) on delete cascade,

  notes               text,
  supabase_id         text,
  synced_at           timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Keep updated_at current
create or replace function public.set_introductions_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger introductions_updated_at
  before update on public.introductions
  for each row execute function public.set_introductions_updated_at();

-- RLS
alter table public.introductions enable row level security;

create policy "org members can read introductions"
  on public.introductions for select
  using (org_id = (select org_id from public.profiles where id = auth.uid()));

create policy "org members can insert introductions"
  on public.introductions for insert
  with check (org_id = (select org_id from public.profiles where id = auth.uid()));

create policy "org members can update introductions"
  on public.introductions for update
  using (org_id = (select org_id from public.profiles where id = auth.uid()));

-- Indexes
create index introductions_org_id_idx      on public.introductions(org_id);
create index introductions_status_idx      on public.introductions(status);
create index introductions_payout_idx      on public.introductions(payout_status);
create index introductions_airtable_id_idx on public.introductions(airtable_id);
