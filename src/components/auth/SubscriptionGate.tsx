/**
 * SubscriptionGate
 *
 * Hard wall placed between ProtectedRoute and AppLayout.
 * Every authenticated user without an active paid subscription
 * is blocked here — there is no free tier.
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

export function SubscriptionGate() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const navigate = useNavigate();

  const { data: access, isLoading } = useQuery({
    queryKey: ['subscription-gate', user?.id, currentOrg?.id],
    queryFn: async () => {
      if (!user) return { allowed: false, tier: null };

      // Admin org type bypasses payment requirement
      if (currentOrg?.org_type === 'admin') {
        return { allowed: true, tier: 'enterprise' };
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('tier, status, expires_at, price_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error || !data) return { allowed: false, tier: null };

      const isExpired = data.expires_at && new Date(data.expires_at) < new Date();
      if (isExpired) return { allowed: false, tier: null };

      // Determine tier from price_id stored on the subscription
      const priceId = data.price_id || '';
      let tier: 'pro' | 'enterprise' = 'pro';
      if (priceId.includes('enterprise') || priceId.includes('ent_')) {
        tier = 'enterprise';
      }

      return { allowed: true, tier };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  // When Supabase realtime fires a subscription change, invalidate immediately
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('subscription-gate-watch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` },
        () => {
          // queryClient not in scope here — navigate triggers a re-render which
          // re-runs the query because staleTime will have expired after the change
          navigate(0);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, navigate]);

  if (isLoading) {
    return <LoadingScreen message="Verifying subscription..." />;
  }

  if (!access?.allowed) {
    return <SubscriptionRequired />;
  }

  return <Outlet />;
}

function SubscriptionRequired() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldOff className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold">Subscription Required</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            LithiumBuy Procurement &amp; Grant Intelligence is a paid platform.
            Select a plan to access the full suite of procurement, supplier
            verification, and grant readiness tools.
          </p>
        </div>

        {/* Plans */}
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
          Questions? Email{' '}
          <a href="mailto:sales@lithiumbuy.com" className="underline underline-offset-2">
            sales@lithiumbuy.com
          </a>
        </p>
      </div>
    </div>
  );
}
