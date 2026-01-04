import { useRole, UILayoutPreference } from '@/context/RoleContext';
import { cn } from '@/lib/utils';

/**
 * UI Layout Switcher - allows users to switch between different dashboard layouts.
 * This is purely cosmetic and does NOT affect authorization.
 * All authorization decisions use serverRole from RoleContext.
 */
const layoutOptions: { value: UILayoutPreference; label: string }[] = [
  { value: 'admin', label: 'ADMIN' },
  { value: 'supplier', label: 'SUPPLIER' },
  { value: 'buyer', label: 'BUYER' },
  { value: 'soe', label: 'SOE' },
];

export function RoleSwitcher() {
  const { uiLayoutPreference, setUILayoutPreference } = useRole();

  return (
    <div className="flex items-center bg-secondary/50 rounded-lg p-1 border border-border/50">
      {layoutOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => setUILayoutPreference(option.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-semibold tracking-wider rounded-md transition-all duration-200",
            uiLayoutPreference === option.value
              ? "bg-accent text-accent-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
