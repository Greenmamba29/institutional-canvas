# LithiumBuy - Quick Start Guide

## Get Your MVP Running in 20 Minutes

**Last Updated**: January 11, 2026  
**Authentication**: Supabase Auth (Native)

---

## Prerequisites

- [ ] Supabase project set up
- [ ] Node.js 18+ installed
- [ ] Git repository cloned

---

## Step 1: Configure Environment Variables (2 minutes)

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. Get Supabase credentials:
   - Go to https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
   - Copy **Project URL** and **anon public** key

---

## Step 2: Install Dependencies (2 minutes)

```bash
npm install
# or
bun install
```

---

## Step 3: Run Database Migrations (5 minutes)

### Option A: Via Supabase CLI (Recommended)

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Push all migrations
supabase db push
```

### Option B: Via Dashboard

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copy contents of each migration file in `supabase/migrations/` (in order by filename)
3. Run each migration

---

## Step 4: Load Seed Data (2 minutes)

1. Open `supabase/seed.sql`
2. Go to Supabase SQL Editor
3. Paste and run the seed script

### Verify Seed Data

```sql
SELECT * FROM organizations;
SELECT * FROM suppliers;
SELECT * FROM products;
```

---

## Step 5: Start Development Server (1 minute)

```bash
npm run dev
# or
bun dev
```

Open http://localhost:5173

---

## Step 6: Test the Application (5 minutes)

### 6.1 Create an Account

1. Click **Sign Up**
2. Enter your email and password
3. Check email for confirmation link (or use Supabase Dashboard to confirm)

### 6.2 Create Organization

1. After login, you'll be redirected to `/onboarding`
2. Choose organization type: **Buyer** or **Supplier**
3. Enter organization details
4. Click **Create Organization**

### 6.3 Explore Features

**As a Buyer:**
- View Dashboard with live metrics
- Browse RFQs and create new ones
- Review bids from suppliers
- Award deals and manage purchases

**As a Supplier:**
- View Dashboard with supplier metrics
- Browse open RFQs
- Submit competitive bids
- Manage deals and TeleBuy sessions

### 6.4 Test TeleBuy

1. Go to **TeleBuy** in navigation
2. Click **New TeleBuy Session**
3. Select a supplier and schedule a meeting
4. Session will appear in your list

---

## ✅ Success Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Seed data loaded
- [ ] App starts without errors
- [ ] Can create account via Supabase Auth
- [ ] Can create organization
- [ ] Can see Dashboard
- [ ] Can navigate to RFQs, Deals, TeleBuy
- [ ] Can create TeleBuy session

**If all checked → You're ready!** 🎉

---

## Troubleshooting

### "User not found in org_members"

- You haven't created an organization yet
- Go to `/onboarding` and create one

### "RPC function not found"

- Types might be out of sync
- Run: `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts`
- Restart dev server

### Can't see any RFQs

- Seed data wasn't loaded
- Re-run `supabase/seed.sql` in SQL Editor

### Authentication redirect loop

- Clear browser cookies/storage
- Verify Supabase URL and anon key are correct

---

## Architecture Overview

```
Frontend (React + Vite)
    ↓
Context Layer (Auth, Org, Role)
    ↓
Hooks (useRFQs, useBids, useTelebuy, etc.)
    ↓
Service Layer (authenticated RPC calls)
    ↓
Supabase (RLS-protected PostgreSQL)
```

### Key Patterns

1. **All writes go through RPC functions** (enforced by service layer)
2. **All RPCs use authenticated Supabase client** (JWT included)
3. **Real-time subscriptions** auto-refresh data grids
4. **Zod validation** on all inputs before RPC calls

---

## Next Steps

1. **Deploy to Vercel** - See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
2. **Invite team members** - Use Team Management in Settings
3. **Run TeleBuy migration** - For video session RPCs
4. **Add custom branding** - Update styles and logos
5. **Set up monitoring** - Vercel Analytics, Supabase logs

---

## Documentation

- **[ARCHITECTURAL_REVIEW.md](./ARCHITECTURAL_REVIEW.md)** - Complete architecture and implementation plan
- **[GAP_ANALYSIS_ROAST.md](./GAP_ANALYSIS_ROAST.md)** - Gap analysis and status
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Production deployment guide
- **[SECURITY_FIXES.md](./SECURITY_FIXES.md)** - Security implementation details

---

## Support

**Repository**: https://github.com/yourusername/institutional-canvas  
**Supabase Docs**: https://supabase.com/docs  
**React Query Docs**: https://tanstack.com/query
