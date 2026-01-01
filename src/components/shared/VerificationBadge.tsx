import { cn } from '@/lib/utils';
import { Shield, CheckCircle } from 'lucide-react';

export type BadgeTier = 'gold' | 'silver' | 'bronze' | 'standard' | 'basic' | 'kyc';

interface VerificationBadgeProps {
  tier: BadgeTier;
  showIcon?: boolean;
  className?: string;
}

export function VerificationBadge({ tier, showIcon = true, className }: VerificationBadgeProps) {
  const configs: Record<BadgeTier, { label: string; bg: string; text: string; border: string; icon: typeof Shield }> = {
    gold: {
      label: 'GOLD VERIFIED',
      bg: 'bg-yellow-500/20',
      text: 'text-yellow-500',
      border: 'border-yellow-500/30',
      icon: Shield,
    },
    silver: {
      label: 'SILVER VERIFIED',
      bg: 'bg-gray-400/20',
      text: 'text-gray-400',
      border: 'border-gray-400/30',
      icon: Shield,
    },
    bronze: {
      label: 'BRONZE VERIFIED',
      bg: 'bg-orange-600/20',
      text: 'text-orange-600',
      border: 'border-orange-600/30',
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
