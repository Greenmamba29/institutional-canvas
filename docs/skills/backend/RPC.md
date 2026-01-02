# RPC Functions Guide

## Why RPC?

All write operations go through Supabase RPC functions because:
1. **Business logic enforcement** - Validation, audit logging
2. **RLS bypass** - Functions run as SECURITY DEFINER
3. **Atomic operations** - Multi-table writes in transaction
4. **Notification triggers** - Auto-create notifications

## Available Functions

### Organization Management

#### `create_organization`
Creates org and adds user as owner.
```sql
SELECT create_organization(
  p_org_type := 'buyer',
  p_name := 'Acme Corp',
  p_email := 'contact@acme.com'
);
```

#### `get_my_organizations`
Returns all orgs user is member of.
```sql
SELECT * FROM get_my_organizations();
```

### RFQ Management

#### `create_rfq`
Creates RFQ and notification.
```sql
SELECT create_rfq(
  p_title := 'Lithium Carbonate',
  p_description := 'Need 500 MT',
  p_product_id := null,
  p_target_quantity := 500,
  p_target_unit := 'MT',
  p_incoterms := 'CIF',
  p_delivery_location := 'Rotterdam'
);
```

#### `list_rfqs`
Returns RFQs for current user's org.
```sql
SELECT * FROM list_rfqs();
```

### Bid Management

#### `submit_bid`
Creates bid and notifies buyer.
```sql
SELECT submit_bid(
  p_rfq_id := '...',
  p_supplier_id := '...',
  p_price := 66500,
  p_currency := 'USD',
  p_quantity := 500,
  p_lead_time_days := 30,
  p_notes := 'Premium grade'
);
```

### Deal Management

#### `create_deal`
Creates deal from awarded bid.
```sql
SELECT create_deal(
  p_supplier_id := '...',
  p_rfq_id := '...',
  p_title := 'Lithium Order Q1'
);
```

### Purchase Management

#### `create_purchase`
Creates PO with auto-generated number.
```sql
SELECT create_purchase(
  p_buyer_org_id := '...',
  p_supplier_org_id := '...',
  p_deal_id := '...',
  p_total_amount := 3325000,
  p_currency := 'USD'
);
```

#### `get_purchase`
Retrieves purchase by PO number.
```sql
SELECT * FROM get_purchase('PO-2024-000123');
```

### Notifications

#### `get_notifications`
Returns notifications for current org.
```sql
SELECT * FROM get_notifications();
```

#### `mark_notification_read`
Marks notification as read.
```sql
SELECT mark_notification_read('notification-uuid');
```

### Market Data

#### `get_price_indicators`
Returns lithium price data.
```sql
SELECT get_price_indicators(
  p_symbol := 'LI-CARB',
  p_region := 'ASIA',
  p_limit := 50
);
```

### Listings

#### `list_listings`
Returns all products.
```sql
SELECT * FROM list_listings();
```

#### `get_listing`
Returns single product.
```sql
SELECT * FROM get_listing('product-uuid');
```

## Helper Functions

#### `jwt_org_id()`
Extracts org_id from JWT claims.

#### `jwt_user_id()`
Extracts user_id from JWT claims.

#### `current_sub()`
Returns current user's auth.uid() as text.

#### `is_org_member(org_id)`
Returns true if current user is member of org.

## Function Template

```sql
CREATE OR REPLACE FUNCTION public.my_function(
  p_param1 text,
  p_param2 uuid
)
RETURNS my_table
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := public.jwt_user_id();
  v_org_id uuid := public.jwt_org_id();
  v_row public.my_table;
BEGIN
  -- Validation
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Missing org_id in JWT';
  END IF;
  
  -- Main logic
  INSERT INTO public.my_table (org_id, ...)
  VALUES (v_org_id, ...)
  RETURNING * INTO v_row;
  
  -- Notifications
  INSERT INTO public.notifications (org_id, type, title, ...)
  VALUES (v_org_id, 'system', 'Action completed', ...);
  
  RETURN v_row;
END;
$$;
```
