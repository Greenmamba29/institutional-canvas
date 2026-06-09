/**
 * SubscriptionGate
 *
 * Hard wall between ProtectedRoute and AppLayout.
 * Users without an active paid subscription see a plan-selection screen.
 *
 * Grace period handling:
 * - past_due + within grace window → access granted, warning banner shown
 * - past_due + grace elapsed → hard wall (same as no subscription)
 * - cancelled → hard wall immediately
 */

import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LoadingScreen } from '@/components/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldOff, Zap, Crown, Mail, ArrowRight } from 'lucide-react';

// ── Subscription access check ─────────────────────────────────────────────────

interface AccessState {
  allowed: boolean;
  tier: 'trial' | 'pro' | 'enterprise' | null;
  inGracePeriod: boolean;
  graceDaysRemaining: number;
  isTrial: boolean;
  trialDaysRemaining: number;
}

function useSubscriptionAccess(): { data: AccessState; isLoading: boolean } {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();

  return useQuery<AccessState>({
    queryKey: ['subscription-gate', user?.id, currentOrg?.id],
    queryFn: async (): Promise<AccessState> => {
      if (!user) return noAccess();

      // Admin org type bypasses payment requirement
      if (currentOrg?.org_type === 'admin') {
        return {
          allowed: true, tier: 'enterprise', inGracePeriod: false, graceDaysRemaining: 0,
          isTrial: false, trialDaysRemaining: 0,
        };
      }

      // Resolve tier via the server-side RPC. get_subscription_tier() returns
      // 'trial' while the org's free-trial window is active, so trial users are
      // granted full access here (no paywall during trial).
      const [{ data: tier }, { data: inGrace }, { data: daysLeft }, { data: trialRows }] =
        await Promise.all([
          supabase.rpc('get_subscription_tier'),
          supabase.rpc('is_in_grace_period'),
          supabase.rpc('grace_period_days_remaining'),
          supabase.rpc('org_trial_status'),
        ]);

      const trial = (Array.isArray(trialRows) ? trialRows[0] : trialRows) as
        | { is_trial_active: boolean; trial_days_left: number }
        | undefined;

      // No tier at all → trial expired AND no paid plan → hard wall.
      if (!tier) {
        return noAccess();
      }

      return {
        allowed: true,
        tier: tier as 'trial' | 'pro' | 'enterprise',
        inGracePeriod: !!inGrace,
        graceDaysRemaining: (daysLeft as number) ?? 0,
        isTrial: tier === 'trial',
        trialDaysRemaining: trial?.trial_days_left ?? 0,
      };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  }) as { data: AccessState; isLoading: boolean };
}

function noAccess(): AccessState {
  return {
    allowed: false, tier: null, inGracePeriod: false, graceDaysRemaining: 0,
    isTrial: false, trialDaysRemaining: 0,
  };
}

// ── Main component ─────────────────────────────────────────────────────────────

export function SubscriptionGate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: access, isLoading } = useSubscriptionAccess();

  // Invalidate when Stripe webhook fires (subscriptions table changes)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('subscription-gate-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` },
        () => navigate(0),   // Force re-render → re-runs query
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, navigate]);

  if (isLoading) return <LoadingScreen message="Verifying subscription..." />;
  if (!access?.allowed) return <SubscriptionRequired />;

  // Trial / grace banners are rendered by LayoutShell (SubscriptionStatusBar) so
  // they sit inside the app chrome above the header instead of overlaying it.
  return <Outlet />;
}

// ── Subscription required wall ────────────────────────────────────────────────

function SubscriptionRequired() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldOff className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold">Your trial has ended</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Your free trial is over. Choose a plan below to keep your full access to
            procurement, supplier verification, and grant readiness tools — all your
            data is preserved and resumes the moment you upgrade.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Pro */}
          <Card className="border-primary/30 shadow-lg shadow-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Pro
                </CardTitle>
                <Badge className="bg-primary/10 text-primary border-primary/20">Most Popular</Badge>
              </div>
              <CardDescription>Full procurement &amp; grant intelligence</CardDescription>
              <div className="pt-2">
                <span className="text-3xl font-bold">$599</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  'Unlimited RFQs & purchase orders',
                  'Grant tracker — DOE, DOD, ARPA-E',
                  'Eligibility scoring engine',
                  'Grant readiness dashboard',
                  'Evidence vault (document management)',
                  'Supplier verification & risk scores',
                  'Market & grant intelligence hub',
                  'Priority support',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                onClick={() => window.location.href = '/settings/billing?plan=pro'}
              >
                Get Started — Pro
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise */}
          <Card className="border-accent/30 shadow-lg shadow-accent/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-accent" />
                  Enterprise
                </CardTitle>
                <Badge variant="outline" className="text-accent border-accent/30">Full Suite</Badge>
              </div>
              <CardDescription>For large procurement teams &amp; consortiums</CardDescription>
              <div className="pt-2">
                <span className="text-3xl font-bold">$4,999</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  'Everything in Pro',
                  'Partner matching & consortium builder',
                  'Funding pipeline automation',
                  'TeleBuy video negotiations',
                  'Auction system access',
                  'API access & webhooks',
                  'SSO & white-label options',
                  'Dedicated account manager',
                  'Success-fee grant advisory',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full border-accent/30 text-accent hover:bg-accent/10"
                onClick={() => window.location.href = 'mailto:sales@lithiumbuy.com?subject=Enterprise Plan Inquiry'}
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Sales
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Annual billing available — save 20%. All plans include a 14-day money-back guarantee.
          Questions?{' '}
          <a href="mailto:sales@lithiumbuy.com" className="underline underline-offset-2">
            sales@lithiumbuy.com
          </a>
        </p>
      </div>
    </div>
  );
}
