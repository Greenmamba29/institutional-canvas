# LithiumBuy.com: Master Plan and Research Synthesis

**Prepared:** 2026-11-07
**Scope:** Everything we know about LithiumBuy, pulled from (a) the `institutional-canvas` codebase, (b) the SWOT analysis from this session, and (c) the 11 documents the founder uploaded. It ends in a prioritized, phased build and go-to-market plan.

> **How to read this.** Section 1 says where each fact came from. Sections 2 to 4 cover what the documents say and what they mean for users. Sections 5 to 8 are the plan. Section 9 lists the user research still needed to confirm the plan. When a number comes from **synthetic** or **sample** data, it is labeled that way.

---

## 0. Executive summary

1. **The vision and the code don't match yet.** The pitch deck promises blockchain smart contracts, one-click logistics and customs, "molecular provenance," and agent-to-agent trading. The repo has a strong procurement, auction, grant and compliance core but none of those deck features. Either we build them or we change the pitch. Recommendation: **change the pitch now and build in phases** (Section 6).
2. **The fastest path to revenue is recycling feedstock plus grants, not spot lithium trading.** The outreach map already positions LithiumBuy as the **feedstock aggregation and procurement layer** inside recycling consortia led by DOE-funded partners. The codebase has collection sites, battery inventory, chain of custody, processing orders and a grant engine. That is the wedge.
3. **Trust is the product, and the live site is spending it.** The landing page claims "$2.4B+ traded," "312 suppliers," "847+ companies," "#1 marketplace," and "Trusted by Tesla, CATL, Panasonic, BYD, Samsung SDI, LG Energy." None of these can be backed up from the data we have. For institutional buyers and federal partners, this is the biggest single risk. Fix it before any outreach.
4. **We have a real supplier dataset to seed the marketplace.** The `lithiumbuy_suppliers_master.csv` file lists 1,199 companies: 375 miners, 203 refiners, 200 converters, 180 recyclers, 139 traders, across about 100 countries. It has **no contact data** and needs cleaning (Section 2.4). It maps directly onto the existing "claimable supplier profile" model in Supabase.
5. **The revenue workbook is placeholder data, not a forecast.** All 200 buyers, 200 suppliers, 200 graph nodes and 200 acquisition targets are synthetic ("Supplier 0001"). Its implied $28.6B GMV and $275M take-rate revenue **must not appear in any pitch**. Keep the structure; replace the numbers.
6. **The federal deadlines in our files have passed.** DOE DE-FOA-0003585 closed 2026-04-24, the Army SBIR topics closed 2026-04-30, and the State Dept NOFO PDS-BUE-2026-04 closed in May 2026. For-profits weren't eligible for that NOFO anyway. The partner list is still valuable. The pipeline needs a refresh for FY27.
7. **Engineering hygiene comes first.** Make.com is removed (this branch). Three more edge functions have no authentication, webhook and cron secret checks fail open, and CI doesn't check types or lint. These ship in Phase 0, ahead of any feature work.

---

## 1. Source index

| # | Document (upload) | Type | What it is | Reliability |
|---|---|---|---|---|
| D1 | LithiumBuy: Powering the Next Generation of Energy Markets (.pptx ×2, .pdf) | Pitch deck, 10 slides | Vision, problem, features, roadmap. The two .pptx files have identical text; the PDF is the same deck. | Vision statements; no data |
| D2 | `lithiumbuy_suppliers_master.csv` (×2, identical by checksum) | Dataset, 1,199 rows | Global lithium company directory | Real company names; needs cleaning; no contacts |
| D3 | `LithiumBuy_Operational_Tops200_Revenue_Workbook_FILLED.xlsx` | Model template | Auction, supplier, buyer, knowledge-graph and acquisition tabs | **Synthetic**; its own README says so |
| D4 | `lithiumbuy_outreach_procurement_map.xlsx` | Research handoff | 17 named partner contacts, 10 federal channels, partner-to-lane map, sources | Real orgs/URLs; deadlines now past; set-aside status unverified |
| D5 | Grand View Research: Li-ion Battery Recycling Market (sample, 68 pp) | Market report sample | Market size, segments, regulations, competitors | **Sample**; most figures paywalled |
| D6 | Hybrid Clean-Energy Lithium Battery Recycling Visual Tutorial (4 pp) | Process overview | Feedstock → discharge → preprocess → direct / hydromet → offtake | High level; explicitly not engineering instructions |
| D7 | NOFO PDS-BUE-2026-04, U.S.-Argentina Lithium Tech & Transparency Initiative (22 pp) | Federal funding notice | $50–100K cooperative agreement, Lithium Triangle governance training | Official; closed; for-profits ineligible |
| D8 | `LITHIUMBUY_SOURCE.md` | Legacy code | Earlier Vite/React 19 JSX site (Netlify), 8 pages, mock products | Superseded by the current repo |
| R | `institutional-canvas` repo + SWOT (this session) | Code | React 18 + Supabase + 26 (now 24) edge functions, 69 (now 70) migrations | Verified by running checks |

