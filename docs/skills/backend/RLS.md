# Row Level Security (RLS) Guide

## RLS Principles

1. **Enable on ALL tables** - No exceptions
2. **Org-based isolation** - Users only see their org's data
3. **Use helper functions** - `jwt_org_id()`, `is_org_member()`
4. **Principle of least privilege** - Start restrictive, open as needed

## Policy Patterns

### Organization-Based Access

```sql
-- Users see only their org's data
CREATE POLICY "rfqs_select_org" ON public.rfqs
  FOR SELECT USING (organization_id = jwt_org_id());

-- Alternative using is_org_member helper
CREATE POLICY "files_select_org" ON public.files
  FOR SELECT USING (is_org_member(org_id) OR user_id = auth.uid());
```

### Public Read, Org Write

```sql
-- Anyone can read products
CREATE POLICY "products_select_all" ON public.products
  FOR SELECT USING (true);

-- Only org members can modify
CREATE POLICY "products_update_org" ON public.products
  FOR UPDATE USING (is_org_member(org_id));
```

### Owner-Only Access

```sql
-- Users can only see their own data
CREATE POLICY "profiles_own_data" ON public.profiles
  FOR ALL USING (auth.uid() = id);
```

### Admin Override

```sql
-- Admins can see everything
CREATE POLICY "audit_admin_read" ON public.audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
```

## Common Patterns by Table

### User Data (profiles, preferences)
```sql
FOR ALL USING (auth.uid() = user_id)
```

### Org Data (rfqs, bids, deals)
```sql
FOR SELECT USING (org_id = jwt_org_id())
-- Writes go through RPC (SECURITY DEFINER)
```

### Shared Data (products, suppliers)
```sql
FOR SELECT USING (true)  -- Public read
FOR INSERT/UPDATE/DELETE USING (is_org_member(org_id))  -- Org write
```

### Cross-Org Data (purchases, notifications)
```sql
-- Both buyer and supplier orgs can see
FOR SELECT USING (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = current_sub()
  )
)
```

## Helper Functions

### `jwt_org_id()`
```sql
CREATE FUNCTION jwt_org_id() RETURNS uuid AS $$
  SELECT (current_setting('request.jwt.claims', true)::json ->> 'org_id')::uuid;
$$ LANGUAGE sql STABLE;
```

### `is_org_member(org_id)`
```sql
CREATE FUNCTION is_org_member(p_org_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id
    AND user_id = current_sub()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

## Debugging RLS

### Check current user
```sql
SELECT auth.uid();
SELECT current_setting('request.jwt.claims', true);
```

### Test policy manually
```sql
-- Simulate RLS check
SELECT * FROM rfqs
WHERE organization_id = 'your-org-id';
```

### View policies
```sql
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

## Security Checklist

- [ ] RLS enabled on table
- [ ] SELECT policy exists
- [ ] INSERT policy exists (or blocked)
- [ ] UPDATE policy exists (or blocked)
- [ ] DELETE policy exists (or blocked)
- [ ] No `USING (true)` on sensitive data
- [ ] Writes go through RPC functions
