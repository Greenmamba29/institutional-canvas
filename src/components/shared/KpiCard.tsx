import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'primary';
  className?: string;
}

export function KpiCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  variant = 'default',
  className
}: KpiCardProps) {
  const isPositive = change && change >= 0;

  return (
    <div className={cn("kpi-tile group animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className={cn(
            "text-2xl font-bold font-mono tabular-nums tracking-tight",
            variant === 'primary' && "text-gradient-primary",
            variant === 'success' && "text-success",
            variant === 'warning' && "text-warning"
          )}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            variant === 'default' && "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
            variant === 'primary' && "bg-primary/10 text-primary",
            variant === 'success' && "bg-success/10 text-success",
            variant === 'warning' && "bg-warning/10 text-warning"
          )}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium font-mono tabular-nums",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {isPositive ? '+' : ''}{change.toFixed(2)}%
          </span>
          {changeLabel && (
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
