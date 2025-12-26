import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { Loader2, Sparkles } from 'lucide-react';

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

export function ProtectedRoute() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { hasOrganization, isLoading: orgLoading } = useOrganization();
  const location = useLocation();

  // Show loading while checking auth status
  if (authLoading) {
    return <LoadingScreen />;
  }

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Show loading while checking org status (only after authenticated)
  if (orgLoading) {
    return <LoadingScreen />;
  }

  // If authenticated but no organization, redirect to onboarding
  // (except if already on the onboarding page)
  if (!hasOrganization && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
