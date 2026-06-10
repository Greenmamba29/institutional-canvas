
import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusPill } from '@/components/shared/StatusPill';
import { usePurchases } from '@/hooks/usePurchases';
import { useOrganization } from '@/context/OrganizationContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { Database } from '@/integrations/supabase/types';
import { NewPurchaseDialog } from '@/components/purchases/NewPurchaseDialog';
import { PurchaseDetailsDialog } from '@/components/purchases/PurchaseDetailsDialog';

type Purchase = Database['public']['Tables']['purchases']['Row'];

type StatusType = 'active' | 'success' | 'warning' | 'error' | 'pending';

const statusMap: Record<string, StatusType> = {
  pending: 'pending',
  confirmed: 'active',
  shipped: 'warning',
  delivered: 'success',
  completed: 'success',
  cancelled: 'error',
};

export default function Purchases() {
  const { data: purchases, isLoading, error } = usePurchases();
  const { currentOrg } = useOrganization();
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const openDetails = (item: Purchase) => {
    setSelectedPurchase(item);
    setDetailsOpen(true);
  };

  const columns = [
    {
      key: 'purchase_id',
      header: 'PO Number',
      render: (item: Purchase) => (
        <span className="font-mono font-semibold text-primary">{item.purchase_id || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Purchase) => (
        <StatusPill 
          status={statusMap[item.status || 'pending'] || 'pending'} 
        />
      ),
    },
    {
      key: 'total_amount',
      header: 'Amount',
      render: (item: Purchase) => (
        <span className="font-mono font-semibold">
          {item.total_amount ? `$${item.total_amount.toLocaleString()}` : '—'}
          <span className="text-muted-foreground text-xs ml-1">
            {item.currency || 'USD'}
          </span>
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (item: Purchase) => (
        <span className="text-muted-foreground">
          {item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy') : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (item: Purchase) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={() => openDetails(item)}
        >
          View
          <ArrowUpRight className="h-3 w-3" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Purchase Orders"
          description={`Manage purchase orders for ${currentOrg?.name || 'your organization'}`}
          actions={<NewPurchaseDialog />}
        />

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : error ? (
          <div className="glass-panel rounded-xl p-8 text-center">
            <p className="text-destructive">Failed to load purchases</p>
          </div>
        ) : purchases && purchases.length > 0 ? (
          <div className="glass-panel rounded-xl overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {purchases.map((item) => (
                    <tr key={item.id} className="table-row-interactive">
                      {columns.map((column) => (
                        <td key={`${item.id}-${column.key}`} className="px-4 py-4 text-sm">
                          {column.render(item)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-xl p-12 text-center">
            <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Purchase Orders Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Create your first purchase order to start tracking transactions with suppliers.
            </p>
            <NewPurchaseDialog />
          </div>
        )}
      </div>

      <PurchaseDetailsDialog
        purchase={selectedPurchase}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
}
