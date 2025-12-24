# Lithium Buy - Quick Start Guide
## Get Your MVP Running in 30 Minutes

---

## Prerequisites
- [ ] Auth0 account (free tier works)
- [ ] Supabase project set up (`vuekwckknfjivjighhfd`)
- [ ] Node.js 18+ installed
- [ ] Git repository cloned

---

## Step 1: Auth0 Setup (10 minutes)

### 1.1 Create Auth0 Application
1. Go to https://manage.auth0.com/dashboard
2. Click **Applications** > **Create Application**
3. Name: `Lithium Buy`
4. Type: **Single Page Application**
5. Click **Create**

### 1.2 Configure Application Settings
In the Application settings:

**Allowed Callback URLs:**
```
http://localhost:5173/callback
```

**Allowed Logout URLs:**
```
http://localhost:5173
```

**Allowed Web Origins:**
```
http://localhost:5173
```

**Allowed Origins (CORS):**
```
http://localhost:5173
```

Click **Save Changes**

### 1.3 Get Auth0 Credentials
Copy these values (you'll need them in Step 2):
- **Domain**: `your-tenant.us.auth0.com`
- **Client ID**: `abc123...`

### 1.4 Create Test Users
1. Go to **User Management** > **Users**
2. Click **Create User**
3. Create User 1:
   - Email: `buyer@test.com`
   - Password: `Test1234!`
   - Connection: Username-Password-Authentication
4. Create User 2:
   - Email: `supplier@test.com`
   - Password: `Test1234!`

### 1.5 Get User Sub Values
1. Click on `buyer@test.com` > **Details** tab
2. Copy **User ID** (looks like `auth0|abc123...`)
3. Save as "Buyer Sub"
4. Repeat for `supplier@test.com`
5. Save as "Supplier Sub"

---

## Step 2: Configure Environment Variables (2 minutes)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in:
   ```env
   VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
   VITE_AUTH0_CLIENT_ID=your_client_id_here
   VITE_SUPABASE_URL=https://vuekwckknfjivjighhfd.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. Get Supabase anon key:
   - Go to https://supabase.com/dashboard/project/vuekwckknfjivjighhfd/settings/api
   - Copy **anon public** key

---

## Step 3: Load Seed Data (5 minutes)

### 3.1 Update Seed Script with Auth0 Subs
1. Open `supabase/seed.sql`
2. Find line 23: `'auth0|buyer_test_user'`
3. Replace with your Buyer Sub from Step 1.5
4. Find line 29: `'auth0|supplier_test_user'`
5. Replace with your Supplier Sub from Step 1.5

### 3.2 Run Seed Script
**Option A: Via Supabase Dashboard (Recommended)**
1. Go to https://supabase.com/dashboard/project/vuekwckknfjivjighhfd/sql/new
2. Copy entire contents of `supabase/seed.sql`
3. Paste into SQL Editor
4. Click **Run**

**Option B: Via psql (if installed)**
```bash
psql "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres" -f supabase/seed.sql
```

### 3.3 Verify Seed Data
Run this query in Supabase SQL Editor:
```sql
SELECT * FROM organizations;
SELECT * FROM org_members;
SELECT * FROM rfqs;
```

You should see:
- 2 organizations (Tesla, Albemarle)
- 2 org members
- 3 RFQs

---

## Step 4: Install Dependencies (2 minutes)

```bash
bun install
# or
npm install
```

---

## Step 5: Start Development Server (1 minute)

```bash
bun run dev
# or
npm run dev
```

Open http://localhost:5173

---

## Step 6: Test Login Flow (5 minutes)

### 6.1 Login as Buyer
1. Click **Login** button
2. Login with: `buyer@test.com` / `Test1234!`
3. You should be redirected to `/onboarding` (no org yet)
4. Create organization:
   - Type: **Buyer**
   - Name: `Tesla Inc`
   - Email: `procurement@tesla.com`
5. Click **Create Organization**
6. You should see the Dashboard

### 6.2 Verify Buyer Can See RFQs
1. Click **RFQs** in sidebar
2. You should see 3 RFQs (from seed data)
3. Click on an RFQ to view details

### 6.3 Login as Supplier
1. Logout (top right)
2. Login with: `supplier@test.com` / `Test1234!`
3. Create organization:
   - Type: **Supplier**
   - Name: `Albemarle Corporation`
   - Email: `sales@albemarle.com`
4. You should see the Dashboard
5. Click **RFQs** - you should see the same 3 RFQs
6. Click on an RFQ > **Submit Bid** button should appear

---

## Step 7: Test End-to-End Flow (5 minutes)

### As Supplier:
1. Go to RFQs
2. Click on "Need 100MT Lithium Carbonate Q1 2025"
3. Click **Submit Bid**
4. Fill in:
   - Price: 850000
   - Quantity: 100
   - Lead Time: 45 days
   - Notes: "Standard delivery terms"
5. Submit

### As Buyer:
1. Logout and login as `buyer@test.com`
2. Go to RFQs
3. Click same RFQ
4. You should see the new bid from Albemarle
5. Click **Award Deal** on the bid
6. Confirm

### As Supplier:
1. Logout and login as `supplier@test.com`
2. Go to **Deals**
3. You should see "Pending" deal
4. Click **Accept**
5. Status changes to "Active"

### As Buyer:
1. Logout and login as `buyer@test.com`
2. Go to Deals
3. Click the "Active" deal
4. Click **Create Purchase Order**
5. Fill in amount: 850000
6. Submit
7. You should see PO-2025-000001 created

### As Supplier:
1. Logout and login as `supplier@test.com`
2. Go to **Purchases**
3. You should see PO-2025-000001
4. Status: Pending

---

## ✅ Success Checklist

- [ ] Auth0 application created and configured
- [ ] 2 test users created with subs copied
- [ ] Environment variables configured
- [ ] Seed data loaded successfully
- [ ] App starts without errors
- [ ] Can login as buyer
- [ ] Can create organization
- [ ] Can see RFQs
- [ ] Can login as supplier
- [ ] Can submit bid on RFQ
- [ ] Buyer can award deal
- [ ] Supplier can accept deal
- [ ] Buyer can create purchase order
- [ ] Supplier can see purchase order

**If all checked → MVP is working!** 🎉

---

## Troubleshooting

### "Cannot read property 'sub' of undefined"
- RLS policy is looking for JWT sub claim
- Make sure you're logged in via Auth0
- Check browser devtools > Application > Cookies for `a0.sX...` cookie

### "Missing org_id in JWT"
- This is expected! We use `current_sub()` which reads Auth0 'sub', not 'org_id'
- Org membership is managed in Supabase `org_members` table
- Ignore this error - it's from old RPC functions

### "User not found in org_members"
- You haven't created an organization yet
- Go to `/onboarding` and create one
- Or the Auth0 sub in seed.sql doesn't match your actual user sub

### "RPC function not found"
- Types might be out of sync
- Run: `supabase gen types typescript --linked > src/integrations/supabase/types.ts`
- Restart dev server

### Can't see any RFQs
- Seed data wasn't loaded
- Re-run `supabase/seed.sql` in SQL Editor
- Make sure you updated Auth0 subs in the script

---

## Next Steps

After MVP is working:
1. Deploy to Netlify/Vercel (Phase 7)
2. Configure production Auth0 callback URLs
3. Invite real users via Team Management (Phase 4)
4. Add custom branding
5. Set up monitoring/analytics

---

## Support

- **Documentation**: See `SKILLS.md` for all RPC functions
- **Implementation Plan**: See `MVP_REVISED_PLAN.md` for full roadmap
- **Status**: See `MVP_STATUS.md` for progress tracking
