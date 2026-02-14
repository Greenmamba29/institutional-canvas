import { useState } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { TabBar } from "@/components/shared/TabBar";
import { StatusPill } from "@/components/shared/StatusPill";
import { VerificationBadge } from "@/components/shared/VerificationBadge";
import { DataTable } from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Clock, AlertTriangle, CheckCircle, XCircle, FileSearch, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BadgeTier } from "@/components/shared/VerificationBadge";

interface VerificationRequest {
  id: string;
  company: string;
  type: string;
  tier: BadgeTier;
  status: 'pending' | 'open' | 'verified' | 'closed';
  submittedAt: string;
  documents: number;
}

function useVerificationRequests() {
  return useQuery<VerificationRequest[]>({
    queryKey: ['kyb-verification'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kyb_verification_queue')
        .select('id, org_id, verification_tier, status, submitted_at, documents, notes')
        .order('submitted_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!data) return [];

      return data.map((row) => ({
        id: row.id.slice(0, 8).toUpperCase(),
        company: row.org_id.slice(0, 12),
        type: 'organization',
        tier: (['gold', 'silver', 'bronze', 'standard', 'basic', 'kyc', 'lithiumbuy'].includes(row.verification_tier)
          ? row.verification_tier
          : 'basic') as BadgeTier,
        status: (['pending', 'open', 'verified', 'closed'].includes(row.status)
          ? row.status
          : 'pending') as VerificationRequest['status'],
        submittedAt: row.submitted_at ? new Date(row.submitted_at).toLocaleDateString() : '-',
        documents: Array.isArray(row.documents) ? row.documents.length : 0,
      }));
    },
  });
}

const columns = [
  {
    key: 'id',
    header: 'REF ID',
    render: (row: VerificationRequest) => <span className="font-mono text-xs">{row.id}</span>,
  },
  {
    key: 'company',
    header: 'ORG',
    render: (row: VerificationRequest) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium font-mono text-xs">{row.company}…</p>
          <p className="text-[10px] text-muted-foreground uppercase">{row.type}</p>
        </div>
      </div>
    ),
  },
  {
    key: 'tier',
    header: 'REQUESTED TIER',
    render: (row: VerificationRequest) => <VerificationBadge tier={row.tier} />,
  },
  {
    key: 'status',
    header: 'STATUS',
    render: (row: VerificationRequest) => <StatusPill status={row.status} />,
  },
  {
    key: 'documents',
    header: 'DOCUMENTS',
    render: (row: VerificationRequest) => <span className="font-mono">{row.documents} files</span>,
  },
  {
    key: 'submittedAt',
    header: 'SUBMITTED',
    render: (row: VerificationRequest) => <span>{row.submittedAt}</span>,
  },
  {
    key: 'actions',
    header: '',
    render: () => (
      <Button variant="outline" size="sm" className="text-xs">
        <FileSearch className="h-3.5 w-3.5 mr-1" />
        Review
      </Button>
    ),
  },
];

export default function Verification() {
  const [activeTab, setActiveTab] = useState('all');
  const { data: verifications = [], isLoading, error } = useVerificationRequests();

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

  const filteredData =
    activeTab === 'all'
      ? verifications
      : activeTab === 'completed'
        ? verifications.filter((v) => v.status === 'verified' || v.status === 'closed')
        : verifications.filter((v) => v.status === activeTab);

  const stats = {
    pending: verifications.filter((v) => v.status === 'pending').length,
    inReview: verifications.filter((v) => v.status === 'open').length,
    approved: verifications.filter((v) => v.status === 'verified').length,
    rejected: verifications.filter((v) => v.status === 'closed').length,
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

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-muted-foreground">Failed to load verification requests</p>
          </div>
        ) : filteredData.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No verification requests"
            description="No verification requests found for the current filter."
            action={{
              label: 'Submit Verification',
              onClick: () => console.log('Submit verification'),
              icon: ShieldCheck,
            }}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredData}
            onRowClick={(row) => console.log('View verification:', row.id)}
          />
        )}
      </div>
    </LayoutShell>
  );
}
