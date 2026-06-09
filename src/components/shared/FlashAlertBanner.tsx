import { useCallback, useEffect, useState } from 'react';
import { useFlashAlerts, useDismissAlert } from '@/hooks/useFlashAlerts';
import { X, AlertTriangle, Info, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_CONFIG = {
  info:        { icon: Info,          bg: 'bg-blue-500/10 border-blue-500/20',    text: 'text-blue-700 dark:text-blue-300' },
  warning:     { icon: AlertTriangle, bg: 'bg-amber-500/10 border-amber-500/20',  text: 'text-amber-700 dark:text-amber-300' },
  critical:    { icon: AlertTriangle, bg: 'bg-destructive/10 border-destructive/20', text: 'text-destructive' },
  opportunity: { icon: TrendingUp,    bg: 'bg-green-500/10 border-green-500/20',  text: 'text-green-700 dark:text-green-300' },
};

// localStorage key holding the ids of alerts the user has dismissed. Persisting
// these means a dismissed alert stays dismissed across navigations / reloads,
// instead of reappearing on every route change.
const DISMISSED_KEY = 'lb:dismissedAlerts';

function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function FlashAlertBanner() {
  const { data: alerts, isLocked } = useFlashAlerts();
  const { mutate: dismiss } = useDismissAlert();
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => readDismissed());

  // Keep in sync across tabs/windows.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === DISMISSED_KEY) setDismissedIds(readDismissed());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleDismiss = useCallback(
    (id: string) => {
      setDismissedIds((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        try {
          localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
        } catch {
          /* ignore quota / unavailable storage */
        }
        return next;
      });
      // Also persist server-side so it stays dismissed for this user everywhere.
      dismiss(id);
    },
    [dismiss]
  );

  const visibleAlerts = alerts?.filter((a) => !dismissedIds.includes(a.id));

  if (isLocked || !visibleAlerts?.length) return null;

  return (
    <div className="space-y-1">
      {visibleAlerts.map((alert) => {
        const config = TYPE_CONFIG[alert.type] || TYPE_CONFIG.info;
        const Icon = config.icon;
        return (
          <div
            key={alert.id}
            className={cn('border-b px-4 py-2 flex items-center justify-between gap-4', config.bg)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon className={cn('h-4 w-4 shrink-0', config.text)} />
              <div className="min-w-0">
                <span className={cn('text-sm font-semibold', config.text)}>{alert.title}</span>
                {alert.message && (
                  <span className="text-sm text-muted-foreground ml-2">{alert.message}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleDismiss(alert.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
