
# KYC/Compliance + Company Verification + API Integration: Full Data Architecture & Implementation

## Current State Assessment

### What Already Exists in Supabase
- `kyb_verification_queue` table — stores one row per org's verification request with: `org_id`, `verification_tier` (CHECK: tier1/tier2/tier3), `status` (pending/in_review/approved/rejected/escalated), `submitted_at`, `reviewed_at`, `reviewer_id`, `rejection_reason`, `documents` (JSONB array), `verification_data` (JSONB blob), `risk_score`, `notes`
- `suppliers` table — has a `verification_tier` column that stores the *approved* tier after review passes
- `organizations` table — has `government_id`, `jurisdiction`, `soe_category`, `parent_ministry` (for SOEs already)
- No `api_keys` table exists
- No `kyc_documents` table exists — documents are stored as a raw JSONB array inside `kyb_verification_queue.documents`, with no structure for file metadata, document types, or upload status

### What is Missing (Gaps)
1. `kyb_verification_queue.verification_tier` uses `tier1/tier2/tier3` CHECK constraint but the UI and `Verification.tsx` page also accept `gold/silver/bronze/standard/basic/kyc/lithiumbuy` — these are misaligned and must be reconciled into a single consistent tier system
2. No structured `kyc_documents` table — document metadata (type, upload URL, status, expiry) is buried in a JSONB blob, making it impossible to query, filter, or sync individual documents to Airtable
3. No `api_keys` table
4. `sync-to-airtable` Edge Function has no mappings for `kyb_verification_queue` or `kyc_documents` — these records never reach Airtable
5. Settings page shows "Coming Soon" stubs with no routes
6. Sign-out in `AuthContext.tsx` does not redirect after `supabase.auth.signOut()` — leaves user on a protected page

---

## Data Architecture Design

### Decision: Separate `kyc_documents` Table (Required)
The current JSONB array in `kyb_verification_queue.documents` is inadequate for:
- Per-document status tracking (uploaded, under_review, accepted, rejected)
- Document expiry dates (passports, certificates expire)
- Document type classification (passport, company_reg, tax_cert, etc.)
- Airtable sync (you cannot sync individual array elements)
- File URL storage (where is the actual file in Supabase Storage?)

**New table required:** `kyc_documents`

### Decision: Standardize Tier Names
Use `bronze / silver / gold` as the canonical tier system across the entire platform. The DB CHECK constraint will be updated via migration. The `Verification.tsx` page already shows these correctly.

---

## Complete Schema Plan

### New Table 1: `kyc_documents`
```text
id               UUID PK
kyb_queue_id     UUID FK -> kyb_verification_queue(id) ON DELETE CASCADE
org_id           UUID FK -> organizations(id) ON DELETE CASCADE
document_type    TEXT  NOT NULL  -- 'passport', 'company_registration', 'tax_certificate',
                                 -- 'bank_statement', 'proof_of_address', 'esg_certification',
                                 -- 'product_certification', 'other'
file_name        TEXT  NOT NULL
file_url         TEXT            -- Supabase Storage path
file_size_bytes  BIGINT
mime_type        TEXT
status           TEXT  NOT NULL  DEFAULT 'uploaded'
                                 -- 'uploaded', 'under_review', 'accepted', 'rejected'
rejection_reason TEXT
expires_at       TIMESTAMPTZ     -- for passports, certifications with expiry
uploaded_by      UUID            -- auth.uid()
reviewed_by      UUID            -- admin reviewer
reviewed_at      TIMESTAMPTZ
created_at       TIMESTAMPTZ     DEFAULT NOW()
airtable_id      TEXT            -- Airtable record ID after sync
```

**RLS Policies:**
- Org members can INSERT their own documents (org_id matches their org)
- Org members can SELECT their own documents
- Admins can SELECT and UPDATE all documents (review workflow)

