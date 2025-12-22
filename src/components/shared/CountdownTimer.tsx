import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface CountdownTimerProps {
  expiresAt: string;
  urgentThreshold?: number; // minutes
  className?: string;
}

export function CountdownTimer({ expiresAt, urgentThreshold = 60, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) return null;
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  if (!timeLeft) {
    return <span className="text-destructive text-sm font-medium">Expired</span>;
  }

  const isUrgent = timeLeft.hours * 60 + timeLeft.minutes <= urgentThreshold;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-mono font-medium",
        isUrgent ? "text-destructive" : "text-muted-foreground",
        className
      )}
    >
      {timeLeft.hours}h {timeLeft.minutes}m
      {isUrgent && <AlertCircle className="h-3.5 w-3.5 animate-pulse" />}
    </span>
  );
}