---

## 2. Document-by-document extraction

### 2.1 D1: Pitch deck

**Positioning:** "The Molecular Marketplace for a Sustainable Future." It describes itself as a command center for global lithium trading. Contact is listed as `lithiumbuy.io` / `vision@lithiumbuy.io`, which conflicts with lithiumbuy.com (see Section 7.1).

| Slide | Claim / feature | Exists in repo? | Gap |
|---|---|---|---|
| 2 | Energy storage (ESS) is the fastest-growing demand pillar; robots are an emerging source of demand | n/a | Needs a cited source in the deck |
| 3 | Problem: no real-time pricing, opaque supply chains, manual procurement, ESG provenance risk | Price feed ✓ (Firecrawl ingest, FX-normalized); RFQ/bid/deal ✓ | Mostly addressed |
| 4 | "Streamlined Frame" UI: minimalist, agentic UX, dark mode, live supply-chain maps | Dark UI ✓; AI agents ✓ (ElevenLabs, AI Studio) | **No supply-chain map** |
| 5 | Real-time bidding | Auctions with anti-sniping ✓ | Done |
| 5 | Integrated logistics: one-click shipping and customs | ✗ | Not built; partner instead (freight forwarder/customs-broker API) |
| 5 | Smart contracts: blockchain escrow and settlement | ✗ (an "Escrow System" feature flag exists; no ledger) | Not built. Escrow via a regulated escrow/payments partner beats blockchain here |
| 6 | Lithium Intelligence (LI): predictive pricing, trade-timing advice, explainable AI | Partial. `price-forecast.service.ts` says "uses mock data for demo" | Needs real models on real price history |
| 7 | "Molecular provenance": every gram tracked mine-to-cell on blockchain | Chain-of-custody tables and events ✓ (no blockchain) | Wording is not technically credible. Reframe as batch-level digital chain of custody aligned with the EU Battery Passport |
| 7 | Sustainability/ESG score per batch | ESG fields scattered across Recycling/KYC pages | No scoring model |
| 7 | Integrated recycling marketplace | Recycling + compliance system ✓ | Done (core) |
| 8 | Agent-to-agent trading; grid API integration; cobalt/nickel/vanadium | Agent/skill policy layer ✓ (foundation) | Future (2027+) |
| 9 | Roadmap: P1 Q1–Q2 2026, P2 Q3–Q4 2026, P3 2027+ | — | P1 smart contracts and logistics slipped; P2 partly done |

### 2.2 D3: Revenue workbook (synthetic)

- **Tabs:** Auction (5 draft auctions), Suppliers_Top200, Buyers_Top200, Knowledge_Graph (200 nodes), Acquisition_Model_Top200, README.
- **Useful parts are the schema and the scoring dimensions.** The numbers are not usable.
  - Suppliers: capacity in metric tons per month, average contract price, margin, **trust score 0–100**, **verification tier (Bronze/Silver/Gold/Platinum)**, financial strength, revenue impact.
  - Buyers: buyer type (ESS integrator, recycler/refiner, cathode maker, cell maker, OEM, trader), annual volume, average bid size, **capital strength, payment reliability, price sensitivity**, **platform take rate of 0.6–1.5%**.
  - Auctions: commodity (Li carbonate, Li hydroxide, **recycled Li salts**), grade, volume, **Incoterms (DDP/CIF)**, reserve vs expected clearing price, **escrow_required**, **minimum verification tier**.
  - Knowledge graph: node type (extraction, refining, recycling, port/rail, logistics hub), bottleneck, inefficiency and arbitrage scores, edges.
  - Acquisition model: recycler/refiner/plant targets, debt ratio, IRR, chokepoint score. This points to a possible **roll-up strategy**.
- **Defects to fix before using it as a template:** `end_time_utc` holds an unrendered template string (`2026-03-{10+i:02d}`). Some region values are wrong (Australia tagged LATAM). The DB verification tiers are bronze/silver/gold only, while the workbook adds **Platinum**.
- **Do not cite:** synthetic totals ($28.6B buyer GMV; ~$275M platform revenue).

### 2.3 D4: Outreach and U.S. procurement map

**Core strategic recommendation (from the file):** *"LithiumBuy should position as the feedstock aggregation, procurement, and partner-orchestration layer inside a larger consortium. The biggest open DOE battery NOFO still requires a 50% non-federal cost share, so larger industrial recyclers/processors remain the better anchors."*

