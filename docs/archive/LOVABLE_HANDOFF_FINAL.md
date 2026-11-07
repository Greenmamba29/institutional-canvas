# 🚀 LOVABLE HANDOFF - COMPLETE INSTRUCTIONS

**Date:** 2026-01-20T18:30:00Z  
**From:** Warp Agent  
**To:** Lovable Agent  
**Priority:** P0 - Ready to Begin  
**Repository:** https://github.com/Greenmamba29/institutional-canvas

---

## ✅ PRE-FLIGHT CHECKLIST

Before starting, verify these items are complete:

- [x] **Branch created:** lovable-dev exists on GitHub
- [x] **Configuration files:** .lovable/rules.md created
- [x] **Handoff document:** .agent-handoffs/HANDOFF-20260120-180700.md created
- [x] **Quick start guide:** LOVABLE_START_HERE.md created
- [x] **Agent state:** AGENT_STATE.json v1.1.0 updated
- [x] **Security fixes:** P0 credentials removed, env() pattern implemented
- [x] **All files synced:** lovable-dev branch has all latest changes

---

## 📋 STEP 1: LOVABLE DASHBOARD CONFIGURATION

**CRITICAL:** Configure these settings in your Lovable dashboard BEFORE starting development.

### A. GitHub Integration Settings

Navigate to: **Lovable Dashboard → Settings → GitHub**

```
Repository: Greenmamba29/institutional-canvas
Branch: lovable-dev          ← MUST BE lovable-dev, NOT main
Auto-merge: OFF              ← CRITICAL: Must be disabled
Create PRs: ON               ← Required for Warp approval
Deploy on push: YES          ← Preview environments enabled
```

### B. Environment Variables

**DO NOT add these to Lovable dashboard** - they are already in the codebase via `src/config/env.ts`.

The following env vars are managed by Warp:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ELEVENLABS_API_KEY`
- `VITE_DAILY_API_KEY`

**You do NOT need to configure these.** They are loaded via the `env()` helper.

### C. Deployment Settings

```
Framework: Vite
Build command: npm run build
Output directory: dist
Install command: npm install
Node version: 18.x or higher
```

---

## 📋 STEP 2: VERIFY LOCAL REPOSITORY ACCESS

If working locally (optional for Lovable):

```bash
# Clone repository (if not already cloned)
git clone https://github.com/Greenmamba29/institutional-canvas.git
cd institutional-canvas

# Switch to lovable-dev branch
git checkout lovable-dev

# Verify you have latest changes
git pull origin lovable-dev

