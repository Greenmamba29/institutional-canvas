import { cn } from '@/lib/utils';

interface CertificationTagProps {
  label: string;
  className?: string;
}

export function CertificationTag({ label, className }: CertificationTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 text-[10px] font-semibold tracking-wider",
        "bg-secondary/50 text-muted-foreground border border-border/50 rounded",
        className
      )}
    >
      {label}
    </span>
  );
}
