# 🔧 Supabase Dashboard Configuration Checklist

## Browser Tabs Now Open:
1. ✅ SQL Editor - Apply migration
2. ✅ Auth Templates - OTP expiry  
3. ✅ Auth Policies - Password protection
4. ✅ API Settings - Rate limiting

---

## 📋 Configuration Steps

### Tab 1: SQL Editor - Apply Migration
**URL:** https://supabase.com/dashboard/project/vuekwckknfjivjighhfd/sql/new

**Steps:**
- [ ] Paste migration SQL (already in clipboard)
- [ ] Click "Run" button
- [ ] Wait for "Success" message
- [ ] Verify: No errors in output

**Expected Result:** "Rows: 0" (migrations don't return data)

---

### Tab 2: Auth Templates - OTP Expiry
**URL:** https://supabase.com/dashboard/project/vuekwckknfjivjighhfd/auth/templates

**Steps:**
1. [ ] Find "Invite User" or "Magic Link" template
2. [ ] Look for "Token expiry" or "OTP validity" field
3. [ ] Change from default (usually 86400 or 3600) to: **300** (5 minutes)
4. [ ] Click "Save"

**Why:** Reduces attack window for intercepted tokens from 24h → 5min

**Note:** If you don't see OTP settings here, they may be in:
- Authentication > Settings > Security
- Or may not be configurable (Auth0 handles this)

---

### Tab 3: Auth Policies - Password Protection  
**URL:** https://supabase.com/dashboard/project/vuekwckknfjivjighhfd/auth/policies

**Steps:**
1. [ ] Look for "Breach Password Protection" toggle
2. [ ] Enable it
3. [ ] Save changes

**Why:** Checks passwords against known breach databases (HaveIBeenPwned)

**Note:** Only applies if using email/password auth. If using Auth0, this is N/A.

---

### Tab 4: API Settings - Rate Limiting
**URL:** https://supabase.com/dashboard/project/vuekwckknfjivjighhfd/settings/api

**Steps:**
1. [ ] Scroll to "Rate Limiting" section
2. [ ] Set limit to: **100 requests per minute** per IP
3. [ ] Save changes

**Why:** Prevents abuse and DDoS attacks

---

## 🔍 Additional Checks

### Check Postgres Version
**URL:** https://supabase.com/dashboard/project/vuekwckknfjivjighhfd/settings/infrastructure

**Steps:**
1. [ ] Open Settings > Infrastructure
2. [ ] Check "Postgres Version"
3. [ ] If updates available, schedule maintenance window
4. [ ] Apply updates

---

## ✅ Completion Checklist

When ALL done, check these:
- [ ] Migration applied successfully (no errors)
- [ ] OTP expiry configured (if applicable)
- [ ] Password protection enabled (if applicable)  
- [ ] Rate limiting configured
- [ ] Postgres version checked

**Time Required:** ~10-15 minutes total

---

## 🚨 If Issues Occur

### Migration Errors
- Check error message carefully
- Most common: Table already exists (safe to ignore)
- If function errors: May need to drop and recreate

### Setting Not Found
- Auth0 projects may not have all settings
- Focus on: Migration + Rate Limiting (critical)
- OTP/Password protection may be Auth0-managed

### Need Help?
See full documentation: `SECURITY_FIXES.md`
