# Security & Credential Rotation Checklist

**Document Version**: 1.0.0  
**Last Updated**: 2026-01-20  
**Purpose**: Credential rotation procedures and security best practices for Lithium & Lux institutional-canvas

---

## 🚨 Credential Rotation Required

### **Supabase Anon Key (Exposed in Code)**
**Status**: ⚠️ **ROTATE IMMEDIATELY**  
**Location**: `/src/integrations/supabase/client.ts` (hardcoded)  
**Risk**: Medium - Anon key protected by RLS but still exposed in client bundle

**Steps to Rotate**:
1. Go to [Supabase Dashboard → Settings → API](https://supabase.com/dashboard/project/_/settings/api)
2. Generate new anon/public key
3. Update `.env` with new `VITE_SUPABASE_ANON_KEY`
4. Remove hardcoded value from `src/integrations/supabase/client.ts` (see fix below)
5. Deploy updated build
6. Monitor logs for any auth failures (24-48 hours)
7. Revoke old key in Supabase dashboard

### **Daily.co API Key**
**Status**: ✅ Low risk (if not yet deployed publicly)  
**Location**: `.env` (not committed)  
**Action**: No immediate rotation needed, but verify scope:
- Ensure key only has "room creation" permissions
- Set domain restrictions if available
- Monitor usage in Daily.co dashboard

### **ElevenLabs Agent IDs**
**Status**: ✅ Safe (agent IDs are public identifiers, not secrets)  
**Location**: `.env` (not committed)  
**Action**: None required

---

## 🔒 Security Best Practices

### 1. Environment Variable Hygiene
**Rules**:
- ✅ `.env` is in `.gitignore` - **NEVER commit this file**
- ✅ Use `.env.example` for documentation only (no real values)
- ✅ All secrets must use `VITE_` prefix for Vite apps
- ❌ **NEVER** hardcode credentials in source code

**Current Issues to Fix**:
- [ ] Remove hardcoded Supabase credentials from `src/integrations/supabase/client.ts`

### 2. API Key Classification

| Key Type | Client-Safe? | Where to Store |
|----------|--------------|----------------|
| Supabase Anon Key | ✅ Yes (protected by RLS) | `.env` → `VITE_SUPABASE_ANON_KEY` |
| Supabase Service Role Key | ❌ **NO** | Supabase Edge Function secrets only |
| Daily.co API Key | ❌ **NO** | Supabase Edge Function secrets only |
| ElevenLabs API Key | ❌ **NO** | Supabase Edge Function secrets only |
| ElevenLabs Agent IDs | ✅ Yes (public identifiers) | `.env` → `VITE_ELEVENLABS_*` |
| Stripe Public Key | ✅ Yes | `.env` → `VITE_STRIPE_PUBLIC_KEY` |
| Stripe Secret Key | ❌ **NO** | Supabase Edge Function secrets only |

### 3. Supabase Row-Level Security (RLS)
**Required for ALL user-facing tables**:
```sql
-- Example RLS policy template
CREATE POLICY "Users can only access their org's data"
ON public.table_name
FOR ALL
TO authenticated
USING (org_id = (jwt_org_id()));

CREATE POLICY "Anon users can read public data only"
ON public.public_table
FOR SELECT
TO anon
USING (is_public = true);
```

**Audit Checklist**:
- [ ] All tables with user/org data have RLS enabled
- [ ] Policies tested with different user contexts
- [ ] No direct `.insert()`, `.update()`, `.delete()` in frontend code (use RPCs)
- [ ] RPC functions validate auth context (`jwt_user_id()`, `jwt_org_id()`)

### 4. Secrets in Supabase Edge Functions
**How to Store Server-Side Secrets**:

```bash
# Using Supabase CLI
supabase secrets set ELEVENLABS_API_KEY=your-key-here
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set DAILY_API_KEY=your-daily-key

# Verify secrets
supabase secrets list
```

**Accessing in Edge Functions**:
```typescript
// supabase/functions/my-function/index.ts
const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
if (!apiKey) {
  return new Response('Server configuration error', { status: 500 });
}
```

### 5. Frontend Security Rules
**What's Safe for Frontend** (in `.env` with `VITE_` prefix):
- Public API keys (Stripe publishable, Supabase anon)
- Agent/widget IDs (ElevenLabs agent IDs, Daily.co domain)
- Feature flags
- API endpoints (public GraphQL URLs)

**What Must Stay Server-Side**:
- API keys with write/admin access
- Service role keys
- OAuth client secrets
- Private encryption keys
- Database connection strings

---

## 🛠️ Immediate Fixes Required

### Fix 1: Remove Hardcoded Supabase Credentials

**File**: `src/integrations/supabase/client.ts`

**Current Code** (⚠️ INSECURE):
```typescript
const SUPABASE_URL = 'https://vuekwckknfjivjighhfd.supabase.co';
const SUPABASE_ANON_KEY = '************************************************...';
```

**Fixed Code** (✅ SECURE):
```typescript
import { env } from '@/config/env';

const { SUPABASE_URL, SUPABASE_ANON_KEY } = env();
```

**Why**: Hardcoded values are visible in built JavaScript bundles and git history. Always use environment variables.

### Fix 2: Verify .gitignore Coverage

**Check**:
```bash
git check-ignore .env .env.local .env.production
```

**Expected Output**: All three should be ignored. If not, add to `.gitignore`:
```
# Environment variables
.env
.env.local
.env.*.local
```

### Fix 3: Validate No Secrets in Git History

**Scan for exposed secrets**:
```bash
# Install gitleaks
brew install gitleaks

# Scan repo
gitleaks detect --source . --verbose
```

If secrets found:
1. Rotate all exposed credentials immediately
2. Use BFG Repo-Cleaner to remove from history (advanced)
3. Force-push cleaned history (coordinate with team)

---

## 🔍 Security Monitoring

### Daily Checks
- [ ] Review Supabase auth logs for failed attempts
- [ ] Monitor Daily.co usage for anomalies
- [ ] Check Sentry for frontend errors exposing sensitive info

### Weekly Checks
- [ ] Review npm audit results (`npm audit`)
- [ ] Check for new CVEs in dependencies
- [ ] Verify RLS policies still enforced (test with different users)

### Monthly Checks
- [ ] Rotate Daily.co API key (best practice)
- [ ] Review Supabase access logs
- [ ] Audit Edge Function secrets (remove unused)
- [ ] Update security documentation

---

## 📋 Incident Response

### If Credentials Are Exposed:

1. **Immediate** (within 1 hour):
   - Rotate exposed credential in provider dashboard
   - Update `.env` on all developer machines
   - Deploy new build with updated credentials
   - Revoke old credential

2. **Within 24 hours**:
   - Review access logs for unauthorized usage
   - Document incident (what, when, impact, resolution)
   - Notify affected parties if data accessed

3. **Within 1 week**:
   - Update security training for team
   - Add additional checks to prevent recurrence
   - Consider implementing secrets scanning in CI/CD

---

## ✅ Security Checklist for Production Deploy

**Pre-Deploy Verification**:
- [ ] No `.env` file in git (`git ls-files | grep .env` returns empty)
- [ ] No hardcoded credentials in source code
- [ ] All secrets in Supabase Edge Function vault
- [ ] RLS enabled on all user tables
- [ ] Supabase anon key is not service role key
- [ ] CORS configured correctly in Edge Functions
- [ ] Error messages don't leak implementation details
- [ ] Build artifacts scanned for exposed secrets
- [ ] Environment variables validated at runtime (`src/config/env.ts`)

**Post-Deploy Verification**:
- [ ] Test auth flow end-to-end
- [ ] Verify RLS blocks unauthorized access (different user contexts)
- [ ] Check browser console for exposed keys (network tab)
- [ ] Monitor Sentry for auth errors
- [ ] Verify no secrets in built bundle (`grep -r "sk_" dist/`)

---

## 🧪 Testing Security

### Test RLS Policies:
```sql
-- Switch to user context
SET LOCAL jwt.claims.sub = 'test-user-id';
SET LOCAL jwt.claims.org_id = 'test-org-id';

-- Try unauthorized access (should fail)
SELECT * FROM listings WHERE org_id != 'test-org-id';
```

### Test Anon Key Restrictions:
```typescript
// Should succeed (read public data)
const { data } = await supabase.from('public_listings').select('*');

// Should fail (write operation)
const { error } = await supabase.from('listings').insert({ ... });
console.log(error); // "new row violates row-level security policy"
```

---

## 📞 Contacts

**Security Incidents**: security@lithiumlux.com  
**Supabase Support**: [support.supabase.com](https://support.supabase.com)  
**Daily.co Support**: [help.daily.co](https://help.daily.co)

---

**Next Review Date**: 2026-02-20  
**Document Owner**: SecurityAgent (AI) / DevOps Lead
