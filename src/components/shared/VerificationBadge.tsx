import { cn } from '@/lib/utils';
import { Shield, CheckCircle } from 'lucide-react';

type BadgeTier = 'gold' | 'standard' | 'basic' | 'kyc';

interface VerificationBadgeProps {
  tier: BadgeTier;
  showIcon?: boolean;
  className?: string;
}

export function VerificationBadge({ tier, showIcon = true, className }: VerificationBadgeProps) {
  const configs = {
    gold: {
      label: 'GOLD VERIFIED',
      bg: 'bg-accent/20',
      text: 'text-accent',
      border: 'border-accent/30',
      icon: Shield,
    },
    standard: {
      label: 'VERIFIED',
      bg: 'bg-success/20',
      text: 'text-success',
      border: 'border-success/30',
      icon: CheckCircle,
    },
    basic: {
      label: 'BASIC',
      bg: 'bg-muted',
      text: 'text-muted-foreground',
      border: 'border-border',
      icon: CheckCircle,
    },
    kyc: {
      label: 'KYC VERIFIED',
      bg: 'bg-primary/20',
      text: 'text-primary',
      border: 'border-primary/30',
      icon: Shield,
    },
  };

  const config = configs[tier];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-wider rounded border",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  );
}
