import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Zap, Crown, Mail, ArrowRight, Calendar } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { STRIPE_PRODUCTS } from "@/lib/stripe/config";

const PRO_FEATURES = [
  "Unlimited RFQs & purchase orders",
  "Grant tracker — DOE, DOD, ARPA-E & state programs",
  "Eligibility scoring engine",
  "Grant readiness dashboard",
  "Evidence vault (document management)",
  "Supplier verification & risk scores",
  "Market & grant intelligence hub",
  "Priority support",
];

const ENTERPRISE_FEATURES = [
  "Everything in Pro",
  "Partner matching & consortium builder",
  "Funding pipeline — auto RFQ/PO on grant award",
  "TeleBuy video negotiations",
  "Auction system access",
  "API access & webhooks",
  "SSO & white-label options",
  "Dedicated account manager",
  "Success-fee grant advisory",
];

export default function Billing() {
  const [annual, setAnnual] = useState(false);
  const { data: subscription } = useSubscription();

  const currentTier = subscription?.tier ?? null;

  const proMonthly = STRIPE_PRODUCTS.pro.price;
  const proAnnual = STRIPE_PRODUCTS.pro.annualPrice;
  const entMonthly = STRIPE_PRODUCTS.enterprise.price;
  const entAnnual = STRIPE_PRODUCTS.enterprise.annualPrice;

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  return (
    <>
      <PageHeader
        title="Billing & Subscription"
        description="Manage your plan and payment methods"
      />

      {/* Current plan banner */}
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
              <p className="text-2xl font-bold capitalize">
                {currentTier ? `${currentTier} Plan` : 'No Active Subscription'}
              </p>
              <p className="text-muted-foreground">
                {currentTier
                  ? `Active ${currentTier} subscription`
                  : 'Select a plan below to activate your account'}
              </p>
            </div>
            {currentTier ? (
              <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
            ) : (
              <Badge variant="destructive">Inactive</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Annual / monthly toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className={!annual ? "font-semibold" : "text-muted-foreground"}>Monthly</span>
        <button
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual(!annual)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            annual ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              annual ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={annual ? "font-semibold" : "text-muted-foreground"}>
          Annual
          <Badge variant="secondary" className="ml-2 text-[10px]">Save 20%</Badge>
        </span>
      </div>

      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
        {/* Pro */}
        <Card className={`border-primary/30 shadow-lg shadow-primary/5 ${currentTier === 'pro' ? 'ring-2 ring-primary' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Pro
              </CardTitle>
              <Badge className="bg-primary/10 text-primary border-primary/20">Most Popular</Badge>
            </div>
            <CardDescription>Full procurement &amp; grant intelligence</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">{fmt(annual ? proAnnual : proMonthly)}</span>
              <span className="text-muted-foreground">/month</span>
              {annual && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Billed as {fmt(proAnnual * 12)}/year
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            {currentTier === 'pro' ? (
              <Button className="w-full" variant="outline" disabled>
                Current Plan
              </Button>
            ) : currentTier === 'enterprise' ? (
              <Button className="w-full" variant="outline" disabled>
                Included in Enterprise
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => window.location.href = `mailto:sales@lithiumbuy.com?subject=Pro Plan — ${annual ? 'Annual' : 'Monthly'}`}
              >
                Get Started — Pro
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Enterprise */}
        <Card className={`border-accent/30 shadow-lg shadow-accent/5 ${currentTier === 'enterprise' ? 'ring-2 ring-accent' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-accent" />
                Enterprise
              </CardTitle>
              <Badge variant="outline" className="text-accent border-accent/30">Full Suite</Badge>
            </div>
            <CardDescription>For large procurement teams &amp; consortiums</CardDescription>
            <div className="mt-4">
              <span className="text-4xl font-bold">{fmt(annual ? entAnnual : entMonthly)}</span>
              <span className="text-muted-foreground">/month</span>
              {annual && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Billed as {fmt(entAnnual * 12)}/year
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2">
              {ENTERPRISE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            {currentTier === 'enterprise' ? (
              <Button className="w-full" variant="outline" disabled>
                Current Plan
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full border-accent/30 text-accent hover:bg-accent/10"
                onClick={() => window.location.href = `mailto:sales@lithiumbuy.com?subject=Enterprise Plan — ${annual ? 'Annual' : 'Monthly'}`}
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Sales
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Custom / contact */}
      <Card className="mt-8 max-w-4xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Need a custom plan or success-fee arrangement?</h3>
              <p className="text-sm text-muted-foreground">
                We offer bespoke pricing for high-volume grant programs and multi-org consortiums.
                Net-30 invoicing and ACH payment available for Enterprise.
              </p>
            </div>
            <Button variant="outline" asChild>
              <a href="mailto:sales@lithiumbuy.com">
                <Mail className="h-4 w-4 mr-2" />
                sales@lithiumbuy.com
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
