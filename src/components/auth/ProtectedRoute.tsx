import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { Loader2, Sparkles } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOrg?: boolean;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="p-4 rounded-2xl bg-gradient-gold animate-pulse">
          <Sparkles className="h-8 w-8 text-accent-foreground" />
        </div>
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-muted-foreground font-medium">Loading...</span>
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children, requireOrg = true }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasOrganization, isLoading: orgLoading } = useOrganization();
  const location = useLocation();

  // Show loading while checking auth/org status
  if (authLoading || (isAuthenticated && orgLoading)) {
    return <LoadingScreen />;
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if no organization and org is required
  if (requireOrg && !hasOrganization) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