**Tier 1 partners (11):**

| Company | Role | Best lane |
|---|---|---|
| Rebuilders Automotive Supply (RAS) | End-of-life EV/hybrid battery aggregation; salvage-yard streams | DOE Topic 2, DLA disposal |
| seLictive Recycling | Black mass / lithium recovery | DOE Topic 2, DLA |
| American Renewable Metals | Hydromet, e-waste; *veteran-owned per teaming sheet (verify in SAM)* | DOE Topic 2, set-aside |
| Flathead Recycling | Regional collection / feedstock | DOE Topic 2, state/local |
| OnTo Technology | Recycling process tech | DOE Topic 2, Army |
| Palladias | Unconventional feedstock recovery | DOE Topic 2 |
| T5 Smackover Operating | Domestic lithium processing anchor | DOE Topic 1 |
| Lithosphere Industries | Materials/components manufacturing | DOE Topic 1/3 |
| Quinn Process Equipment | Pilot / scale-up equipment | Technical subcontractor |
| McCarl's Technical Services | EPC / commissioning | Technical subcontractor |
| Electrochemistry Foundry | Pilot manufacturing | Army SBIR, DOE |

**Tier 2 (6):** Liberty Ion (proposal writing), Strategic Analysis (techno-economic and life-cycle analysis), RTI International (research and life-cycle analysis), Linde (industrial gases), Ramboll (permitting), Essential Leap (commercialization; minority- and woman-owned per its site).

**Channels:** DOE DE-FOA-0003585 (closed 2026-04-24), Army battery SBIR topics (closed 2026-04-30), DOE Office of Science SBIR (closed May 2026), plus the **rolling channels that still matter**: DOE Acquisition Forecast, DOE Office of Small Business Programs, SAM.gov set-aside search, GSA Multiple Award Schedule, DLA safe battery disposal (signal), DoD Lithium Battery Strategy (signal). NC DEQ grant: reference only.

**What the product needs from this:** the grant engine must model **consortium roles**, **cost-share %**, **applicant-type eligibility**, **set-aside status** and **teaming partners**. Today it doesn't (the `grants` table has no eligibility-type, cost-share or role fields).

### 2.4 D2: Supplier master (1,199 rows)

| Dimension | Finding |
|---|---|
| Types | miner 375 · refiner 203 · converter 200 · recycler 180 · trader 139 · other 102 |
| Regions | APAC 599 · **NA (North America) 315** · EU 177 · LATAM 59 · MENA 26 · Africa 14 · Other 9 |
| Countries | ~100 distinct values; China 298 · USA 201 (split as "USA" 163 / "United States" 36 / others) · Australia 126 · Canada 90 · India 62 |
| U.S. recyclers | 24 (top domestic outreach list for the recycling wedge); global recyclers: China 67, USA 20+, Germany 16, India 14 |
| Scale | medium 957 · small 149 · large 93 |
| Contacts | **0%** have email, phone, LinkedIn or employee band. Every one of those columns is empty |
| Quality defects | 34 duplicate names (e.g. 3× Evergold Minerals), 49 duplicate websites, 49 blank websites, country name variants (USA/United States, UK/United Kingdom), multi-country values ("Canada, Argentina"), some mislabeled types (CATL tagged "miner") |
| **Import trap** | Default CSV parsers (pandas, many ETL tools) read the region code `NA` as *null*, which silently drops North America. Import with NA-detection off |

**Use:** seed `suppliers` as **unclaimed public profiles** (the table already has `claim_status`, `claim_token_hash`, `invited_email`, `verification_tier`). Each profile is a lead and an SEO page ("Pilbara Minerals: lithium supplier profile"). Enrichment (contacts, LinkedIn) has to be sourced and consented separately.

### 2.5 D5: Battery recycling market (Grand View sample)

- Global Li-ion battery recycling: **USD 138.62M in 2023, 44.8% CAGR to 2030** (sample figure; other analysts publish much larger numbers. Get the licensed report before citing a total addressable market).
- Transportation (EV) = **68.8%** share in 2023. The sample contradicts itself on the fastest-growing segment (industrial at 38.4% vs transportation "fastest"). Treat with caution.
- **Asia Pacific fastest growing** (China, Australia, Japan). That matches D2, where 67 of 180 recyclers are Chinese.
- Driver: recycled lithium costs less than mined lithium; EV and UPS growth. **Restraint: high recycling cost** (specialized equipment, hazmat, labor). **Opportunity: build collection infrastructure where none exists.**
- U.S. rules vary by state; Li-ion is classed as miscellaneous hazardous waste (packaging/labeling/shipping rules); California retailers must offer free take-back.
- Named players: Call2Recycle, Umicore, Retriev, Exide, Li-Cycle, Redwood (partner mention), Glencore, Fortum, Duesenfeld, Aqua Metals, Sumitomo Metal Mining, Dowa, Neometals, Accurec, AkkuSer, Lithion, Batrec.
- Cost model components: capital (equipment, land, storage, vehicles), maintenance (~2.5% of capital per year), collection, labor, processing.

