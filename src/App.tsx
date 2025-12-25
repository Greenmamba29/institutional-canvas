import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Auth0Provider } from "@auth0/auth0-react";
import { AuthProvider } from "@/context/AuthContext";
import { OrganizationProvider } from "@/context/OrganizationContext";
import { RoleProvider } from "@/context/RoleContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import RFQs from "./pages/RFQs";
import Bids from "./pages/Bids";
import Auctions from "./pages/Auctions";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Verification from "./pages/Verification";
import Messages from "./pages/Messages";
import NotFound from "./pages/NotFound";
import Deals from "./pages/Deals";
import TeleBuy from "./pages/TeleBuy";
import AIStudio from "./pages/AIStudio";
import Data from "./pages/Data";
import Orders from "./pages/Orders";
import Billing from "./pages/Billing";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Purchases from "./pages/Purchases";
import Team from "./pages/Team";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

// Auth0 configuration - using environment variables with runtime validation
const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE;

// Validate Auth0 configuration at runtime
const isAuth0Configured = auth0Domain && auth0ClientId && auth0Audience;

// Always redirect to production domain for Auth0
const getRedirectUri = () => 'https://lithiumbuy.com';

const redirectUri = getRedirectUri();

// Debug logging for Auth0 configuration (remove in production)
console.log('[Auth0] Redirect URI:', redirectUri);
console.log('[Auth0] Domain:', auth0Domain);

const App = () => {
  // Show configuration error if Auth0 is not properly configured
  if (!isAuth0Configured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center max-w-md p-6">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Configuration Error
          </h1>
          <p className="text-muted-foreground mb-4">
            Authentication is not properly configured. Please ensure the following
            environment variables are set:
          </p>
          <ul className="text-left text-sm text-muted-foreground space-y-1 mb-4">
            <li>• VITE_AUTH0_DOMAIN</li>
            <li>• VITE_AUTH0_CLIENT_ID</li>
            <li>• VITE_AUTH0_AUDIENCE</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Contact your administrator if this issue persists.
          </p>
        </div>
      </div>
    );
  }

  return (
  <Auth0Provider
    domain={auth0Domain}
    clientId={auth0ClientId}
    authorizationParams={{
      redirect_uri: redirectUri,
      audience: auth0Audience,
    }}
    cacheLocation="localstorage"
  >
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OrganizationProvider>
          <RoleProvider>
            <NotificationProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/auth" element={<Auth />} />
                    
                    {/* Onboarding - requires auth but not org */}
                    <Route
                      path="/onboarding"
                      element={
                        <ProtectedRoute requireOrg={false}>
                          <Onboarding />
                        </ProtectedRoute>
                      }
                    />

                    {/* Protected routes */}
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                    <Route path="/marketplace/:id" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                    <Route path="/rfqs" element={<ProtectedRoute><RFQs /></ProtectedRoute>} />
                    <Route path="/rfqs/:id" element={<ProtectedRoute><RFQs /></ProtectedRoute>} />
                    <Route path="/bids" element={<ProtectedRoute><Bids /></ProtectedRoute>} />
                    <Route path="/auctions" element={<ProtectedRoute><Auctions /></ProtectedRoute>} />
                    <Route path="/auctions/:id" element={<ProtectedRoute><Auctions /></ProtectedRoute>} />
                    <Route path="/deals" element={<ProtectedRoute><Deals /></ProtectedRoute>} />
                    <Route path="/deals/:id" element={<ProtectedRoute><Deals /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                    <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
                    <Route path="/telebuy" element={<ProtectedRoute><TeleBuy /></ProtectedRoute>} />
                    <Route path="/telebuy/session/:id" element={<ProtectedRoute><TeleBuy /></ProtectedRoute>} />
                    <Route path="/ai-studio" element={<ProtectedRoute><AIStudio /></ProtectedRoute>} />
                    <Route path="/data" element={<ProtectedRoute><Data /></ProtectedRoute>} />
                    <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/settings/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
                    <Route path="/settings/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
                    <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
                    <Route path="/verification" element={<ProtectedRoute><Verification /></ProtectedRoute>} />
                    <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </NotificationProvider>
          </RoleProvider>
        </OrganizationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </Auth0Provider>
  );
};

export default App;
