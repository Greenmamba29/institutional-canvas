# MVP Gap Analysis Report
**Date:** 2026-01-09  
**Status:** MVP Ship-Ready (with noted limitations)

---

## ✅ COMPLETED FIXES

### Phase A: Security & Hygiene
| Issue | Status | Details |
|-------|--------|---------|
| `.env` with secrets committed | ✅ FIXED | Deleted from repo |
| `SECURITY.md` rotation checklist | ✅ CREATED | Lists all exposed keys |
| Env var naming mismatch | ✅ FIXED | Standardized on `VITE_SUPABASE_ANON_KEY` |
| Runtime env validation | ✅ CREATED | `src/config/env.ts` |
| ElevenLabs API key in frontend | ✅ FIXED | Removed, requires Edge Function |

### Phase B: RPC-Only Write Enforcement
| File | Violation | Status |
|------|-----------|--------|
| `QuoteRequestModal.tsx` | `.insert("quotes")` | ✅ FIXED → `createQuote()` RPC |
| `WriteReviewModal.tsx` | `.insert("reviews")` | ✅ FIXED → `createReview()` RPC |
| `SupplierReviews.tsx` | `.update("reviews")` | ✅ FIXED → `incrementReviewHelpful()` RPC |
| `CreateSessionModal.tsx` | `.insert("telebuy_sessions")` | ✅ FIXED → `createTelebuySession()` RPC |
| `VideoCallRoom.tsx` | `.update("telebuy_sessions")` | ✅ FIXED → `updateTelebuyNotes()` RPC |

### Phase C: CI & Enforcement
| Item | Status |
|------|--------|
| ESLint config updated | ✅ Added RPC violation warnings |
| `scripts/check-rpc-violations.sh` | ✅ CREATED |
| `scripts/ci.sh` | ✅ CREATED |

### Phase D: Non-MVP Module Handling
| Module | Decision | Status |
|--------|----------|--------|
| ElevenLabs | Feature-flagged OFF | ✅ Agent IDs only, no API keys |
| Knowledge Base | Disabled | ✅ `features.knowledgeBase = false` |
| Billing | Coming Soon UI | ✅ Pro/Enterprise disabled |
| Agent Setup | Disabled | ✅ Requires Edge Function |

---

## 📊 DATABASE RPCs CREATED

```sql
-- New RPC functions added:
create_quote(p_supplier_id, p_product_id, p_quantity, p_requested_price, p_expires_at, p_notes)
create_review(p_supplier_id, p_rating, p_content, p_author, p_company, p_verified_purchase)
increment_review_helpful(p_review_id)
update_telebuy_notes(p_session_id, p_notes)
```

---

## ⚠️ KNOWN LIMITATIONS (Non-Blocking for MVP)

### 1. Pre-Existing Security Warnings
The database linter shows 27 warnings that existed before this fix cycle:
- 2 INFO: RLS enabled but no policies (review which tables)
- 20 WARN: Function search_path not set (existing functions)
- 2 WARN: Extensions in public schema
- 1 WARN: Permissive RLS policy (USING true)
- 1 WARN: Leaked password protection disabled

**Recommendation:** Address in post-MVP hardening sprint.

### 2. ElevenLabs Full Integration
- Agent IDs work (widget can connect)
- Agent creation/updates require Edge Function deployment
- `AgentSetup.tsx` is disabled until server-side ready

### 3. Knowledge Base
- Table `lithium_knowledge_base` not created
- Feature disabled in config
- Remove from nav or implement in v1.1

---

## 📁 FILES CHANGED

### Created
- `src/config/env.ts` - Environment validation
- `src/services/quotes.service.ts` - Quote RPC wrapper
- `src/services/reviews.service.ts` - Review RPC wrapper
- `src/pages/Health.tsx` - Health check page
- `scripts/check-rpc-violations.sh` - CI enforcement
- `scripts/ci.sh` - CI pipeline
- `SECURITY.md` - Key rotation checklist
- `MVP_SHIP_CHECKLIST.md` - Deployment guide

### Modified
- `src/integrations/supabase/client.ts` - Env var fix
- `src/lib/supabase/authenticated-client.ts` - Env var fix
- `src/services/telebuy.service.ts` - RPC wrappers
- `src/services/elevenlabs.service.ts` - Removed API key
- `src/services/elevenlabs-multi-agent.service.ts` - Feature flag
- `src/services/index.ts` - Export new services
- `src/components/suppliers/QuoteRequestModal.tsx` - Use RPC
- `src/components/reviews/WriteReviewModal.tsx` - Use RPC
- `src/components/suppliers/SupplierReviews.tsx` - Use RPC
- `src/components/telebuy/CreateSessionModal.tsx` - Use RPC
- `src/components/telebuy/VideoCallRoom.tsx` - Use RPC
- `src/pages/AgentSetup.tsx` - Disabled until server-side
- `src/pages/Billing.tsx` - Coming Soon badges
- `src/App.tsx` - Added /health route
- `eslint.config.js` - RPC violation rules
- `.env.example` - Updated template

### Deleted
- `.env` - Contained exposed secrets

---

## 🚀 MVP SHIP READINESS

| Criteria | Status |
|----------|--------|
| No secrets in repo | ✅ |
| Env vars consistent | ✅ |
| Runtime validation | ✅ |
| Auth flow works | ✅ |
| Org onboarding works | ✅ |
| Marketplace reads work | ✅ |
| RFQ create/list works | ✅ |
| Bid submit/list works | ✅ |
| RPC-only writes enforced | ✅ |
| Non-MVP features disabled | ✅ |
| Health check available | ✅ `/health` |

---

## 🔑 KEY ROTATION REQUIRED

See `SECURITY.md` for full checklist. Critical items:
1. **ElevenLabs API Key** - Regenerate in ElevenLabs dashboard
2. **Auth0 credentials** - Regenerate if previously exposed

---

## NEXT STEPS (Post-MVP)

1. Address pre-existing security warnings
2. Deploy `elevenlabs-agent-proxy` Edge Function
3. Create `lithium_knowledge_base` table or remove feature
4. Implement Stripe billing integration
5. Add Sentry error tracking
