import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider } from "@/context/RoleContext";
import { NotificationProvider } from "@/context/NotificationContext";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <RoleProvider>
      <NotificationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:id" element={<Marketplace />} />
              <Route path="/rfqs" element={<RFQs />} />
              <Route path="/rfqs/:id" element={<RFQs />} />
              <Route path="/bids" element={<Bids />} />
              <Route path="/auctions" element={<Auctions />} />
              <Route path="/auctions/:id" element={<Auctions />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/deals/:id" element={<Deals />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/telebuy" element={<TeleBuy />} />
              <Route path="/telebuy/session/:id" element={<TeleBuy />} />
              <Route path="/ai-studio" element={<AIStudio />} />
              <Route path="/data" element={<Data />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/billing" element={<Billing />} />
              <Route path="/verification" element={<Verification />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </NotificationProvider>
    </RoleProvider>
  </QueryClientProvider>
);

export default App;
