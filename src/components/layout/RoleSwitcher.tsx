import { useRole, UserRole } from '@/context/RoleContext';
import { cn } from '@/lib/utils';

const roles: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'ADMIN' },
  { value: 'supplier', label: 'SUPPLIER' },
  { value: 'buyer', label: 'BUYER' },
];

export function RoleSwitcher() {
  const { role, setRole } = useRole();

  return (
    <div className="flex items-center bg-secondary/50 rounded-lg p-1 border border-border/50">
      {roles.map((r) => (
        <button
          key={r.value}
          onClick={() => setRole(r.value)}
          className={cn(
            "px-3 py-1.5 text-xs font-semibold tracking-wider rounded-md transition-all duration-200",
            role === r.value
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
