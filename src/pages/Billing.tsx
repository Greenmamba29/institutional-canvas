import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Zap, Building2 } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Basic directory access",
    features: [
      "Supplier directory search",
      "Limited RFQs (5/month)",
      "Basic marketplace access",
      "Email support",
    ],
    current: true,
  },
  {
    name: "Pro",
    price: "$199",
    period: "/month",
    description: "Full marketplace access",
    features: [
      "Everything in Free",
      "Unlimited RFQs",
      "SPOT.ai market intelligence",
      "TeleBuy video sessions",
      "AI transcripts & summaries",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$1,999",
    period: "/month",
    description: "For large organizations",
    features: [
      "Everything in Pro",
      "API access",
      "White-label options",
      "SSO integration",
      "Bulk operations",
      "Dedicated account manager",
    ],
  },
];

export default function Billing() {
  return (
    <LayoutShell>
      <PageHeader
        title="Billing & Subscription"
        description="Manage your plan and payment methods"
      />

      {/* Current Plan */}
      <Card className="mt-6 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">Free Plan</p>
              <p className="text-muted-foreground">Basic access to the marketplace</p>
            </div>
            <Badge variant="outline" className="bg-muted">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={plan.highlighted ? "border-accent shadow-lg shadow-accent/10" : ""}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {plan.name === "Pro" && <Zap className="h-5 w-5 text-accent" />}
                  {plan.name === "Enterprise" && <Building2 className="h-5 w-5" />}
                  {plan.name}
                </CardTitle>
                {plan.current && (
                  <Badge variant="outline">Current</Badge>
                )}
                {plan.highlighted && (
                  <Badge className="bg-accent text-accent-foreground">Popular</Badge>
                )}
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button 
                className={`w-full ${plan.highlighted ? "bg-accent hover:bg-accent/90 text-accent-foreground" : ""}`}
                variant={plan.current ? "outline" : "default"}
                disabled={plan.current}
              >
                {plan.current ? "Current Plan" : `Upgrade to ${plan.name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </LayoutShell>
  );
}
