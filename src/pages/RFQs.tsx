import { useState } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { useRole } from "@/context/RoleContext";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { TabBar } from "@/components/shared/TabBar";
import { StatusPill } from "@/components/shared/StatusPill";
import { CountdownTimer } from "@/components/shared/CountdownTimer";
import { MatchProgressBar } from "@/components/shared/MatchProgressBar";
import { SupplierProfileSidebar } from "@/components/rfq/SupplierProfileSidebar";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Truck, Flag, AlertCircle } from "lucide-react";
import { useRFQs } from "@/hooks/useRFQs";
import type { RFQ } from "@/services/rfqs.service";
import { CreateRFQDialog } from "@/components/rfq/CreateRFQDialog";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatVolume(volume: number, unit: string): string {
  return `${volume.toLocaleString()} ${unit}`;
}

export default function RFQs() {
  const { viewMode } = useRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'closed' | 'awarded'>('all');
  const [activeTab, setActiveTab] = useState('live');
  
  const { data: rfqs = [], isLoading, error } = useRFQs();

  const filteredRfqs = rfqs.filter(rfq => {
    const matchesSearch = rfq.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rfq.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesStatus = filterStatus === 'all' || rfq.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const tabs = [
    { id: 'live', label: 'LIVE RFQs' },
    { id: 'history', label: 'HISTORY' },
    { id: 'templates', label: 'TEMPLATES' },
  ];

  const columns = [
    {
      key: 'title',
      header: 'TITLE',
      render: (rfq: RFQ) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{rfq.title}</span>
        </div>
      )
    },
    {
      key: 'description',
      header: 'DESCRIPTION',
      render: (rfq: RFQ) => <span className="text-sm text-muted-foreground line-clamp-1">{rfq.description || '-'}</span>
    },
    {
      key: 'target_quantity',
      header: 'QUANTITY',
      render: (rfq: RFQ) => <span className="font-mono text-sm">{formatVolume(rfq.target_quantity || 0, rfq.target_unit || 'MT')}</span>
    },
    {
      key: 'delivery_location',
      header: 'DELIVERY',
      render: (rfq: RFQ) => <span className="text-sm">{rfq.delivery_location || '-'}</span>
    },
    {
      key: 'incoterms',
      header: 'INCOTERMS',
      render: (rfq: RFQ) => <span className="text-sm font-mono">{rfq.incoterms || '-'}</span>
    },
    {
      key: 'status',
      header: 'STATUS',
      render: (rfq: RFQ) => <StatusPill status={rfq.status === 'submitted' ? 'open' : rfq.status === 'draft' ? 'pending' : rfq.status === 'closed' ? 'closed' : 'pending'} />
    },
    {
      key: 'created_at',
      header: 'CREATED',
      render: (rfq: RFQ) => <span className="text-xs text-muted-foreground">{new Date(rfq.created_at).toLocaleDateString()}</span>
    },
  ];

  if (error) {
    return (
      <LayoutShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Failed to load RFQs</h2>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        <BreadcrumbNav items={[{ label: 'PLATFORM' }, { label: 'TRADING DESK' }, { label: 'RFQs' }]} />
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Live RFQs</h1>
          <CreateRFQDialog />
        </div>

        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            {/* Filters */}
            <div className="glass-panel rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="relative flex-1 sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search RFQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50"
                />
              </div>
              <div className="flex items-center gap-2">
                {(['all', 'submitted', 'awarded', 'closed'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                    className="capitalize text-xs"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredRfqs.length === 0 ? (
              <div className="glass-panel rounded-xl p-8 text-center">
                <p className="text-muted-foreground">No RFQs found</p>
              </div>
            ) : (
              <DataTable columns={columns} data={filteredRfqs} />
            )}

            {/* Bottom Status Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="glass-panel rounded-lg p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <Truck className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium">Logistics Fulfillment</p>
                  <p className="text-xs text-muted-foreground">Pending dispatch for Order #77421 (Santiago Port)</p>
                </div>
              </div>
              <div className="glass-panel rounded-lg p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Flag className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium">Pending Settlements</p>
                  <p className="text-xs text-muted-foreground">3 Escrow releases awaiting final verification</p>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Profile Sidebar */}
          {viewMode === 'supplier' && (
            <div className="lg:col-span-1">
              <SupplierProfileSidebar
                name="Diego Santos"
                title="Chief Operating Officer"
                company="LithiumCorp"
                verificationTier="gold"
                kycVerified={true}
                purityGrade={96.5}
                recycledMaterial="Up to 10%"
                trustScore={97}
                pricePerMT={66500}
                origin="Chile"
                originFlag="🇨🇱"
                certifications={['ISO 9001', 'ISO 14001', 'RMI-RMAP', 'DCC']}
                verificationPipeline={[
                  { name: 'Site Inspection 2024', status: 'approved' },
                  { name: 'RMI Sustainability Audit', status: 'in_review' },
                  { name: 'LME Grade Registration', status: 'active' },
                ]}
              />
            </div>
          )}
        </div>
      </div>
    </LayoutShell>
  );
}
