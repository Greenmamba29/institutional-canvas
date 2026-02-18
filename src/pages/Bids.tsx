import { useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  Search,
  TrendingUp,
  Building2,
  AlertCircle
} from "lucide-react";
import { useBids } from "@/hooks/useBids";
import { AwardDealButton } from "@/components/bid/AwardDealButton";
import type { Bid } from "@/services/bids.service";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Bids() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterWithdrawn, setFilterWithdrawn] = useState<'all' | 'active' | 'withdrawn'>('all');

  const { data: bids = [], isLoading, error } = useBids();

  const filteredBids = bids.filter(bid => {
    const matchesSearch = bid.rfq_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.supplier_id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterWithdrawn === 'all' || 
      (filterWithdrawn === 'withdrawn' && bid.is_withdrawn) ||
      (filterWithdrawn === 'active' && !bid.is_withdrawn);
    return matchesSearch && matchesFilter;
  });

  const columns = [
    {
      key: 'id',
      header: 'Bid ID',
      render: (bid: Bid) => (
        <span className="font-mono text-primary">{bid.id.slice(0, 8)}</span>
      )
    },
    {
      key: 'rfq_id',
      header: 'RFQ',
      render: (bid: Bid) => (
        <Link to={`/rfqs/${bid.rfq_id}`} className="font-mono hover:text-primary transition-colors">
          {bid.rfq_id.slice(0, 8)}
        </Link>
      )
    },
    {
      key: 'supplier_id',
      header: 'Supplier',
      render: (bid: Bid) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{bid.supplier_id.slice(0, 8)}</span>
        </div>
      )
    },
    {
      key: 'quantity',
      header: 'Quantity',
      className: 'text-right',
      render: (bid: Bid) => (
        <span className="font-mono">{bid.quantity?.toLocaleString() || '-'}</span>
      )
    },
    {
      key: 'price',
      header: 'Price',
      className: 'text-right',
      render: (bid: Bid) => (
        <span className="font-mono font-medium">{formatCurrency(bid.price)}</span>
      )
    },
    {
      key: 'lead_time_days',
      header: 'Lead Time',
      className: 'text-right',
      render: (bid: Bid) => (
        <span className="text-sm text-muted-foreground">
          {bid.lead_time_days ? `${bid.lead_time_days} days` : '-'}
        </span>
      )
    },
    {
      key: 'is_withdrawn',
      header: 'Status',
      render: (bid: Bid) => <StatusPill status={bid.is_withdrawn ? 'withdrawn' : 'active'} />
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (bid: Bid) => !bid.is_withdrawn ? (
        <AwardDealButton
          bidId={bid.id}
          supplierId={bid.supplier_id}
          rfqId={bid.rfq_id}
          bidPrice={bid.price}
          bidQuantity={bid.quantity ?? undefined}
        />
      ) : null
    }
  ];

  // Stats
  const stats = {
    totalBids: bids.length,
    activeBids: bids.filter(b => !b.is_withdrawn).length,
    withdrawnBids: bids.filter(b => b.is_withdrawn).length,
    totalValue: bids.reduce((acc, b) => acc + b.price, 0),
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Failed to load Bids</h2>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Live Bids"
          description="Track and manage your bid activity"
          icon={Activity}
          actions={
            <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              <TrendingUp className="h-4 w-4 mr-2" />
              Place Bid
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Bids</p>
            <p className="text-2xl font-bold font-mono tabular-nums">{stats.totalBids}</p>
          </div>
          <div className="glass-panel rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Active Bids</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-primary">{stats.activeBids}</p>
          </div>
          <div className="glass-panel rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Withdrawn</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-muted-foreground">{stats.withdrawnBids}</p>
          </div>
          <div className="glass-panel rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Value</p>
            <p className="text-2xl font-bold font-mono tabular-nums">{formatCurrency(stats.totalValue)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="glass-panel rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bids..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'active', 'withdrawn'] as const).map((status) => (
              <Button
                key={status}
                variant={filterWithdrawn === status ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilterWithdrawn(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredBids.length === 0 ? (
          <div className="glass-panel rounded-xl p-8 text-center">
            <p className="text-muted-foreground">No bids found</p>
          </div>
        ) : (
          <DataTable columns={columns} data={filteredBids} />
        )}
      </div>
    </>
  );
}
