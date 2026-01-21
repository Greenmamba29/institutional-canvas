# Cursor Bug Fix Rules

**Branch:** cursor-bugs  
**Mode:** Bug Fix Only  
**Last Updated:** 2026-01-20

---

## Scope - Bug Fixes ONLY

### ✅ Allowed:
- Fix TypeScript compilation errors
- Fix runtime errors and exceptions
- Fix broken imports or missing dependencies
- Fix type mismatches
- Fix ESLint errors (critical only)
- Fix broken component rendering
- Fix broken API calls

### ❌ NOT Allowed:
- Add new features
- Refactor code (unless required to fix bug)
- Change architecture
- Modify working functionality
- Update dependencies (unless fixing bug)
- Change UI/UX (unless broken)

---

## Workflow

1. **User reports bug** or error detected
2. **Check AGENT_STATUS.md** (if exists)
3. **Pull latest from cursor-bugs:**
   ```bash
   git checkout cursor-bugs
   git pull origin cursor-bugs
   ```
4. **Check for file locks:**
   ```bash
   ls -la .agent-locks/
   # If file is locked by Warp/Lovable, wait or coordinate
   ```
5. **Fix the bug** (minimal changes only)
6. **Test the fix** locally
7. **Commit with prefix:**
   ```bash
   git commit -m "[Cursor] Fix: <description>
   
   <details>
   
   Co-Authored-By: Warp <agent@warp.dev>"
   ```
8. **Push and create PR:**
   ```bash
   git push origin cursor-bugs
   # Create PR to main via GitHub
   ```
9. **Notify Warp** by updating AGENT_STATE.json (if accessible)

---

## Protected Files

**DO NOT modify these files even to fix bugs:**
- `AGENT_STATE.json` (unless bug is IN this file)
- `ORCHESTRATION/*.md`
- `SECURITY_*.md`
- `src/config/env.ts` (coordinate with Warp first)
- `supabase/migrations/*.sql` (coordinate with Warp first)

If bug is in a protected file, create an issue and notify Warp.

---

## Coordination

### If file is locked:
1. Check `.agent-locks/warp.lock` or `.agent-locks/lovable.lock`
2. If your bug fix touches locked files, **wait** for lock to clear
3. Or contact Warp for emergency handoff

### If bug was introduced by another agent:
- Still fix it (bugs have priority)
- Document which agent introduced it in commit message
- No blame, just fix

### If Lovable is regenerating components:
- Wait for Lovable to finish
- Pull latest from main
- Check if bug still exists
- Fix if still present

---

## Commit Message Format

```
[Cursor] Fix: <one-line description>

Details:
- What was broken
- Root cause
- How it was fixed

Affected files:
- path/to/file.ts

Co-Authored-By: Warp <agent@warp.dev>
```

**Example:**
```
[Cursor] Fix: TypeScript error in Dashboard component

Details:
- useOrganization hook returning undefined on initial load
- Root cause: Missing null check in Dashboard.tsx
- Added optional chaining and loading state

Affected files:
- src/pages/Dashboard.tsx

Co-Authored-By: Warp <agent@warp.dev>
```

---

## Bug Priority Levels

### P0 - Critical (Fix immediately):
- App won't compile/build
- App crashes on load
- Security vulnerabilities
- Auth broken
- Data loss possible

### P1 - High (Fix within hours):
- Feature completely broken
- Major UI rendering issues
- API calls failing
- Error in console breaking UX

### P2 - Medium (Fix within day):
- Minor UI glitches
- Non-critical type errors
- ESLint warnings
- Performance issues

### P3 - Low (Fix when available):
- Code style issues
- Dead code
- Unused imports
- Minor optimizations

---

## Current Known Issues

(Check AGENT_STATE.json → agents.cursor.current_bugs)

**As of 2026-01-20:** None reported

---

## Testing Checklist

Before pushing bug fix:
- [ ] TypeScript compiles (`npm run build`)
- [ ] App runs without errors (`npm run dev`)
- [ ] Bug is actually fixed (test the specific scenario)
- [ ] No new bugs introduced (smoke test main flows)
- [ ] Commit message follows format
- [ ] PR created (not merged directly)

---

## Emergency Bug Fix Protocol

If production is down or critical security issue:

1. **Fix immediately** on cursor-bugs branch
2. **Skip normal process** - push directly
3. **Create emergency PR** with `[P0]` prefix
4. **Notify Warp immediately** via all channels
5. **Document post-mortem** after fix deployed

Only use for genuine emergencies.

---

## Questions?

- Check `.agent-handoffs/` for context
- Check `AGENT_STATE.json` for current bugs list
- Human oversight: @paco
