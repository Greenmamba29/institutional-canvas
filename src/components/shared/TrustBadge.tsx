import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

interface TrustBadgeProps {
  status: 'verified' | 'pending' | 'unverified';
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TrustBadge({ status, score, showScore = true, size = 'md', className }: TrustBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const config = {
    verified: {
      icon: CheckCircle,
      label: 'Verified',
      className: 'bg-success/10 text-success border border-success/20'
    },
    pending: {
      icon: Clock,
      label: 'Pending',
      className: 'bg-warning/10 text-warning border border-warning/20'
    },
    unverified: {
      icon: AlertCircle,
      label: 'Unverified',
      className: 'bg-muted text-muted-foreground border border-border'
    }
  };

  const { icon: Icon, label, className: statusClassName } = config[status];

  return (
    <div className={cn(
      "inline-flex items-center rounded-full font-medium",
      sizeClasses[size],
      statusClassName,
      className
    )}>
      <Icon className={iconSizes[size]} />
      <span>{label}</span>
      {showScore && score !== undefined && (
        <span className="ml-1 font-mono tabular-nums opacity-80">
          {score}%
        </span>
      )}
    </div>
  );
}
