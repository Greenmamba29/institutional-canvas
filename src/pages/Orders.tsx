
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import { StatsGridSkeleton, QuoteListSkeleton } from "@/components/ui/skeleton-loaders";
import { Package, Truck, CheckCircle, Clock, DollarSign, AlertCircle } from "lucide-react";
import { useOrders } from "@/hooks/useOrders";
import { format } from "date-fns";

const statusConfig: Record<string, { icon: typeof Package; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-warning/10 text-warning border-warning/20", label: "Pending" },
  processing: { icon: Clock, color: "bg-warning/10 text-warning border-warning/20", label: "Processing" },
  shipped: { icon: Truck, color: "bg-primary/10 text-primary border-primary/20", label: "Shipped" },
  delivered: { icon: CheckCircle, color: "bg-success/10 text-success border-success/20", label: "Delivered" },
  cancelled: { icon: AlertCircle, color: "bg-destructive/10 text-destructive border-destructive/20", label: "Cancelled" },
};

interface OrderRow {
  id: string;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string | null;
  supplier_id: string;
}

export default function Orders() {
  const { data: orders, isLoading, error } = useOrders();

  const columns = [
    {
      key: "id",
      header: "Order ID",
      render: (order: OrderRow) => (
        <span className="font-mono text-sm font-medium">{order.id.slice(0, 8)}</span>
      ),
    },
    {
      key: "supplier_id",
      header: "Supplier",
      render: (order: OrderRow) => (
        <span className="text-muted-foreground font-mono text-xs">{order.supplier_id?.slice(0, 8) || "N/A"}</span>
      ),
    },
    {
      key: "total_amount",
      header: "Total",
      render: (order: OrderRow) => (
        <span className="font-mono font-semibold text-accent">
          {order.currency} {order.total_amount?.toLocaleString() || "0"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (order: OrderRow) => {
        const config = statusConfig[order.status] || statusConfig.pending;
        const Icon = config.icon;
        return (
          <Badge variant="outline" className={config.color}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "created_at",
      header: "Date",
      render: (order: OrderRow) => (
        <span className="text-sm text-muted-foreground">
          {order.created_at ? format(new Date(order.created_at), "MMM d, yyyy") : "-"}
        </span>
      ),
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeOrders: OrderRow[] = (orders as any[]) || [];
  
  const stats = [
    { label: "Total Orders", value: safeOrders.length, icon: Package },
    { label: "In Transit", value: safeOrders.filter((o) => o.status === "shipped").length, icon: Truck },
    { label: "Delivered", value: safeOrders.filter((o) => o.status === "delivered").length, icon: CheckCircle },
    { 
      label: "Total Value", 
      value: `$${(safeOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / 1000000).toFixed(2)}M`, 
      icon: DollarSign 
    },
  ];

  if (isLoading) {
    return (
      <>
        <PageHeader title="Orders" description="Track and manage your purchase orders" />
        <div className="mt-6 mb-6">
          <StatsGridSkeleton count={4} />
        </div>
        <Card>
          <CardHeader><CardTitle>Recent Orders</CardTitle></CardHeader>
          <CardContent>
            <QuoteListSkeleton count={5} />
          </CardContent>
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader title="Orders" description="Track and manage your purchase orders" />
        <Card className="mt-6">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load orders. Please try again.</p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Orders"
        description="Track and manage your purchase orders"
      />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4 mt-6 mb-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {safeOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            <DataTable columns={columns} data={safeOrders} />
          )}
        </CardContent>
      </Card>
    </>
  );
}
