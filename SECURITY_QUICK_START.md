# Security Fixes - Quick Start Guide

## 🚨 IMMEDIATE ACTION REQUIRED

### 1. Apply Database Migration (5 minutes)

```bash
cd /Users/paco/institutional-canvas

# Option A: Using Supabase CLI (recommended)
supabase db push

# Option B: Manual via Dashboard
# 1. Copy contents of: supabase/migrations/20251224_security_fixes.sql
# 2. Go to: Supabase Dashboard > SQL Editor
# 3. Paste and run
```

### 2. Update Supabase Dashboard Settings (10 minutes)

#### Auth OTP Expiry
1. Go to: **Supabase Dashboard > Authentication > Settings > Email Templates**
2. Find "Magic Link" template
3. Change expiry to: **300 seconds (5 minutes)**
4. Save

#### Breach Password Protection
1. Go to: **Supabase Dashboard > Authentication > Policies**  
2. Enable: **Breach Password Protection**
3. Save

#### Postgres Updates
1. Go to: **Supabase Dashboard > Database > Settings**
2. Check for available updates
3. Apply if available

#### Rate Limiting
1. Go to: **Supabase Dashboard > API**
2. Set rate limit: **100 requests/minute per IP**
3. Save

### 3. Verify Git Security (2 minutes)

```bash
# Check .env is now ignored:
git status .env

# If it shows up, run:
git rm --cached .env
git commit -m "Remove .env from version control (security)"

# Push changes:
git push origin main
```

## ✅ WHAT WAS FIXED

### Critical Issues Resolved
- ✅ **RLS enabled on ALL tables** - Multi-tenant isolation secured
- ✅ **Audit logging added** - All security events tracked
- ✅ **`.env` added to .gitignore** - Secrets protected going forward
- ✅ **Function search paths secured** - SQL injection prevention
- ✅ **Enhanced error handling** - No info leakage

### Warnings Addressed
- ✅ **Search path mutable** - Fixed in migration
- 🟡 **OTP expiry** - Needs dashboard config (see above)
- 🟡 **Password protection** - Needs dashboard config (see above)
- 🟡 **Postgres updates** - Needs dashboard check (see above)
- ⚪ **Extension in public** - Acceptable, no action needed

## 📊 VERIFICATION

Run these queries after applying migration:

```sql
-- 1. Verify all tables have RLS:
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = false;
-- Expected: 0 rows

-- 2. Verify security definer functions:
SELECT proname FROM pg_proc 
WHERE prosecdef = true 
  AND proname NOT LIKE 'pg_%'
  AND prosrc NOT LIKE '%set search_path%';
-- Expected: 0 rows

-- 3. Test audit logging:
SELECT * FROM public.audit_log ORDER BY created_at DESC LIMIT 5;
-- Expected: Any logged events
```

## 🔥 IF SECRETS WERE EXPOSED

If you discover actual secrets (not asterisks) in git history:

```bash
# 1. Check git history
git --no-pager log --all --full-history -p -- .env | grep -i "key\|secret\|password"

# 2. If real secrets found, IMMEDIATELY:
# - Go to Supabase Dashboard > Settings > API
# - Rotate ALL keys (anon key, service role key)
# - Update .env with new keys
# - Update production environment variables

# 3. Clean git history (DANGEROUS - coordinate with team):
# git filter-branch --force --index-filter \
#   "git rm --cached --ignore-unmatch .env" \
#   --prune-empty --tag-name-filter cat -- --all
# git push origin --force --all
```

## 📱 MONITORING SETUP

After fixes are live, set up monitoring:

```sql
-- Daily: Check for suspicious activity
SELECT 
  action,
  outcome,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence
FROM audit_log
WHERE created_at > now() - interval '24 hours'
  AND outcome = 'failure'
GROUP BY action, outcome
ORDER BY count DESC;

-- Weekly: Review auth attempts
SELECT 
  user_id,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt
FROM audit_log
WHERE action LIKE '%auth%'
  AND outcome = 'failure'
  AND created_at > now() - interval '7 days'
GROUP BY user_id
HAVING COUNT(*) > 5
ORDER BY failed_attempts DESC;
```

## 📚 FULL DOCUMENTATION

For complete details, see: `SECURITY_FIXES.md`

## ✅ CHECKLIST

- [ ] Applied database migration
- [ ] Set OTP expiry to 5 minutes
- [ ] Enabled breach password protection
- [ ] Checked for Postgres updates
- [ ] Configured rate limiting
- [ ] Verified `.env` is gitignored
- [ ] Verified no secrets in git history
- [ ] Ran RLS verification query
- [ ] Tested audit logging
- [ ] Set up monitoring alerts
- [ ] Re-ran Frontend security scan

## 🆘 SUPPORT

If issues arise:
1. Check migration logs in Supabase Dashboard
2. Review `SECURITY_FIXES.md` for detailed explanations
3. Test queries in SQL Editor before applying
4. Keep backup of database before major changes

---

**Status:** Ready to deploy  
**Estimated Time:** 20 minutes total  
**Risk Level:** Low (all changes are additive, no breaking changes)
