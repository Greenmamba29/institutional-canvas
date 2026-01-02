# Routing Guide

## Route Definitions

All routes are defined in `src/App.tsx`.

### Public Routes
```
/              → Landing (redirects to /auth if not logged in)
/auth          → Login/Signup
/password-reset → Password reset flow
```

### Protected Routes (require auth)
```
/dashboard           → Main dashboard (role-aware)
/marketplace         → Supplier/product directory
/marketplace/:id     → Supplier detail page
/rfqs                → RFQ management
/bids                → Bid management
/deals               → Deal management
/orders              → Order tracking
/purchases           → Purchase orders
/auctions            → Live auctions
/telebuy             → Video call scheduling
/telebuy/:id         → Active video session
/ai-studio           → AI insights (Pro tier)
/settings            → User settings
/billing             → Subscription management
/team                → Team management
/verification        → Account verification
/onboarding          → New user onboarding
```

## Route Guards

### ProtectedRoute
Wraps all authenticated routes:
```typescript
<Route element={<ProtectedRoute />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Route>
```

### Implementation
```typescript
// src/components/auth/ProtectedRoute.tsx
function ProtectedRoute() {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth" />;
  
  return <Outlet />;
}
```

## Navigation Patterns

### Programmatic Navigation
```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/dashboard');
navigate(`/marketplace/${supplierId}`);
```

### Link Components
```typescript
import { Link } from 'react-router-dom';

<Link to="/marketplace">Browse Suppliers</Link>

// With Button
<Button asChild>
  <Link to="/rfqs">View RFQs</Link>
</Button>
```

### Dynamic Routes
```typescript
// Route definition
<Route path="/marketplace/:id" element={<SupplierDetail />} />

// Access params
const { id } = useParams<{ id: string }>();
```

## Breadcrumbs

Use `BreadcrumbNav` for navigation context:
```typescript
<BreadcrumbNav items={[
  { label: 'PLATFORM' },
  { label: 'TRADING DESK' },
  { label: 'RFQs' }
]} />
```

## Query Parameters

Use `useSearchParams` for filter state:
```typescript
const [searchParams, setSearchParams] = useSearchParams();
const status = searchParams.get('status') || 'all';

// Update
setSearchParams({ status: 'open' });
```
