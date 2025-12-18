import { cn } from "@/lib/utils";

type StatusType = 'active' | 'success' | 'warning' | 'error' | 'pending' | 'verified' | 'live' | 'upcoming' | 'ended' | 'open' | 'closed' | 'awarded' | 'won' | 'lost' | 'withdrawn' | 'reserved' | 'sold';

interface StatusPillProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  active: { label: 'Active', className: 'status-active' },
  success: { label: 'Success', className: 'status-success' },
  warning: { label: 'Warning', className: 'status-warning' },
  error: { label: 'Error', className: 'status-error' },
  pending: { label: 'Pending', className: 'status-pending' },
  verified: { label: 'Verified', className: 'status-success' },
  live: { label: 'Live', className: 'bg-destructive/20 text-destructive border border-destructive/30 animate-pulse' },
  upcoming: { label: 'Upcoming', className: 'status-active' },
  ended: { label: 'Ended', className: 'status-pending' },
  open: { label: 'Open', className: 'status-active' },
  closed: { label: 'Closed', className: 'status-pending' },
  awarded: { label: 'Awarded', className: 'status-success' },
  won: { label: 'Won', className: 'status-success' },
  lost: { label: 'Lost', className: 'status-error' },
  withdrawn: { label: 'Withdrawn', className: 'status-pending' },
  reserved: { label: 'Reserved', className: 'status-warning' },
  sold: { label: 'Sold', className: 'status-success' },
};

export function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
      config.className,
      className
    )}>
      {config.label}
    </span>
  );
}