**What the product needs:** the high-cost restraint is the core pain we can solve. Aggregation lowers collection cost per ton, auctions improve price discovery for black mass, and compliance automation lowers hazmat admin cost.

### 2.6 D6: Recycling process tutorial

Steps: **define feedstock and acceptance QA** (chemistry ID, state of charge, damage triage) → **safe discharge and quarantine** for damaged packs → **mechanical preprocessing** → **decision split:** direct recycling (recoverable cathode) vs hydromet (mixed/low grade) → recover cathode or leach Ni/Co/Mn/Li → **offtake strategy**, with packaging, traceability and chain of custody → **electrified utilities** (solar, storage, heat pumps, closed-loop water).

**What the product needs (most of it maps to our tables):**

| Process step | Product requirement | Current table |
|---|---|---|
| Acceptance QA | Intake form: chemistry, state of charge, damage class, quarantine flag | `battery_inventory` (extend) |
| Discharge / quarantine | Hazard status and quarantine workflow; fire-risk alerting | new fields + `compliance_audit_logs` |
| Direct vs hydromet split | Routing decision recorded per lot; drives which processor/auction | `processing_orders` (add `route`) |
| Black mass / salts / Cu-Al outputs | Output lots become **listable auction commodities** | `processing_orders` → `auctions` |
| Traceability | Custody event at every handoff | `chain_of_custody` ✓ |
| Clean-energy utilities | Low-carbon proof feeds an ESG score | new `esg_attestations` |

### 2.7 D7: NOFO PDS-BUE-2026-04 (U.S.–Argentina Lithium Tech & Transparency)

- $50–100K, **one** cooperative agreement, 8–12 months (Sept 2026 to Aug 2027), Smith-Mundt public diplomacy funds. Audience: provincial mining officials, scientists and graduate students in **Salta, Jujuy, Catamarca**.
- **Eligibility: non-profits, universities, public international organizations, governments only. For-profits are not eligible.** Only one non-profit can be prime; others may be subcontractors.
- Deadline appears as **May 31** on the cover and **May 15, 2026, 5 PM Argentine time** in the body. The notice contradicts itself, and both dates have passed.
- Scoring: program idea 30 · organizational capacity 25 · planning 20 · budget 10 · monitoring and evaluation 10 · sustainability 5. Tie-break: lower indirect cost rate.
- Outcomes: at least 80% of participants show improved understanding; reduce permitting time by 50%.

**What it means for us:**
1. LithiumBuy can join only as a **subcontractor or content partner** to a university/NGO prime (e.g. offering a transparent-pricing and chain-of-custody training module).
2. The **grant engine must model eligibility by applicant type**. Showing for-profit Pro customers a NOFO they can't apply for erodes trust in the "eligibility engine."
3. **LATAM supply relationships.** D2 has 59 LATAM companies (Argentina 14, Chile 17, Brazil 22). The transparency theme fits our pitch.

### 2.8 D8: Legacy source (`LITHIUMBUY_SOURCE.md`)

The earlier site: Vite + React 19 JSX on Netlify, a localStorage "login," a cart, 8 mock products. It is **superseded** by the current repo. Do not carry over:
- the fake team ("Sarah Chen, former Tesla procurement lead," etc.),
- the fake **"ISO 9001 Certified / SOC 2 Type II / GDPR Compliant"** badges,
- the 555 phone number and "San Francisco, CA" address.
- This is where the README's "React 19" claim came from; the current app runs React 18.3.

Worth keeping: the product taxonomy (battery/technical-grade carbonate, LiOH·H₂O, spodumene 6%, LiCl, Li metal, LFP, NMC 811) as a category seed.

---

## 3. Research synthesis (affinity map → insights)

### 3.1 Themes

