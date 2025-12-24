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

// Auth0 configuration - using provided credentials
const auth0Domain = 'dev-vbox82zyf82ityy0.us.auth0.com';
const auth0ClientId = 'YnXqFAVjFUcmqeJUZgvbyFzK35A4mBzW';
const auth0Audience = 'https://lithiumbuy.com/api';

const App = () => (
  <Auth0Provider
    domain={auth0Domain}
    clientId={auth0ClientId}
    authorizationParams={{
      redirect_uri: window.location.origin,
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

export default App;
