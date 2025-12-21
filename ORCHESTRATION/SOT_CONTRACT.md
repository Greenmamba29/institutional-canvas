# LithiumBuy System-of-Truth Contract

> **Version:** 1.0.0  
> **Last Updated:** 2024-12-21  
> **Owners:** Backend (Replit) + Frontend (Lovable)

---

## 1. System-of-Truth Rules

### 1.1 Data Ownership

| Layer | Owner | Responsibilities |
|-------|-------|------------------|
| **Database Schema** | Supabase (via Replit migrations) | Tables, columns, indexes, constraints |
| **RLS Policies** | Supabase | Row-level security enforcement |
| **RPC Functions** | Supabase | Business logic, validation, audit logging |
| **Edge Functions** | Supabase | External API integrations, webhooks |
| **Frontend UI** | Lovable | Components, routing, state management |
| **TypeScript Types** | Auto-generated | `src/integrations/supabase/types.ts` |

### 1.2 Golden Rules

1. **Supabase is the single source of truth for all data**
2. **Frontend NEVER writes directly to protected tables** (use RPC only)
3. **Schema changes require migration + type regeneration + contract update**
4. **All mutations must be auditable** (activity_log table)
5. **RLS enforces access control** — frontend trusts backend enforcement

---

## 2. Allowed Write Paths

### 2.1 Frontend (Lovable) — READ + RPC ONLY

```typescript
// ✅ ALLOWED: Direct reads
const { data } = await supabase.from('suppliers').select('*');

// ✅ ALLOWED: RPC function calls
const { data } = await supabase.rpc('create_telebuy_session', {
  p_supplier_id: supplierId,
  p_scheduled_at: scheduledAt
});

// ❌ FORBIDDEN: Direct mutations
await supabase.from('orders').insert({ ... }); // NEVER
await supabase.from('suppliers').update({ ... }); // NEVER
```

### 2.2 Backend (Replit) — Full Access via Migrations/RPC

```sql
-- ✅ ALLOWED: Migrations for schema changes
ALTER TABLE suppliers ADD COLUMN verified_at TIMESTAMP;

-- ✅ ALLOWED: RPC functions for business logic
CREATE FUNCTION create_order(...) RETURNS uuid AS $$
  -- validation, audit logging, business rules
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.3 Protected Tables (RPC-only writes)

| Table | Read | Write | Notes |
|-------|------|-------|-------|
| `suppliers` | Direct | RPC | Supplier management |
| `products` | Direct | RPC | Product catalog |
| `orders` | Direct | RPC | Purchase records |
| `quotes` | Direct | RPC | Quote requests |
| `telebuy_sessions` | Direct | RPC | Video sessions |
| `activity_log` | Direct | RPC | Audit trail |
| `profiles` | Direct | RPC | User profiles |

### 2.4 Unprotected Tables (Direct writes allowed)

| Table | Notes |
|-------|-------|
| `user_preferences` | User-specific settings |
| `notifications` | Notification state |

---

## 3. Eventing Architecture

### 3.1 Event Bus

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  Supabase   │────▶│   Backend   │
│  (Lovable)  │     │  Triggers   │     │  (Replit)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ Edge Funcs  │
                    │ (Webhooks)  │
                    └─────────────┘
```

### 3.2 Event Types

| Event | Trigger | Handler |
|-------|---------|---------|
| `order.created` | INSERT on orders | Edge function → notification |
| `bid.placed` | INSERT on bids | Edge function → supplier alert |
| `session.started` | UPDATE on telebuy_sessions | Edge function → analytics |

### 3.3 Realtime (Deferred)

- **Status:** NOT IMPLEMENTED
- **Plan:** Subscribe to `bids`, `notifications`, `telebuy_sessions`
- **TODO:** Add realtime subscriptions after MVP

---

## 4. Change Protocol

### 4.1 Schema Change Checklist

- [ ] Create migration file in `supabase/migrations/`
- [ ] Update `ORCHESTRATION/SCHEMA.json`
- [ ] Regenerate TypeScript types
- [ ] Update `ORCHESTRATION/API.openapiv1.yaml` (if RPC changed)
- [ ] Run drift detection: `npm run check:drift`
- [ ] Update this contract if rules changed

### 4.2 RPC Change Checklist

- [ ] Update/create RPC function in migration
- [ ] Add to `ORCHESTRATION/API.openapiv1.yaml`
- [ ] Update frontend call sites
- [ ] Add tests for new RPC

### 4.3 Breaking Change Protocol

1. **Announce** in PR description
2. **Version** the RPC (e.g., `create_order_v2`)
3. **Deprecate** old version (don't delete immediately)
4. **Migrate** frontend to new version
5. **Remove** old version after 1 release cycle

---

## 5. Security Invariants

1. **All user data queries use `auth.uid()`** — never trust client-provided user IDs
2. **RLS is always enabled** on user-scoped tables
3. **Service role key is backend-only** — never expose in frontend
4. **Audit logs are immutable** — no DELETE policy on activity_log
5. **Sensitive operations require RPC** — validation happens server-side

---

## 6. Monitoring & Observability

### 6.1 Required Logs

| Event | Table | Required Fields |
|-------|-------|-----------------|
| User action | `activity_log` | user_id, action, resource_type, resource_id |
| RPC call | Edge function logs | function_name, duration_ms, status |
| Error | Edge function logs | error_message, stack_trace |

### 6.2 Drift Detection

Run on every PR:
```bash
npm run check:drift
```

Fails if:
- Migration changed but types not regenerated
- RPC signature doesn't match OpenAPI spec
- Schema.json out of sync with database

---

## 7. Contract Violations

### 7.1 What Happens on Violation

1. **CI blocks merge** if drift detected
2. **PR requires contract update** if schema changed
3. **Breaking changes require RFC** in PR description

### 7.2 Exception Process

1. Create issue explaining why exception needed
2. Get approval from both Backend and Frontend owners
3. Document exception in this file under "Active Exceptions"

### 7.3 Active Exceptions

_None currently._

---

## Appendix A: Project IDs

- **Supabase Project ID:** `vuekwckknfjivjighhfd`
- **Supabase URL:** `https://vuekwckknfjivjighhfd.supabase.co`
- **GitHub Repo:** (linked via Lovable)

## Appendix B: Changelog

| Date | Version | Change |
|------|---------|--------|
| 2024-12-21 | 1.0.0 | Initial contract |