| Theme | Evidence | Insight |
|---|---|---|
| **T1. Trust before transactions** | D1 slide 3 (opacity); D3 trust and verification tiers; D7 transparency theme; the landing page's unbacked claims | Institutional buyers and federal partners judge credibility before features. Verified tiers, real stats and auditable custody are the product. |
| **T2. Recycling is the wedge** | D4 strategy; D5 cost restraint; D6 process; D2's 180 recyclers; repo compliance system | Aggregating fragmented end-of-life batteries and listing black mass and salts is under-served. We already have the system for it. |
| **T3. Non-dilutive money drives adoption** | D4 channels; D7; repo grant engine and federal ingest | Small recyclers and processors adopt tools that help them win cost-shared grants. A consortium-builder is a hook. |
| **T4. Compliance is a calendar, not a feature** | CLAUDE.md regulations (NJ 2025/26/27, WA 2027, EU 2025–2030); D5 state patchwork | Customers need deadline-driven obligations per jurisdiction, not static pages. |
| **T5. Pricing intelligence must be honest** | D1 LI promises; mock forecast service; recent commit adding a 35% sanity cap on arbitrage margins | Explainable, sourced, conservative pricing beats "predict before it happens." |
| **T6. Data is the moat, and today it's thin** | D2 has 0% contacts; D3 all synthetic | Supplier claiming, verification, and real transaction and price history must be built deliberately. |
| **T7. Vision versus practicality** | D1 blockchain, molecular tracking, grid APIs | Pitch credibility goes up when the wording matches what exists, with the rest labeled as a roadmap. |

### 3.2 Personas (hypotheses to confirm in Section 9)

| Persona | Org type (D2/D3) | Job to be done | Top pains | LithiumBuy answer |
|---|---|---|---|---|
| **Riley, Feedstock Aggregator** | Salvage/collection (RAS, Flathead) | "Turn scattered end-of-life packs into sellable, compliant lots" | Hazmat logistics, price opacity, paperwork | Collection sites, intake QA, custody, black mass auctions |
| **Sam, Recycler / Processor Ops** | Recycler (seLictive, ARM, OnTo) | "Secure steady, spec'd feedstock and sell outputs" | Feedstock variability, offtake, grant cost-share | Feedstock RFQs, routing, output auctions, consortium builder |
| **Priya, Procurement Lead** | Cathode/cell/ESS buyer (D3 buyer types) | "Buy battery-grade Li with verified origin at a fair price" | Supplier vetting, FEOC/origin risk, price volatility | Verified tiers, RFQs, price intel, custody docs |
| **Diego, Upstream Seller** | Miner/converter (375 + 200 in D2) | "Reach qualified buyers beyond my traders" | Buyer credit risk, discovery | Claimable profile, buyer reliability scores, escrow |
| **Morgan, Compliance Manager** | Producer/importer under NJ/WA/EU rules | "Never miss a registration/reporting deadline" | Multi-state patchwork, audit trail | Obligation calendar, audit logs, exportable reports |
| **Dr. Lee, Grants / BD Lead** | Small business or university partner | "Assemble a winning consortium fast" | Finding partners, eligibility, cost share | Grant engine + partner matching (Enterprise) |

### 3.3 Journey map: recycling feedstock lot (target state)

`Battery collected → intake QA (chemistry/state of charge/damage) → custody event → stored at site → batched into lot → routed (direct vs hydromet) → listed as RFQ or auction (Incoterms, escrow, minimum tier) → awarded → shipped (custody + hazmat docs) → processed → outputs listed → compliance report auto-generated`

Main moments of truth: **intake QA accuracy**, **buyer trust at award**, **payment security**, **report on deadline**.

### 3.4 Impact / effort matrix

| | Low effort | High effort |
|---|---|---|
| **High impact** | Remove unverified claims; security fixes; supplier CSV import as unclaimed profiles; grant eligibility fields; refresh federal pipeline | Feedstock-to-auction flow; compliance obligation calendar; escrow via partner; real price models |
| **Low impact** | Domain/brand unification; doc cleanup | Blockchain ledger; grid APIs; agent-to-agent trading; multi-mineral |

---

## 4. Current-state baseline (verified this session)

- **Done on this branch:** Make.com fully removed: `make-webhook` and `market-data` functions deleted; `handle_make_webhook()` dropped (it was SECURITY DEFINER and executable by PUBLIC, so anonymous callers could inject market prices, KPIs, news, arbitrage rows and briefings); policy category, types, docs and architecture page cleaned up.
- **Open security items:** `sync-to-airtable` and `setup-airtable-auctions` require no authentication; Airtable webhooks and `airtable-pull-sync` / `market-intel-ingest` / `grant-ingest` secret checks fail open; `Access-Control-Allow-Origin: *` everywhere; `CLAUDE.md` contradicts `config.toml` on login-token (JWT) checks and on webhook header names.
- **Quality:** 32 type errors (CI hides them because the root `tsconfig.json` has `files: []`); 30 lint errors; 20 high-severity production dependency advisories; 94/94 unit tests passing; build passes; 2.5 MB + 1.9 MB landing images.
- **Leftover mock/synthetic logic:** `price-forecast.service.ts` (mock), `knowledge-base.service.ts`, `useRiskAssessment.ts`, `supplier-matcher.service.ts` still reference mock paths; `generate-telebuy-avatar` still calls Lovable.

