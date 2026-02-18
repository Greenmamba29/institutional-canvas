import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Handshake, Clock, DollarSign, Users, AlertCircle } from "lucide-react";
import { useDeals } from "@/hooks/useDeals";
import type { Deal, DealStatus } from "@/services/deals.service";

const statusColors: Record<DealStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  active: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted/50 text-muted-foreground border-border",
  expired: "bg-muted/50 text-muted-foreground border-border",
};

export default function Deals() {
  const { data: deals = [], isLoading, error } = useDeals();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load Deals</h2>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Lithium & Recycling Deals"
          description="Active supply negotiations and closed recycling agreements"
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      </>
    );
  }

  return (
    <LayoutShell>
      <PageHeader
        title="Lithium & Recycling Deals"
        description="Active supply negotiations and closed recycling agreements"
      />

      {deals.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center mt-6">
          <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No deals yet</h3>
          <p className="text-muted-foreground">Start a negotiation from an RFQ to create your first deal</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </LayoutShell>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold line-clamp-2">
            {deal.title}
          </CardTitle>
          <Badge className={statusColors[deal.status]} variant="outline">
            {deal.status.replace("_", " ")}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Supplier: {deal.supplier_id.slice(0, 8)}...
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>Status</span>
          </div>
          <span className="font-mono font-semibold capitalize">
            {deal.status}
          </span>
        </div>
        {deal.offer_decision && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Decision</span>
            </div>
            <span className="capitalize">{deal.offer_decision}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Created</span>
          </div>
          <span>{new Date(deal.created_at).toLocaleDateString()}</span>
        </div>
        <Button variant="outline" className="w-full mt-2">
          <Handshake className="h-4 w-4 mr-2" />
          View Deal
        </Button>
      </CardContent>
    </Card>
  );
}
