# Phase 2B: Database & Form Fixes - Execution Guide

## Overview
This phase fixes two critical blocking issues:
1. **Organization Creation Failure** - Users cannot complete onboarding
2. **RFQ Creation Failure** - Form validation and submission issues

## 🎯 Quick Start

### Step 1: Run Diagnostics (Required First)
Open **Supabase SQL Editor** and run:
```
sql/phase2b-01-diagnostics.sql
```

This will output 8 sections showing:
- Table schemas
- Existing functions  
- Helper functions
- Auth functions
- RLS policies
- RLS status
- QA account status
- Data counts

**Review the output** to understand the current state before proceeding.

---

### Step 2: Fix Organizations Table Schema
Run in **Supabase SQL Editor**:
```
sql/phase2b-02-fix-organizations-schema.sql
```

This will:
- ✅ Add `email` column (if missing)
- ✅ Add `updated_at` column (if missing)
- ✅ Add `phone` column (if missing)
- ✅ Create auto-update trigger for `updated_at`

**Expected Output:**
```
NOTICE: Added email column to organizations
NOTICE: Added updated_at column to organizations
NOTICE: Added phone column to organizations
```

---

### Step 3: Recreate create_organization Function
Run in **Supabase SQL Editor**:
```
sql/phase2b-03-fix-create-organization.sql
```

This will:
- ✅ Drop old function (if exists)
- ✅ Create new function with `auth.uid()` authentication
- ✅ Add proper error handling
- ✅ Grant execute permission to authenticated users

**Expected Output:**
```
status: Function created successfully
routine_name: create_organization
routine_type: FUNCTION
return_type: organizations
```

---

### Step 4: Fix RLS Policies for Organizations
Run in **Supabase SQL Editor**:
```
sql/phase2b-04-fix-rls-policies.sql
```

This will:
- ✅ Enable RLS on `organizations` table
- ✅ Enable RLS on `org_members` table
- ✅ Create proper INSERT policies (allow authenticated users)
- ✅ Create proper SELECT policies (view own orgs)
- ✅ Create proper UPDATE policies (admins/owners only)

**Expected Policies Created:**
- `authenticated_users_can_insert_organizations`
- `users_can_view_their_organizations`
- `org_admins_can_update_organizations`
- `authenticated_users_can_insert_memberships`
- `users_can_view_their_memberships`
- `users_can_view_org_members`
- `org_admins_can_update_memberships`

---

### Step 5: Fix RFQ Table & Policies
Run in **Supabase SQL Editor**:
```
sql/phase2b-05-fix-rfqs.sql
```

This will:
- ✅ Show current RFQ schema (diagnostic)
- ✅ Enable RLS on `rfqs` table
- ✅ Create INSERT policy (org members only)
- ✅ Create SELECT policies (own org + published RFQs)
- ✅ Create UPDATE policy (creators only)

**Expected Policies Created:**
- `authenticated_users_can_create_rfqs`
- `users_can_view_org_rfqs`
- `users_can_update_own_rfqs`
- `users_can_view_published_rfqs`

---

### Step 6: Fix Client-Side Form Validation
After database fixes, the client-side RFQ form needs fixes:
- See `FORM_FIXES.md` for detailed instructions
- Main issues: form state management and validation

---

## 🧪 Testing After Fixes

### Test 1: Organization Creation
1. Visit: https://lithiumbuy.com
2. Sign up or login with: `qa-test-buyer@lithiumbuy.com`
3. Go to onboarding page
4. Click "Create Organization"
5. Fill in: Name, select Buyer type
6. Click Create
7. **Expected:** Redirect to `/dashboard` ✅

### Test 2: RFQ Creation  
1. After creating organization, go to Dashboard
2. Click "Create RFQ" button
3. Fill in:
   - Title: "Test RFQ for Lithium Carbonate"
   - Description: "Need 100 tons for Q2 2025"
   - Quantity: 100
   - Unit: tons
4. Click "Create RFQ"
5. **Expected:** Success toast, RFQ appears in list ✅

### Test 3: All Organization Types
Repeat Test 1 with:
- `qa-test-supplier@lithiumbuy.com` (Supplier org)
- `qa-test-admin@lithiumbuy.com` (Admin org)

---

## 🔍 Troubleshooting

### Error: "Authentication required"
**Cause:** User not properly authenticated or `auth.uid()` returning null

**Fix:**
1. Check user is logged in (verify JWT in browser storage)
2. Re-run script 03 to ensure function uses `auth.uid()`
3. Check Supabase dashboard → Authentication → Users

### Error: "User already belongs to an organization"
**Cause:** User already has active org membership

**Fix:**
```sql
-- Remove existing membership for testing
DELETE FROM public.org_members 
WHERE user_id = 'USER_ID_HERE'::text;
```

### Error: "Column does not exist: email"
**Cause:** Schema fix script didn't run or failed

**Fix:**
1. Re-run script 02 (it's idempotent)
2. Check output for errors
3. Manually verify: `SELECT * FROM information_schema.columns WHERE table_name='organizations';`

### Error: "Permission denied for table organizations"
**Cause:** RLS policies too restrictive or not applied

**Fix:**
1. Re-run script 04
2. Verify policies exist: `SELECT * FROM pg_policies WHERE tablename='organizations';`
3. Check RLS enabled: `SELECT * FROM pg_tables WHERE tablename='organizations';`

---

## 📊 Success Criteria

- ✅ All SQL scripts run without errors
- ✅ QA accounts can create organizations
- ✅ Users redirect to dashboard after onboarding
- ✅ Users can create RFQs from dashboard
- ✅ No silent failures in any flow
- ✅ All validation errors are clear and actionable

---

## 🚀 Next Steps After Phase 2B

Once all tests pass:
1. Commit all changes to git
2. Deploy to production
3. Test with real users
4. Monitor error logs for issues
5. Proceed to Phase 3 (Advanced Features)

---

## 📝 Notes

- All SQL scripts are **idempotent** (safe to re-run)
- Scripts include verification queries at the end
- Always run diagnostics first (script 01)
- Run scripts in order (01 → 05)
- Test after each script for debugging
