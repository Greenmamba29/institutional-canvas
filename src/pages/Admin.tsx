import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { BreadcrumbNav } from '@/components/shared/BreadcrumbNav';
import { TabBar } from '@/components/shared/TabBar';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { UsersPanel } from '@/components/admin/UsersPanel';
import { SuppliersPanel } from '@/components/admin/SuppliersPanel';
import { AuditLogPanel } from '@/components/admin/AuditLogPanel';
import { AdminSettingsPanel } from '@/components/admin/AdminSettingsPanel';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert } from 'lucide-react';

const tabs = [
  { id: 'users', label: 'USERS' },
  { id: 'suppliers', label: 'SUPPLIERS' },
  { id: 'audit', label: 'AUDIT LOG' },
  { id: 'settings', label: 'SETTINGS' },
];

export default function Admin() {
  const { isSuperAdmin, isLoading } = useIsSuperAdmin();
  const [activeTab, setActiveTab] = useState('users');

  const breadcrumbs = [
    { label: 'PLATFORM' },
    { label: 'ADMIN' },
  ];

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </LayoutShell>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        <BreadcrumbNav items={breadcrumbs} />

        <div className="flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        </div>

        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-4">
          {activeTab === 'users' && <UsersPanel />}
          {activeTab === 'suppliers' && <SuppliersPanel />}
          {activeTab === 'audit' && <AuditLogPanel />}
          {activeTab === 'settings' && <AdminSettingsPanel />}
        </div>
      </div>
    </LayoutShell>
  );
}
