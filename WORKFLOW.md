# Lithium Buy - Development Workflow

## Project Overview
**Institutional Canvas / Lithium Buy** - Institutional Trading Platform
- **Supabase Project**: `vuekwckknfjivjighhfd`
- **GitHub**: `git@github.com:Greenmamba29/institutional-canvas.git`
- **Frontend**: Lovable-managed
- **Backend**: Warp-managed

---

## Workflow Architecture

### 1. Lovable → Frontend Truth
**Responsibility**: UI, Routes, Components

**Process**:
1. Edits UI components in Lovable
2. Commits changes to GitHub (automatic)
3. Updates Notion Frontend DB with:
   - Commit URL
   - Preview URL
   - Deployment status

**Output**: React/TypeScript components, routes, UI state

---

### 2. Warp → Backend Truth + Enforcement
**Responsibility**: Database Schema, RPCs, Edge Functions, Types

**Process**: When frontend depends on backend changes:

#### Step 1: Schema Changes
```bash
# Create migration for new tables/columns/functions
supabase migration new <description>

# Edit migration file in supabase/migrations/

# Push to remote database
supabase db push
```

#### Step 2: Deploy Edge Functions
```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy <function-name>
```

#### Step 3: Generate TypeScript Types
```bash
# Generate types from remote schema
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

#### Step 4: Quality Checks (Optional but Recommended)
```bash
# Run linter
bun run lint

# Build check
bun run build

# Type check (if configured)
bun run typecheck
```

#### Step 5: Commit Backend Artifacts
```bash
git add supabase/migrations/* src/integrations/supabase/types.ts
git commit -m "feat(backend): <description>

Co-Authored-By: Warp <agent@warp.dev>"
git push origin main
```

---

### 3. GitHub → Single Source of Truth
**Responsibility**: Handshake between Lovable and Warp

**Rules**:
- All changes MUST go through GitHub
- No direct MCP-to-MCP communication
- Frontend and backend sync via git commits
- Always pull before pushing to avoid conflicts

---

## Key Commands Reference

### Database Operations
```bash
# Link to project (one-time setup)
supabase link --project-ref vuekwckknfjivjighhfd

# Check migration status
supabase migration list

# Create new migration
supabase migration new <name>

# Push migrations to remote
supabase db push

# Generate types
supabase gen types typescript --linked > src/integrations/supabase/types.ts

# Repair migration history (if needed)
supabase migration repair --status <applied|reverted> <version>
```

### Edge Functions
```bash
# List functions
supabase functions list

# Create new function
supabase functions new <name>

# Deploy function
supabase functions deploy <name>

# View function logs
supabase functions logs <name>
```

### Development
```bash
# Install dependencies
bun install

# Run dev server
bun dev

# Build for production
bun run build

# Lint code
bun run lint
```

---

## Project Structure

```
institutional-canvas/
├── src/
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts          # Supabase client setup
│   │       └── types.ts           # Generated TypeScript types (DO NOT EDIT MANUALLY)
│   ├── services/                  # API wrappers for Supabase
│   │   ├── orders.service.ts
│   │   ├── suppliers.service.ts
│   │   ├── documents.service.ts
│   │   └── ...
│   └── ...
├── supabase/
│   ├── config.toml                # Project configuration
│   ├── migrations/                # Database migrations (version controlled)
│   └── functions/                 # Edge Functions
├── WORKFLOW.md                    # This file
└── ...
```

---

## Database Tables (Current Schema)

### Core Tables
- `activity_log` - Audit trail for all actions
- `agent_config` - AI agent configuration
- `agent_events` - Agent execution tracking
- `agent_logs` - Agent operation logs
- `ai_analysis_results` - AI analysis outputs

### Trading Tables
- `orders` - Trade orders
- `order_executions` - Execution records
- `suppliers` - Supplier/broker information
- `transactions` - Financial transactions

### Document Management
- `documents` - Document metadata
- `document_versions` - Version control
- `files` - File storage references
- `folders` - Folder hierarchy

### User & Org
- `profiles` - User profiles
- `organizations` - Organization data
- `org_members` - Organization membership
- `api_keys` - API authentication

---

## Integration Rules

### Lovable → Warp Dependencies
When Lovable needs backend support:

1. **Create Issue/Task**: Document the backend requirement
2. **Warp Implements**: Create migration, RPC, or Edge Function
3. **Warp Commits**: Push backend changes to GitHub
4. **Lovable Pulls**: Get latest types and integrate
5. **Test**: Verify integration works end-to-end

### Conflict Resolution
1. Always pull latest from `main` before starting work
2. Backend changes should be committed before frontend integration
3. If migration conflict occurs, use `supabase migration repair`
4. Never force push - communicate conflicts in team channel

---

## Security Best Practices

### RLS (Row Level Security)
- ✅ **ALWAYS** enable RLS on user-facing tables
- ✅ Create policies matching `auth.uid()` for user isolation
- ✅ Test policies with different user contexts
- ❌ **NEVER** bypass RLS in production

### API Keys & Secrets
- ✅ Store in Supabase Edge Function secrets
- ✅ Access via `Deno.env.get()`
- ❌ **NEVER** commit keys to git
- ❌ **NEVER** expose in client code

### Authentication
- ✅ Verify JWT in Edge Functions: `supabaseClient.auth.getUser()`
- ✅ Check `user.id` matches requested resources
- ✅ Return 401 for invalid tokens
- ✅ Log security events to `activity_log`

---

## Deployment Checklist

### Before Deploying
- [ ] All migrations applied: `supabase db push`
- [ ] Types generated: `supabase gen types typescript --linked`
- [ ] Edge Functions deployed: `supabase functions deploy`
- [ ] Lint passes: `bun run lint`
- [ ] Build succeeds: `bun run build`
- [ ] Tests pass (if configured)
- [ ] Changes committed and pushed to GitHub

### After Deploying
- [ ] Verify deployment on Lovable preview
- [ ] Test critical user flows
- [ ] Monitor Edge Function logs
- [ ] Check database query performance
- [ ] Update Notion with deployment details

---

## Troubleshooting

### Migration Issues
```bash
# Check current state
supabase migration list

# Mark remote migrations as applied
supabase migration repair --status applied <version>

# Mark remote migrations as reverted
supabase migration repair --status reverted <version>
```

### Type Generation Fails
```bash
# Ensure project is linked
supabase link --project-ref vuekwckknfjivjighhfd

# Regenerate types
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### Edge Function Errors
```bash
# View logs
supabase functions logs <name> --tail

# Redeploy
supabase functions deploy <name>
```

---

## Contact & Support
- **Warp Agent**: Backend operations, migrations, Edge Functions
- **Lovable**: Frontend UI, component changes, routing
- **GitHub**: Source of truth, all changes synced here
- **Supabase Dashboard**: https://supabase.com/dashboard/project/vuekwckknfjivjighhfd

---

**Last Updated**: 2025-12-23  
**Current Status**: ✅ Connected & Operational
