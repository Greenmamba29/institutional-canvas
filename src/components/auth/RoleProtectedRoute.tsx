/**
 * Role-Protected Route Component
 * 
 * Server-validated role-based access control.
 * Uses RPC to validate org type and subscription tier.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useServerRole, useServerRoles } from '@/hooks/useServerRole';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useOrganization } from '@/context/OrganizationContext';
import { Lock, ArrowUpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface RoleProtectedRouteProps {
  /** Allowed organization types. Admin always has access. */
  allowedOrgTypes?: ('admin' | 'supplier' | 'buyer' | 'soe')[];
  /** Allowed member roles within org */
  allowedRoles?: ('owner' | 'admin' | 'member')[];
  /** Required subscription tier */
  requireSubscription?: 'pro' | 'enterprise';
  /** Redirect path if unauthorized */
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

  // No org or role found - redirect to onboarding
  if (!role && !allRoles?.length) {
    return <Navigate to="/onboarding" state={{ from: location }} replace />;
  }

  // Check org type access (admin always has access)
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

  // Check member role access
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

  // Check subscription tier
  if (requireSubscription && role) {
    // Admin org type bypasses subscription
    if (role.org_type !== 'admin') {
      const tier = role.subscription_tier;
      const isPro = tier === 'pro' || tier === 'active';
      const isEnterprise = tier === 'enterprise';
      const hasTierAccess = isEnterprise || (requireSubscription === 'pro' && isPro);
      
      if (!hasTierAccess) {
        const displayTier = isEnterprise ? 'enterprise' : isPro ? 'pro' : 'free';
        return (
          <UpgradeRequired
            requiredTier={requireSubscription}
            currentTier={displayTier}
          />
        );
      }
    }
  }

  return <Outlet />;
}

function AccessDenied({ 
  title, 
  description, 
  redirectTo 
}: { 
  title: string; 
  description: string; 
  redirectTo: string;
}) {
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

function UpgradeRequired({ 
  requiredTier, 
  currentTier 
}: { 
  requiredTier: 'pro' | 'enterprise'; 
  currentTier: 'free' | 'pro' | 'enterprise';
}) {
  const features = {
    pro: [
      'AI-Powered Market Intelligence',
      'TeleBuy Video Negotiations',
      'Advanced Analytics Dashboard',
      'Unlimited RFQs',
      'Priority Support',
    ],
    enterprise: [
      'Everything in Pro',
      'Custom API Access',
      'White-label Options',
      'SSO Integration',
      'Dedicated Account Manager',
      'Daily.co Premium Video',
    ],
  };

  const pricing = {
    pro: '$199/month',
    enterprise: '$1,999/month',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <ArrowUpCircle className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Upgrade to {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}</CardTitle>
          <CardDescription>
            This feature requires a {requiredTier} subscription. 
            Your current plan: <span className="font-medium">{currentTier}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <span className="text-3xl font-bold">{pricing[requiredTier]}</span>
          </div>
          
          <ul className="space-y-2">
            {features[requiredTier].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {feature}
              </li>
            ))}
          </ul>
          
          <div className="flex gap-3 pt-4">
            <Button variant="outline" className="flex-1" asChild>
              <a href="/dashboard">Maybe Later</a>
            </Button>
            <Button className="flex-1" asChild>
              <a href="/settings/billing">Upgrade Now</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