---

## 5. Product principles (derived from the research)

1. **Real data only.** No stat, logo or certification appears unless a query or a signed agreement backs it.
2. **Recycling-first, procurement-always.** Recycling is the wedge; primary lithium procurement is the expansion.
3. **Every handoff leaves a record.** Each material movement writes a custody event.
4. **Eligibility before inspiration.** Only show grants and auctions the user can actually take part in.
5. **Explain every number.** Prices, scores and recommendations carry source, timestamp and method.
6. **Partner for regulated rails.** Escrow, payments, customs and freight go through licensed partners, not homegrown ledgers.

---

## 6. Phased plan

Dates assume today is 2026-11-07. Each phase has exit criteria.

### Phase 0: Trust and hardening (weeks 1–2)

| # | Task | Files / area | Exit criterion |
|---|---|---|---|
| 0.1 | ✅ Remove Make.com entirely | done (this branch) | No Make references; RPC dropped |
| 0.2 | ✅ Add authentication to `sync-to-airtable` (service-role or signed internal caller) and `setup-airtable-auctions` (admin JWT) | `supabase/functions/*` | Requests without credentials get 401 |
| 0.3 | ✅ Webhook/cron secrets **fail closed**; constant-time compare; fix header-name drift (`x-webhook-token` vs `x-airtable-signature`) | 3 Airtable webhooks, pull-sync, market-intel-ingest, grant-ingest, close-auctions | A missing secret rejects requests in production |
| 0.4 | ✅ Restrict CORS to `https://lithiumbuy.com` (+ preview domains) | shared CORS helper | No `*` on authenticated functions |
| 0.5 | ✅ **Remove unverified marketing claims** ($2.4B, 312, 47, 847+, "#1", Tesla/CATL/… logos) and replace them with live counts from `refresh_platform_kpis` or neutral copy | `src/pages/Landing.tsx`, `index.html` meta | Every number on the page traces to a query |
| 0.6 | ✅ Make CI real: `tsc -p tsconfig.app.json`, fix the 32 errors, remove `continue-on-error`, `npm audit fix` | `.github/workflows/ci.yml` | CI fails on type, lint or test errors |
| 0.7 | ✅ Revoke default PUBLIC EXECUTE on SECURITY DEFINER functions; grant only to `authenticated`/`service_role` as needed | new migration | Supabase security advisor clean |
| 0.8 | ✅ Compress landing images (WebP/AVIF), and archive the 64 root `.md` files into `docs/archive/` | `src/assets`, root | Images under 300 KB each; root keeps README, CLAUDE.md, SECURITY.md |

**Phase 0 status (2026-11-07): code complete on branch `claude/clever-galileo-x9evw8`.** Also fixed along the way: the market tables' write policies let anonymous users insert/update prices, KPIs, news, arbitrage and briefings (dropped); grant/evidence hooks queried columns that don't exist. Remaining highs in `npm audit` (vite 5, zod 3) need major upgrades.

**Rollout checklist (order matters: cron jobs and webhooks fail closed once the functions are deployed):**
1. Set secrets: `CRON_SECRET`, `AIRTABLE_WEBHOOK_SECRET`, `AIRTABLE_GRANT_WEBHOOK_SECRET`, `AIRTABLE_COMPLIANCE_WEBHOOK_SECRET`, optional `ALLOWED_ORIGINS` (e.g. `https://*.vercel.app`).
2. Store the same cron value in Vault: `select vault.create_secret('<CRON_SECRET>', 'cron_secret');`
3. Apply migrations `20261107000000`, `20261107000100`, `20261107000200`.
4. Update each Airtable automation to send `x-webhook-token: <matching secret>`.
5. Deploy all edge functions (`supabase functions deploy`); delete the old `make-webhook` and `market-data` deployments.
6. Smoke test: sign in and trigger an Airtable sync from the app; watch the next cron run in the `cron.job_run_details` table and the function logs for 401/503.

### Phase 1: Recycling wedge MVP (weeks 3–8)

