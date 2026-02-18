import { Link } from "react-router-dom";

import { PageHeader } from "@/components/shared/PageHeader";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  CreditCard,
  Key,
  Building2,
  ChevronRight,
} from "lucide-react";

const settingsSections = [
  {
    title: "Profile",
    description: "Manage your account details and preferences",
    icon: User,
    href: "/settings/team",
    items: ["Personal Information", "Company Details", "Notification Preferences"],
  },
  {
    title: "Security",
    description: "Password, 2FA, and access controls",
    icon: Shield,
    href: "/settings",
    items: ["Change Password", "Two-Factor Authentication", "Session Management"],
  },
  {
    title: "Notifications",
    description: "Configure alerts and updates",
    icon: Bell,
    href: "/settings",
    items: ["Email Notifications", "SMS Alerts", "Price Alerts"],
  },
  {
    title: "Billing",
    description: "Payment methods and invoices",
    icon: CreditCard,
    href: "/settings/billing",
    items: ["Payment Methods", "Billing History", "Subscription"],
  },
];

const actionSections = [
  {
    title: "KYC / Compliance",
    description: "Submit identity verification and compliance documents for your organization",
    icon: Shield,
    href: "/settings/kyc",
    badge: "Required for Pro",
  },
  {
    title: "API Integration",
    description: "Create and manage API keys to connect external systems and webhooks",
    icon: Key,
    href: "/settings/api",
    badge: null,
  },
  {
    title: "Company Verification",
    description: "Track your business verification status and manage credentials",
    icon: Building2,
    href: "/settings/company-verification",
    badge: null,
  },
];

export default function Settings() {
  return (
    <>
      <div className="space-y-8 animate-fade-in">
        <PageHeader
          title="Settings"
          description="Manage your account and preferences"
          icon={SettingsIcon}
        />

        {/* Main Settings */}
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
              <div className="space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item}
                    to={section.href}
                    className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-secondary/50 transition-colors text-sm"
                  >
                    <span>{item}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Sections */}
        <div>
          <h2 className="text-base font-semibold mb-4">Compliance & Integration</h2>
          <div className="grid lg:grid-cols-3 gap-4">
            {actionSections.map((section) => (
              <Link
                key={section.title}
                to={section.href}
                className="card-premium p-5 hover:bg-secondary/30 transition-colors group block"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <section.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{section.title}</h3>
                    {section.badge && (
                      <span className="text-[10px] text-primary font-medium uppercase tracking-wide">
                        {section.badge}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {section.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
