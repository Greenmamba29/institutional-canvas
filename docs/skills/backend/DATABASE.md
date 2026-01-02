# Database Schema Guide

## Table Categories

### Core Tables
- `organizations` - Buyer/Supplier companies
- `org_members` - User-org membership
- `profiles` - User profiles

### Trading Tables
- `rfqs` - Request for Quotes
- `bids` - Supplier bids on RFQs
- `deals` - Accepted deals
- `purchases` - Purchase orders

### Marketplace Tables
- `suppliers` - Supplier public profiles
- `products` - Product listings
- `certifications` - Supplier certifications
- `reviews` - Supplier reviews

### Market Data
- `price_indicators` - Lithium prices by region
- `auctions` - Live/scheduled auctions
- `auction_bids` - Bids on auctions

### Support Tables
- `notifications` - System notifications
- `audit_log` - Action audit trail
- `telebuy_sessions` - Video call sessions

## Naming Conventions

### Tables
- Plural nouns: `organizations`, `products`, `rfqs`
- Snake_case: `org_members`, `price_indicators`

### Columns
- Primary key: `id` (UUID)
- Foreign keys: `{table}_id` (e.g., `org_id`, `supplier_id`)
- Timestamps: `created_at`, `updated_at`
- Status: `status` (with enum type)
- Amounts: `{prefix}_amount` (e.g., `total_amount`)

### Constraints
- Primary: `{table}_pkey`
- Foreign: `{table}_{column}_fkey`
- Unique: `{table}_{column}_key`
- Check: `{table}_{column}_check`

## Common Patterns

### Standard Columns
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
org_id UUID REFERENCES organizations(id)
```

### Updated_at Trigger
```sql
CREATE TRIGGER update_updated_at
BEFORE UPDATE ON my_table
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
```

### Status Enums
```sql
CREATE TYPE rfq_status AS ENUM ('draft', 'submitted', 'closed', 'awarded');
CREATE TYPE deal_status AS ENUM ('pending', 'accepted', 'rejected', 'completed');
```

## Key Relationships

```
organizations
  └── org_members (user_id → auth.users)
  └── suppliers (org_id → organizations)
      └── products
      └── certifications
      └── reviews
  └── rfqs (organization_id)
      └── bids (rfq_id)
          └── deals (bid_id)
              └── purchases (deal_id)
```

## Indexes

### Standard Indexes
```sql
-- Foreign key indexes (auto-created in some cases)
CREATE INDEX idx_rfqs_org_id ON rfqs(organization_id);

-- Status filtering
CREATE INDEX idx_rfqs_status ON rfqs(status);

-- Date range queries
CREATE INDEX idx_price_indicators_observed ON price_indicators(observed_at DESC);

-- Text search
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
```

## Migration Best Practices

1. **Always add defaults** for new required columns
2. **Use validation triggers** instead of CHECK constraints for time-based rules
3. **Create indexes** for frequently filtered columns
4. **Add RLS policies** in same migration
5. **Test with existing data** before deploying