| # | Task | Notes |
|---|---|---|
| 1.1 | **Supplier directory import**: clean D2 (dedupe by domain, normalize countries to ISO-3166, keep `NA`, reclassify mislabeled types) → `suppliers` as `claim_status='unclaimed'` with public profiles | Script in `scripts/`; pass NA-safe options to the parser; record where each row came from |
| 1.2 | **Claim-your-profile flow**: email or domain verification → tier Bronze | Uses existing `claim_token_hash` |
| 1.3 | **Verification tiers**: decide whether to add Platinum (D3) or keep three tiers; publish the criteria | Update enum + docs |
| 1.4 | **Battery intake QA**: chemistry, state of charge, damage class, quarantine flag, photos | Extend `battery_inventory`; D6 step 1–2 |
| 1.5 | **Lot builder + routing**: group inventory into lots; record direct vs hydromet route | `processing_orders.route` |
| 1.6 | **Feedstock / black-mass auctions**: commodity list adds black mass, recycled Li salts, Cu/Al; Incoterms, minimum tier, `escrow_required` (from D3 schema) | Existing auction engine |
| 1.7 | **Custody everywhere**: auto custody event on intake, lot, award, ship, receive | `chain_of_custody` |
| 1.8 | **SEO supplier pages** for 1,199 profiles + category pages (carbonate, hydroxide, spodumene, black mass) | Programmatic pages; no fabricated data |

**Exit:** one real partner (e.g. RAS → seLictive) runs a lot end to end in the system.

### Phase 2: Grants, compliance and partner network (weeks 6–14)

| # | Task | Notes |
|---|---|---|
| 2.1 | Grant schema: `eligible_applicant_types[]`, `cost_share_pct`, `consortium_roles[]`, `set_aside`, `loi_deadline`, `status` | Fixes the D7 problem (for-profits ineligible) |
| 2.2 | Eligibility filter by org type (for-profit, non-profit, university, government) | `useGrants`, `airtable-grants` |
| 2.3 | **Consortium builder**: pick a grant → suggest partners by role from the directory and D4 contacts → invite → shared workspace | Enterprise "Partner matching" |
| 2.4 | Load the D4 partner map (17 contacts as CRM leads, 10 channels) into Airtable/Supabase; mark the 2026 deadlines **closed**; set up a FY27 refresh | Through the existing grant-ingest + Airtable |
| 2.5 | **Compliance obligation calendar**: rules for NJ (registration 2025 / reporting 2026 / disposal ban 2027), WA SB 5144 (2027), CA AB 2440/SB 1215, EU 2023/1542 (labels 2025–27; recycled-content minimums: CLAUDE.md says 12% Co / 4% Li / 4% Ni by 2030, but our reading of the regulation is 16% Co / 6% Li / 6% Ni from 2031. **Confirm with counsel before encoding**), RCRA universal waste | New `compliance_obligations` table + reminders |
| 2.6 | Exportable audit reports (PDF/CSV) from custody and audit logs | For regulators and grant reporting |

### Phase 3: Procurement depth and trusted settlement (weeks 12–24)

