import { useOrganization, ViewMode } from '@/context/OrganizationContext';
import { cn } from '@/lib/utils';

const viewModes: { value: ViewMode; label: string }[] = [
  { value: 'admin', label: 'ADMIN' },
  { value: 'supplier', label: 'SUPPLIER' },
  { value: 'buyer', label: 'BUYER' },
];

export function RoleSwitcher() {
  const { viewMode, setViewMode } = useOrganization();

  return (
    <div className="flex items-center bg-secondary/50 rounded-lg p-1 border border-border/50">
      {viewModes.map((r) => (
        <button
          key={r.value}
          onClick={() => setViewMode(r.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-semibold tracking-wider rounded-md transition-all duration-200",
            viewMode === r.value
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
