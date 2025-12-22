import { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Activity,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Building2
} from "lucide-react";
import { bids, formatCurrency, formatVolume, type Bid } from "@/data/mockData";

export default function Bids() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'won' | 'lost'>('all');

  const filteredBids = bids.filter(bid => {
    const matchesSearch = bid.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bid.rfqId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || bid.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'id',
      header: 'Bid ID',
      render: (bid: Bid) => (
        <span className="font-mono text-primary">{bid.id}</span>
      )
    },
    {
      key: 'rfqId',
      header: 'RFQ',
      render: (bid: Bid) => (
        <Link to={`/rfqs/${bid.rfqId}`} className="font-mono hover:text-primary transition-colors">
          {bid.rfqId}
        </Link>
      )
    },
    {
      key: 'supplierName',
      header: 'Supplier',
      render: (bid: Bid) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{bid.supplierName}</span>
        </div>
      )
    },
    {
      key: 'volume',
      header: 'Volume',
      className: 'text-right',
      render: (bid: Bid) => (
        <span className="font-mono">{formatVolume(bid.volume, bid.unit)}</span>
      )
    },
    {
      key: 'pricePerUnit',
      header: 'Price/Unit',
      className: 'text-right',
      render: (bid: Bid) => (
        <span className="font-mono font-medium">{formatCurrency(bid.pricePerUnit)}</span>
      )
    },
    {
      key: 'totalValue',
      header: 'Total Value',
      className: 'text-right',
      render: (bid: Bid) => (
        <span className="font-mono font-bold text-lg">{formatCurrency(bid.totalValue)}</span>
      )
    },
    {
      key: 'deliveryDate',
      header: 'Delivery',
      render: (bid: Bid) => (
        <span className="text-sm text-muted-foreground">
          {new Date(bid.deliveryDate).toLocaleDateString()}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      className: 'text-right',
      render: (bid: Bid) => <StatusPill status={bid.status} />
    }
  ];

  // Stats
  const stats = {
    totalBids: bids.length,
    activeBids: bids.filter(b => b.status === 'active').length,
    totalValue: bids.reduce((acc, b) => acc + b.totalValue, 0),
    wonValue: bids.filter(b => b.status === 'won').reduce((acc, b) => acc + b.totalValue, 0),
  };

  return (
    <LayoutShell>
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
            <p className="text-sm text-muted-foreground">Total Bid Value</p>
            <p className="text-2xl font-bold font-mono tabular-nums">{formatCurrency(stats.totalValue)}</p>
          </div>
          <div className="glass-panel rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Won Value</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-success">{formatCurrency(stats.wonValue)}</p>
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
            {(['all', 'active', 'won', 'lost'] as const).map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        <DataTable columns={columns} data={filteredBids} />
      </div>
    </LayoutShell>
  );
}
