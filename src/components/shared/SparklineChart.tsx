import { cn } from '@/lib/utils';

interface SparklineChartProps {
  data: number[];
  color?: 'primary' | 'success' | 'accent';
  height?: number;
  className?: string;
}

export function SparklineChart({ data, color = 'primary', height = 32, className }: SparklineChartProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const colorClass = {
    primary: 'stroke-primary',
    success: 'stroke-success',
    accent: 'stroke-accent',
  }[color];

  const gradientId = `sparkline-gradient-${color}`;

  return (
    <svg 
      viewBox={`0 0 100 ${height}`} 
      preserveAspectRatio="none"
      className={cn("w-full", className)}
      style={{ height }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`hsl(var(--${color}))`} stopOpacity="0.3" />
          <stop offset="100%" stopColor={`hsl(var(--${color}))`} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} 100,${height}`}
        fill={`url(#${gradientId})`}
      />
      <polyline
        points={points}
        fill="none"
        className={cn(colorClass, "stroke-[1.5]")}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
