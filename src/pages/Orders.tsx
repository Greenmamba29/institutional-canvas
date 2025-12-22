import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/shared/DataTable";
import { Package, Truck, CheckCircle, Clock, DollarSign } from "lucide-react";

const mockOrders = [
  {
    id: "ORD-2024-001",
    product: "Lithium Carbonate 99.5%",
    supplier: "LithiumCorp Chile",
    quantity: "50 MT",
    total: 1250000,
    status: "shipped",
    date: "2024-01-15",
  },
  {
    id: "ORD-2024-002",
    product: "Lithium Hydroxide Battery Grade",
    supplier: "Atacama Minerals",
    quantity: "25 MT",
    total: 875000,
    status: "processing",
    date: "2024-01-18",
  },
  {
    id: "ORD-2024-003",
    product: "Spodumene Concentrate",
    supplier: "Pilbara Resources",
    quantity: "100 MT",
    total: 450000,
    status: "delivered",
    date: "2024-01-10",
  },
];

const statusConfig: Record<string, { icon: typeof Package; color: string; label: string }> = {
  processing: { icon: Clock, color: "bg-warning/10 text-warning border-warning/20", label: "Processing" },
  shipped: { icon: Truck, color: "bg-primary/10 text-primary border-primary/20", label: "Shipped" },
  delivered: { icon: CheckCircle, color: "bg-success/10 text-success border-success/20", label: "Delivered" },
};

const columns = [
  {
    key: "id",
    header: "Order ID",
    render: (order: typeof mockOrders[0]) => (
      <span className="font-mono text-sm font-medium">{order.id}</span>
    ),
  },
  {
    key: "product",
    header: "Product",
  },
  {
    key: "supplier",
    header: "Supplier",
    render: (order: typeof mockOrders[0]) => (
      <span className="text-muted-foreground">{order.supplier}</span>
    ),
  },
  {
    key: "quantity",
    header: "Quantity",
  },
  {
    key: "total",
    header: "Total",
    render: (order: typeof mockOrders[0]) => (
      <span className="font-mono font-semibold text-accent">
        ${order.total.toLocaleString()}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (order: typeof mockOrders[0]) => {
      const config = statusConfig[order.status];
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
    key: "date",
    header: "Date",
  },
];

export default function Orders() {
  const stats = [
    { label: "Total Orders", value: mockOrders.length, icon: Package },
    { label: "In Transit", value: mockOrders.filter(o => o.status === "shipped").length, icon: Truck },
    { label: "Delivered", value: mockOrders.filter(o => o.status === "delivered").length, icon: CheckCircle },
    { label: "Total Value", value: `$${(mockOrders.reduce((sum, o) => sum + o.total, 0) / 1000000).toFixed(2)}M`, icon: DollarSign },
  ];

  return (
    <LayoutShell>
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
          <DataTable columns={columns} data={mockOrders} />
        </CardContent>
      </Card>
    </LayoutShell>
  );
}
