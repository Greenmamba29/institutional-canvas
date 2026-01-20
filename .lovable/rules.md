# Lovable Development Rules

**Branch:** lovable-dev  
**Mode:** Frontend Development  
**Last Updated:** 2026-01-20

---

## Files to NEVER Modify

These files are owned by Warp and must not be changed by Lovable:

- `AGENT_STATE.json` (agent orchestration state)
- `ORCHESTRATION/*.md` (system contracts and rules)
- `SECURITY_*.md` (security documentation)
- `src/config/env.ts` (environment configuration)
- `src/integrations/supabase/types.ts` (auto-generated from database)
- `supabase/migrations/*.sql` (database schema)
- `.agent-locks/*` (lock files)
- `.agent-handoffs/*` (handoff documents)

**Why?** These files control system security, orchestration, and database schema. Modifying them can break the entire multi-agent workflow.

---

## Before Starting Work

1. **Check for handoffs:**
   ```bash
   ls -la .agent-handoffs/
   cat .agent-handoffs/HANDOFF-*.md  # Read latest
   ```

2. **Pull latest from lovable-dev:**
   ```bash
   git checkout lovable-dev
   git pull origin lovable-dev
   ```

3. **Check for locked files:**
   ```bash
   ls -la .agent-locks/
   # If warp.lock or cursor.lock exists, check if your files are listed
   ```

---

## Workflow

1. **Work on lovable-dev branch only**
2. **Create/modify UI components in:**
   - `src/components/*`
   - `src/pages/*`
   - `src/hooks/*`
   - `src/services/*` (frontend services only)

3. **Safe to modify:**
   - React components (.tsx files)
   - Styles (Tailwind classes)
   - UI logic and state management
   - Frontend service calls (but not RPC definitions)

4. **When ready to deploy:**
   - Push to `lovable-dev` branch
   - Create PR to `main` (do NOT merge directly)
   - Wait for Warp approval

---

## Commit Message Format

All commits must follow this format:

```
[Lovable] <brief description>

<details if needed>

Co-Authored-By: Warp <agent@warp.dev>
```

**Examples:**
```
[Lovable] Add carbon calculator UI component

Created CarbonCalculator.tsx with Recharts visualization

Co-Authored-By: Warp <agent@warp.dev>
```

---

## Deployment Protocol

1. **Preview first:** Deploy to preview environment
2. **Create PR:** Push to lovable-dev, then create PR to main
3. **No auto-merge:** Auto-merge is DISABLED
4. **Wait for approval:** Warp will review and approve
5. **Merge:** After approval, merge via GitHub

---

## Critical P0 Security Notice

**DO NOT modify these security-critical patterns:**

### Environment Variables
```typescript
// ✅ CORRECT - Use env() helper
import { env } from '@/config/env';
const { SUPABASE_URL, SUPABASE_ANON_KEY } = env();

// ❌ WRONG - Do NOT hardcode
const SUPABASE_URL = 'https://...';
```

### Supabase Client
```typescript
// ✅ CORRECT - Import existing client
import { supabase } from '@/integrations/supabase/client';

// ❌ WRONG - Do NOT create new client
import { createClient } from '@supabase/supabase-js';
const client = createClient('...', '...');
```

### Authentication
```typescript
// ✅ CORRECT - Use AuthContext
import { useAuth } from '@/contexts/AuthContext';

// ❌ WRONG - Do NOT bypass auth context
```

---

## Communication with Other Agents

### If you need Warp to:
- Modify database schema → Create issue, don't modify migrations
- Update RPC functions → Create issue with spec
- Change environment config → Create issue, don't touch .env files

### If Cursor fixes a bug:
- Pull from main after bug fix is merged
- Don't re-implement the same fix

---

## Current Project Context

**Recent Changes (as of 2026-01-20):**
- ✅ P0 Security: Hardcoded credentials removed
- ✅ Environment validation implemented
- ✅ Multi-agent branch structure created
- ⚠️ DO NOT regenerate `src/integrations/supabase/client.ts`

**Protected Patterns:**
- `env()` import from `@/config/env` - DO NOT CHANGE
- Supabase client initialization - DO NOT CHANGE
- AuthContext usage - DO NOT CHANGE

---

## Questions?

- Check `.agent-handoffs/` for latest communications
- Check `AGENT_STATE.json` for current system state (read-only)
- Human oversight: @paco
