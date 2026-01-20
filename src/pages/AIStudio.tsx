import { useState } from 'react';
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, TrendingUp, Target, Sparkles, Lock } from "lucide-react";
import { useRole, useHasSubscription } from "@/context/RoleContext";
import { PriceForecast } from "@/components/ai-studio/PriceForecast";
import { SupplierMatcher } from "@/components/ai-studio/SupplierMatcher";
import { RiskAnalysis } from "@/components/ai-studio/RiskAnalysis";

export default function AIStudio() {
  const [activeTab, setActiveTab] = useState('price-forecast');
  
  // Server-validated role from context
  const { isLoadingRole } = useRole();
  const hasAccess = useHasSubscription('pro');

  // Show loading state while checking role
  if (isLoadingRole) {
    return (
      <LayoutShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      </LayoutShell>
    );
  }

  if (!hasAccess) {
    return (
      <LayoutShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="p-4 rounded-full bg-accent/10 mb-6">
            <Lock className="h-12 w-12 text-accent" />
          </div>
          <h1 className="text-3xl font-bold mb-3">SPOT.ai Market Intelligence</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            Unlock AI-powered lithium price forecasting, supplier matching, and deal risk analysis.
          </p>
          <div className="space-y-2 text-left mb-8">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Real-time lithium price forecasting</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-accent" />
              <span>AI-powered supplier matching</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span>Deal risk analysis</span>
            </div>
          </div>
          <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Upgrade to Pro - $199/month
          </Button>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
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
    </LayoutShell>
  );
}
