import { useState } from "react";
import { Link } from "react-router-dom";
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
import { FileText, Search, Plus, Building2, Truck, Flag } from "lucide-react";
import { rfqs, formatCurrency, formatVolume, type RFQ } from "@/data/mockData";

export default function RFQs() {
  const { role } = useRole();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed' | 'awarded'>('all');
  const [activeTab, setActiveTab] = useState('live');

  const filteredRfqs = rfqs.filter(rfq => {
    const matchesSearch = rfq.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rfq.buyerCompany.toLowerCase().includes(searchQuery.toLowerCase());
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
      key: 'buyerCompany',
      header: 'COMPANY',
      render: (rfq: RFQ) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">🇺🇸</span>
          <span className="font-medium text-sm">{rfq.buyerCompany}</span>
        </div>
      )
    },
    {
      key: 'commodity',
      header: 'PRODUCT',
      render: (rfq: RFQ) => <span className="text-sm">{rfq.commodity}</span>
    },
    {
      key: 'volume',
      header: 'QUANTITY',
      render: (rfq: RFQ) => <span className="font-mono text-sm">{formatVolume(rfq.volume, rfq.unit)}</span>
    },
    {
      key: 'expiresAt',
      header: 'REMAINING',
      render: (rfq: RFQ) => <CountdownTimer expiresAt={rfq.expiresAt} />
    },
    {
      key: 'match',
      header: 'MATCH',
      render: () => <MatchProgressBar percentage={Math.floor(Math.random() * 60) + 30} className="w-24" />
    },
    {
      key: 'targetPrice',
      header: 'VALUE',
      render: (rfq: RFQ) => <span className="font-mono font-bold">{formatCurrency(rfq.targetPrice * rfq.volume)}</span>
    },
    {
      key: 'escrow',
      header: 'ESCROW',
      render: () => <span className="text-xs text-muted-foreground">@{Math.floor(Math.random() * 5) + 1}H {Math.floor(Math.random() * 59)}M</span>
    },
  ];

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        <BreadcrumbNav items={[{ label: 'PLATFORM' }, { label: 'TRADING DESK' }, { label: 'RFQs' }]} />
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Live RFQs</h1>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Plus className="h-4 w-4 mr-2" />
            Create RFQ
          </Button>
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
                {(['all', 'open', 'awarded', 'closed'] as const).map((status) => (
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

            <DataTable columns={columns} data={filteredRfqs} />

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
          {role === 'supplier' && (
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
