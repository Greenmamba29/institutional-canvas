import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/context/OrganizationContext";
import { useRole } from "@/context/RoleContext";
import { useAuth } from "@/context/AuthContext";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";
import { RoleSwitcher } from "./RoleSwitcher";
import { GMVSummaryPanelConnected } from "./GMVSummaryPanelConnected";
import { NotificationDropdown } from "./NotificationDropdown";
import { CountBadge } from "@/components/shared/CountBadge";
import { OrgSwitcher } from "@/components/org/OrgSwitcher";
import { VerificationBadge } from "@/components/shared/VerificationBadge";
import {
  Store,
  Shield,
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
  Sparkles,
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
  Activity,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LayoutShellProps {
  children: React.ReactNode;
}

// Navigation items with role/tier requirements
interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  requiresOrgType?: ('admin' | 'supplier' | 'buyer' | 'soe')[];
  requiresTier?: 'pro' | 'enterprise';
}

// Buyer/Admin Navigation - MVP locked ordering
const adminNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Marketplace', path: '/marketplace', icon: Store, requiresOrgType: ['admin', 'buyer', 'soe'] },
  { label: 'Auctions', path: '/auctions', icon: Gavel, count: 14 },
  { label: 'Recycling', path: '/recycling', icon: Activity, count: 3 },
  { label: 'Bids', path: '/bids', icon: Target, count: 5 },
  { label: 'RFQs', path: '/rfqs', icon: FileText, count: 8 },
  { label: 'Deals', path: '/deals', icon: Handshake },
  { label: 'Orders', path: '/orders', icon: Package, count: 3 },
  { label: 'TeleBuy', path: '/telebuy', icon: Video, requiresTier: 'pro' },
  { label: 'AI Studio', path: '/ai-studio', icon: Brain, requiresTier: 'pro' },
  { label: 'Data', path: '/data', icon: Database },
  { label: 'Messages', path: '/messages', icon: MessageSquare, count: 3 },
  { label: 'Verification', path: '/verification', icon: ShieldCheck, count: 5, requiresOrgType: ['admin'] },
  { label: 'Analytics', path: '/analytics', icon: TrendingUp },
  { label: 'Admin', path: '/admin', icon: Shield, requiresOrgType: ['admin'] },
];

// Supplier Navigation - MVP locked ordering
const supplierNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Recycling', path: '/recycling', icon: Activity, count: 2 },
  { label: 'RFQs', path: '/rfqs', icon: FileText, count: 15 },
  { label: 'Auctions', path: '/auctions', icon: Gavel, count: 2 },
  { label: 'Bid Activity', path: '/bids', icon: Target, count: 3 },
  { label: 'Deals', path: '/deals', icon: Handshake },
  { label: 'Orders', path: '/orders', icon: Package, count: 3 },
  { label: 'TeleBuy', path: '/telebuy', icon: Video, requiresTier: 'pro' },
  { label: 'Messages', path: '/messages', icon: MessageSquare, count: 3 },
  { label: 'Analytics', path: '/analytics', icon: TrendingUp },
];

const bottomNavItems = [
  { label: 'Settings', path: '/settings', icon: Settings },
  { label: 'Billing', path: '/settings/billing', icon: CreditCard },
];

export function LayoutShell({ children }: LayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { viewMode, currentOrg } = useOrganization();
  const { orgType, subscriptionTier } = useRole();
  const { user, signOut } = useAuth();
  const { isSuperAdmin } = useIsSuperAdmin();

  // Create a key based on user.id to force re-renders when user changes
  // This ensures the sidebar updates with the correct user info after sign-in/sign-out
  const userKey = user?.id || 'anonymous';

  // Derive user display info - use userKey dependency implicitly via user object
  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitials = userDisplayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const orgDisplayName = currentOrg?.name || 'No Organization';
  const orgInitials = orgDisplayName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isActive = (path: string) => location.pathname.startsWith(path);
  
  // Filter nav items based on org type and subscription tier
  const baseNavItems = viewMode === 'supplier' ? supplierNavItems : adminNavItems;
  
  const navItems = useMemo(() => {
    return baseNavItems.filter(item => {
      // Admin nav item requires super_admins table check
      if (item.path === '/admin' && !isSuperAdmin) {
        return false;
      }
      // Check org type requirement
      if (item.requiresOrgType && orgType) {
        if (!item.requiresOrgType.includes(orgType as 'admin' | 'supplier' | 'buyer' | 'soe')) {
          return false;
        }
      }
      // Note: We don't filter by subscription here - we show all items
      // but will show lock icons for gated features
      return true;
    });
  }, [baseNavItems, orgType, isSuperAdmin]);

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
            <div className="p-2 rounded-lg bg-gradient-gold">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-tight">LithiumBuy</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                  {viewMode === 'supplier' ? 'Recycling & Supply' : 'Mission Control'}
                </span>
              </div>
            )}
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

        {/* Supplier Profile Card */}
        {viewMode === 'supplier' && sidebarOpen && (
          <div className="p-4 border-b border-border/50 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                {orgInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{orgDisplayName}</p>
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
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{userDisplayName}</p>
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

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const isLocked = item.requiresTier && 
              subscriptionTier !== item.requiresTier && 
              subscriptionTier !== 'enterprise' &&
              orgType !== 'admin';
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  isLocked && "opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("h-5 w-5 shrink-0", active && "text-primary")} />
                  {sidebarOpen && (
                    <span className="font-medium truncate">{item.label}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {sidebarOpen && isLocked && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">PRO</Badge>
                  )}
                  {sidebarOpen && item.count && (
                    <CountBadge count={item.count} variant={active ? 'default' : 'accent'} />
                  )}
                </div>
                {!sidebarOpen && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                    {isLocked && ' (Pro)'}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* GMV Summary for Admin */}
        {viewMode !== 'supplier' && sidebarOpen && (
          <GMVSummaryPanelConnected />
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
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span className="font-medium">Sign Out</span>}
          </button>
          
          {sidebarOpen && (
            <div className="pt-3 mt-3 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground text-center tracking-widest">
                {viewMode === 'supplier' ? 'SUPPLIER TERMINAL V4.1' : 'MISSION CONTROL CENTER • CONNECTED'}
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
            <div className="p-2 rounded-lg bg-gradient-gold">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg">LithiumBuy</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Recycling & Supply</span>
            </div>
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
          {navItems.map((item) => {
            const active = isActive(item.path);
            const isLocked = item.requiresTier && 
              subscriptionTier !== item.requiresTier && 
              subscriptionTier !== 'enterprise' &&
              orgType !== 'admin';
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  isLocked && "opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={cn("h-5 w-5", active && "text-primary")} />
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isLocked && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">PRO</Badge>
                  )}
                  {item.count && <CountBadge count={item.count} variant={active ? 'default' : 'accent'} />}
                </div>
              </Link>
            );
          })}
        </nav>
        
        {/* Mobile User Profile + Bottom Nav */}
        <div className="p-3 border-t border-border/50 space-y-2">
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/30 border border-border/30">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userDisplayName}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {subscriptionTier || 'free'} • {orgType || 'buyer'}
              </p>
            </div>
          </div>

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
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
          
          {/* Sign Out Button */}
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              signOut();
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-5 w-5 shrink-0" />
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
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-border/50">
                <div className="text-right">
                  <p className="text-sm font-semibold">{userDisplayName}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {subscriptionTier ? `${subscriptionTier} TIER` : 'FREE'} • {orgType || 'USER'}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                  {userInitials}
                </div>
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
