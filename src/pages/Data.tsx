
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Paywall } from "@/components/shared/Paywall";
import { Database, Download, FileSpreadsheet, BarChart3 } from "lucide-react";
import { useIsAdmin, useRole } from "@/context/RoleContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

export default function Data() {
  const isAdmin = useIsAdmin();
  const { isLoadingRole } = useRole();
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const navigate = useNavigate();

  const isPro = subscription?.tier === 'pro' || subscription?.tier === 'enterprise';
  const hasAccess = isAdmin || isPro;

  if (isLoadingRole || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <Paywall
        feature="Data Hub"
        description="Access comprehensive market data, export tools, and analytics for lithium procurement and recycling volumes."
        requiredTier="pro"
        benefits={[
          'Real-time & historical lithium market data',
          'Custom report generation',
          'CSV/Excel export',
          'Sustainability & ESG reports',
          'Supplier performance analytics',
        ]}
      />
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
              Real-time and historical lithium market data including spot prices, volume, and regional trends.
            </p>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">Live Feed</Badge>
              <Badge variant="outline" className="text-xs">Historical</Badge>
            </div>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Market Data
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
              Generate custom reports for RFQs, deal performance, supplier comparisons, and ESG metrics.
            </p>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">PDF</Badge>
              <Badge variant="outline" className="text-xs">Excel</Badge>
              <Badge variant="outline" className="text-xs">CSV</Badge>
            </div>
            <Button variant="outline" className="w-full">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
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
              Advanced analytics: procurement spend, supplier reliability scores, and carbon footprint tracking.
            </p>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">Interactive</Badge>
              <Badge variant="outline" className="text-xs">Exportable</Badge>
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate('/analytics')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
