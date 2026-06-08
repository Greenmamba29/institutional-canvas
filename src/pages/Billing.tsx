import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Zap, Crown, Mail, ArrowRight, Calendar, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useCheckout, type BillingCycle } from "@/hooks/useCheckout";
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
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const { data: subscription } = useSubscription();
  const { startCheckout, isLoading } = useCheckout();

  const currentTier = subscription?.tier ?? null;
  const isTrial = subscription?.isTrialActive ?? false;
  const trialDaysLeft = subscription?.trialDaysLeft ?? 0;
  // A trial grants pro-equivalent access but is not a paid plan — the plan cards
  // below should still let trial users pick (and pay for) a plan.
  const paidTier = currentTier && currentTier !== 'trial' ? currentTier : null;

  const proPrice    = cycle === 'annual' ? STRIPE_PRODUCTS.pro.annualPrice      : STRIPE_PRODUCTS.pro.price;
  const entPrice    = cycle === 'annual' ? STRIPE_PRODUCTS.enterprise.annualPrice : STRIPE_PRODUCTS.enterprise.price;
  const fmt = (n: number) => `$${n.toLocaleString()}`;

  return (
    <>
      <PageHeader
        title="Billing & Subscription"
        description="Manage your plan and payment methods"
      />

      {/* Current plan */}
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
                {isTrial
                  ? 'Free Trial'
                  : paidTier
                    ? `${paidTier} Plan`
                    : 'No Active Subscription'}
              </p>
              <p className="text-muted-foreground">
                {isTrial && `Full access — ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left. Choose a plan below to continue after your trial.`}
                {!isTrial && paidTier === 'pro' && 'Full procurement & grant intelligence'}
                {!isTrial && paidTier === 'enterprise' && 'Complete platform access including partner matching & TeleBuy'}
                {!isTrial && !paidTier && 'Your trial has ended — select a plan below to restore full access'}
              </p>
            </div>
            {isTrial ? (
              <Badge className="bg-primary/10 text-primary border-primary/20">Trial</Badge>
            ) : paidTier ? (
              <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
            ) : (
              <Badge variant="destructive">Inactive</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Annual / monthly toggle */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <span className={cycle === 'monthly' ? "font-semibold" : "text-muted-foreground"}>Monthly</span>
        <button
          role="switch"
          aria-checked={cycle === 'annual'}
          onClick={() => setCycle(c => c === 'annual' ? 'monthly' : 'annual')}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            cycle === 'annual' ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            cycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
        <span className={cycle === 'annual' ? "font-semibold" : "text-muted-foreground"}>
          Annual
          <Badge variant="secondary" className="ml-2 text-[10px]">Save 20%</Badge>
        </span>
      </div>

      {/* Plans */}
      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">

        {/* Pro */}
        <Card className={`border-primary/30 shadow-lg shadow-primary/5 ${paidTier === 'pro' ? 'ring-2 ring-primary' : ''}`}>
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
              <span className="text-4xl font-bold">{fmt(proPrice)}</span>
              <span className="text-muted-foreground">/month</span>
              {cycle === 'annual' && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Billed as {fmt(proPrice * 12)}/year
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

            {paidTier === 'pro' ? (
              <Button className="w-full" variant="outline" disabled>
                Current Plan
              </Button>
            ) : paidTier === 'enterprise' ? (
              <Button className="w-full" variant="outline" disabled>
                Included in Enterprise
              </Button>
            ) : (
              <Button
                className="w-full"
                disabled={isLoading}
                onClick={() => startCheckout('pro', cycle)}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Get Started — Pro
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Enterprise */}
        <Card className={`border-accent/30 shadow-lg shadow-accent/5 ${paidTier === 'enterprise' ? 'ring-2 ring-accent' : ''}`}>
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
              <span className="text-4xl font-bold">{fmt(entPrice)}</span>
              <span className="text-muted-foreground">/month</span>
              {cycle === 'annual' && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Billed as {fmt(entPrice * 12)}/year
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

            {paidTier === 'enterprise' ? (
              <Button className="w-full" variant="outline" disabled>
                Current Plan
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full border-accent/30 text-accent hover:bg-accent/10"
                onClick={() => window.location.href = `mailto:sales@lithiumbuy.com?subject=Enterprise Plan — ${cycle}`}
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
                Bespoke pricing for high-volume grant programs and multi-org consortiums.
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
