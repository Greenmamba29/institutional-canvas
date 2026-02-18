import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { OrganizationProvider, useOrganization } from "@/context/OrganizationContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { RoleProvider } from "@/context/RoleContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/auth/RoleProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AppLayout } from "@/components/layout/AppLayout";

// Public pages — small, load eagerly
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import PasswordReset from "./pages/PasswordReset";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";

// Protected pages — lazy loaded for code splitting
// Each import creates a separate chunk, loaded only when navigated to
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const RFQs = lazy(() => import("./pages/RFQs"));
const Bids = lazy(() => import("./pages/Bids"));
const Auctions = lazy(() => import("./pages/Auctions"));
const AuctionDetail = lazy(() => import("./pages/AuctionDetail"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const Verification = lazy(() => import("./pages/Verification"));
const Messages = lazy(() => import("./pages/Messages"));
const Deals = lazy(() => import("./pages/Deals"));
const TeleBuy = lazy(() => import("./pages/TeleBuy"));
const AIStudio = lazy(() => import("./pages/AIStudio"));
const Data = lazy(() => import("./pages/Data"));
const Orders = lazy(() => import("./pages/Orders"));
const Billing = lazy(() => import("./pages/Billing"));
const Purchases = lazy(() => import("./pages/Purchases"));
const Team = lazy(() => import("./pages/Team"));
const ChainOfCustody = lazy(() => import("./pages/ChainOfCustody"));
const Admin = lazy(() => import("./pages/Admin"));
const Recycling = lazy(() => import("./pages/Recycling"));
const KYCCompliance = lazy(() => import("./pages/KYCCompliance"));
const CompanyVerification = lazy(() => import("./pages/CompanyVerification"));
const APIIntegration = lazy(() => import("./pages/APIIntegration"));

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
      {/* Suspense boundary wraps all lazy routes — shows skeleton while chunk loads */}
      <Suspense fallback={<LoadingScreen message="Loading..." />}>
        <Routes>
          {/* Public routes — no layout shell */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/password-reset" element={<PasswordReset />} />

          {/* Auth guard — wraps all authenticated routes */}
          <Route element={<ProtectedRoute />}>
            {/* Onboarding — no persistent layout */}
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Persistent layout: AppLayout renders LayoutShell ONCE.
                Every route below shares the same sidebar instance.
                Page transitions only re-render <Outlet />, not the sidebar. */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
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
              <Route path="/chain-of-custody" element={<ChainOfCustody />} />
              <Route path="/recycling" element={<Recycling />} />
              <Route path="/data" element={<Data />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/billing" element={<Billing />} />
              <Route path="/settings/team" element={<Team />} />
              <Route path="/settings/kyc" element={<KYCCompliance />} />
              <Route path="/settings/company-verification" element={<CompanyVerification />} />
              <Route path="/settings/api" element={<APIIntegration />} />
              <Route path="/team" element={<Team />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/messages" element={<Messages />} />

              {/* Pro-gated routes */}
              <Route element={<RoleProtectedRoute requireSubscription="pro" />}>
                <Route path="/telebuy" element={<TeleBuy />} />
                <Route path="/telebuy/session/:id" element={<TeleBuy />} />
                <Route path="/ai-studio" element={<AIStudio />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
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
