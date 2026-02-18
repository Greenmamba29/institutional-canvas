import { useState } from 'react';

import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { TabBar } from '@/components/shared/TabBar';
import { UsersPanel } from '@/components/admin/UsersPanel';
import { SuppliersPanel } from '@/components/admin/SuppliersPanel';
import { AuditLogPanel } from '@/components/admin/AuditLogPanel';
import { AdminSettingsPanel } from '@/components/admin/AdminSettingsPanel';
import { Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const tabs = [
  { id: 'users', label: 'Users' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'audit', label: 'Audit Log' },
  { id: 'settings', label: 'Settings' },
];

export default function Admin() {
  const { isSuperAdmin, isLoading } = useIsSuperAdmin();
  const [activeTab, setActiveTab] = useState('users');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h2 className="text-xl font-bold">Access Denied</h2>
            <p className="text-muted-foreground text-center">
              You do not have super admin privileges. This page is restricted.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mt-4">
        {activeTab === 'users' && <UsersPanel />}
        {activeTab === 'suppliers' && <SuppliersPanel />}
        {activeTab === 'audit' && <AuditLogPanel />}
        {activeTab === 'settings' && <AdminSettingsPanel />}
      </div>
    </div>
  );
}
