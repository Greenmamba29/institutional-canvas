import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Handshake, Clock, DollarSign, Users } from "lucide-react";

const mockDeals = [
  {
    id: "deal-001",
    title: "Lithium Carbonate Supply Agreement",
    supplier: "LithiumCorp Chile",
    value: 2450000,
    status: "negotiating",
    lastActivity: "2 hours ago",
    participants: 4,
  },
  {
    id: "deal-002", 
    title: "Battery-Grade Hydroxide Contract",
    supplier: "Atacama Minerals",
    value: 1850000,
    status: "pending_signature",
    lastActivity: "1 day ago",
    participants: 3,
  },
  {
    id: "deal-003",
    title: "Spodumene Concentrate Order",
    supplier: "Pilbara Resources",
    value: 890000,
    status: "completed",
    lastActivity: "3 days ago",
    participants: 2,
  },
];

const statusColors: Record<string, string> = {
  negotiating: "bg-warning/10 text-warning border-warning/20",
  pending_signature: "bg-primary/10 text-primary border-primary/20",
  completed: "bg-success/10 text-success border-success/20",
};

export default function Deals() {
  return (
    <LayoutShell>
      <PageHeader
        title="Deals"
        description="Active negotiations and closed agreements"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {mockDeals.map((deal) => (
          <Card key={deal.id} className="hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-base font-semibold line-clamp-2">
                  {deal.title}
                </CardTitle>
                <Badge className={statusColors[deal.status]} variant="outline">
                  {deal.status.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{deal.supplier}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Value</span>
                </div>
                <span className="font-mono font-semibold text-accent">
                  ${deal.value.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Participants</span>
                </div>
                <span>{deal.participants}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Last activity</span>
                </div>
                <span>{deal.lastActivity}</span>
              </div>
              <Button variant="outline" className="w-full mt-2">
                <Handshake className="h-4 w-4 mr-2" />
                View Deal
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </LayoutShell>
  );
}
