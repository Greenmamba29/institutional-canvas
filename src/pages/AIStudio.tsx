import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, TrendingUp, Target, Sparkles, Lock } from "lucide-react";
import { useIsAdmin, useRole } from "@/context/RoleContext";

export default function AIStudio() {
  // Server-validated admin check (from org_members table)
  const isAdmin = useIsAdmin();
  const { isLoadingRole } = useRole();
  
  // TODO: Implement actual subscription check via useSubscription hook
  const isPro = false; // Mock - will be replaced with subscription tier check
  
  // Grant access if user is admin OR has pro subscription
  const hasAccess = isAdmin || isPro;

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
        description="SPOT.ai market intelligence and price forecasting"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-accent" />
              Price Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI-powered lithium price predictions based on market data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Supplier Matching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Find the best suppliers for your specific requirements.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Evaluate deal risks and market volatility.
            </p>
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
