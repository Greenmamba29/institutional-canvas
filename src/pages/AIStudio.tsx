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
          <h1 className="text-3xl font-bold mb-3">Lithium & Recycling Intelligence</h1>
          <p className="text-muted-foreground max-w-md mb-6">
            Dominate the market with AI-powered lithium price forecasting, recycling yield matching, and deal risk analysis.
          </p>
          <div className="space-y-2 text-left mb-8">
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Real-time lithium & recycling price forecasting</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-accent" />
              <span>AI-powered lithium recycling supplier matching</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-accent" />
              <span>Black mass & circular economy risk analysis</span>
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
        title="Lithium & Recycling AI Studio"
        description="Market intelligence and price forecasting for primary and secondary lithium markets"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-accent" />
              Material Forecast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI-powered predictions for lithium carbonate, hydroxide, and recycled black mass.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              Circular Matching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Find the best primary and recycling partners for your supply chain requirements.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Market Volatility
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Evaluate global supply risks and secondary market volatility.
            </p>
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
