import { useRole, UILayoutPreference } from '@/context/RoleContext';
import { cn } from '@/lib/utils';

/**
 * UI Layout Switcher - ADMIN ONLY.
 * Allows admin org users to switch between different dashboard layouts for testing.
 * This is purely cosmetic and does NOT affect authorization.
 * 
 * @note This component should only be rendered for admin org_type users.
 * Regular buyers, suppliers, and SOE users should NOT see this component.
 */
const layoutOptions: { value: UILayoutPreference; label: string }[] = [
  { value: 'admin', label: 'ADMIN' },
  { value: 'supplier', label: 'SUPPLIER' },
  { value: 'buyer', label: 'BUYER' },
  { value: 'soe', label: 'SOE' },
];

export function RoleSwitcher() {
  const { uiLayoutPreference, setUILayoutPreference, canSwitchLayouts } = useRole();

  // Only render for admin orgs
  if (!canSwitchLayouts) {
    return null;
  }

  return (
    <div className="flex items-center bg-secondary/50 rounded-lg p-1 border border-warning/30" title="Admin View Switcher (Testing Only)">
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
