# Supabase Frontend Integration

## Client Setup

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vuekwckknfjivjighhfd.supabase.co';
const supabaseAnonKey = '...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## Data Fetching Patterns

### Direct Reads (Allowed)
```typescript
// ✅ Read operations are allowed
const { data, error } = await supabase
  .from('suppliers')
  .select('*')
  .eq('verification_tier', 'gold');
```

### RPC for Writes (Required)
```typescript
// ✅ All writes go through RPC
const { data, error } = await supabase.rpc('create_rfq', {
  p_title: 'Lithium Carbonate Request',
  p_description: '500 MT needed',
  p_target_quantity: 500,
  p_target_unit: 'MT'
});

// ❌ NEVER do direct inserts
// await supabase.from('rfqs').insert({ ... });
```

## Available RPC Functions

| Function | Purpose | Parameters |
|----------|---------|------------|
| `create_organization` | Create buyer/supplier org | `p_org_type`, `p_name`, `p_email` |
| `create_rfq` | Create new RFQ | `p_title`, `p_description`, etc. |
| `submit_bid` | Submit bid on RFQ | `p_rfq_id`, `p_price`, etc. |
| `create_deal` | Create deal from bid | `p_supplier_id`, `p_rfq_id`, `p_title` |
| `create_purchase` | Create purchase order | `p_buyer_org_id`, `p_supplier_org_id` |
| `mark_notification_read` | Mark notification read | `p_notification_id` |

## React Query Integration

### Hook Pattern
```typescript
// src/hooks/useRFQs.ts
export function useRFQs() {
  return useQuery({
    queryKey: ['rfqs'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('list_rfqs');
      if (error) throw error;
      return data;
    }
  });
}
```

### Mutation Pattern
```typescript
export function useCreateRFQ() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: CreateRFQInput) => {
      const { data, error } = await supabase.rpc('create_rfq', {
        p_title: input.title,
        p_description: input.description,
        // ...
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      toast.success('RFQ created successfully');
    }
  });
}
```

## Realtime Subscriptions

```typescript
// src/hooks/useRealtimeSubscription.ts
export function useRealtimeSubscription({
  table,
  event = '*',
  filter,
  queryKey,
  enabled = true
}: RealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', { event, schema: 'public', table, filter }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, filter, queryKey, enabled, queryClient]);
}
```

## Error Handling

```typescript
// Service layer catches errors
async function fetchSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*');
  
  if (error) {
    console.error('Failed to fetch suppliers:', error);
    throw new Error('Failed to load suppliers');
  }
  
  return data;
}

// Component shows error state
if (error) {
  return (
    <ErrorState
      title="Failed to load suppliers"
      retry={() => refetch()}
    />
  );
}
```

## Type Safety

Types are auto-generated in `src/integrations/supabase/types.ts`.

```typescript
import type { Database } from '@/integrations/supabase/types';

type Supplier = Database['public']['Tables']['suppliers']['Row'];
type RFQ = Database['public']['Tables']['rfqs']['Row'];
```
