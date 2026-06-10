import { AlertTriangle, ArrowRight } from 'lucide-react';

interface SystemAlertProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SystemAlert({ message, actionLabel = "VIEW DETAILS", onAction }: SystemAlertProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg bg-warning/10 border border-warning/30">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
        <span className="text-sm">
          <span className="font-semibold text-warning">SYSTEM ALERT:</span>{' '}
          <span className="text-foreground">{message}</span>
        </span>
      </div>
      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition-colors shrink-0"
        >
          {actionLabel}
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
