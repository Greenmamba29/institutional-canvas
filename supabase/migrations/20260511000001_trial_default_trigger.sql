-- Guarantee every new org gets a 3-day trial server-side, even if the client
-- never calls start_org_trial (e.g. onboarding abandoned mid-flow).
-- Complements the client-side start_org_trial call in Onboarding (idempotent).
CREATE OR REPLACE FUNCTION public.set_default_org_trial()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_started_at := COALESCE(NEW.trial_started_at, now());
    NEW.trial_ends_at    := now() + interval '3 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_default_org_trial ON public.organizations;
CREATE TRIGGER trg_set_default_org_trial
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_default_org_trial();
