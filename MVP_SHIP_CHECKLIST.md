# MVP Ship Checklist

## Pre-Flight Checks ✅

### 1. Security (P0 - CRITICAL)
- [x] `.env` file deleted from repo
- [x] `SECURITY.md` created with rotation checklist
- [x] No API keys in frontend code (only agent IDs)
- [ ] **ACTION REQUIRED**: Rotate ElevenLabs API key (was exposed)
- [ ] **ACTION REQUIRED**: Rotate Auth0 credentials (was exposed)

### 2. Environment Variables (P0)
- [x] Standardized to `VITE_SUPABASE_ANON_KEY` everywhere
- [x] `src/config/env.ts` validates all required vars
- [x] `.env.example` updated with safe template
- [x] Legacy `VITE_SUPABASE_PUBLISHABLE_KEY` still supported (migration)

### 3. Bootability (P0)
- [x] App shows clear error if env vars missing
- [x] `/health` page tests connectivity
- [x] Supabase client validates config at runtime

### 4. Non-MVP Modules (P1)
- [x] Billing page shows "Coming Soon" for Pro/Enterprise
- [x] ElevenLabs uses feature flag (`isFeatureEnabled('elevenlabs')`)
- [x] No client-side API keys (agent IDs only)

---

## Local Development

```bash
# 1. Clone and install
git clone <repo>
cd lithiumbuy
npm install

# 2. Create .env from template
cp .env.example .env

# 3. Add your Supabase credentials
# Edit .env:
# VITE_SUPABASE_URL=https://vuekwckknfjivjighhfd.supabase.co
# VITE_SUPABASE_ANON_KEY=<your-anon-key>

# 4. Start dev server
npm run dev

# 5. Verify health
# Navigate to: http://localhost:5173/health
```

---

## Vercel Deployment

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Add environment variables in Vercel dashboard:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_ELEVENLABS_AGENT_ID (optional)

# 4. Redeploy with env vars
vercel --prod
```

---

## Files Changed

| File | Change |
|------|--------|
| `.env` | DELETED (was exposing secrets) |
| `.env.example` | Updated with safe template |
| `SECURITY.md` | Created - key rotation checklist |
| `src/config/env.ts` | Created - runtime validation |
| `src/integrations/supabase/client.ts` | Fixed env var name |
| `src/lib/supabase/authenticated-client.ts` | Fixed env var name |
| `src/pages/Health.tsx` | Created - health check page |
| `src/pages/Billing.tsx` | Added "Coming Soon" badges |
| `src/services/elevenlabs-multi-agent.service.ts` | Removed API key, added feature flag |
| `src/App.tsx` | Added /health route |

---

## Remaining Manual Steps

1. **Rotate Exposed Keys** (see SECURITY.md)
   - ElevenLabs API key
   - Auth0 credentials

2. **Clean Git History** (optional but recommended)
   ```bash
   bfg --delete-files .env
   git push --force-with-lease
   ```

3. **Add Edge Function Secrets** (for ElevenLabs)
   ```bash
   supabase secrets set ELEVENLABS_API_KEY=your-new-key
   ```

---

## Expected Outcomes

After completing this checklist:
- ✅ App boots from `.env.example` + credentials
- ✅ No secrets in repo
- ✅ `/health` shows all green checks
- ✅ Auth works (login/logout)
- ✅ Marketplace loads suppliers
- ✅ RFQs/Bids work end-to-end
- ✅ Non-MVP features are flagged "Coming Soon"
