import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Clock,
  Building2,
  Key
} from "lucide-react";

export default function Settings() {
  const settingsSections = [
    {
      title: 'Profile',
      description: 'Manage your account details and preferences',
      icon: User,
      items: ['Personal Information', 'Company Details', 'Notification Preferences']
    },
    {
      title: 'Security',
      description: 'Password, 2FA, and access controls',
      icon: Shield,
      items: ['Change Password', 'Two-Factor Authentication', 'API Keys']
    },
    {
      title: 'Notifications',
      description: 'Configure alerts and updates',
      icon: Bell,
      items: ['Email Notifications', 'SMS Alerts', 'Price Alerts']
    },
    {
      title: 'Billing',
      description: 'Payment methods and invoices',
      icon: CreditCard,
      items: ['Payment Methods', 'Billing History', 'Subscription']
    }
  ];

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Settings"
          description="Manage your account and preferences"
          icon={SettingsIcon}
        />

        <div className="grid lg:grid-cols-2 gap-6">
          {settingsSections.map((section) => (
            <div key={section.title} className="card-premium p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
              </div>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <button
                    key={item}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-sm"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Phase 2 Stubs */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Coming Soon</h2>
          <div className="grid lg:grid-cols-3 gap-4">
            {[
              { title: 'KYC/Compliance', icon: Shield, desc: 'Identity verification and compliance documents' },
              { title: 'API Integration', icon: Key, desc: 'Connect external systems and webhooks' },
              { title: 'Company Verification', icon: Building2, desc: 'Business verification and credentials' }
            ].map((stub) => (
              <div key={stub.title} className="card-premium p-5 border-dashed border-2 border-border opacity-60">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-muted">
                    <stub.icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold">{stub.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{stub.desc}</p>
                <p className="text-xs text-warning mt-2">Phase 2</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
