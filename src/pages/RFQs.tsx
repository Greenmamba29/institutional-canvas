import { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  Filter,
  Plus,
  Clock,
  Building2,
  ArrowUpRight
} from "lucide-react";
import { rfqs, formatCurrency, formatVolume, type RFQ } from "@/data/mockData";

export default function RFQs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed' | 'awarded'>('all');

  const filteredRfqs = rfqs.filter(rfq => {
    const matchesSearch = rfq.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.buyerCompany.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || rfq.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'id',
      header: 'RFQ ID',
      render: (rfq: RFQ) => (
        <Link to={`/rfqs/${rfq.id}`} className="font-mono text-primary hover:underline">
          {rfq.id}
        </Link>
      )
    },
    {
      key: 'commodity',
      header: 'Commodity',
      render: (rfq: RFQ) => (
        <div>
          <p className="font-medium">{rfq.commodity}</p>
          <p className="text-xs text-muted-foreground">{rfq.grade} • {rfq.requiredPurity}</p>
        </div>
      )
    },
    {
      key: 'buyerCompany',
      header: 'Buyer',
      render: (rfq: RFQ) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span>{rfq.buyerCompany}</span>
        </div>
      )
    },
    {
      key: 'volume',
      header: 'Volume',
      className: 'text-right',
      render: (rfq: RFQ) => (
        <span className="font-mono font-bold">{formatVolume(rfq.volume, rfq.unit)}</span>
      )
    },
    {
      key: 'targetPrice',
      header: 'Target Price',
      className: 'text-right',
      render: (rfq: RFQ) => (
        <span className="font-mono">{formatCurrency(rfq.targetPrice)}/{rfq.unit}</span>
      )
    },
    {
      key: 'bidsCount',
      header: 'Bids',
      className: 'text-center',
      render: (rfq: RFQ) => (
        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
          {rfq.bidsCount}
        </span>
      )
    },
    {
      key: 'expiresAt',
      header: 'Expires',
      render: (rfq: RFQ) => (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {new Date(rfq.expiresAt).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      className: 'text-right',
      render: (rfq: RFQ) => <StatusPill status={rfq.status} />
    }
  ];

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Live RFQs"
          description="Request for quotes from verified buyers"
          icon={FileText}
          actions={
            <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Create RFQ
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Open RFQs', value: rfqs.filter(r => r.status === 'open').length, color: 'text-primary' },
            { label: 'Total Bids', value: rfqs.reduce((acc, r) => acc + r.bidsCount, 0), color: 'text-foreground' },
            { label: 'Awarded', value: rfqs.filter(r => r.status === 'awarded').length, color: 'text-success' },
            { label: 'Avg. Bids/RFQ', value: (rfqs.reduce((acc, r) => acc + r.bidsCount, 0) / rfqs.length).toFixed(1), color: 'text-accent' },
          ].map((stat) => (
            <div key={stat.label} className="glass-panel rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-2xl font-bold font-mono tabular-nums ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="glass-panel rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search RFQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'open', 'awarded', 'closed'] as const).map((status) => (
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
        <DataTable columns={columns} data={filteredRfqs} />
      </div>
    </LayoutShell>
  );
}
