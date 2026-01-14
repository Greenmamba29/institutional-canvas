import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useRole } from "@/context/RoleContext";
import { RoleSwitcher } from "./RoleSwitcher";
import { GMVSummaryPanel } from "./GMVSummaryPanel";
import { NotificationDropdown } from "./NotificationDropdown";
import { CountBadge } from "@/components/shared/CountBadge";
import { OrgSwitcher } from "@/components/org/OrgSwitcher";
import { VerificationBadge } from "@/components/shared/VerificationBadge";
import { UserMenu } from "@/components/auth/UserMenu";
import {
  Store,
  FileText,
  Gavel,
  TrendingUp,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Package,
  MessageSquare,
  Plus,
  Handshake,
  Video,
  Brain,
  Database,
  CreditCard,
  Target,
  Landmark,
  ClipboardCheck,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";

interface LayoutShellProps {
  children: React.ReactNode;
}

// Buyer/Admin Navigation - MVP locked ordering
// TODO: Realtime publish later: subscribe to bid events + notification events
const adminNavItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Marketplace', path: '/marketplace', icon: Store },
  { label: 'Auctions', path: '/auctions', icon: Gavel, count: 14 },
  { label: 'Bids', path: '/bids', icon: Target, count: 5 },
  { label: 'RFQs', path: '/rfqs', icon: FileText, count: 8 },
  { label: 'Deals', path: '/deals', icon: Handshake },
  { label: 'Orders', path: '/orders', icon: Package, count: 3 },
  { label: 'TeleBuy', path: '/telebuy', icon: Video },
  { label: 'AI Studio', path: '/ai-studio', icon: Brain },
  { label: 'Data', path: '/data', icon: Database },
  { label: 'Messages', path: '/messages', icon: MessageSquare, count: 3 },
  { label: 'Verification', path: '/verification', icon: ShieldCheck, count: 5 },
  { label: 'Analytics', path: '/analytics', icon: TrendingUp },
];

// Supplier Navigation - MVP locked ordering
// TODO: Realtime publish later: subscribe to bid events + notification events
const supplierNavItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'RFQs', path: '/rfqs', icon: FileText, count: 15 },
  { label: 'Auctions', path: '/auctions', icon: Gavel, count: 2 },
  { label: 'Bid Activity', path: '/bids', icon: Target, count: 3 },
  { label: 'Deals', path: '/deals', icon: Handshake },
  { label: 'Orders', path: '/orders', icon: Package, count: 3 },
  { label: 'TeleBuy', path: '/telebuy', icon: Video },
  { label: 'Messages', path: '/messages', icon: MessageSquare, count: 3 },
  { label: 'Analytics', path: '/analytics', icon: TrendingUp },
];

// SOE Navigation - Government-focused ordering
const soeNavItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Strategic Procurement', path: '/rfqs', icon: FileText, count: 8 },
  { label: 'National Reserves', path: '/data', icon: Database },
  { label: 'Supplier Registry', path: '/marketplace', icon: Store },
  { label: 'Contracts', path: '/deals', icon: Handshake },
  { label: 'Orders', path: '/orders', icon: Package, count: 3 },
  { label: 'TeleBuy', path: '/telebuy', icon: Video },
  { label: 'Compliance', path: '/verification', icon: ClipboardCheck, count: 5 },
  { label: 'Reports', path: '/analytics', icon: TrendingUp },
];

const bottomNavItems = [
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Billing', path: '/settings/billing', icon: CreditCard },
];