### New Table 2: `api_keys`
```text
id              UUID PK
org_id          UUID FK -> organizations(id) ON DELETE CASCADE
created_by      UUID  -- auth.uid()
name            TEXT NOT NULL
key_hash        TEXT NOT NULL UNIQUE  -- SHA-256 of raw key, never stored raw
key_prefix      TEXT NOT NULL        -- first 16 chars + '...' for display
scopes          TEXT[] NOT NULL DEFAULT '{}'
                -- 'read:rfqs', 'read:auctions', 'write:bids',
                -- 'read:marketplace', 'read:prices', 'webhook'
last_used_at    TIMESTAMPTZ
created_at      TIMESTAMPTZ DEFAULT NOW()
revoked_at      TIMESTAMPTZ  -- NULL = active
expires_at      TIMESTAMPTZ  -- optional expiry
```

**RLS Policies:**
- Org owners/admins can manage keys for their org
- No public SELECT (keys are sensitive)

### Existing Table Modified: `kyb_verification_queue`
Update the `verification_tier` CHECK constraint from `tier1/tier2/tier3` to `bronze/silver/gold`. Add a `UNIQUE(org_id)` constraint so each org has one active submission.

---

## Airtable Architecture

### Two New Airtable Tables Required

**Table A: KYC_Submissions**
Maps from `kyb_verification_queue`:
```
Submission_ID     → id
Org_ID            → org_id
Verification_Tier → verification_tier  (bronze/silver/gold)
Status            → status
Submitted_At      → submitted_at
Reviewed_At       → reviewed_at
Risk_Score        → risk_score
Rejection_Reason  → rejection_reason
Notes             → notes
Document_Count    → (computed: count of linked kyc_documents)
```

**Table B: KYC_Documents**
Maps from `kyc_documents`:
```
Document_ID       → id
Submission_ID     → kyb_queue_id
Org_ID            → org_id
Document_Type     → document_type
File_Name         → file_name
Status            → status
Rejection_Reason  → rejection_reason
Expires_At        → expires_at
Uploaded_At       → created_at
Reviewed_At       → reviewed_at
```

The user needs to create these two tables in their Airtable base and share the Table IDs. The `sync-to-airtable` Edge Function will be extended with field transformers and table mappings for both.

### Two New Secrets Required (User Action)
- `AIRTABLE_KYC_SUBMISSIONS_TABLE` = (Table ID from Airtable for KYC_Submissions)
- `AIRTABLE_KYC_DOCUMENTS_TABLE` = (Table ID from Airtable for KYC_Documents)

---

## RPC Functions Required

### 1. `submit_kyc_verification(p_tier, p_notes)`
- Gets caller's org_id from `org_members`
- Upserts into `kyb_verification_queue` (ON CONFLICT org_id → reset to pending)
- Syncs the new/updated row to Airtable via `sync-to-airtable` Edge Function
- Returns the queue row

### 2. `upload_kyc_document(p_kyb_queue_id, p_document_type, p_file_name, p_file_url, p_file_size_bytes, p_mime_type, p_expires_at)`
- Validates the caller belongs to the org that owns the queue entry
- Inserts into `kyc_documents`
- Syncs to Airtable
- Returns the document row

### 3. `admin_review_document(p_document_id, p_status, p_rejection_reason)`
- Admin-only (checks `is_admin` on profiles)
- Updates `kyc_documents.status` and `reviewed_by`, `reviewed_at`
- Syncs updated document to Airtable

### 4. `admin_review_submission(p_queue_id, p_status, p_rejection_reason, p_notes)`
- Admin-only
- Updates `kyb_verification_queue.status`, `reviewed_at`, `reviewer_id`
- If approved, writes `verification_tier` back to `suppliers.verification_tier`
- Inserts a notification for the org (type: `system`)
- Syncs to Airtable

### 5. `create_api_key(p_name, p_scopes)`
- Gets caller's org_id
- Generates raw key: `lb_live_` + 24 random bytes base64
- SHA-256 hashes it
- Stores hash + prefix in `api_keys`
- Returns raw key (shown once only)

### 6. `revoke_api_key(p_key_id)`
- Sets `revoked_at = now()` for the key belonging to caller's org

---

## Sync-to-Airtable Extension

The `sync-to-airtable` Edge Function will gain two new entries in `tableMapping` and two new entries in `fieldTransformers` for `kyb_verification_queue` and `kyc_documents`. The table IDs come from the new secrets.

