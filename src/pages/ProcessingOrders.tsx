import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { KpiCard } from "@/components/shared/KpiCard";
import { Paywall } from "@/components/shared/Paywall";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHasFeature } from "@/hooks/useSubscription";
import { Factory, Weight, DollarSign, ClipboardList } from "lucide-react";

interface ProcessingOrder {
  id: string;
  airtable_id: string | null;
  inventory_id: string | null;
  processor_id: string | null;
  processing_method: string | null;
  processed_output: string | null;
  output_weight_kg: number | null;
  output_value_usd: number | null;
  processing_date: string | null;
  org_id: string | null;
  created_at: string;
  updated_at: string;
}

function useProcessingOrders() {
  const hasAccess = useHasFeature("chain_of_custody");
  const isLocked = !hasAccess;

  const query = useQuery<ProcessingOrder[]>({
    queryKey: ["processing_orders"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("processing_orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProcessingOrder[];
    },
    enabled: hasAccess,
    staleTime: 2 * 60 * 1000,
  });

  return { ...query, isLocked };
}

function OrderStatusBadge({ processingDate }: { processingDate: string | null }) {
  if (processingDate) {
    return <Badge variant="default" className="bg-green-600 text-white">Completed</Badge>;
  }
  return <Badge variant="secondary">Pending</Badge>;
}

export default function ProcessingOrders() {
  const hasFeature = useHasFeature("chain_of_custody");
  const { data: orders, isLoading } = useProcessingOrders();

  const totalOrders = orders?.length ?? 0;
  const totalOutputWeight = orders?.reduce((sum, o) => sum + (o.output_weight_kg ?? 0), 0) ?? 0;
  const totalOutputValue = orders?.reduce((sum, o) => sum + (o.output_value_usd ?? 0), 0) ?? 0;

  const preview = (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Processing Orders"
        description="Battery processor intake and output tracking"
        icon={Factory}
      />
      <div className="grid sm:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );

  if (!hasFeature) {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none">{preview}</div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Paywall feature="Processing Orders" requiredTier="enterprise" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Processing Orders"
        description="Battery processor intake and output tracking"
        icon={Factory}
      />

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : (
          <>
            <KpiCard
              title="Total Orders"
              value={totalOrders.toLocaleString()}
              icon={ClipboardList}
              variant="primary"
            />
            <KpiCard
              title="Total Output Weight"
              value={`${totalOutputWeight.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`}
              icon={Weight}
              variant="success"
            />
            <KpiCard
              title="Total Output Value"
              value={`$${totalOutputValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              icon={DollarSign}
              variant="default"
            />
          </>
        )}
      </div>

      {/* Orders Table */}
      <div className="card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/50">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Processing Method</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Output Type</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Weight (kg)</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Value (USD)</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Processing Date</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="border-b border-border/30">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !orders || orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-0">
                    <EmptyState
                      icon={Factory}
                      title="No processing orders"
                      description="No processing orders have been recorded yet."
                    />
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-border/30 last:border-0 hover:bg-secondary/20">
                    <td className="py-3 px-4 capitalize">
                      {order.processing_method?.replace(/_/g, " ") ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {order.processed_output ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {order.output_weight_kg != null
                        ? order.output_weight_kg.toLocaleString(undefined, { maximumFractionDigits: 3 })
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {order.output_value_usd != null
                        ? `$${order.output_value_usd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {order.processing_date
                        ? new Date(order.processing_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-3 px-4">
                      <OrderStatusBadge processingDate={order.processing_date} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
