-- Add airtable_id columns to existing tables for sync tracking (simplified)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS airtable_id TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS airtable_id TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS airtable_id TEXT;
ALTER TABLE rfqs ADD COLUMN IF NOT EXISTS airtable_id TEXT;

-- Create updated_at trigger for soe_organizations if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'soe_organizations') THEN
    DROP TRIGGER IF EXISTS set_soe_organizations_updated_at ON soe_organizations;
    CREATE TRIGGER set_soe_organizations_updated_at
      BEFORE UPDATE ON soe_organizations
      FOR EACH ROW
      EXECUTE FUNCTION handle_updated_at();
  END IF;
END
$$;