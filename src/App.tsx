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
import { SubscriptionGate } from "@/components/auth/SubscriptionGate";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AppLayout } from "@/components/layout/AppLayout";

// Public pages — load eagerly
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import PasswordReset from "./pages/PasswordReset";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";

// Protected pages — lazy loaded for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const RFQs = lazy(() => import("./pages/RFQs"));
const Bids = lazy(() => import("./pages/Bids"));
const Deals = lazy(() => import("./pages/Deals"));
const Orders = lazy(() => import("./pages/Orders"));
const Purchases = lazy(() => import("./pages/Purchases"));
const ChainOfCustody = lazy(() => import("./pages/ChainOfCustody"));
const Verification = lazy(() => import("./pages/Verification"));
const Settings = lazy(() => import("./pages/Settings"));
const Billing = lazy(() => import("./pages/Billing"));
const Team = lazy(() => import("./pages/Team"));
const KYCCompliance = lazy(() => import("./pages/KYCCompliance"));
const CompanyVerification = lazy(() => import("./pages/CompanyVerification"));
const Admin = lazy(() => import("./pages/Admin"));

// Pro-tier pages
const Analytics = lazy(() => import("./pages/Analytics"));
const Data = lazy(() => import("./pages/Data"));

// Compliance OS pages (pro+)
const ComplianceDashboard = lazy(() => import("./pages/ComplianceDashboard"));
const BatteryInventory = lazy(() => import("./pages/BatteryInventory"));
const CollectionSites = lazy(() => import("./pages/CollectionSites"));
const CollectionWorkers = lazy(() => import("./pages/CollectionWorkers"));
const ProcessingOrders = lazy(() => import("./pages/ProcessingOrders"));

// Enterprise-tier pages (deferred — rendered behind RoleProtectedRoute)
const TeleBuy = lazy(() => import("./pages/TeleBuy"));
const AIStudio = lazy(() => import("./pages/AIStudio"));
const Auctions = lazy(() => import("./pages/Auctions"));
const AuctionDetail = lazy(() => import("./pages/AuctionDetail"));
const Messages = lazy(() => import("./pages/Messages"));
const Recycling = lazy(() => import("./pages/Recycling"));
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
      <Suspense fallback={<LoadingScreen message="Loading..." />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/password-reset" element={<PasswordReset />} />

          {/* Auth guard */}
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />

            {/* SubscriptionGate: every route inside requires an active paid subscription.
                Users with no subscription see the plan-selection wall. */}
            <Route element={<SubscriptionGate />}>
              <Route element={<AppLayout />}>

                {/* ── Core routes — available to all paid subscribers (Pro & Enterprise) ── */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/marketplace/:id" element={<Marketplace />} />
                <Route path="/rfqs" element={<RFQs />} />
                <Route path="/rfqs/:id" element={<RFQs />} />
                <Route path="/bids" element={<Bids />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/deals/:id" element={<Deals />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/purchases" element={<Purchases />} />
                <Route path="/chain-of-custody" element={<ChainOfCustody />} />
                <Route path="/verification" element={<Verification />} />

                {/* Settings — always available to paid subscribers */}
                <Route path="/settings" element={<Settings />} />
                <Route path="/settings/billing" element={<Billing />} />
                <Route path="/settings/team" element={<Team />} />
                <Route path="/settings/kyc" element={<KYCCompliance />} />
                <Route path="/settings/company-verification" element={<CompanyVerification />} />
                <Route path="/team" element={<Team />} />

                {/* ── Pro routes — Analytics and Data Hub ── */}
                <Route element={<RoleProtectedRoute requireSubscription="pro" />}>
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/data" element={<Data />} />
                  <Route path="/compliance" element={<ComplianceDashboard />} />
                  <Route path="/compliance/inventory" element={<BatteryInventory />} />
                  <Route path="/compliance/sites" element={<CollectionSites />} />
                </Route>

                <Route element={<RoleProtectedRoute requireSubscription="enterprise" />}>
                  <Route path="/compliance/workers" element={<CollectionWorkers />} />
                  <Route path="/compliance/processing" element={<ProcessingOrders />} />
                </Route>

                {/* ── Enterprise routes — TeleBuy, Auctions, AI Studio, Messages, Recycling, API ── */}
                <Route element={<RoleProtectedRoute requireSubscription="enterprise" />}>
                  <Route path="/telebuy" element={<TeleBuy />} />
                  <Route path="/telebuy/session/:id" element={<TeleBuy />} />
                  <Route path="/ai-studio" element={<AIStudio />} />
                  <Route path="/auctions" element={<Auctions />} />
                  <Route path="/auctions/:id" element={<AuctionDetail />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/recycling" element={<Recycling />} />
                  <Route path="/settings/api" element={<APIIntegration />} />
                </Route>

                {/* ── Admin-only routes ── */}
                <Route element={<RoleProtectedRoute allowedOrgTypes={['admin']} />}>
                  <Route path="/admin" element={<Admin />} />
                </Route>

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
