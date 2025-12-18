import { useState } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { useRole } from "@/context/RoleContext";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { TabBar } from "@/components/shared/TabBar";
import { SystemAlert } from "@/components/shared/SystemAlert";
import { SparklineChart } from "@/components/shared/SparklineChart";
import { GMVChart } from "@/components/dashboard/GMVChart";
import { AuditLog, AuditLogEntry } from "@/components/dashboard/AuditLog";
import { TrustedPartners, TrustedPartner } from "@/components/dashboard/TrustedPartners";
import { MetricsReview } from "@/components/dashboard/MetricsReview";
import { BottomKPIs } from "@/components/dashboard/BottomKPIs";
import { WeeklyAuctionSnapshot } from "@/components/supplier/WeeklyAuctionSnapshot";
import { UpcomingAuctions } from "@/components/supplier/UpcomingAuctions";
import { TrendingUp, DollarSign, Activity, Lock } from "lucide-react";

const chartData = [
  { date: 'Oct 1', value: 42000 },
  { date: 'Oct 6', value: 48000 },
  { date: 'Oct 11', value: 45000 },
  { date: 'Oct 16', value: 52000 },
  { date: 'Oct 21', value: 58000 },
  { date: 'Oct 26', value: 66300 },
];

const auditEntries: AuditLogEntry[] = [
  { id: '1', type: 'approved', title: 'Approved Santiago Lithium S.A.', description: 'KYB verification Tier 1 passed', timestamp: '12M AGO', action: 'REVIEW ESCROW' },
  { id: '2', type: 'cancelled', title: 'Escrow Contract Cancelled', description: 'Order #77421 - Buyer withdrawal', timestamp: '2H AGO', action: 'ESCROW DETAILS' },
  { id: '3', type: 'flagged', title: 'Flagged CleanTech Ventures', description: 'Purity mismatch reported by auditor', timestamp: '5M AGO', action: 'REVIEW' },
  { id: '4', type: 'withdrawal', title: 'Withdrawal Approved', description: 'Batch ID: B990212001MT', timestamp: '6H AGO', action: 'SETTLEMENT' },
];

const trustedPartners: TrustedPartner[] = [
  { id: '1', name: 'LithiumCorp Chile', verified: true, verificationTier: 'gold', ytdRevenue: 3750000, product: 'Lithium Carbonate', pricePerMT: 83250, responseTime: '4.2H' },
  { id: '2', name: 'Albemarle Corp', verified: true, verificationTier: 'gold', ytdRevenue: 5200000, product: 'Lithium Hydroxide', pricePerMT: 24500, responseTime: '2.1H' },
];

const upcomingAuctions = [
  { id: '1', company: 'LithiumCorp', countryCode: 'CL', verified: true, volume: 60, product: 'Lithium Carbonate', pricePerMT: 66500 },
  { id: '2', company: 'Pilbara Minerals', countryCode: 'AU', verified: true, volume: 120, product: 'Spodumene', pricePerMT: 2850 },
];

const escrowedAssets = [
  { description: 'Li-Hydroxide LCE', remainder: '4.2k', gain: 1.2 },
  { description: 'Carbonate Batch A', remainder: '1.8k', gain: -0.4 },
  { description: 'Spodumene Conc.', remainder: '12.4k', gain: 5.6 },
  { description: 'Chloride Purified', remainder: '0.9k', gain: 0.1 },
];

export default function Dashboard() {
  const { role } = useRole();
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = role === 'supplier' 
    ? [{ id: 'overview', label: 'OVERVIEW' }, { id: 'listings', label: 'MY LISTINGS' }, { id: 'financials', label: 'FINANCIALS' }]
    : [{ id: 'dashboard', label: 'DASHBOARD' }, { id: 'auctions', label: 'AUCTION LISTINGS' }, { id: 'performance', label: 'PERFORMANCE' }];

  const breadcrumbs = role === 'supplier'
    ? [{ label: 'PLATFORM' }, { label: 'SUPPLIER DESK' }, { label: 'DASHBOARD' }]
    : [{ label: 'PLATFORM' }, { label: 'TRADING DESK' }, { label: 'OVERVIEW' }];

  const title = role === 'supplier' ? 'Supplier Performance Terminal' : 'Institutional Trading Console';

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        <BreadcrumbNav items={breadcrumbs} />
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        </div>

        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <SystemAlert message="Chilean export quota re-allocations are live. Review updated compliance requirements." />

        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground tracking-wider">GROSS MARKET VALUE</span>
              <span className="text-[10px] font-bold text-success bg-success/20 px-1.5 py-0.5 rounded">+8.2%</span>
            </div>
            <p className="text-2xl font-bold font-mono">$4MV</p>
            <p className="text-[10px] text-muted-foreground">YTD #237</p>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground tracking-wider">TODAY'S GMV</span>
              <span className="text-[10px] font-bold text-success bg-success/20 px-1.5 py-0.5 rounded">+6.1%</span>
            </div>
            <p className="text-2xl font-bold font-mono">$4,270</p>
          </div>

          <div className="glass-panel rounded-xl p-4 lg:col-span-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-accent bg-accent/20 px-1.5 py-0.5 rounded">4% +1 FEE RATE</span>
            </div>
            <p className="text-[10px] text-muted-foreground tracking-wider">TOTAL MARKETPLACE VALUE</p>
            <p className="text-xl font-bold font-mono mb-2">$16,207,430</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">AUCTION FEES: <span className="text-foreground font-mono">$608,297</span></span>
              <span className="text-success">+2.4% GROWTH INDEX</span>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground tracking-wider">TOTAL TRANSACTIONS</p>
                <p className="text-2xl font-bold font-mono">526</p>
              </div>
              <SparklineChart data={[10, 15, 12, 18, 22, 19, 25]} color="primary" height={32} className="w-16" />
            </div>
          </div>

          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-muted-foreground tracking-wider">ESCROW CONTRACTS</span>
              <span className="text-[10px] font-bold text-accent bg-accent/20 px-1.5 py-0.5 rounded">+14</span>
            </div>
            <p className="text-2xl font-bold font-mono">263</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <GMVChart data={chartData} />
            
            {role === 'supplier' ? (
              <WeeklyAuctionSnapshot
                totalBids={475000}
                changePercent={12.4}
                activeLots={15}
                lotType="Carbonate & Hydroxide"
                verifiedBidders={21}
              />
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
              escrowedAssets={escrowedAssets}
            />
            
            {role === 'supplier' ? (
              <UpcomingAuctions auctions={upcomingAuctions} />
            ) : (
              <AuditLog entries={auditEntries} />
            )}
          </div>
        </div>

        <BottomKPIs />
      </div>
    </LayoutShell>
  );
}
