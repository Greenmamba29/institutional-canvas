# Frontend Components Guide

## Component Organization

```
src/components/
├── ui/                    # shadcn/ui primitives (DO NOT modify unless adding variants)
│   ├── button.tsx
│   ├── card.tsx
│   ├── skeleton.tsx
│   ├── skeleton-loaders.tsx  # Custom page-level skeletons
│   └── ...
├── shared/                # Reusable business components
│   ├── PageHeader.tsx
│   ├── StatusPill.tsx
│   ├── EmptyState.tsx
│   └── ...
├── layout/                # Layout shells and navigation
│   ├── LayoutShell.tsx
│   └── ...
├── marketplace/           # Marketplace-specific components
├── rfq/                   # RFQ-specific components
├── suppliers/             # Supplier detail components
├── telebuy/               # Video call components
└── auth/                  # Auth-related components
```

## Skeleton Loaders

**Location**: `src/components/ui/skeleton-loaders.tsx`

### Available Skeletons

| Component | Use Case |
|-----------|----------|
| `SupplierGridSkeleton` | Marketplace supplier grid |
| `MarketplaceGridSkeleton` | Product cards in marketplace |
| `QuoteListSkeleton` | RFQ/Order list pages |
| `StatsGridSkeleton` | Dashboard KPI cards |
| `DetailPageSkeleton` | Supplier/Deal detail pages |
| `RFQListSkeleton` | RFQ table loading |
| `DashboardKPISkeleton` | Dashboard top KPIs |

### Usage Pattern

```typescript
import { SupplierGridSkeleton } from '@/components/ui/skeleton-loaders';

function MarketplacePage() {
  const { data, isLoading, error } = useProducts();

  if (isLoading) return <SupplierGridSkeleton count={6} />;
  if (error) return <ErrorState ... />;
  if (!data?.length) return <EmptyState ... />;

  return <ProductGrid products={data} />;
}
```

## Shared Components

### PageHeader
```typescript
<PageHeader
  title="Marketplace"
  description="Browse verified lithium products"
  icon={Store}
/>
```

### StatusPill
```typescript
<StatusPill status="open" />     // Green
<StatusPill status="pending" />  // Yellow
<StatusPill status="closed" />   // Gray
```

### EmptyState
```typescript
<EmptyState
  icon={Package}
  title="No products found"
  description="Try adjusting your filters"
  action={<Button>Clear Filters</Button>}
/>
```

## Component Best Practices

1. **Props over context** - Pass data explicitly when possible
2. **Composition over configuration** - Use children for flexibility
3. **Single responsibility** - One component, one job
4. **Named exports** - `export function MyComponent` not `export default`

## Styling Rules

1. **Use design tokens only**
   ```typescript
   // ✅ Good
   className="text-foreground bg-background border-border"
   
   // ❌ Bad
   className="text-white bg-black border-gray-200"
   ```

2. **Use semantic classes**
   ```typescript
   // ✅ Good
   className="glass-panel rounded-xl p-4"
   
   // ❌ Bad
   className="bg-white/10 backdrop-blur-lg rounded-xl p-4"
   ```

3. **Mobile first**
   ```typescript
   className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
   ```

## State Patterns

### Loading/Error/Empty
Every data-fetching component MUST handle:
- Loading state (skeleton)
- Error state (retry button)
- Empty state (helpful message)
- Success state (actual content)

### Form Handling
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```
