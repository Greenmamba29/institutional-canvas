# Drift Detection Rules

> **Purpose:** Ensure schema, types, and API specs stay in sync across the stack.

---

## 1. What is Drift?

Drift occurs when:
- Database schema changes but TypeScript types aren't regenerated
- RPC function signature changes but OpenAPI spec isn't updated
- SCHEMA.json doesn't match actual database structure
- Frontend calls RPC with wrong parameters

---

## 2. Drift Detection Rules

### Rule 1: Migration → Types Sync

```
IF migrations/*.sql changed
THEN src/integrations/supabase/types.ts MUST be regenerated
```

**How to fix:**
```bash
npx supabase gen types typescript --project-id vuekwckknfjivjighhfd > src/integrations/supabase/types.ts
```

### Rule 2: RPC → OpenAPI Sync

```
IF RPC function added/modified in migrations
THEN ORCHESTRATION/API.openapiv1.yaml MUST be updated
```

**What to update:**
- Add new path under `/rest/v1/rpc/{function_name}`
- Update request body schema
- Update response schema

### Rule 3: Schema.json → Database Sync

```
IF table structure changed in migrations
THEN ORCHESTRATION/SCHEMA.json MUST be updated
```

**What to update:**
- Add/modify entity definition
- Update property types
- Update required fields

### Rule 4: Frontend → RPC Call Sync

```
IF RPC signature changed
THEN all supabase.rpc() calls MUST use correct parameters
```

**How to check:**
```bash
npm run check:drift
```

---

## 3. Automated Checks

### GitHub Actions Workflow

Create `.github/workflows/drift-check.yml`:

```yaml
name: Drift Detection

on:
  pull_request:
    paths:
      - 'supabase/migrations/**'
      - 'src/integrations/supabase/**'
      - 'ORCHESTRATION/**'

jobs:
  check-drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - run: npm ci
      
      - name: Run drift detection
        run: npm run check:drift
        
      - name: Check types are fresh
        run: |
          npx supabase gen types typescript --project-id ${{ secrets.SUPABASE_PROJECT_ID }} > /tmp/fresh-types.ts
          diff src/integrations/supabase/types.ts /tmp/fresh-types.ts || (echo "Types are stale! Regenerate with: npx supabase gen types typescript" && exit 1)
```

---

## 4. Manual Verification Checklist

Before merging any PR that touches database:

- [ ] `supabase/migrations/` has new migration file
- [ ] `src/integrations/supabase/types.ts` regenerated
- [ ] `ORCHESTRATION/SCHEMA.json` updated (if entity changed)
- [ ] `ORCHESTRATION/API.openapiv1.yaml` updated (if RPC changed)
- [ ] `npm run check:drift` passes
- [ ] `SOT_CONTRACT.md` updated (if rules changed)

---

## 5. Common Drift Scenarios

### Scenario A: Added new column

1. Create migration: `ALTER TABLE x ADD COLUMN y`
2. Regenerate types: `npx supabase gen types typescript...`
3. Update SCHEMA.json: Add property to entity
4. ✅ No OpenAPI change needed (columns are in table, not RPC)

### Scenario B: Added new RPC function

1. Create migration with `CREATE FUNCTION`
2. Regenerate types (RPC types auto-included)
3. Update API.openapiv1.yaml: Add new path
4. Update SCHEMA.json if function returns new entity type

### Scenario C: Changed RPC parameters

1. Create migration with `CREATE OR REPLACE FUNCTION`
2. Regenerate types
3. Update API.openapiv1.yaml: Update requestBody schema
4. Update all frontend `supabase.rpc()` calls
5. Run `npm run check:drift` to verify

### Scenario D: Renamed table/column

1. Create migration with `ALTER TABLE RENAME`
2. Regenerate types
3. Update SCHEMA.json: Rename entity/property
4. Update API.openapiv1.yaml if exposed in RPC
5. **Search and replace** all frontend usages

---

## 6. Drift Detection Script

See `scripts/check_drift.ts` for implementation.

The script checks:
1. All RPC calls in frontend match defined functions
2. Parameter types match expected schemas
3. No hardcoded table names that don't exist
4. Import paths are valid

---

## 7. Recovery Procedures

### If types are stale

```bash
# Regenerate from live database
npx supabase gen types typescript --project-id vuekwckknfjivjighhfd > src/integrations/supabase/types.ts
```

### If OpenAPI is stale

1. Query database for current RPC functions:
   ```sql
   SELECT routine_name, data_type 
   FROM information_schema.routines 
   WHERE routine_schema = 'public';
   ```
2. Update API.openapiv1.yaml manually

### If SCHEMA.json is stale

1. Query database for current schema:
   ```sql
   SELECT table_name, column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_schema = 'public';
   ```
2. Update SCHEMA.json to match

---

## 8. Enforcement

| Violation | Consequence |
|-----------|-------------|
| Types not regenerated | CI fails, PR blocked |
| OpenAPI not updated | Manual review required |
| SCHEMA.json outdated | Warning in PR |
| Frontend drift | TypeScript compile error |

---

## Appendix: File Locations

| File | Purpose |
|------|---------|
| `supabase/migrations/*.sql` | Database changes |
| `src/integrations/supabase/types.ts` | Generated TypeScript types |
| `ORCHESTRATION/SCHEMA.json` | Canonical entity schemas |
| `ORCHESTRATION/API.openapiv1.yaml` | RPC endpoint specs |
| `ORCHESTRATION/SOT_CONTRACT.md` | System rules |
| `scripts/check_drift.ts` | Drift detection script |
