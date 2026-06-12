# Lithium Buy - Frontend/Backend Orchestration Skills

## Project Overview
**Lithium Buy** is an institutional trading platform for lithium and battery materials procurement. The platform enables buyers to create RFQs, manage supplier relationships, execute deals, and participate in auctions.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite (managed in Frontend)
- Backend: Supabase (Postgres + Edge Functions)
- Auth: Supabase Auth with JWT claims for `org_id` multi-tenancy
- Repository: https://github.com/Greenmamba29/institutional-canvas.git
- Supabase Project: `vuekwckknfjivjighhfd`

---

## MVP FIFO Orchestration Chain (Canonical)

For MVP bug work, use this fixed skill chain in/out with minimal overhead:

1. **Triage Skill**  
   - Read `docs/MVP_BUG_LEDGER.md`
   - Select oldest open item in FIFO order (Blocking first, then Non-blocking)
   - Confirm owner + exit criteria

2. **Implementation Skill**  
   - Execute smallest change required to satisfy exit criteria
   - Avoid unrelated refactors

3. **Verification Skill**  
   - Run focused checks/tests for the changed surface
   - Record pass/fail evidence

4. **Ledger Update Skill**  
   - Update row status in `docs/MVP_BUG_LEDGER.md`
   - Add closure evidence (PR/commit reference and date)

**Rule:** Never skip the ledger read and never work items out of FIFO order within a queue.

---

## Division of Responsibilities

### Frontend (Frontend)
**What Frontend Does:**
- Build all React components and UI
- Implement routing and navigation
- Handle form validation and user interactions
- Call Supabase RPC functions (NOT direct table access)
- Display data from RPC responses
- Manage client-side state with Zustand/Context
- Style with Tailwind CSS

**What Frontend Does NOT Do:**
- Create or modify database schemas
- Write SQL migrations
- Create Edge Functions
- Modify RLS policies
- Generate TypeScript types from database

**Frontend's Data Access Pattern:**
```typescript
// ✅ CORRECT - Call RPC functions
const { data, error } = await supabase.rpc('create_rfq', {
  p_title: 'Need 10MT Lithium Carbonate',
  p_description: '...',
  // ...other params
});

// ❌ WRONG - Never direct table access
const { data } = await supabase.from('rfqs').insert({ ... });
```

---

### Warp (Backend)
**What Warp Does:**
- Create and modify database schemas
- Write SQL migrations in `supabase/migrations/`
- Create Edge Functions in `supabase/functions/`
- Configure RLS policies
- Generate TypeScript types: `supabase gen types typescript --linked > src/integrations/supabase/types.ts`
- Commit all backend changes to GitHub with co-author line
- Verify migrations applied successfully via MCP

**What Warp Does NOT Do:**
- Build React components
- Write JSX/TSX UI code
- Implement frontend routing
- Style components

**Warp's Workflow:**
1. Research existing schema via MCP or codebase search
2. Write migration SQL in `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
3. Apply migration via MCP `execute_sql` (in chunks if needed)
4. Verify tables/functions created
5. Regenerate types: `supabase gen types typescript --linked > src/integrations/supabase/types.ts`
6. Commit with co-author: `Co-Authored-By: Warp <agent@warp.dev>`
7. Push to GitHub

---

## Database Architecture

### Core Tables
1. **suppliers** - Supplier organizations (existing, primary key: `org_id`)
2. **products** - Product catalog (existing)
3. **rfqs** - Request for Quotes from buyers
4. **bids** - Supplier responses to RFQs
5. **deals** - Awarded contracts between buyer and supplier
6. **auctions** - Live/scheduled auctions
7. **auction_bids** - Bids placed in auctions
8. **notifications** - System notifications
9. **price_indicators** - Market intelligence data

### Authentication Pattern
**Supabase Auth JWT Claims:**
```json
{
  "sub": "uuid-of-user",
  "user_metadata": {
    "org_id": "uuid-of-organization"
  }
}
```

**Helper Functions:**
- `jwt_claim(claim text)` - Extract any claim from JWT
- `jwt_org_id()` - Get org_id from JWT (supports namespaced claims)
- `jwt_user_id()` - Get user_id from JWT or fall back to `auth.uid()`

### Security Model
**Row Level Security (RLS):**
- All tables have RLS enabled
- SELECT policies filter by `org_id = jwt_org_id()`
- Direct INSERT/UPDATE/DELETE revoked for `anon` and `authenticated` roles
- All mutations MUST go through SECURITY DEFINER RPC functions

**Why RPC Functions?**
- Enforce business logic server-side
- Create audit logs and notifications atomically
- Prevent privilege escalation
- Enable cross-organization operations (e.g., supplier accepting buyer's deal)

---

## Available RPC Functions

### RFQs
```typescript
// Create new RFQ (buyer)
create_rfq(
  p_title: string,
  p_description: string,
  p_product_id: uuid | null,
  p_target_quantity: number,
  p_target_unit: string,
  p_incoterms: string,
  p_delivery_location: string
): rfqs

