/**
 * SubscriptionStatusBar
 *
 * A slim status ribbon rendered INSIDE the app chrome (LayoutShell), in normal
 * flow directly above the sticky header — so it complements the dashboard
 * instead of overlaying the header. Shows the active free-trial countdown or a
 * payment grace-period warning. Renders nothing for fully-paid users.
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export function SubscriptionStatusBar() {
  const { data: sub } = useSubscription();
  const { user } = useAuth();

  // Only probe grace-period state for past-due subscriptions (rare); avoids
  // extra RPCs for trial / healthy users.
  const { data: grace } = useQuery({
    queryKey: ['grace-status', user?.id],
    enabled: !!user && sub?.status === 'past_due',
    staleTime: 2 * 60 * 1000,
    queryFn: async () => {
      const [{ data: inGrace }, { data: days }] = await Promise.all([
        supabase.rpc('is_in_grace_period'),
        supabase.rpc('grace_period_days_remaining'),
      ]);
      return { inGrace: !!inGrace, days: (days as number) ?? 0 };
    },
  });

  const fmtDays = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

  if (grace?.inGrace) {
    return (
      <StatusRibbon
        tone="warning"
        icon={<AlertTriangle className="h-4 w-4 shrink-0" />}
        message={
          <>
            Payment issue — your access ends in{' '}
            <span className="font-semibold">{fmtDays(grace.days)}</span>. Update billing to stay active.
          </>
        }
        ctaLabel="Update billing"
        ctaTo="/settings/billing"
      />
    );
  }

  if (sub?.isTrialActive) {
    return (
      <StatusRibbon
        tone="trial"
        icon={<Sparkles className="h-4 w-4 shrink-0" />}
        message={
          <>
            <span className="font-semibold">Free trial</span> — {fmtDays(sub.trialDaysLeft)} left
            <span className="hidden sm:inline text-muted-foreground"> · full access to every feature</span>
          </>
        }
        ctaLabel="Upgrade"
        ctaTo="/settings/billing"
      />
    );
  }

  return null;
}

function StatusRibbon({
  tone,
  icon,
  message,
  ctaLabel,
  ctaTo,
}: {
  tone: 'trial' | 'warning';
  icon: React.ReactNode;
  message: React.ReactNode;
  ctaLabel: string;
  ctaTo: string;
}) {
  return (
    <div
      className={cn(
        'flex-shrink-0 flex items-center justify-center gap-3 px-4 py-2 text-sm border-b backdrop-blur-sm',
        tone === 'trial'
          ? 'bg-gradient-to-r from-primary/15 via-accent/10 to-primary/15 border-primary/20 text-foreground'
          : 'bg-gradient-to-r from-destructive/15 via-destructive/10 to-destructive/15 border-destructive/20 text-foreground'
      )}
    >
      <span className={cn('flex items-center', tone === 'trial' ? 'text-primary' : 'text-destructive')}>
        {icon}
      </span>
      <p className="truncate">{message}</p>
      <Link
        to={ctaTo}
        className={cn(
          'group inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors shrink-0',
          tone === 'trial'
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
        )}
      >
        {ctaLabel}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
