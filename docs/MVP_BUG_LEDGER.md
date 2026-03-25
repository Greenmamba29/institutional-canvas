# MVP Bug Ledger (Canonical)

**Purpose:** Single source of truth for MVP bug triage and ship/no-ship decisions.  
**Canonical as-of date:** 2026-03-25 UTC  
**Primary source-of-truth snapshot used:** `GAP_ANALYSIS_REPORT.md` (dated 2026-01-09)  
**Decision rule:** If this file conflicts with older planning/status docs, this file wins.

---

## 1) Current MVP Ship Decision

- **Blocking bugs open:** **0**
- **Non-blocking bugs/limitations open:** **5**
- **MVP decision:** **Ship-ready with known non-blocking limitations**

---

## 2) Canonical Bug/Limitation Ledger

| ID | Type | Severity | Blocking? | Owner | Status | Source-of-truth date | Summary | Exit criteria |
|---|---|---|---|---|---|---|---|---|
| MVP-001 | Security hardening | Medium | No | Warp (Backend) | Open | 2026-01-09 | Existing DB linter warnings (search_path/RLS/extensions/password protection) predate MVP fixes. | Warnings remediated or formally risk-accepted in hardening doc. |
| MVP-002 | Integration gap | Medium | No | Warp (Backend) | Open | 2026-01-09 | ElevenLabs full management flow requires `elevenlabs-agent-proxy` Edge Function deployment. | Edge Function deployed and Agent Setup enabled end-to-end. |
| MVP-003 | Feature readiness | Low | No | Warp + Frontend | Open | 2026-01-09 | `lithium_knowledge_base` table not created; feature currently disabled. | Table + APIs implemented **or** feature removed from nav/routes. |
| MVP-004 | Security operations | High | No (MVP), Yes (post-incident hygiene) | Ops/Security | Open | 2026-01-09 | Rotate exposed credentials (ElevenLabs/Auth0) per security checklist. | Rotation completed and documented with timestamps. |
| MVP-005 | Observability gap | Medium | No | Frontend + Ops | Open | 2026-01-09 | Error monitoring (Sentry) not yet implemented. | Sentry (or equivalent) live in prod with release/environment tags. |

---

## 3) Resolved MVP Bug Themes (Do Not Reopen Without Regression)

- Secrets removed from repo; env naming and runtime validation fixed.
- RPC-only write enforcement added for high-risk frontend mutations.
- Non-MVP modules explicitly disabled or feature-flagged for launch safety.

---

## 4) Ownership Model (Short)

- **Frontend:** UI wiring, feature flags, route/nav hygiene, client observability.
- **Warp/Backend:** migrations, RPCs, Edge Functions, RLS/security hardening.
- **Ops/Security:** credential rotation, production policy enforcement.

---

## 5) FIFO Triage Protocol (Get-In / Get-Out)

1. New issue arrives → assign new ID `MVP-XXX` and append to bottom of table.
2. Classify as **Blocking** or **Non-blocking** using MVP scope only.
3. Assign single owner and explicit exit criteria.
4. Work strictly oldest-open-first within each class:
   - First clear **Blocking FIFO queue**.
   - Then clear **Non-blocking FIFO queue**.
5. On close: set `Status=Closed`, add close date in PR/commit notes.

---

## 6) Stale-Doc Reconciliation Notes

Older docs that may show obsolete TODOs should be treated as historical unless revalidated:

- `MVP_STATUS.md` (2025-12-24)
- `ACTUAL_REMAINING_TASKS.md` (2025-01-23)

Use this ledger to prevent re-opening already resolved items from older plans.
