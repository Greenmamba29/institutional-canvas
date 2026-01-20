# 🚀 Lovable - Start Here

**Status:** ✅ Ready to begin  
**Branch:** lovable-dev  
**Date:** 2026-01-20

---

## Quick Start (30 seconds)

```bash
# 1. Switch to your branch
git checkout lovable-dev
git pull origin lovable-dev

# 2. Read your handoff
cat .agent-handoffs/HANDOFF-20260120-180700.md

# 3. Read your rules
cat .lovable/rules.md

# 4. Start building!
```

---

## 📋 Critical Rules (READ FIRST)

### ❌ NEVER Modify These Files:
- `AGENT_STATE.json`
- `ORCHESTRATION/*.md`
- `SECURITY_*.md`
- `src/config/env.ts`
- `src/integrations/supabase/types.ts`
- `supabase/migrations/*.sql`

### ✅ Safe to Build:
- `src/components/*` - React components
- `src/pages/*` - Pages
- `src/hooks/*` - Custom hooks
- `src/services/*` - Frontend services
- Tailwind CSS styling

---

## 🔐 Critical Patterns (Don't Break These)

### Environment Variables
```typescript
// ✅ CORRECT
import { env } from '@/config/env';
const { SUPABASE_URL, SUPABASE_ANON_KEY } = env();

// ❌ WRONG
const SUPABASE_URL = 'https://...';
```

### Supabase Client
```typescript
// ✅ CORRECT
import { supabase } from '@/integrations/supabase/client';

// ❌ WRONG
import { createClient } from '@supabase/supabase-js';
```

---

## 📝 Commit Format

```
[Lovable] <description>

<details>

Co-Authored-By: Warp <agent@warp.dev>
```

---

## 🔄 Workflow

1. Build on `lovable-dev` branch
2. Push to `lovable-dev`
3. Create PR to `main`
4. Wait for Warp approval
5. Merge after approval

**DO NOT push directly to main!**

---

## 📚 Full Documentation

- **Rules:** `.lovable/rules.md`
- **Handoff:** `.agent-handoffs/HANDOFF-20260120-180700.md`
- **Agent State:** `AGENT_STATE.json` (read-only)

---

## ✅ You're Ready!

The codebase is clean, secure, and ready for frontend development.

**Start building amazing UI! 🎨**
