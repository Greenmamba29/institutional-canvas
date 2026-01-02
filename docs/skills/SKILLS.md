# LithiumBuy Skills Documentation

This folder contains comprehensive documentation for maintaining and extending the LithiumBuy codebase. Use these guides to understand patterns, prevent bugs, and ensure consistency.

## Directory Structure

```
docs/skills/
├── SKILLS.md           # This file - overview
├── frontend/
│   ├── COMPONENTS.md   # Component patterns and usage
│   ├── ROUTING.md      # React Router patterns
│   └── SUPABASE.md     # Frontend Supabase integration
└── backend/
    ├── DATABASE.md     # Schema design patterns
    ├── RPC.md          # RPC function patterns
    └── RLS.md          # Row Level Security patterns
```

## Quick Reference

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Query (server) + Context (auth/role)
- **Routing**: React Router v6
- **Backend**: Supabase (Postgres + RLS + RPC)

### Critical Rules

1. **NO direct Supabase mutations** - Use RPC functions for writes
2. **Use semantic tokens** - Never `text-white`, always `text-foreground`
3. **Handle all states** - Loading, error, empty, success
4. **Mobile first** - All layouts must work at 375px
5. **Type everything** - No `any` without `eslint-disable` comment

### Key Patterns

#### Data Fetching
```typescript
// Always use React Query hooks
const { data, isLoading, error } = useQuery({
  queryKey: ['entity', id],
  queryFn: () => fetchEntity(id),
  enabled: !!id
});
```

#### RPC Calls
```typescript
// All writes go through RPC
const { data, error } = await supabase.rpc('create_entity', {
  p_name: name,
  p_org_id: orgId
});
```

#### Loading States
```typescript
// Use skeleton loaders
import { SupplierGridSkeleton } from '@/components/ui/skeleton-loaders';

if (isLoading) return <SupplierGridSkeleton count={6} />;
```

## See Also
- [frontend/COMPONENTS.md](./frontend/COMPONENTS.md) - Component library
- [frontend/ROUTING.md](./frontend/ROUTING.md) - Route definitions
- [backend/RPC.md](./backend/RPC.md) - Available RPC functions
