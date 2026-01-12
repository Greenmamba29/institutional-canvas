import { useState } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { useRole } from "@/context/RoleContext";
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
import { useEscrowedAssets } from "@/hooks/useEscrowedAssets";
import { useAuctions } from "@/hooks/useAuctions";
import { Skeleton } from "@/components/ui/skeleton";

const chartData = [
  { date: 'Oct 1', value: 42000 },
  { date: 'Oct 6', value: 48000 },
  { date: 'Oct 11', value: 45000 },
  { date: 'Oct 16', value: 52000 },
  { date: 'Oct 21', value: 58000 },
  { date: 'Oct 26', value: 66300 },
];

export default function Dashboard() {
  const { uiLayoutPreference } = useRole();
  const [activeTab, setActiveTab] = useState(uiLayoutPreference === 'supplier' ? 'overview' : 'dashboard');
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: priceData } = usePriceTicker();
  
  // Real data hooks
  const { data: auditEntries = [], isLoading: auditLoading } = useAuditLog(4);
  const { data: trustedPartners = [], isLoading: partnersLoading } = usePartners(2);
  const { data: escrowedAssets = [], isLoading: escrowLoading } = useEscrowedAssets(4);
  const { data: auctions = [], isLoading: auctionsLoading } = useAuctions();

  // Transform auctions to the format expected by UpcomingAuctions
  const upcomingAuctions = auctions
    .filter(a => a.status === 'scheduled' || a.status === 'live')
    .slice(0, 2)
    .map(auction => ({
      id: auction.id,
      company: auction.title,
      countryCode: 'CL', // Default, could be derived from org location
      verified: true,
      volume: auction.reserve_price ? Math.floor(auction.reserve_price / 1000) : 60,
      product: auction.description || 'Lithium Product',
      pricePerMT: auction.reserve_price ?? 66500,
    }));

  // UI layout determines which tabs/breadcrumbs to show - this is cosmetic, not authorization
  const tabs = uiLayoutPreference === 'supplier' 
    ? [{ id: 'overview', label: 'OVERVIEW' }, { id: 'listings', label: 'MY LISTINGS' }, { id: 'financials', label: 'FINANCIALS' }]
    : [{ id: 'dashboard', label: 'DASHBOARD' }, { id: 'auctions', label: 'AUCTION LISTINGS' }, { id: 'performance', label: 'PERFORMANCE' }];

  const breadcrumbs = uiLayoutPreference === 'supplier'
    ? [{ label: 'PLATFORM' }, { label: 'SUPPLIER DESK' }, { label: 'DASHBOARD' }]
    : [{ label: 'PLATFORM' }, { label: 'TRADING DESK' }, { label: 'OVERVIEW' }];

  const title = uiLayoutPreference === 'supplier' ? 'Supplier Performance Terminal' : 'Institutional Trading Console';

  const renderTabContent = () => {
    // Supplier layout tabs - UI preference only
    if (uiLayoutPreference === 'supplier') {
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
              <span className="text-[10px] font-bold text-green-600 bg-green-600/20 px-1.5 py-0.5 rounded">DEALS</span>
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
            <GMVChart data={chartData} />
            
            {uiLayoutPreference === 'supplier' ? (
              <WeeklyAuctionSnapshot
                totalBids={475000}
                changePercent={12.4}
                activeLots={15}
                lotType="Carbonate & Hydroxide"
                verifiedBidders={21}
              />
            ) : partnersLoading ? (
              <div className="glass-panel rounded-xl p-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ) : (
              <TrustedPartners partners={trustedPartners} />
            )}
          </div>

          <div className="space-y-6">
            <MetricsReview
              totalGMV={4270000}
              todayChange={6300}
              grossMerchandise={52.1}
              stackedData={52}
              verificationMedia={17}
              escrowedAssets={escrowLoading ? [] : escrowedAssets}
            />
            
            {uiLayoutPreference === 'supplier' ? (
              auctionsLoading ? (
                <div className="glass-panel rounded-xl p-6">
                  <Skeleton className="h-6 w-40 mb-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ) : (
                <UpcomingAuctions auctions={upcomingAuctions.length > 0 ? upcomingAuctions : [
                  { id: '1', company: 'No upcoming auctions', countryCode: 'XX', verified: false, volume: 0, product: '-', pricePerMT: 0 }
                ]} />
              )
            ) : auditLoading ? (
              <div className="glass-panel rounded-xl p-6">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ) : (
              <AuditLog entries={auditEntries.length > 0 ? auditEntries : [
                { id: '0', type: 'approved', title: 'No recent activity', description: 'Activity will appear here', timestamp: 'NOW', action: 'VIEW' }
              ]} />
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
