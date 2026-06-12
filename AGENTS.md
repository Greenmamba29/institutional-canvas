# AGENTS.md

## Scope
These instructions apply to the entire repository.

## Canonical MVP bug source
- Always use `docs/MVP_BUG_LEDGER.md` as the canonical MVP bug backlog.
- If any status/plan doc conflicts with the ledger, follow the ledger.
- Treat `MVP_STATUS.md` and `ACTUAL_REMAINING_TASKS.md` as historical context unless explicitly revalidated.

## Short execution protocol (low burden)
1. Read `docs/MVP_BUG_LEDGER.md` summary counts.
2. Pick oldest open item in FIFO order:
   - Blocking queue first.
   - Then non-blocking queue.
3. Apply minimum viable fix for the selected item.
4. Update only the row status/owner/exit criteria evidence.
5. Exit quickly; avoid broad refactors unless required by the exit criteria.

## Skills orchestration rule
When coordinating multiple contributors/skills, use this chain:
1. **Triage skill** (classification + owner)
2. **Implementation skill** (single-item fix)
3. **Verification skill** (tests/checks)
4. **Ledger update skill** (status + closure evidence)

Process in strict FIFO per queue to keep get-in/get-out flow predictable.