export function LayoutShell({ children }: LayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { uiLayoutPreference } = useRole();
  const { signOut } = useAuth();

  const isActive = (path: string) => location.pathname.startsWith(path);
  // UI layout determines which navigation to show - this is cosmetic, not authorization
  const navItems = uiLayoutPreference === 'supplier' 
    ? supplierNavItems 
    : uiLayoutPreference === 'soe'
    ? soeNavItems
    : adminNavItems;

  const layoutLabel = uiLayoutPreference === 'supplier' 
    ? 'Supplier Terminal' 
    : uiLayoutPreference === 'soe'
    ? 'Government Portal'
    : 'Mission Control';

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0 border-r border-border/50 bg-sidebar transition-all duration-300",
          sidebarOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <Link to="/" className="flex items-center gap-3">
            <Logo 
              size={sidebarOpen ? 'md' : 'sm'} 
              showText={sidebarOpen} 
              variant={sidebarOpen ? 'full' : 'icon'}
              layoutLabel={layoutLabel}
            />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>

        {/* Supplier Profile Card - shown when user selects supplier layout */}
        {uiLayoutPreference === 'supplier' && sidebarOpen && (
          <div className="p-4 border-b border-border/50 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                LC
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">LithiumCorp</p>
                <VerificationBadge tier="gold" showIcon={false} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">TOTAL SALES</span>
              <span className="font-mono font-bold text-accent">$3.75M</span>
            </div>
            <div className="p-2 rounded-lg bg-secondary/30 border border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                  DS
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">Diego Santos</p>
                  <p className="text-[10px] text-primary">1X LIVE RFQ • $47.3K</p>
                </div>
              </div>
            </div>
            <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-semibold">
              <Plus className="h-3.5 w-3.5 mr-1" />
              LIST NEW MATERIAL
            </Button>
          </div>
        )}

        {/* SOE Profile Card - shown when user selects SOE layout */}
        {uiLayoutPreference === 'soe' && sidebarOpen && (
          <div className="p-4 border-b border-border/50 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-success/20 flex items-center justify-center text-success font-bold text-sm">
                <Landmark className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">Government Entity</p>
                <span className="text-[10px] text-success font-medium">VERIFIED SOE</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">STRATEGIC RESERVES</span>
              <span className="font-mono font-bold text-success">12,500 MT</span>
            </div>
            <div className="p-2 rounded-lg bg-success/5 border border-success/20">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Active Contracts</span>
                <span className="font-semibold text-success">7</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-muted-foreground">Pending Review</span>
                <span className="font-semibold text-warning">3</span>
              </div>
            </div>
            <Button className="w-full bg-success hover:bg-success/90 text-success-foreground text-xs font-semibold">
              <FileText className="h-3.5 w-3.5 mr-1" />
              NEW PROCUREMENT RFQ
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
                  {sidebarOpen && (
                    <span className="font-medium truncate">{item.label}</span>
                  )}
                </div>
                {sidebarOpen && item.count && (
                  <CountBadge count={item.count} variant={active ? 'default' : 'accent'} />
                )}
                {!sidebarOpen && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* GMV Summary for Admin layout */}
        {uiLayoutPreference !== 'supplier' && sidebarOpen && (
          <GMVSummaryPanel
            gmvYTD={15200000}
            changePercent={12.4}
            suppliersVerified={147}
            buyersVerified={17402}
            sparklineData={[10, 15, 12, 18, 22, 19, 25, 28, 24, 30]}
          />
        )}

        {/* Bottom nav */}
        <div className="p-3 border-t border-border/50 space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive(item.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </Link>
          ))}
          
          {/* Sign Out Button */}
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
          
          {sidebarOpen && (
            <div className="pt-3 mt-3 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground text-center tracking-widest">
                {uiLayoutPreference === 'supplier' 
                  ? 'LITHIUMBUY • SUPPLIER TERMINAL' 
                  : uiLayoutPreference === 'soe'
                  ? 'LITHIUMBUY • GOVERNMENT PORTAL'
                  : 'LITHIUMBUY • MISSION CONTROL'}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-sidebar border-r border-border transform transition-transform duration-300 lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <Link to="/" className="flex items-center gap-3">
            <Logo size="md" layoutLabel="Trading Platform" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive(item.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.count && <CountBadge count={item.count} />}
            </Link>
          ))}
        </nav>
        
        {/* Mobile Bottom nav with Sign Out */}
        <div className="p-3 border-t border-border/50 space-y-1">
          {bottomNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive(item.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
          
          {/* Mobile Sign Out Button */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              signOut();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-left text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="h-full px-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Search */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 w-72">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search listings, RFQs, suppliers..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded">
                  ⌘K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Organization Switcher */}
              <OrgSwitcher />

              {/* Role Switcher */}
              <RoleSwitcher />

              {/* Live indicator */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] font-semibold text-success tracking-wider">LIVE MARKET STATUS: NORMAL</span>
              </div>

              <NotificationDropdown />

              {/* User Profile */}
              <div className="pl-3 border-l border-border/50">
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
