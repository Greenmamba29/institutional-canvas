# Phase 2B Deployment Checklist

**Date:** December 26, 2025  
**Status:** Ready for Deployment ✅  
**Git Commits:** `fa4f312` (SQL), `e65cafd` (Form)

---

## ✅ Completed Pre-Deployment

- [x] All SQL scripts created and committed
- [x] Form validation fixes applied
- [x] Changes pushed to GitHub (`main` branch)
- [x] Execution guide created (README.md)
- [x] Documentation complete

---

## 🔄 Deployment Steps (Run in Order)

### Step 1: Database Fixes (Supabase SQL Editor)

Open **Supabase SQL Editor** and run these scripts **in order**:

#### 1.1 Diagnostics (5 min)
```sql
-- File: sql/phase2b-01-diagnostics.sql
-- Purpose: Audit current database state
-- Action: Review output, identify issues
```
**Expected:** 8 sections of output showing tables, functions, policies, etc.

#### 1.2 Fix Organizations Schema (2 min)
```sql
-- File: sql/phase2b-02-fix-organizations-schema.sql
-- Purpose: Add missing columns (email, updated_at, phone)
-- Action: Run and verify NOTICE messages
```
**Expected:** "Added email column", "Added updated_at column", etc.

#### 1.3 Recreate create_organization Function (2 min)
```sql
-- File: sql/phase2b-03-fix-create-organization.sql
-- Purpose: Replace function to use auth.uid()
-- Action: Run and verify function created
```
**Expected:** "Function created successfully" with routine_name

#### 1.4 Fix RLS Policies - Organizations (3 min)
```sql
-- File: sql/phase2b-04-fix-rls-policies.sql
-- Purpose: Enable RLS and create proper policies
-- Action: Run and verify policies created
```
**Expected:** 7 policies created across organizations and org_members

#### 1.5 Fix RLS Policies - RFQs (3 min)
```sql
-- File: sql/phase2b-05-fix-rfqs.sql
-- Purpose: Enable RLS on rfqs table
-- Action: Run and verify 4 policies created
```
**Expected:** authenticated_users_can_create_rfqs, users_can_view_org_rfqs, etc.

**Total Database Time:** ~15 minutes

---

### Step 2: Frontend Deployment (Automatic)

The form fixes are already committed and pushed. Lovable will auto-deploy:

**Commit:** `e65cafd`  
**Changes:**
- ✅ Removed HTML5 `required` attributes
- ✅ Added `aria-required` for accessibility
- ✅ Marked description as "(Optional)"
- ✅ Changed product_id fallback to `null`
- ✅ Changed min quantity from 0 to 0.01

**Deployment:** Automatic via GitHub integration

---

### Step 3: Testing (QA Accounts)

#### 3.1 Test Organization Creation (Buyer)
- [ ] Login: `qa-test-buyer@lithiumbuy.com`
- [ ] Go to: https://lithiumbuy.com/onboarding
- [ ] Click: "Create Organization"
- [ ] Fill: Name = "Test Buyer Corp", Type = Buyer
- [ ] Submit and verify redirect to `/dashboard`
- [ ] **Expected:** Success! No errors, dashboard loads

#### 3.2 Test Organization Creation (Supplier)
- [ ] Login: `qa-test-supplier@lithiumbuy.com`
- [ ] Go to: https://lithiumbuy.com/onboarding
- [ ] Click: "Create Organization"
- [ ] Fill: Name = "Test Supplier Inc", Type = Supplier
- [ ] Submit and verify redirect to `/dashboard`
- [ ] **Expected:** Success! No errors, dashboard loads

#### 3.3 Test RFQ Creation
- [ ] Login with buyer account (from 3.1)
- [ ] Go to: https://lithiumbuy.com/rfqs
- [ ] Click: "Create RFQ" button
- [ ] Fill form:
  - Title: "Lithium Carbonate Q2 2025"
  - Description: "Need 100 MT for battery production"
  - Quantity: 100
  - Unit: MT
  - Incoterms: FOB
  - Delivery: "Shanghai Port, China"
- [ ] Submit and verify:
  - Success toast appears
  - RFQ appears in list
  - Form closes and resets
- [ ] **Expected:** Success! RFQ created and visible

#### 3.4 Test Validation Errors
- [ ] Try creating RFQ with empty title
  - **Expected:** Toast notification "Title required"
- [ ] Try creating RFQ with quantity = 0
  - **Expected:** Toast notification "Invalid quantity"
- [ ] Try creating RFQ with empty delivery
  - **Expected:** Toast notification "Delivery location required"

**Total Testing Time:** ~20 minutes

---

## 🚨 Rollback Plan (If Needed)

If critical issues occur, you can rollback:

### Database Rollback
```sql
-- Revert to previous function version (if you have backup)
-- Or disable RLS temporarily:
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE rfqs DISABLE ROW LEVEL SECURITY;
```

### Code Rollback
```bash
git revert e65cafd  # Revert form changes
git revert fa4f312  # Revert SQL files (if needed)
git push origin main
```

---

## 📊 Success Criteria

- ✅ All SQL scripts run without errors
- ✅ QA accounts can create organizations
- ✅ Users redirect to dashboard after onboarding
- ✅ RFQs can be created without errors
- ✅ Validation shows clear toast messages
- ✅ No HTML5 validation errors visible
- ✅ No silent failures in any flow

---

## 🐛 Known Issues & Workarounds

### Issue 1: "User already belongs to an organization"
**Cause:** User tested onboarding multiple times  
**Fix:** Run cleanup SQL:
```sql
DELETE FROM org_members WHERE user_id = 'USER_ID_HERE'::text;
DELETE FROM organizations WHERE id = 'ORG_ID_HERE';
```

### Issue 2: "Column does not exist: product_id"
**Cause:** RFQ table schema mismatch  
**Fix:** Check `rfqs` table has `product_id` column, allow NULL if needed

### Issue 3: Form shows "Please fill out this field"
**Cause:** Browser cache still has old version with `required` attributes  
**Fix:** Hard refresh (Cmd+Shift+R), clear cache, or incognito mode

---

## 📞 Support Contacts

**Database Issues:** Check Supabase logs  
**Frontend Issues:** Check browser console  
**Deployment Issues:** Check Lovable deployment status

---

## ✅ Post-Deployment Verification

After deployment, verify these endpoints:

1. **Auth:** https://lithiumbuy.com/auth ✅
2. **Onboarding:** https://lithiumbuy.com/onboarding ✅
3. **Dashboard:** https://lithiumbuy.com/dashboard ✅
4. **RFQs:** https://lithiumbuy.com/rfqs ✅

Check Supabase logs for:
- [ ] No authentication errors
- [ ] No RLS policy violations
- [ ] No function execution failures

---

## 🎯 Next Steps (After Phase 2B)

Once all tests pass and deployment is stable:

1. Monitor error logs for 24 hours
2. Collect user feedback
3. Fix any edge cases discovered
4. Proceed to **Phase 3: Advanced Features**
   - ⌘K Command Palette
   - Enhanced mobile navigation
   - Performance optimizations
   - Contextual help system

---

**Deployment Ready!** 🚀

All commits pushed to GitHub.  
SQL scripts ready in `sql/` directory.  
Form fixes deployed automatically via Lovable.
