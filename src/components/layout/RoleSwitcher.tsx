import { useOrganization, ViewMode } from '@/context/OrganizationContext';
import { useSuperAdmin } from '@/hooks/useCapability';
import { cn } from '@/lib/utils';

const viewModes: { value: ViewMode; label: string }[] = [
  { value: 'admin', label: 'ADMIN' },
  { value: 'supplier', label: 'SUPPLIER' },
  { value: 'buyer', label: 'BUYER' },
];

/**
 * RoleSwitcher Component
 * 
 * SECURITY: This component is ONLY visible to super admins for testing purposes.
 * Regular users derive their view from their onboarding profile server-side.
 * This prevents privilege escalation via localStorage manipulation.
 */
export function RoleSwitcher() {
  const { viewMode, setViewMode } = useOrganization();
  const { data: isSuperAdmin, isLoading } = useSuperAdmin();

  // Only render for super admins - prevents privilege escalation
  if (isLoading || !isSuperAdmin) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-destructive font-mono uppercase tracking-wider">
        [ADMIN TEST MODE]
      </span>
      <div className="flex items-center bg-secondary/50 rounded-lg p-1 border border-destructive/30">
        {viewModes.map((r) => (
          <button
            key={r.value}
            onClick={() => setViewMode(r.value)}
            className={cn(
              "px-3 py-1.5 text-xs font-semibold tracking-wider rounded-md transition-all duration-200",
              viewMode === r.value
                ? "bg-destructive/20 text-destructive shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
