import { useState } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { TabBar } from "@/components/shared/TabBar";
import { StatusPill } from "@/components/shared/StatusPill";
import { VerificationBadge } from "@/components/shared/VerificationBadge";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock, AlertTriangle, CheckCircle, XCircle, FileSearch, Building2 } from "lucide-react";

interface VerificationRequest {
  id: string;
  company: string;
  type: 'supplier' | 'buyer';
  tier: 'gold' | 'standard' | 'basic';
  status: 'pending' | 'open' | 'verified' | 'closed';
  submittedAt: string;
  documents: number;
}

const mockVerifications: VerificationRequest[] = [
  { id: 'VER-001', company: 'Atacama Lithium Recycling', type: 'supplier', tier: 'gold', status: 'pending', submittedAt: '2024-01-15', documents: 8 },
  { id: 'VER-002', company: 'CleanTech Battery Recovery', type: 'buyer', tier: 'standard', status: 'open', submittedAt: '2024-01-14', documents: 5 },
  { id: 'VER-003', company: 'Pacific Lithium Supply', type: 'supplier', tier: 'gold', status: 'verified', submittedAt: '2024-01-12', documents: 12 },
  { id: 'VER-004', company: 'EV Battery Loop', type: 'buyer', tier: 'basic', status: 'closed', submittedAt: '2024-01-10', documents: 3 },
  { id: 'VER-005', company: 'Atacama Primary Resources', type: 'supplier', tier: 'standard', status: 'pending', submittedAt: '2024-01-09', documents: 6 },
];

const columns = [
  { 
    key: 'id', 
    header: 'REF ID',
    render: (row: VerificationRequest) => <span className="font-mono text-xs">{row.id}</span>
  },
  { 
    key: 'company', 
    header: 'COMPANY', 
    render: (row: VerificationRequest) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{row.company}</p>
          <p className="text-[10px] text-muted-foreground uppercase">{row.type}</p>
        </div>
      </div>
    )
  },
  { 
    key: 'tier', 
    header: 'REQUESTED TIER',
    render: (row: VerificationRequest) => <VerificationBadge tier={row.tier} />
  },
  { 
    key: 'status', 
    header: 'STATUS',
    render: (row: VerificationRequest) => <StatusPill status={row.status} />
  },
  { 
    key: 'documents', 
    header: 'DOCUMENTS', 
    render: (row: VerificationRequest) => <span className="font-mono">{row.documents} files</span> 
  },
  { 
    key: 'submittedAt', 
    header: 'SUBMITTED',
    render: (row: VerificationRequest) => <span>{row.submittedAt}</span>
  },
  { 
    key: 'actions', 
    header: '', 
    render: (row: VerificationRequest) => (
      <Button variant="outline" size="sm" className="text-xs">
        <FileSearch className="h-3.5 w-3.5 mr-1" />
        Review
      </Button>
    )
  },
];

export default function Verification() {
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'ALL REQUESTS' },
    { id: 'pending', label: 'PENDING' },
    { id: 'open', label: 'IN REVIEW' },
    { id: 'completed', label: 'COMPLETED' },
  ];

  const breadcrumbs = [
    { label: 'PLATFORM' },
    { label: 'COMPLIANCE' },
    { label: 'VERIFICATION' },
  ];

  const filteredData = activeTab === 'all' 
    ? mockVerifications 
    : activeTab === 'completed'
      ? mockVerifications.filter(v => v.status === 'verified' || v.status === 'closed')
      : mockVerifications.filter(v => v.status === activeTab);

  const stats = {
    pending: mockVerifications.filter(v => v.status === 'pending').length,
    inReview: mockVerifications.filter(v => v.status === 'open').length,
    approved: mockVerifications.filter(v => v.status === 'verified').length,
    rejected: mockVerifications.filter(v => v.status === 'closed').length,
  };

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        <BreadcrumbNav items={breadcrumbs} />
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Lithium & Recycling Verification</h1>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <ShieldCheck className="h-4 w-4 mr-2" />
            New Verification
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.pending}</p>
                <p className="text-[10px] text-muted-foreground tracking-wider">PENDING REVIEW</p>
              </div>
            </div>
          </div>
          
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <AlertTriangle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.inReview}</p>
                <p className="text-[10px] text-muted-foreground tracking-wider">IN REVIEW</p>
              </div>
            </div>
          </div>
          
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.approved}</p>
                <p className="text-[10px] text-muted-foreground tracking-wider">APPROVED</p>
              </div>
            </div>
          </div>
          
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{stats.rejected}</p>
                <p className="text-[10px] text-muted-foreground tracking-wider">REJECTED</p>
              </div>
            </div>
          </div>
        </div>

        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <DataTable 
          columns={columns} 
          data={filteredData}
          onRowClick={(row) => console.log('View verification:', row.id)}
        />
      </div>
    </LayoutShell>
  );
}