| # | Task | Notes |
|---|---|---|
| 3.1 | **Escrow via a licensed partner** (deck's "smart contracts," delivered credibly) | Replace blockchain wording |
| 3.2 | Logistics partner integration: freight quotes + hazmat Class 9 docs (deck's "integrated logistics") | Start with quotes plus a document pack, not one-click |
| 3.3 | Buyer reliability scoring (payment reliability, capital strength: D3 dimensions) computed from real behavior | Shown to sellers |
| 3.4 | **Lithium Intelligence v1**: replace the mock forecast with a model on stored price history; show confidence and sources | Explainable by design |
| 3.5 | ESG score v1: origin, custody completeness, recycled content %, clean-energy attestations (D6 step 7) | Method published |
| 3.6 | Supply-chain map view (deck slide 4) from directory + custody geodata | Uses D3 knowledge-graph schema with real edges |

### Phase 4: Expansion (2027+)

Battery Passport export (EU), agent-assisted negotiation (human-approved) on the existing skill and policy layer, cobalt/nickel/vanadium categories, a market data API (Enterprise), and an evaluation of the D3 acquisition model with real comps.

---

## 7. Go-to-market and business plan

### 7.1 Brand and positioning
- **One domain: lithiumbuy.com.** Update the deck (`lithiumbuy.io`, `vision@lithiumbuy.io`), `package.json` repo URL, and email addresses.
- Positioning: *"The trusted marketplace and compliance system for lithium and battery recycling: verified suppliers, auditable chain of custody, and grant-ready partnerships."*
- Reword deck slides 5 and 7: "blockchain" → "tamper-evident digital chain of custody"; "every gram, molecular" → "batch-level traceability, Battery Passport-ready."

### 7.2 Pricing (current tiers retained)
- **Pro $599/mo:** grants tracker, eligibility, readiness, evidence vault, plus directory listing and claim.
- **Enterprise $4,999/mo:** partner matching / consortium builder, funding pipeline, auctions, API.
- **Transaction take rate: 0.6–1.5%** on awarded auctions and RFQs (the range modeled in D3; validate with users).
- Possible **free tier**: claimed supplier profile, which drives network growth.

### 7.3 First 90 days of outreach
1. Fix trust (Phase 0) **before** any calls.
2. Call D4's Tier 1 contacts in this order: RAS, seLictive, American Renewable Metals, T5, Lithosphere, Quinn (as the file recommends). Offer a free Enterprise pilot in exchange for a co-designed lot flow.
3. Email the 24 U.S. recyclers + top 40 North American converters/traders from D2 with a "claim your profile" link.
4. Federal: register / verify in SAM.gov, watch the DOE Acquisition Forecast + SAM set-asides, and line up FY27 DOE battery recycling rounds as a **consortium member** (feedstock/procurement layer).
5. LATAM: look for a university/NGO prime for the next State Dept transparency NOFO cycle and offer LithiumBuy as a subcontracted training/content partner.

### 7.4 KPIs

| Stage | KPI | Phase 1 target |
|---|---|---|
| Supply | Claimed supplier profiles | 50 of 1,199 |
| Trust | % of listings Silver+ verified | ≥ 30% |
| Liquidity | Lots/auctions completed end to end | 5 |
| Revenue | Paying orgs (Pro/Enterprise) | 10 / 2 |
| Grants | Consortia formed in-platform | 2 |
| Compliance | Obligations tracked with on-time completion | 100% on time |
| Quality | CI green with strict checks; 0 unauthenticated functions | Always |

---

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Unverified marketing claims (legal/FTC, reputation) | Phase 0.5; claims-review checklist before each release |
| Security incident on webhooks/edge functions | Phase 0.2–0.4, 0.7; quarterly review |
| Synthetic numbers leaking into investor materials | Label D3 "TEMPLATE"; build investor metrics only from Supabase |
| Hazmat liability on battery lots | Partner with licensed haulers; acceptance-QA gating; clear terms |
| Grant eligibility mismatch (D7) | Phase 2.1–2.2 |
| Price-model overconfidence | Confidence bands, sources, sanity caps (as in the existing 35% arbitrage cap) |
| Vendor concentration (Airtable, ElevenLabs, Daily, Firecrawl, Stripe, Anthropic) | Keep Supabase as the source of truth; wrap vendors behind services; build export paths |
| Data-privacy issues when enriching supplier contacts | Use public business contacts only; honor opt-out; record a lawful basis |

---

## 9. Research plan to validate this (user-research deliverables)

### 9.1 Objectives
1. Confirm that the feedstock aggregator and recycler personas will run lots through LithiumBuy (Phase 1).
2. Test willingness to pay (Pro/Enterprise) and take-rate tolerance (0.6–1.5%).
3. Find the minimum trust signals procurement leads need before bidding.
4. Validate demand for the compliance calendar and the consortium builder.

### 9.2 Methods and sample

| Method | Who | n | When |
|---|---|---|---|
| Interviews | D4 Tier 1 contacts + 3 U.S. recyclers + 3 cathode/ESS buyers | 8–10 | Weeks 2–5 |
| Usability tests | Lot builder + auction award + claim flow | 5–6 | Weeks 7–8 |
| Survey | Claimed-profile suppliers (pricing, features) | 100+ | Weeks 8–10 |
| Card sort | Navigation for 39 pages → simplified IA | 15–20 | Week 4 |

### 9.3 Interview guide (45 min)
1. **Warm-up (5):** role, company, how batteries or lithium move through their business.
2. **Context (10):** walk through the last lot bought or sold. Who was involved, which documents, how the price was set, what went wrong?
3. **Deep dive (20):**
   - Feedstock: how do you assess incoming packs (chemistry, state of charge, damage)? What makes a lot unsellable?
   - Trust: what do you check before transacting with a new counterparty? Which certifications matter?
   - Payment: how do you secure payment today? Would escrow change behavior?
   - Compliance: which state/EU obligations cost you the most time? How do you track deadlines?
   - Grants: have you been on a federal consortium? What was hardest: partners, cost share, or writing?
4. **Reaction (10):** show the lot → auction → custody flow and the consortium builder. "What would stop you using this tomorrow?"
5. **Wrap-up (5):** pricing reaction ($599 / $4,999 / % take); referrals.

### 9.4 Synthesis template
Affinity-map quotes to themes T1–T7; update personas; re-score the impact/effort matrix; pull out the highlights (top 10 quotes) for the deck refresh.

---

## 10. Immediate next actions (this week)

1. Merge this branch (Make.com removal + this plan) and apply migration `20261107000000_drop_legacy_inbound_webhook_rpc.sql` to production.
2. Delete the **deployed** `make-webhook` and `market-data` functions in Supabase (removing them from the repo does not undeploy them).
3. Start Phase 0.2–0.5 (auth, fail-closed secrets, CORS, landing-page claims).
4. Run the supplier CSV cleaning script (Phase 1.1) into a staging table for review.
5. Book the first 5 interviews from the D4 Tier 1 list.
