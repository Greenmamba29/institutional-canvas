import { useState } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
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
import { useDashboardStats, usePriceTicker } from "@/hooks/useDashboardStats";
import { useAuditLog } from "@/hooks/useAuditLog";
import { usePartners } from "@/hooks/usePartners";
import { useGMVStats, useGMVSparkline } from "@/hooks/useGMVStats";
import { Skeleton } from "@/components/ui/skeleton";

// Fallback chart data when no real data available
const fallbackChartData = [
  { date: 'Oct 1', value: 42000 },
  { date: 'Oct 6', value: 48000 },
  { date: 'Oct 11', value: 45000 },
  { date: 'Oct 16', value: 52000 },
  { date: 'Oct 21', value: 58000 },
  { date: 'Oct 26', value: 66300 },
];

// Fallback upcoming auctions (will be replaced with real data)
const upcomingAuctions = [
  { id: '1', company: 'LithiumRecycle', countryCode: 'DE', verified: true, volume: 60, product: 'Recycled Carbonate', pricePerMT: 66500 },
  { id: '2', company: 'GreenLi Tech', countryCode: 'CA', verified: true, volume: 120, product: 'Black Mass', pricePerMT: 2850 },
];

// Fallback escrowed assets
const escrowedAssets = [
  { description: 'Recycled Li-Hydroxide', remainder: '4.2k', gain: 1.2 },
  { description: 'Black Mass Concentrate', remainder: '1.8k', gain: -0.4 },
  { description: 'Spodumene Conc.', remainder: '12.4k', gain: 5.6 },
  { description: 'Secondary Carbonate', remainder: '0.9k', gain: 0.1 },
];

export default function Dashboard() {
  const { viewMode } = useOrganization();
  const [activeTab, setActiveTab] = useState(viewMode === 'supplier' ? 'overview' : 'dashboard');
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: priceData } = usePriceTicker();
  const { data: auditEntries = [] } = useAuditLog(4);
  const { data: partners = [] } = usePartners(2);
  const { data: gmvStats } = useGMVStats();
  const gmvSparkline = useGMVSparkline();

  // Build chart data from GMV sparkline
  const chartData = gmvSparkline.map((value, i) => ({
    date: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value,
  }));

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
                <span className="text-accent">{priceData.symbol}: ${priceData.price.toLocaleString()}/{priceData.unit}</span>
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
                <p className="text-2xl font-bold font-mono">${priceData.price.toLocaleString()}</p>
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
            <GMVChart data={chartData.length > 0 ? chartData : fallbackChartData} />
            
            {viewMode === 'supplier' ? (
              <WeeklyAuctionSnapshot
                totalBids={475000}
                changePercent={12.4}
                activeLots={15}
                lotType="Carbonate & Hydroxide"
                verifiedBidders={21}
              />
            ) : (
              <TrustedPartners partners={partners.length > 0 ? partners : [
                { id: '1', name: 'Lithium Recycling Global', verified: true, verificationTier: 'gold', ytdRevenue: 3750000, product: 'Recycled Lithium', pricePerMT: 83250, responseTime: '4.2H' },
                { id: '2', name: 'EcoBattery Solutions', verified: true, verificationTier: 'gold', ytdRevenue: 5200000, product: 'Black Mass (Co/Ni/Li)', pricePerMT: 24500, responseTime: '2.1H' },
              ]} />
            )}
          </div>

          <div className="space-y-6">
            <MetricsReview
              totalGMV={gmvStats?.gmvYTD || 4270000}
              todayChange={6300}
              grossMerchandise={gmvStats?.changePercent || 52.1}
              stackedData={52}
              verificationMedia={17}
              escrowedAssets={escrowedAssets}
            />
            
            {viewMode === 'supplier' ? (
              <UpcomingAuctions auctions={upcomingAuctions} />
            ) : (
              <AuditLog entries={auditEntries} />
            )}
          </div>
        </div>

        <BottomKPIs />
      </>
    );
  };

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        <BreadcrumbNav items={breadcrumbs} />
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>

        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <SystemAlert message="Chilean export quota re-allocations are live. Review updated compliance requirements." />

        {renderTabContent()}
      </div>
    </LayoutShell>
  );
}
