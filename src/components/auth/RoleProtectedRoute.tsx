/**
 * Role-Protected Route — server-validated org type and subscription tier.
 *
 * Pro  $599/month  — required for analytics, data hub, grant features
 * Enterprise $4,999/month — required for TeleBuy, auctions, partner matching, funding pipeline
 *
 * Admin org type bypasses all tier checks.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useServerRole, useServerRoles } from '@/hooks/useServerRole';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useOrganization } from '@/context/OrganizationContext';
import { Lock, ArrowUpCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RoleProtectedRouteProps {
  allowedOrgTypes?: ('admin' | 'supplier' | 'buyer' | 'soe')[];
  allowedRoles?: ('owner' | 'admin' | 'member')[];
  requireSubscription?: 'pro' | 'enterprise';
  redirectTo?: string;
}

export function RoleProtectedRoute({
  allowedOrgTypes,
  allowedRoles,
  requireSubscription,
  redirectTo = '/dashboard',
}: RoleProtectedRouteProps) {
  const location = useLocation();
  const { currentOrg } = useOrganization();
  const { data: role, isLoading } = useServerRole(currentOrg?.id);
  const { data: allRoles } = useServerRoles();

  if (isLoading) {
    return <LoadingScreen message="Validating access..." />;
  }

  if (!role && !allRoles?.length) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  if (allowedOrgTypes && allowedOrgTypes.length > 0) {
    const isAdmin = role?.org_type === 'admin' || allRoles?.some(r => r.org_type === 'admin');
    const hasOrgTypeAccess = isAdmin || (role && allowedOrgTypes.includes(role.org_type));
    if (!hasOrgTypeAccess) {
      return (
        <AccessDenied
          title="Access Restricted"
          description={`This feature is only available for ${allowedOrgTypes.join(' or ')} accounts.`}
          redirectTo={redirectTo}
        />
      );
    }
  }

  if (allowedRoles && allowedRoles.length > 0 && role) {
    const hasRoleAccess = allowedRoles.includes(role.member_role as 'owner' | 'admin' | 'member');
    if (!hasRoleAccess) {
      return (
        <AccessDenied
          title="Permission Required"
          description={`This action requires ${allowedRoles.join(' or ')} permissions.`}
          redirectTo={redirectTo}
        />
      );
    }
  }

  if (requireSubscription && role) {
    if (role.org_type !== 'admin') {
      const tier = role.subscription_tier;
      const isPro = tier === 'pro' || tier === 'active';
      const isEnterprise = tier === 'enterprise';
      const hasTierAccess = isEnterprise || (requireSubscription === 'pro' && isPro);

      if (!hasTierAccess) {
        return <UpgradeRequired requiredTier={requireSubscription} currentTier={isEnterprise ? 'enterprise' : isPro ? 'pro' : null} />;
      }
    }
  }

  return <Outlet />;
}

function AccessDenied({ title, description, redirectTo }: { title: string; description: string; redirectTo: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Lock className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild>
            <a href={redirectTo}>Return to Dashboard</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

const TIER_DETAILS = {
  pro: {
    price: '$599/month',
    features: [
      'Unlimited RFQs & purchase orders',
      'Grant tracker — DOE, DOD, ARPA-E',
      'Eligibility scoring & readiness dashboard',
      'Evidence vault',
      'Market & grant intelligence hub',
      'Priority support',
    ],
  },
  enterprise: {
    price: '$4,999/month',
    features: [
      'Everything in Pro',
      'Partner matching & consortium builder',
      'Funding pipeline automation',
      'TeleBuy video negotiations',
      'Auction system access',
      'API access, SSO & white-label',
      'Dedicated account manager',
    ],
  },
};

function UpgradeRequired({ requiredTier, currentTier }: { requiredTier: 'pro' | 'enterprise'; currentTier: 'pro' | 'enterprise' | null }) {
  const details = TIER_DETAILS[requiredTier];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowUpCircle className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>
            Upgrade to {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}
          </CardTitle>
          <CardDescription>
            This feature requires a{' '}
            <span className="font-medium capitalize">{requiredTier}</span> subscription.
            {currentTier && (
              <> Your current plan: <span className="font-medium capitalize">{currentTier}</span>.</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <span className="text-3xl font-bold">{details.price}</span>
            <p className="text-xs text-muted-foreground mt-1">Annual billing available — save 20%</p>
          </div>

          <ul className="space-y-2">
            {details.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" asChild>
              <a href="/dashboard">Maybe Later</a>
            </Button>
            {requiredTier === 'enterprise' ? (
              <Button className="flex-1" asChild>
                <a href="mailto:sales@lithiumbuy.com?subject=Enterprise Plan Inquiry">
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Sales
                </a>
              </Button>
            ) : (
              <Button className="flex-1" asChild>
                <a href="/settings/billing">Upgrade Now</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
