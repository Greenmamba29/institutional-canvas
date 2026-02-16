

# Fix Recycling Page + Schema Alignment

## The Core Problem

The Recycling page (`src/pages/Recycling.tsx`) references field names that DO NOT EXIST in the `products` table schema. The actual schema (from `types.ts`) has these fields:

| Actual Field | What Recycling.tsx Uses | Status |
|---|---|---|
| `name` | `name` | Correct |
| `product_type` | `product_type` | Correct |
| `price_per_unit` | `price_per_unit` | Correct |
| `purity_level` | `purity` / `grade` | WRONG -- should be `purity_level` |
| `min_order_quantity` | `minimum_order_quantity` | WRONG -- should be `min_order_quantity` |
| `unit` | `unit` | Correct |
| `availability` | (not used) | Should show availability |
| `currency` | (not used) | Should use for price display |
| (does not exist) | `description` | WRONG -- field doesn't exist |
| (does not exist) | `grade` | WRONG -- use `purity_level` |
| (does not exist) | `certifications` | WRONG -- field doesn't exist |

## What Will Change

### 1. Rewrite `src/pages/Recycling.tsx` to use REAL schema fields

- Replace `item.description` with product type label (no description field exists)
- Replace `item.grade || item.purity` with `item.purity_level`
- Replace `item.minimum_order_quantity` with `item.min_order_quantity`
- Replace `item.certifications` check with `item.availability` status
- Add `item.currency` to price display instead of hardcoded `$`
- Fix Airtable query to fetch ALL recycling types, not just black_mass
- Remove `TYPE_ICONS` (declared but never used)

### 2. No changes to routing or auth

- `/recycling` route already exists in `App.tsx` line 88 -- verified working
- Google Auth code is correct -- the 403 is a Supabase Dashboard redirect URL configuration issue (not code)
- All other files from the uploaded `.md` already match the current codebase (verified each one)

## Files Verified as Already Matching .md (NO CHANGES NEEDED)

| File | Status |
|---|---|
| `src/lib/auth/config.ts` | Identical |
| `src/services/telebuy.service.ts` | Matches (uses `callRpc` with `as any` cast) |
| `src/components/shared/VerificationBadge.tsx` | Identical (includes `lithiumbuy` tier) |
| `src/hooks/useRealtimeSubscription.ts` | Matches |
| `src/hooks/useMarketIntel.ts` | Matches |
| `src/services/market-intel.service.ts` | Matches |
| `src/services/airtable-crud.service.ts` | Identical |
| `src/hooks/useSubscriptionTier.ts` | Identical |
| `src/hooks/useAuctionParticipants.ts` | Matches |
| `src/services/auction-participants.service.ts` | Matches |

## Technical Details

### File: `src/pages/Recycling.tsx` (REWRITE)

Key changes in the rewrite:

- Query the `products` table using only fields that exist: `name`, `product_type`, `price_per_unit`, `purity_level`, `min_order_quantity`, `unit`, `availability`, `currency`, `has_bulk_discount`, `bulk_discount_percentage`
- Fix Airtable query to use `OR({Type}='black_mass',{Type}='recycled_lithium',{Type}='cathode_scrap')` instead of only `{Type}='black_mass'`
- Card display: show `purity_level` for Grade, `min_order_quantity` for Min Order, `currency` + `price_per_unit` for Price, `availability` as a badge, `has_bulk_discount` indicator
- Remove all `any` types -- use proper Product type from generated types
- Remove unused `TYPE_ICONS` constant

### Google Auth 403 Fix (NOT a code change -- Dashboard configuration)

You must add these redirect URLs in two places:

**Supabase Dashboard** (Authentication > URL Configuration > Redirect URLs):
- `https://id-preview--7bc09c97-db33-42bd-a64e-3fad7765ce5a.lovable.app/auth/callback`
- `https://lithiumbuy.lovable.app/auth/callback`

**Google Cloud Console** (APIs > Credentials > OAuth Client > Authorized redirect URIs):
- `https://vuekwckknfjivjighhfd.supabase.co/auth/v1/callback`

This is the ONLY way to fix the 403. No code change resolves this.

---

## Airtable Update Report

For the Recycling page and sitewide data to fully function, these Airtable tables and fields are required:

### Products Table (Recycling page reads this)
| Field Name | Field Type | Values/Notes |
|---|---|---|
| Name | Single line text | Material name |
| Type | Single select | `black_mass`, `recycled_lithium`, `cathode_scrap`, `anode_scrap`, `electrolyte_recovery` |
| Grade | Single line text | e.g. "Battery Grade", "Technical Grade" |
| Specifications | Long text | Technical specs |
| Supplier | Single line text | Supplier name |
| Price_Range | Single line text | e.g. "$12,000-$15,000/MT" |
| Availability | Single select | `in_stock`, `limited`, `pre_order`, `out_of_stock` |
| Certifications | Multi-select | `ISO_14001`, `REACH`, `Basel_Convention`, `EU_Battery_Regulation` |
| ESG_Compliant | Checkbox | Boolean |

### Market_Intelligence Table
| Field | Type |
|---|---|
| Query | Single line text |
| Category | Single select: `price`, `news`, `auction`, `company` |
| Content | Long text |
| Source | Single line text |
| Timestamp | Date/time |

### Auction_Companies Table
| Field | Type |
|---|---|
| Company_Name | Single line text |
| Company_Type | Single select |
| Auction_Role | Single select: `buyer`, `seller`, `broker` |
| Country | Single line text |
| Verification_Tier | Single select: `gold`, `silver`, `bronze`, `basic` |
| KYC_Status | Single select: `verified`, `pending`, `rejected` |

### Auction_Contacts Table
| Field | Type |
|---|---|
| Company_ID | Linked record (to Auction_Companies) |
| Contact_Full_Name | Single line text |
| Job_Title | Single line text |
| Lead_Status | Single select: `active`, `inactive`, `prospect` |

### Analytics_Events Table
| Field | Type |
|---|---|
| Event_Type | Single line text |
| Event_Data | Long text (JSON) |
| Timestamp | Date/time |
| User_ID | Single line text |

### GMV_Metrics Table
| Field | Type |
|---|---|
| Period | Single line text (e.g. "2026-Q1") |
| Total_GMV | Currency |
| Transaction_Count | Number |
| Avg_Deal_Size | Currency |

