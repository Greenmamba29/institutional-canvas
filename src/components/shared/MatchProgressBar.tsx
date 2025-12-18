import { cn } from '@/lib/utils';

interface MatchProgressBarProps {
  percentage: number;
  showLabel?: boolean;
  className?: string;
}

export function MatchProgressBar({ percentage, showLabel = true, className }: MatchProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-mono font-medium text-muted-foreground min-w-[32px]">
          {clampedPercentage}%
        </span>
      )}
    </div>
  );
}
