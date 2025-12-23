# Warp Development Quick Reference

## 🚀 Quick Start

```bash
# Navigate to project
cd ~/institutional-canvas

# Install dependencies
bun install

# Start dev server
bun dev
```

## 📋 Common Workflows

### Backend Schema Change
```bash
# 1. Create migration
supabase migration new add_new_table

# 2. Edit migration file in supabase/migrations/

# 3. Apply to remote
supabase db push

# 4. Generate types
supabase gen types typescript --linked > src/integrations/supabase/types.ts

# 5. Commit
git add supabase/migrations/* src/integrations/supabase/types.ts
git commit -m "feat(backend): add new table

Co-Authored-By: Warp <agent@warp.dev>"
git push
```

### Deploy Edge Function
```bash
# Deploy single function
supabase functions deploy <name>

# Check logs
supabase functions logs <name> --tail
```

### Sync with Remote DB
```bash
# Check migration status
supabase migration list

# Generate types from current schema
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

## 🔧 Project Info

- **Project**: Lithium Buy (Institutional Trading Platform)
- **Supabase**: `vuekwckknfjivjighhfd`
- **GitHub**: `Greenmamba29/institutional-canvas`
- **Package Manager**: bun
- **Framework**: React 18 + TypeScript + Vite

## 📚 Documentation

- [WORKFLOW.md](../WORKFLOW.md) - Complete workflow documentation
- [Supabase Dashboard](https://supabase.com/dashboard/project/vuekwckknfjivjighhfd)

## 🤝 Division of Responsibilities

| Area | Owner | Actions |
|------|-------|---------|
| **Frontend** | Lovable | UI, components, routes |
| **Backend** | Warp | Schema, migrations, Edge Functions, types |
| **Truth** | GitHub | All changes synced here |

## ⚡ Key Rules

1. **Always** generate types after schema changes
2. **Never** edit `src/integrations/supabase/types.ts` manually
3. **Always** include co-author line in commits: `Co-Authored-By: Warp <agent@warp.dev>`
4. **Never** commit API keys or secrets
5. **Always** enable RLS on user-facing tables

## 🆘 Troubleshooting

### Migration conflicts?
```bash
supabase migration repair --status applied <version>
```

### Types out of sync?
```bash
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### Need to check DB state?
```bash
supabase migration list
```

## 📞 Support

- Issues? Check [WORKFLOW.md](../WORKFLOW.md) Troubleshooting section
- Warp handles: Backend, DB, Edge Functions
- Lovable handles: Frontend, UI, Components
