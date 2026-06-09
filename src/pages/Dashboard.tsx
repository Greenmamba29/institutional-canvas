import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useOrganization } from "@/context/OrganizationContext";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { TabBar } from "@/components/shared/TabBar";
import { SystemAlert } from "@/components/shared/SystemAlert";
import { SparklineChart } from "@/components/shared/SparklineChart";
import { GMVChart } from "@/components/dashboard/GMVChart";
import { AuditLog } from "@/components/dashboard/AuditLog";
import { TrustedPartners } from "@/components/dashboard/TrustedPartners";
import { MetricsReview } from "@/components/dashboard/MetricsReview";
import { BottomKPIs } from "@/components/dashboard/BottomKPIs";
import { WeeklyAuctionSnapshot } from "@/components/supplier/WeeklyAuctionSnapshot";
import { UpcomingAuctions } from "@/components/supplier/UpcomingAuctions";
import { LivePriceTicker, MarketNewsFeed, ArbitragePanel } from "@/components/market";
import { SkillRecommendations } from "@/components/skills/SkillRecommendations";
import { useDashboardStats, usePriceTicker } from "@/hooks/useDashboardStats";
import { useAuditLog } from "@/hooks/useAuditLog";
import { usePartners } from "@/hooks/usePartners";
import { useWeeklyAuctionSnapshot } from "@/hooks/useWeeklyAuctionSnapshot";
import { useOrders } from "@/hooks/useOrders";
import { useCurrency } from "@/hooks/useCurrency";
import { FileText, CheckCircle, Truck, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Activity } from "lucide-react";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";

