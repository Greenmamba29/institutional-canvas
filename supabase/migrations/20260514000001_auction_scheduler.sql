-- Auction status scheduler
-- Adds scheduled→live transition and pg_cron jobs for both directions.
-- Companion to close_ended_auctions() which handles live→ended (already exists).

-- 1. Function: open auctions whose start time has passed
create or replace function public.open_scheduled_auctions()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.auctions
  set status = 'live'
  where status = 'scheduled'
    and starts_at is not null
    and starts_at <= now();
end;
$$;

-- 2. pg_cron: run both transitions every minute
--    (pg_cron extension was already enabled in a prior migration)
select cron.schedule(
  'open-scheduled-auctions',
  '* * * * *',
  'select public.open_scheduled_auctions()'
);

select cron.schedule(
  'close-ended-auctions',
  '* * * * *',
  'select public.close_ended_auctions()'
);

-- 3. Refresh demo auction dates so the UI always shows live activity
--    Idempotent: updates by title pattern, skips if not found.
update public.auctions
set
  starts_at = now() - interval '2 hours',
  ends_at   = now() + interval '22 hours',
  status    = 'live'
where lower(title) like '%lithium carbonate%'
  and status in ('scheduled', 'live');

update public.auctions
set
  starts_at = now() + interval '2 days',
  ends_at   = now() + interval '3 days',
  status    = 'scheduled'
where lower(title) like '%lithium hydroxide%'
  and status in ('scheduled', 'live', 'ended');

update public.auctions
set
  starts_at = now() - interval '6 hours',
  ends_at   = now() + interval '18 hours',
  status    = 'live'
where lower(title) like '%black mass%'
  and status in ('scheduled', 'live');

update public.auctions
set
  starts_at = now() + interval '5 days',
  ends_at   = now() + interval '6 days',
  status    = 'scheduled'
where lower(title) like '%spodumene%'
  and status in ('scheduled', 'live', 'ended');
