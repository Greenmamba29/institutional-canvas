import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { OrganizationProvider, useOrganization } from "@/context/OrganizationContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { RoleProvider } from "@/context/RoleContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";

// Pages
import Dashboard from "./pages/Dashboard";
import Marketplace from "./pages/Marketplace";
import RFQs from "./pages/RFQs";
import Bids from "./pages/Bids";
import Auctions from "./pages/Auctions";
import AuctionDetail from "./pages/AuctionDetail";
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
import AuthCallback from "./pages/AuthCallback";
import PasswordReset from "./pages/PasswordReset";
import Onboarding from "./pages/Onboarding";
import Purchases from "./pages/Purchases";
import Team from "./pages/Team";
import Landing from "./pages/Landing";
import ChainOfCustody from "./pages/ChainOfCustody";
import Admin from "./pages/Admin";
import Recycling from "./pages/Recycling";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

const AppContent = () => {
  const { isLoading: authLoading } = useAuth();
  const { isLoading: orgLoading } = useOrganization();

  if (authLoading || orgLoading) {
    return <LoadingScreen message="Initializing LithiumBuy..." />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        
        {/* Protected routes - using Outlet pattern */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/:id" element={<Marketplace />} />
          <Route path="/rfqs" element={<RFQs />} />
          <Route path="/rfqs/:id" element={<RFQs />} />
          <Route path="/bids" element={<Bids />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/auctions/:id" element={<AuctionDetail />} />
          <Route path="/deals" element={<Deals />} />
          <Route path="/deals/:id" element={<Deals />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/purchases" element={<Purchases />} />
          {/* TeleBuy - requires Pro subscription */}
          <Route element={<RoleProtectedRoute requireSubscription="pro" />}>
            <Route path="/telebuy" element={<TeleBuy />} />
            <Route path="/telebuy/session/:id" element={<TeleBuy />} />
          </Route>
          <Route path="/chain-of-custody" element={<ChainOfCustody />} />
          <Route path="/recycling" element={<Recycling />} />
          
          {/* AI Studio - requires Pro subscription */}
          <Route element={<RoleProtectedRoute requireSubscription="pro" />}>
            <Route path="/ai-studio" element={<AIStudio />} />
          </Route>
          
          <Route path="/data" element={<Data />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/billing" element={<Billing />} />
          <Route path="/settings/team" element={<Team />} />
          <Route path="/team" element={<Team />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/messages" element={<Messages />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OrganizationProvider>
            <RoleProvider>
              <NotificationProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <AppContent />
                </TooltipProvider>
              </NotificationProvider>
            </RoleProvider>
          </OrganizationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