export default function Dashboard() {
  const navigate = useNavigate();
  const { viewMode } = useOrganization();
  const [activeTab, setActiveTab] = useState(viewMode === 'supplier' ? 'overview' : 'dashboard');
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: priceData } = usePriceTicker();
  const { data: auditEntries = [] } = useAuditLog(4);
  const { data: partners = [] } = usePartners(2);
  const { data: auctionSnapshot } = useWeeklyAuctionSnapshot();
  const { data: orders = [] } = useOrders();
  const { format } = useCurrency();

  // Real GMV: sum of all order totals (canonical USD) from Supabase.
  const totalGMV = (orders ?? []).reduce(
    (sum, o) => sum + (o.total_amount || 0),
    0
  );

  // Real bottom KPIs sourced from live platform data.
  const bottomKPIs = [
    { label: 'ACTIVE RFQs', value: stats?.activeRfqs ?? 0, icon: FileText },
    { label: 'SETTLED ORDERS', value: (orders ?? []).filter((o) => o.status === 'delivered').length, icon: CheckCircle },
    { label: 'IN TRANSIT', value: (orders ?? []).filter((o) => o.status === 'shipped').length, icon: Truck },
    { label: 'TOTAL GMV', value: format(totalGMV), icon: DollarSign },
  ];

  // Build chart data from real orders, aggregated by month (canonical USD).
  const monthlyGMV = new Map<string, number>();
  for (const o of orders ?? []) {
    if (!o.created_at) continue;
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    monthlyGMV.set(key, (monthlyGMV.get(key) || 0) + (o.total_amount || 0));
  }
  const chartData = Array.from(monthlyGMV.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      const [year, month] = key.split('-').map(Number);
      return {
        date: new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value,
      };
    });

  const tabs = viewMode === 'supplier' 
    ? [{ id: 'overview', label: 'OVERVIEW' }, { id: 'listings', label: 'MY LISTINGS' }, { id: 'financials', label: 'FINANCIALS' }]
    : [{ id: 'dashboard', label: 'DASHBOARD' }, { id: 'auctions', label: 'AUCTION LISTINGS' }, { id: 'performance', label: 'PERFORMANCE' }];

  const breadcrumbs = viewMode === 'supplier'
    ? [{ label: 'PLATFORM' }, { label: 'RECYCLING & SUPPLY' }, { label: 'DASHBOARD' }]
    : [{ label: 'PLATFORM' }, { label: 'RECYCLING CONSOLE' }, { label: 'OVERVIEW' }];

  const title = viewMode === 'supplier' ? 'Lithium & Recycling Supply Terminal' : 'Global Lithium & Recycling Console';

  const renderTabContent = () => {
    // Supplier tabs
    if (viewMode === 'supplier') {
      if (activeTab === 'listings') {
        return (
          <div className="glass-panel rounded-xl p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">My Listings</h3>
            <p className="text-muted-foreground">Manage your active material listings and inventory here.</p>
          </div>
        );
      }
      if (activeTab === 'financials') {
        return (
          <div className="glass-panel rounded-xl p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Financials</h3>
            <p className="text-muted-foreground">View your earnings, pending payments, and transaction history.</p>
          </div>
        );
      }
    }
    
    // Admin/Buyer tabs
    if (activeTab === 'auctions') {
      return (
        <div className="glass-panel rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Auction Listings</h3>
          <p className="text-muted-foreground">Browse and manage all active and upcoming auctions.</p>
        </div>
      );
    }
    if (activeTab === 'performance') {
      return (
        <div className="glass-panel rounded-xl p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">Performance Analytics</h3>
          <p className="text-muted-foreground">Detailed platform performance metrics and trends.</p>
        </div>
      );
    }

    // Default: Overview/Dashboard content
    return (
      <>
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground tracking-wider">ACTIVE RFQs</span>
              <span className="text-[10px] font-bold text-accent bg-accent/20 px-1.5 py-0.5 rounded">LIVE</span>
            </div>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold font-mono">{stats?.activeRfqs || 0}</p>
            )}
            <p className="text-[10px] text-muted-foreground">Total: {stats?.totalRfqs || 0}</p>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground tracking-wider">ACTIVE BIDS</span>
              <span className="text-[10px] font-bold text-success bg-success/20 px-1.5 py-0.5 rounded">OPEN</span>
            </div>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold font-mono">{stats?.activeBids || 0}</p>
            )}
            <p className="text-[10px] text-muted-foreground">Total: {stats?.totalBids || 0}</p>
          </div>

          <div className="glass-panel rounded-xl p-4 lg:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-success bg-success/20 px-1.5 py-0.5 rounded">DEALS</span>
            </div>
            <p className="text-[10px] text-muted-foreground tracking-wider">ACCEPTED / PENDING</p>
            {statsLoading ? (
              <Skeleton className="h-6 w-32 mb-2" />
            ) : (
              <p className="text-xl font-bold font-mono mb-2">{stats?.acceptedDeals || 0} / {stats?.pendingDeals || 0}</p>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">TOTAL DEALS: <span className="text-foreground font-mono">{stats?.totalDeals || 0}</span></span>
              {priceData && (
                <span className="text-accent">{priceData.symbol}: {format(priceData.price)}/{priceData.unit}</span>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground tracking-wider">RECENT ACTIVITY</p>
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold font-mono">{stats?.recentActivity.length || 0}</p>
                )}
              </div>
              <SparklineChart data={[10, 15, 12, 18, 22, 19, 25]} color="primary" height={32} className="w-16" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground tracking-wider">PRICE TICKER</span>
              {priceData && (
                <span className="text-[10px] font-bold text-accent bg-accent/20 px-1.5 py-0.5 rounded">{priceData.region}</span>
              )}
            </div>
            {priceData ? (
              <>
                <p className="text-2xl font-bold font-mono">{format(priceData.price)}</p>
                <p className="text-[10px] text-muted-foreground">{priceData.symbol} per {priceData.unit}</p>
              </>
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <GMVChart data={chartData} totalGMV={totalGMV} />
            
            {viewMode === 'supplier' ? (
              <WeeklyAuctionSnapshot
                totalBids={auctionSnapshot?.totalBids ?? 0}
                changePercent={auctionSnapshot?.changePercent ?? null}
                activeLots={auctionSnapshot?.activeLots ?? 0}
                lotType={auctionSnapshot?.lotType ?? ''}
                verifiedBidders={auctionSnapshot?.verifiedBidders ?? 0}
              />
            ) : (
              <TrustedPartners partners={partners} />
            )}

            {/* Market News Feed - New */}
            <MarketNewsFeed />
          </div>

          <div className="space-y-6">
            {/* Live Price Ticker - New */}
            <LivePriceTicker />

            <MetricsReview totalGMV={totalGMV} />
            
            {viewMode === 'supplier' ? (
              <UpcomingAuctions auctions={[]} />
            ) : (
              <>
                <ArbitragePanel />
                <AuditLog entries={auditEntries} />
                <SkillRecommendations />
              </>
            )}
          </div>
        </div>

        <BottomKPIs kpis={bottomKPIs} />
      </>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <BreadcrumbNav items={breadcrumbs} />
      
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <Button
          onClick={() => navigate('/recycling')}
          variant="outline"
          className="gap-2"
        >
          <Activity className="h-4 w-4" />
          Recycling Marketplace
        </Button>
      </div>

      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <OnboardingChecklist />

      <SystemAlert message="Chilean export quota re-allocations are live. Review updated compliance requirements." />

      {renderTabContent()}

      <WelcomeModal />
    </div>
  );
}
