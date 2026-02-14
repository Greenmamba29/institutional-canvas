import { cn } from '@/lib/utils';
import { Shield, CheckCircle, BadgeCheck } from 'lucide-react';

export type BadgeTier = 'gold' | 'silver' | 'bronze' | 'standard' | 'basic' | 'kyc' | 'lithiumbuy';

interface VerificationBadgeProps {
  tier: BadgeTier;
  showIcon?: boolean;
  className?: string;
}

export function VerificationBadge({ tier, showIcon = true, className }: VerificationBadgeProps) {
  const configs: Record<BadgeTier, { label: string; bg: string; text: string; border: string; icon: typeof Shield }> = {
    gold: {
      label: 'GOLD VERIFIED',
      bg: 'bg-[#FFB800]/20',
      text: 'text-[#FFB800]',
      border: 'border-[#FFB800]/30',
      icon: Shield,
    },
    silver: {
      label: 'SILVER VERIFIED',
      bg: 'bg-[#C0C0C0]/20',
      text: 'text-[#C0C0C0]',
      border: 'border-[#C0C0C0]/30',
      icon: Shield,
    },
    bronze: {
      label: 'BRONZE VERIFIED',
      bg: 'bg-[#CD7F32]/20',
      text: 'text-[#CD7F32]',
      border: 'border-[#CD7F32]/30',
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
    lithiumbuy: {
      label: 'LB STANDARD',
      bg: 'bg-[#1E40AF]/20',
      text: 'text-[#3B82F6]',
      border: 'border-[#3B82F6]/40',
      icon: BadgeCheck,
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
