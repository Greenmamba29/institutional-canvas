import { cn } from '@/lib/utils';

interface CountBadgeProps {
  count: number;
  variant?: 'default' | 'accent' | 'destructive';
  className?: string;
}

export function CountBadge({ count, variant = 'default', className }: CountBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full",
        variant === 'default' && "bg-primary/20 text-primary",
        variant === 'accent' && "bg-accent/20 text-accent",
        variant === 'destructive' && "bg-destructive text-destructive-foreground",
        className
      )}
    >
      {count}
    </span>
  );
}
