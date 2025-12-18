import { Link } from "react-router-dom";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { KpiCard } from "@/components/shared/KpiCard";
import { PriceTicker } from "@/components/shared/PriceTicker";
import { StatusPill } from "@/components/shared/StatusPill";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ArrowUpRight,
  FileText,
  Gavel,
  Activity,
  TrendingUp,
  Package,
  Users,
  DollarSign,
  Clock
} from "lucide-react";
import {
  priceIndicators,
  rfqs,
  auctions,
  bids,
  dashboardStats,
  formatCurrency
} from "@/data/mockData";

export default function Dashboard() {
  const stats = dashboardStats.buyer;
  const recentRfqs = rfqs.slice(0, 3);
  const liveAuctions = auctions.filter(a => a.status === 'live' || a.status === 'upcoming').slice(0, 2);
  const recentBids = bids.slice(0, 4);

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Dashboard"
          description="Overview of your trading activity"
          icon={LayoutDashboard}
          actions={
            <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              <FileText className="h-4 w-4 mr-2" />
              Create RFQ
            </Button>
          }
        />

        {/* Price Tickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {priceIndicators.map((indicator) => (
            <PriceTicker
              key={indicator.commodity}
              commodity={indicator.commodity}
              price={indicator.spotPrice}
              change={indicator.change24h}
              changePercent={indicator.changePercent}
              unit={indicator.unit}
            />
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Open RFQs"
            value={stats.openRfqs}
            icon={FileText}
            variant="primary"
          />
          <KpiCard
            title="Active Bids"
            value={stats.activeBids}
            icon={Activity}
          />
          <KpiCard
            title="Watched Listings"
            value={stats.watchedListings}
            icon={Package}
          />
          <KpiCard
            title="Total Spend"
            value={formatCurrency(stats.totalSpend)}
            icon={DollarSign}
            change={stats.avgSavings}
            changeLabel="avg savings"
            variant="success"
          />
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent RFQs */}
          <div className="lg:col-span-2 glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Recent RFQs
              </h2>
              <Link to="/rfqs">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentRfqs.map((rfq) => (
                <Link
                  key={rfq.id}
                  to={`/rfqs/${rfq.id}`}
                  className="block p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-muted-foreground">{rfq.id}</span>
                        <StatusPill status={rfq.status} />
                      </div>
                      <h3 className="font-semibold truncate">{rfq.commodity}</h3>
                      <p className="text-sm text-muted-foreground">{rfq.buyerCompany}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold tabular-nums">{rfq.volume.toLocaleString()} {rfq.unit}</p>
                      <p className="text-sm text-muted-foreground">{rfq.bidsCount} bids</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Live Auctions */}
          <div className="glass-panel rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Gavel className="h-5 w-5 text-primary" />
                Live Auctions
              </h2>
              <Link to="/auctions">
                <Button variant="ghost" size="sm" className="text-primary">
                  View All <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {liveAuctions.map((auction) => (
                <Link
                  key={auction.id}
                  to={`/auctions/${auction.id}`}
                  className="block p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <StatusPill status={auction.status} />
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(auction.endTime).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{auction.title}</h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{auction.lots.length} lots</span>
                    <span className="font-mono font-bold text-primary">{formatCurrency(auction.totalValue)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Bids */}
        <div className="glass-panel rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Bid Activity
            </h2>
            <Link to="/bids">
              <Button variant="ghost" size="sm" className="text-primary">
                View All <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase">Bid ID</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase">Supplier</th>
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase">RFQ</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase">Value</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {recentBids.map((bid) => (
                  <tr key={bid.id} className="table-row-interactive">
                    <td className="py-3 px-2 font-mono text-sm">{bid.id}</td>
                    <td className="py-3 px-2 font-medium">{bid.supplierName}</td>
                    <td className="py-3 px-2 text-muted-foreground">{bid.rfqId}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold tabular-nums">{formatCurrency(bid.totalValue)}</td>
                    <td className="py-3 px-2 text-right"><StatusPill status={bid.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