// List org's RFQs
list_rfqs(): rfqs[]
```

### Bids
```typescript
// Submit bid on RFQ (supplier)
submit_bid(
  p_rfq_id: uuid,
  p_supplier_id: uuid,
  p_price: number,
  p_currency: string,
  p_quantity: number,
  p_lead_time_days: number,
  p_notes: string
): bids

// Withdraw bid
withdraw_bid(p_bid_id: uuid): boolean
```

### Deals
```typescript
// Create deal (buyer awards RFQ to supplier)
create_deal(
  p_supplier_id: uuid,
  p_rfq_id: uuid | null,
  p_title: string
): deals

// Update deal status (buyer)
update_deal_status(
  p_deal_id: uuid,
  p_status: deal_status
): deals

// Supplier responds to offer
respond_to_offer(
  p_deal_id: uuid,
  p_decision: 'accepted' | 'rejected',
  p_note: string
): deals
```

### Auctions
```typescript
// List active auctions
list_auctions(): auctions[]

// Place bid in auction
place_auction_bid(
  p_auction_id: uuid,
  p_amount: number,
  p_currency: string
): auction_bids
```

### Notifications
```typescript
// Get org's notifications
get_notifications(): notifications[]

// Mark notification as read
mark_notification_read(p_notification_id: uuid): boolean
```

### Market Intel
```typescript
// Get price indicators
get_price_indicators(
  p_symbol: string | null,
  p_region: string | null,
  p_limit: number = 50
): jsonb
```

### Listings (Products)
```typescript
// List all products
list_listings(): products[]

// Get single product
get_listing(p_product_id: uuid): products
```

### Organizations
```typescript
// Create organization (auto-adds creator as owner)
create_organization(
  p_org_type: 'buyer' | 'supplier' | 'admin' | 'partner',
  p_name: string,
  p_email: string | null,
  p_phone: string | null
): organizations

// Get user's organizations
get_my_organizations(): organizations[]

// Invite member to org (returns invite token)
invite_org_member(
  p_org_id: uuid,
  p_user_email: string,
  p_role: 'owner' | 'admin' | 'member' | 'viewer'
): jsonb

// Claim org membership (supplier onboarding)
claim_org_membership(
  p_org_id: uuid,
  p_invite_token: string | null
): org_members

// Get org members
get_org_members(p_org_id: uuid): org_members[]
```

### Purchases (Purchase Orders)
```typescript
// Create purchase order (generates PO-YYYY-NNNNNN)
create_purchase(
  p_buyer_org_id: uuid,
  p_supplier_org_id: uuid,
  p_deal_id: uuid | null,
  p_total_amount: number | null,
  p_currency: string = 'USD',
  p_payload: jsonb = '{}',
  p_notes: string | null
): purchases

// Update purchase status
update_purchase_status(
  p_purchase_id: string, // PO number
  p_status: 'pending' | 'accepted' | 'rejected' | 'paid' | 'shipped' | 'delivered' | 'cancelled'
): purchases

// List user's org purchases
list_purchases(): purchases[]

