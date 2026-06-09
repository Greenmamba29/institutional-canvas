import { useState } from 'react';

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, Target } from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { PriceForecast } from "@/components/ai-studio/PriceForecast";
import { SupplierMatcher } from "@/components/ai-studio/SupplierMatcher";
import { RiskAnalysis } from "@/components/ai-studio/RiskAnalysis";

export default function AIStudio() {
  const [activeTab, setActiveTab] = useState('price-forecast');
  
  // Server-validated role from context. Access is enforced at the route level
  // (RoleProtectedRoute requireSubscription="enterprise" in App.tsx), so no
  // redundant in-page paywall here.
  const { isLoadingRole } = useRole();

  // Show loading state while checking role
  if (isLoadingRole) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="AI Studio"
        description="SPOT.ai market intelligence powered by advanced analytics"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="price-forecast">
            <TrendingUp className="h-4 w-4 mr-2" />
            Price Forecast
          </TabsTrigger>
          <TabsTrigger value="supplier-match">
            <Target className="h-4 w-4 mr-2" />
            Supplier Match
          </TabsTrigger>
          <TabsTrigger value="risk-analysis">
            <Brain className="h-4 w-4 mr-2" />
            Risk Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="price-forecast" className="mt-6">
          <PriceForecast />
        </TabsContent>

        <TabsContent value="supplier-match" className="mt-6">
          <SupplierMatcher />
        </TabsContent>

        <TabsContent value="risk-analysis" className="mt-6">
          <RiskAnalysis />
        </TabsContent>
      </Tabs>
    </>
  );
}
