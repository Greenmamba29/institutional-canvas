import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PriceTickerProps {
  commodity: string;
  price: number;
  change: number;
  changePercent: number;
  currency?: string;
  unit?: string;
  className?: string;
}

export function PriceTicker({
  commodity,
  price,
  change,
  changePercent,
  currency = 'USD',
  unit = 'MT',
  className
}: PriceTickerProps) {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  const TrendIcon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div className={cn(
      "glass-panel rounded-lg p-4 flex items-center justify-between group hover:border-primary/30 transition-colors",
      className
    )}>
      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground line-clamp-1">
          {commodity}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold font-mono tabular-nums">
            ${price.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">/{unit}</span>
        </div>
      </div>
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg",
        isNeutral && "bg-muted text-muted-foreground",
        isPositive && "bg-success/10 text-success",
        !isPositive && !isNeutral && "bg-destructive/10 text-destructive"
      )}>
        <TrendIcon className="h-4 w-4" />
        <span className="font-mono tabular-nums text-sm font-medium">
          {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}