---

## Frontend Pages

### Page 1: `src/pages/KYCCompliance.tsx` → `/settings/kyc`
- **Current Status Card**: Reads from `kyb_verification_queue` — shows tier, status, submitted date
- **Document Upload Section**: Lists existing `kyc_documents` for the org. Each row shows: type, file name, status badge, expiry if set
- **Submission Form** (only visible when no pending/in_review submission exists OR previous was rejected):
  - Tier selector (Bronze / Silver / Gold) with tier descriptions
  - Document type + file URL input (or drag-drop if Storage is wired)
  - Notes field
  - Submit calls `submit_kyc_verification` RPC
- **Status Tracker**: Visual stepper (Submitted → In Review → Decision)

### Page 2: `src/pages/CompanyVerification.tsx` → `/settings/company-verification`
- Reads from `kyb_verification_queue` and `kyc_documents`
- Shows a clean status dashboard with the verification tier badge once approved
- Shows document checklist (which document types are accepted vs. still needed)
- If rejected: shows rejection reason and "Resubmit" button
- "Start Verification" → navigates to `/settings/kyc` if not yet submitted

### Page 3: `src/pages/APIIntegration.tsx` → `/settings/api`
- Lists active API keys (name, prefix, scopes, created, last used, active/revoked badge)
- "Create Key" modal: name + scope multi-select → calls `create_api_key` RPC → shows raw key once in a copy-to-clipboard alert
- "Revoke" button per key → calls `revoke_api_key` RPC
- Webhook docs panel (informational)

### Settings Page (`src/pages/Settings.tsx`)
Remove the "Coming Soon" block entirely. Replace with 3 functional `<Link>` cards navigating to the new routes.

### Sign-Out Fix (`src/context/AuthContext.tsx`)
After `await supabase.auth.signOut()` succeeds, add `window.location.href = '/auth'`. This forces a full page reload, clears all React Query cache and in-memory state, and immediately lands the user on the login screen.

---

## Implementation Order

| Step | Action | Type |
|------|--------|------|
| 1 | Fix sign-out redirect in `AuthContext.tsx` | Code edit |
| 2 | SQL Migration: update `kyb_verification_queue` tier CHECK + add UNIQUE(org_id) | DB migration |
| 3 | SQL Migration: create `kyc_documents` table + RLS | DB migration |
| 4 | SQL Migration: create `api_keys` table + RLS | DB migration |
| 5 | SQL Migration: create all 6 RPCs | DB migration |
| 6 | Extend `sync-to-airtable` with KYC table mappings | Edge Function edit |
| 7 | Create `src/pages/KYCCompliance.tsx` | New file |
| 8 | Create `src/pages/CompanyVerification.tsx` | New file |
| 9 | Create `src/pages/APIIntegration.tsx` | New file |
| 10 | Update `src/pages/Settings.tsx` (remove stubs, add links) | Code edit |
| 11 | Update `src/App.tsx` (register 3 new routes) | Code edit |

**User action required before Step 6 runs:** Create `KYC_Submissions` and `KYC_Documents` tables in Airtable and add `AIRTABLE_KYC_SUBMISSIONS_TABLE` and `AIRTABLE_KYC_DOCUMENTS_TABLE` secrets in Supabase.

---

## Data Flow Diagram

```text
User submits KYC
      |
      v
submit_kyc_verification() RPC
      |
      +---> kyb_verification_queue (upsert)
      |
      +---> sync-to-airtable Edge Function
                  |
                  v
            Airtable: KYC_Submissions table

User uploads document
      |
      v
upload_kyc_document() RPC
      |
      +---> kyc_documents (insert)
      |
      +---> sync-to-airtable Edge Function
                  |
                  v
            Airtable: KYC_Documents table

Admin approves submission
      |
      v
admin_review_submission() RPC
      |
      +---> kyb_verification_queue.status = 'approved'
      |
      +---> suppliers.verification_tier = approved tier
      |
      +---> notifications (org notified)
      |
      +---> sync-to-airtable (update KYC_Submissions record)
```
