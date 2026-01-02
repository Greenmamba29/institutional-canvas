import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Skeleton loader for supplier cards
 */
export function SupplierCardSkeleton() {
  return (
    <Card className="relative">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex flex-col items-center text-center space-y-3">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-5 w-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for supplier grid
 */
export function SupplierGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SupplierCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton loader for quote/order rows
 */
export function QuoteRowSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for quote/order lists
 */
export function QuoteListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <QuoteRowSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton loader for product rows in tables
 */
export function ProductRowSkeleton() {
  return (
    <tr>
      <td className="p-4">
        <Skeleton className="h-4 w-32" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-24" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-20" />
      </td>
      <td className="p-4">
        <Skeleton className="h-4 w-28" />
      </td>
      <td className="p-4">
        <Skeleton className="h-8 w-24 rounded" />
      </td>
    </tr>
  );
}

/**
 * Skeleton loader for product table
 */
export function ProductTableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="p-4 text-left">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="p-4 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
            <th className="p-4 text-left">
              <Skeleton className="h-4 w-12" />
            </th>
            <th className="p-4 text-left">
              <Skeleton className="h-4 w-20" />
            </th>
            <th className="p-4 text-left">
              <Skeleton className="h-4 w-16" />
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <ProductRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Skeleton loader for page header
 */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-4 mb-8">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-96" />
    </div>
  );
}

/**
 * Skeleton loader for stats/KPIs
 */
export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for stats grid
 */
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton loader for detailed content page
 */
export function DetailPageSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton loader for RFQ rows
 */
export function RFQRowSkeleton() {
  return (
    <div className="glass-panel rounded-lg p-4 flex items-center justify-between">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for RFQ list
 */
export function RFQListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <RFQRowSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Skeleton loader for dashboard KPI cards
 */
export function DashboardKPISkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-panel rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-10 rounded" />
          </div>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for marketplace product cards
 */
export function MarketplaceCardSkeleton() {
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="h-3 w-1/2 mb-4" />
      <div className="space-y-2 mb-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-20 rounded" />
      </div>
    </div>
  );
}

/**
 * Skeleton for marketplace grid
 */
export function MarketplaceGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <MarketplaceCardSkeleton key={i} />
      ))}
    </div>
  );
}
