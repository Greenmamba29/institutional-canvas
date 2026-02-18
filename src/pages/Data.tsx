
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Download, FileSpreadsheet, BarChart3, Lock } from "lucide-react";
import { useIsAdmin, useRole } from "@/context/RoleContext";

export default function Data() {
  // Server-validated admin check (from org_members table)
  const isAdmin = useIsAdmin();
  const { isLoadingRole } = useRole();
  
  // TODO: Implement actual subscription check via useSubscription hook
  const isPro = false; // Mock - will be replaced with subscription tier check
  
  // Grant access if user is admin OR has pro subscription
  const hasAccess = isAdmin || isPro;

  if (isLoadingRole) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="p-4 rounded-full bg-accent/10 mb-6">
          <Lock className="h-12 w-12 text-accent" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Lithium & Recycling Data Hub</h1>
        <p className="text-muted-foreground max-w-md mb-6">
          Access comprehensive data on lithium procurement, black mass recycling volumes, and sustainability reports.
        </p>
        <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
          Upgrade to Pro - $199/month
        </Button>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Data Hub"
        description="Market data, exports, and analytics"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Market Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Real-time and historical lithium market data.
            </p>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate custom reports and analyses.
            </p>
            <Button variant="outline" className="w-full">
              Create Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Advanced analytics and visualization tools.
            </p>
            <Button variant="outline" className="w-full">
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