# Verify configuration files exist
ls -la .lovable/
ls -la .agent-handoffs/
cat LOVABLE_START_HERE.md
```

**Expected files on lovable-dev:**
```
.lovable/rules.md                             ← Your workflow rules
.agent-handoffs/HANDOFF-20260120-180700.md   ← Handoff from Warp
.cursor/rules.md                              ← Cursor's rules (for reference)
LOVABLE_START_HERE.md                         ← Quick start guide
AGENT_STATE.json                              ← Agent state (READ ONLY)
```

---

## 📋 STEP 3: READ CRITICAL DOCUMENTATION

**MUST READ before writing any code:**

### A. Protected Files List (5 minutes)

Read: `.lovable/rules.md` → Section "Files to NEVER Modify"

**Critical files you CANNOT modify:**
1. `AGENT_STATE.json` - Agent orchestration state
2. `ORCHESTRATION/DRIFT_RULES.md` - Schema sync rules
3. `ORCHESTRATION/SOT_CONTRACT.md` - System-of-truth contract
4. `SECURITY_ROTATION_CHECKLIST.md` - Security procedures
5. `src/config/env.ts` - Environment validation
6. `src/integrations/supabase/types.ts` - Auto-generated types
7. `supabase/migrations/*.sql` - Database migrations

**Why?** These control security, orchestration, and database schema. Modifying them breaks multi-agent coordination.

### B. Security Patterns (3 minutes)

Read: `.agent-handoffs/HANDOFF-20260120-180700.md` → Section "Critical Pattern to Preserve"

**Environment Variables Pattern:**
```typescript
// ✅ CORRECT - ALWAYS use this
import { env } from '@/config/env';
const { SUPABASE_URL, SUPABASE_ANON_KEY } = env();

// ❌ WRONG - NEVER hardcode
const SUPABASE_URL = 'https://vuekwckknfjivjighhfd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGc...';
```

**Supabase Client Pattern:**
```typescript
// ✅ CORRECT - Use existing client
import { supabase } from '@/integrations/supabase/client';

// ❌ WRONG - Don't create new client
import { createClient } from '@supabase/supabase-js';
const client = createClient(url, key);
```

**Authentication Pattern:**
```typescript
// ✅ CORRECT - Use AuthContext
import { useAuth } from '@/contexts/AuthContext';
const { session, user, loading } = useAuth();

// ❌ WRONG - Don't bypass context
import { supabase } from '@/integrations/supabase/client';
const user = await supabase.auth.getUser();
```

---

## 📋 STEP 4: UNDERSTAND YOUR WORKFLOW

### Your Development Cycle:

```
1. Build feature on lovable-dev branch
   ↓
2. Test in preview environment
   ↓
3. Push to lovable-dev (triggers preview deploy)
   ↓
4. Create PR to main
   ↓
5. Wait for Warp approval
   ↓
6. Warp merges to main
   ↓
7. Pull latest to lovable-dev
   ↓
8. Repeat
```

### Commit Message Format:

**Template:**
```
[Lovable] <brief description>

<optional details>

Co-Authored-By: Warp <agent@warp.dev>
```

**Examples:**
```
[Lovable] Add carbon calculator UI component

Created CarbonCalculator.tsx with Recharts visualization.
Integrated with existing pricing data hooks.

Co-Authored-By: Warp <agent@warp.dev>
```

```
[Lovable] Fix Dashboard layout on mobile

Improved responsive grid for small screens.
Updated Tailwind breakpoints.

Co-Authored-By: Warp <agent@warp.dev>
```

---

## 📋 STEP 5: WHAT YOU CAN BUILD

### ✅ Safe Directories (Full Access):

```
src/components/          ← React UI components
src/pages/              ← Page layouts
src/hooks/              ← Custom React hooks
src/services/           ← Frontend service calls
src/lib/                ← Utility functions
src/styles/             ← CSS/Tailwind
public/                 ← Static assets
```

### ✅ Safe File Types:

- `.tsx` - React components
- `.ts` - TypeScript utilities
- `.css` - Stylesheets (Tailwind)
- `.svg`, `.png`, `.jpg` - Images
- `.json` - Config files (except protected ones)

### ✅ Safe Operations:

- Create new React components
- Modify existing UI components
- Add Tailwind CSS classes
- Create custom hooks
- Call existing Supabase RPCs (don't create new ones)
- Use React Query hooks
- Update component state
- Add routing (React Router)
- Import/use existing services

---

## 📋 STEP 6: WHAT YOU CANNOT DO

### ❌ Forbidden Operations:

1. **Database Changes:**
   - Don't create migrations
   - Don't modify supabase/migrations/*.sql
   - Don't regenerate src/integrations/supabase/types.ts

2. **Environment Changes:**
   - Don't modify src/config/env.ts
   - Don't add new env vars (ask Warp)
   - Don't hardcode credentials

3. **Architecture Changes:**
   - Don't modify ORCHESTRATION/*.md files
   - Don't update AGENT_STATE.json
   - Don't change security docs

4. **Backend Logic:**
   - Don't create Supabase RPC functions
   - Don't modify Edge Functions
   - Don't change RLS policies

### If You Need Backend Changes:

**Don't do it yourself.** Instead:

1. Create a GitHub issue with specification
2. Tag it with `needs-warp` label
3. Describe what you need (e.g., "Need RPC function to calculate carbon offset")
4. Warp will implement and notify you

---

## 📋 STEP 7: CURRENT PROJECT CONTEXT

### Recent Changes (Last 7 Days):

**2026-01-20 (Today):**
- ✅ P0 Security: Removed hardcoded Supabase credentials
- ✅ Multi-agent branch structure created
- ✅ Environment validation implemented via env() helper
- ✅ Agent coordination setup complete

**2026-01-17:**
- ✅ AI Studio features added (Price Forecasting, Supplier Matching)
- ✅ Messaging services implemented
- ✅ Role-protected routes added
- ✅ Database migrations updated

### Tech Stack You'll Use:

**Frontend Framework:**
- React 19.2.0 (latest with concurrent features)
- TypeScript (strict mode enabled)
- Vite (build tool)

**UI Libraries:**
- Tailwind CSS (utility-first styling)
- shadcn/ui (pre-built components)
- Radix UI (primitives)
- Lucide React (icons)

**State Management:**
- React Query (TanStack Query v5) - server state
- React Context - global state
- Zustand - optional for complex state

**Routing:**
- React Router v6 (client-side routing)

**Forms & Validation:**
- React Hook Form
- Zod (schema validation)

**Data Fetching:**
- Supabase client (already configured)
- React Query hooks (already set up)

**Charts/Visualization:**
- Recharts (for dashboards)

---

## 📋 STEP 8: EXAMPLE WORKFLOW

Let's walk through creating a new feature:

### Example: Add "My Profile" Page

**1. Create component:**
```bash
# File: src/pages/Profile.tsx
```

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Profile() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Email: {user.email}</p>
          <p>ID: {user.id}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**2. Add route:**
```typescript
// File: src/App.tsx (add to existing routes)

import Profile from '@/pages/Profile';

// In your Routes component:
<Route path="/profile" element={<Profile />} />
```

**3. Test locally (if you have local setup):**
```bash
npm run dev
# Visit http://localhost:5173/profile
```

**4. Commit:**
```bash
git add src/pages/Profile.tsx src/App.tsx
git commit -m "[Lovable] Add user profile page

Created basic profile page showing user email and ID.
Uses existing AuthContext.

Co-Authored-By: Warp <agent@warp.dev>"
```

**5. Push to lovable-dev:**
```bash
git push origin lovable-dev
```

**6. Create PR to main:**
- Go to GitHub
- Click "Pull Requests" → "New Pull Request"
- Base: `main`, Compare: `lovable-dev`
- Title: `[Lovable] Add user profile page`
- Create PR
- Wait for Warp review and approval

---

## 📋 STEP 9: EXISTING CODE PATTERNS TO FOLLOW

### Pattern 1: Using Supabase for Data

```typescript
// ✅ CORRECT - Use existing client
import { supabase } from '@/integrations/supabase/client';

// Read data
const { data, error } = await supabase
  .from('suppliers')
  .select('*')
  .limit(10);

// Use RPC (for writes)
const { data, error } = await supabase
  .rpc('create_rfq', {
    p_title: 'New RFQ',
    p_details: 'Details here'
  });
```

### Pattern 2: Authentication Check

```typescript
// ✅ CORRECT - Use AuthContext
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading, signOut } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" />;

  return <div>Hello {user.email}</div>;
}
```

### Pattern 3: Organization Context

```typescript
// ✅ CORRECT - Use OrganizationContext
import { useOrganization } from '@/contexts/OrganizationContext';

function Dashboard() {
  const { currentOrg, switchOrganization } = useOrganization();

  return <div>Org: {currentOrg?.name}</div>;
}
```

### Pattern 4: Data Fetching with React Query

```typescript
// ✅ CORRECT - Use React Query
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

function SupplierList() {
  const { data, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('suppliers')
        .select('*');
      return data;
    }
  });

  if (isLoading) return <div>Loading...</div>;
  
  return (
    <ul>
      {data?.map(s => <li key={s.id}>{s.name}</li>)}
    </ul>
  );
}
```

---

## 📋 STEP 10: TESTING YOUR CHANGES

### Before Creating PR:

**1. Visual Testing:**
- Does it look good on desktop? (1920x1080)
- Does it look good on tablet? (768x1024)
- Does it look good on mobile? (375x667)

**2. Functional Testing:**
- Does the feature work as expected?
- Are there any console errors?
- Does navigation work?
- Do forms validate correctly?

**3. Code Quality:**
- No TypeScript errors: `npm run build`
- Follows existing patterns
- Uses existing components where possible
- Proper error handling

**4. Accessibility:**
- Keyboard navigation works
- Screen reader friendly (aria labels)
- Color contrast sufficient
- Focus indicators visible

---

## 📋 STEP 11: COMMUNICATION PROTOCOL

### Check for Handoffs Daily:

```bash
# Check for new messages from Warp
ls -la .agent-handoffs/
cat .agent-handoffs/HANDOFF-*.md | tail -100
```

### If You Get Stuck:

**1. Check existing code:**
```bash
# Search for similar patterns
grep -r "similar pattern" src/
```

**2. Check documentation:**
- `.lovable/rules.md` - Your rules
- `AGENT_STATE.json` - Current system state
- `.agent-handoffs/` - Latest communications

**3. Create issue for Warp:**
- Go to GitHub Issues
- Title: `[Lovable] Need help with X`
- Describe what you're trying to do
- Tag: `needs-warp`

### If Cursor Fixes a Bug:

After Cursor merges a bug fix to main:

```bash
# Update your branch
git checkout lovable-dev
git pull origin main
git push origin lovable-dev
```

---

## 📋 STEP 12: FINAL VERIFICATION CHECKLIST

Before you start building, verify:

- [ ] Lovable dashboard configured (branch: lovable-dev, auto-merge: OFF)
- [ ] Read `.lovable/rules.md` completely
- [ ] Read `.agent-handoffs/HANDOFF-20260120-180700.md`
- [ ] Understand protected files (AGENT_STATE.json, ORCHESTRATION/*, etc.)
- [ ] Understand security patterns (env(), supabase client, AuthContext)
- [ ] Know commit message format ([Lovable] + Co-Authored-By)
- [ ] Understand workflow (lovable-dev → PR → Warp approval → merge)
- [ ] Know what you can/cannot do
- [ ] Know how to communicate with Warp (via .agent-handoffs/ or GitHub issues)

---

## 🚀 YOU'RE READY TO BUILD!

### Your First Task (Suggested):

**Option A - Easy Win:**
Create a simple UI improvement:
- Improve button styling
- Add loading states
- Enhance form validation messages

**Option B - New Feature:**
Build something from the roadmap:
- Carbon calculator UI
- Auction dashboard
- Messaging interface

**Option C - Wait for Direction:**
Check if there's a specific task in:
- GitHub Issues tagged `frontend`
- AGENT_STATE.json → epics (look for assigned to "build" or "lovable")

---

## 📞 CONTACTS & RESOURCES

**Human Oversight:** @paco  
**Warp Agent:** Monitors warp-dev branch  
**Cursor Agent:** Monitors cursor-bugs branch  

**Documentation:**
- `.lovable/rules.md` - Your workflow rules
- `.agent-handoffs/` - Communication from other agents
- `AGENT_STATE.json` - System state (read-only)
- `LOVABLE_START_HERE.md` - Quick reference

**Repository:** https://github.com/Greenmamba29/institutional-canvas  
**Your Branch:** lovable-dev  
**Target Branch:** main (via PR only)

---

## ✅ HANDOFF COMPLETE

**Status:** ✅ Ready to begin frontend development  
**Next Action:** Start building UI components on lovable-dev branch  
**Support:** Check .agent-handoffs/ daily for updates from Warp

**Welcome to the team! Build amazing UI! 🎨🚀**