// Get single purchase by PO number
get_purchase(p_purchase_id: string): purchases
```

---

## Enums

```typescript
type rfq_status = 'draft' | 'submitted' | 'closed' | 'cancelled';
type deal_status = 'pending' | 'active' | 'rejected' | 'expired' | 'completed' | 'cancelled';
type offer_decision = 'accepted' | 'rejected';
type auction_status = 'scheduled' | 'live' | 'ended' | 'cancelled';
type notification_type = 
  | 'rfq_submitted'
  | 'rfq_awarded'
  | 'deal_created'
  | 'deal_offer_response'
  | 'auction_bid_placed'
  | 'auction_won'
  | 'system';
```

---

## Frontend Implementation Patterns

### 1. Creating an RFQ (Buyer Flow)
```typescript
// In Frontend component
const CreateRFQForm = () => {
  const [formData, setFormData] = useState({ ... });
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const { data, error } = await supabase.rpc('create_rfq', {
      p_title: formData.title,
      p_description: formData.description,
      p_product_id: formData.productId,
      p_target_quantity: formData.quantity,
      p_target_unit: formData.unit,
      p_incoterms: formData.incoterms,
      p_delivery_location: formData.location
    });
    
    if (error) {
      toast.error('Failed to create RFQ');
      console.error(error);
      return;
    }
    
    toast.success('RFQ created successfully');
    navigate(`/rfqs/${data.id}`);
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

### 2. Listing RFQs with Real-time Updates
```typescript
const RFQList = () => {
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  
  useEffect(() => {
    // Initial load
    const loadRfqs = async () => {
      const { data } = await supabase.rpc('list_rfqs');
      setRfqs(data || []);
    };
    loadRfqs();
    
    // Subscribe to changes
    const subscription = supabase
      .channel('rfqs_channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rfqs' },
        () => loadRfqs()
      )
      .subscribe();
    
    return () => { subscription.unsubscribe(); };
  }, []);
  
  return <div>{rfqs.map(rfq => <RFQCard key={rfq.id} rfq={rfq} />)}</div>;
};
```

### 3. Supplier Bidding on RFQ
```typescript
const BidForm = ({ rfqId }: { rfqId: string }) => {
  const [bid, setBid] = useState({ price: 0, quantity: 0, notes: '' });
  const { user } = useAuth(); // Assume Auth0 integration
  
  const handleSubmit = async () => {
    const { data, error } = await supabase.rpc('submit_bid', {
      p_rfq_id: rfqId,
      p_supplier_id: user.org_id, // From Auth0 JWT
      p_price: bid.price,
      p_currency: 'USD',
      p_quantity: bid.quantity,
      p_lead_time_days: 30,
      p_notes: bid.notes
    });
    
    if (error) {
      toast.error('Failed to submit bid');
      return;
    }
    
    toast.success('Bid submitted successfully');
  };
  
  return <form>...</form>;
};
```

### 4. Buyer Awarding Deal
```typescript
const AwardDealButton = ({ rfqId, supplierId, bidTitle }: Props) => {
  const handleAward = async () => {
    const { data, error } = await supabase.rpc('create_deal', {
      p_supplier_id: supplierId,
      p_rfq_id: rfqId,
      p_title: bidTitle
    });
    
    if (error) {
      toast.error('Failed to create deal');
      return;
    }
    
    toast.success('Deal created! Waiting for supplier response.');
    navigate(`/deals/${data.id}`);
  };
  
  return <Button onClick={handleAward}>Award to Supplier</Button>;
};
```

### 5. Supplier Accepting/Rejecting Offer
```typescript
const DealResponseButtons = ({ dealId }: { dealId: string }) => {
  const handleResponse = async (decision: 'accepted' | 'rejected') => {
    const note = prompt('Add a note (optional):');
    
    const { data, error } = await supabase.rpc('respond_to_offer', {
      p_deal_id: dealId,
      p_decision: decision,
      p_note: note || ''
    });
    
    if (error) {
      toast.error('Failed to respond');
      return;
    }
    
    toast.success(`Offer ${decision}`);
  };
  
  return (
    <div>
      <Button onClick={() => handleResponse('accepted')}>Accept</Button>
      <Button onClick={() => handleResponse('rejected')}>Reject</Button>
    </div>
  );
};
```

---

## Backend Implementation Patterns

### 1. Adding a New RPC Function
**File:** `supabase/migrations/YYYYMMDDHHMMSS_add_function_name.sql`

```sql
create or replace function public.function_name(
  p_param1 type1,
  p_param2 type2
) returns return_type
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid := public.jwt_org_id();
  v_user uuid := public.jwt_user_id();
  v_result return_type;
begin
  -- Validate org_id present
  if v_org is null then 
    raise exception 'Missing org_id in JWT'; 
  end if;
  
  -- Your business logic here
  insert into public.some_table (...)
  values (...)
  returning * into v_result;
  
  -- Optional: create notification
  insert into public.notifications (org_id, type, title, body)
  values (v_org, 'system', 'Action completed', 'Details...');
  
  return v_result;
end;
$$;
```

**Apply via Warp:**
```bash
# Split into chunks and apply via MCP execute_sql
# OR use supabase CLI if psql available
```

### 2. Adding a New Table
```sql
create table if not exists public.new_table (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  created_by uuid not null,
  -- other columns
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists new_table_org_id_idx on public.new_table(org_id);

-- Enable RLS
alter table public.new_table enable row level security;

-- Create policy
do $$ begin
  drop policy if exists new_table_select_org on public.new_table;
  create policy new_table_select_org on public.new_table 
    for select using (org_id = public.jwt_org_id());
exception when others then null; end $$;

-- Lock down direct mutations
revoke insert, update, delete on public.new_table from anon, authenticated;
```

### 3. Adding Edge Function (External API Integration)
**File:** `supabase/functions/spot-ai-sync/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }
  
  // Verify JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { data: { user }, error } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  
  if (error || !user) return new Response('Unauthorized', { status: 401 });
  
  // Call external API
  const spotApiKey = Deno.env.get('SPOT_AI_API_KEY');
  const response = await fetch('https://api.spot.ai/prices', {
    headers: { 'Authorization': `Bearer ${spotApiKey}` }
  });
  
  const prices = await response.json();
  
  // Store in database
  for (const price of prices) {
    await supabase.from('price_indicators').insert({
      symbol: price.symbol,
      region: price.region,
      price: price.value,
      currency: price.currency,
      unit: price.unit,
      source: 'SPOT.ai',
      metadata: price.metadata
    });
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

**Deploy:**
```bash
supabase functions deploy spot-ai-sync --no-verify-jwt
supabase secrets set SPOT_AI_API_KEY=xxx
```

---

## Testing Checklist

### Before Frontend Starts Building UI
- [ ] All RPC functions exist and are tested
- [ ] TypeScript types generated and committed
- [ ] RLS policies verified (test with different org_ids)
- [ ] Sample data inserted for UI development

### Testing RPC Functions (Warp)
```sql
-- Test as specific org
select set_config('request.jwt.claims', 
  '{"org_id": "test-org-uuid-here"}', 
  false);

-- Test function
select * from create_rfq(
  'Test RFQ',
  'Test Description',
  null,
  100,
  'MT',
  'FOB',
  'Los Angeles'
);

-- Verify notification created
select * from notifications where org_id = 'test-org-uuid-here';
```

### Testing in Frontend
```typescript
// Add to component for debugging
console.log('Calling create_rfq with:', params);
const { data, error } = await supabase.rpc('create_rfq', params);
console.log('Response:', { data, error });
```

---

## Common Issues & Solutions

### Issue: "Missing org_id in JWT"
**Cause:** Auth0 not injecting org_id claim
**Solution:** Configure Auth0 Action to add custom claim:
```javascript
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://lithiumbuy.com';
  api.idToken.setCustomClaim(`${namespace}/org_id`, event.user.org_id);
  api.accessToken.setCustomClaim(`${namespace}/org_id`, event.user.org_id);
};
```

### Issue: RLS blocks reads even with correct org_id
**Cause:** JWT not being passed correctly
**Solution:** Ensure Supabase client initialized with Auth0 token:
```typescript
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: {
      Authorization: `Bearer ${auth0Token}`
    }
  }
});
```

### Issue: "Permission denied for table X"
**Cause:** Trying direct table access instead of RPC
**Solution:** Use RPC function: `supabase.rpc('function_name', params)`

### Issue: Types out of sync
**Cause:** Schema changed but types not regenerated
**Solution (Warp):**
```bash
supabase gen types typescript --linked > src/integrations/supabase/types.ts
git add src/integrations/supabase/types.ts
git commit -m "chore: regenerate types"
git push
```

---

## Communication Protocol

### When Frontend Needs New Functionality
**Frontend asks Warp:**
> "I need to implement [feature]. Can you create an RPC function that [does X] and returns [Y]?"

**Warp responds:**
1. Creates migration with RPC function
2. Applies to database via MCP
3. Regenerates types
4. Commits and pushes to GitHub
5. Replies: "✅ Function `function_name(params)` ready. Returns `Type`. Pull latest and import from `src/integrations/supabase/types.ts`"

### When Backend Schema Changes
**Warp notifies Frontend:**
> "⚠️ Breaking change: Renamed column `old_name` to `new_name` in table X. Please update your queries."

**Frontend:**
1. Pulls latest from GitHub
2. Updates component imports/types
3. Tests affected components

---

## Git Workflow

### Warp Commits
```bash
git add supabase/migrations/* src/integrations/supabase/types.ts
git commit -m "feat: add RFQ bidding workflow

- Created submit_bid() RPC function
- Added bids table with foreign keys
- Enabled RLS with org isolation
- Generated TypeScript types

Co-Authored-By: Warp <agent@warp.dev>"
git push origin main
```

### Frontend Commits
```bash
# Frontend's internal git workflow (automatic)
# User commits via Frontend UI
# Changes pushed to GitHub automatically
```

---

## File Structure

```
institutional-canvas/
├── src/
│   ├── components/          # React components (Frontend)
│   ├── pages/              # Route pages (Frontend)
│   ├── hooks/              # Custom hooks (Frontend)
│   ├── lib/                # Utilities (Frontend)
│   └── integrations/
│       └── supabase/
│           ├── client.ts   # Supabase client setup
│           └── types.ts    # Generated types (Warp)
├── supabase/
│   ├── functions/          # Edge Functions (Warp)
│   └── migrations/         # SQL migrations (Warp)
├── SKILLS.md              # This file
├── WORKFLOW.md            # Detailed workflow docs
└── README.md              # Project overview
```

---

## Quick Reference

### Frontend's Supabase Cheat Sheet
```typescript
// ✅ Always use RPC functions
await supabase.rpc('function_name', { params });

// ✅ Subscribe to real-time changes
supabase.channel('channel_name')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'table_name' }, callback)
  .subscribe();

// ❌ Never use direct table access
await supabase.from('table').insert({ ... }); // BLOCKED BY RLS
```

### Warp's Migration Cheat Sheet
```sql
-- Create function
create or replace function public.func_name(...) 
returns type
language plpgsql
security definer
set search_path = public
as $$ ... $$;

-- Enable RLS
alter table public.table_name enable row level security;

-- Create policy
do $$ begin
  drop policy if exists policy_name on public.table_name;
  create policy policy_name on public.table_name 
    for select using (org_id = public.jwt_org_id());
exception when others then null; end $$;

-- Lock mutations
revoke insert, update, delete on public.table_name from anon, authenticated;
```

---

## Success Metrics

**You know the orchestration is working when:**
- [ ] Frontend can call any RPC function without errors
- [ ] TypeScript provides autocomplete for all function params
- [ ] RLS correctly isolates data by org_id
- [ ] Notifications are created automatically on key events
- [ ] Real-time subscriptions update UI instantly
- [ ] No direct table access errors in console
- [ ] All git commits include co-author line

---

**Last Updated:** 2025-12-24  
**Version:** 1.0.0  
**Maintained By:** Warp AI Agent
