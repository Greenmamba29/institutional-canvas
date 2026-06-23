/**
 * SpendBreakdownChart — donut (category) + area (monthly trend) side-by-side.
 */

import { useSpendAnalytics } from '@/hooks/useSpendAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export function SpendBreakdownChart() {
  const { monthlySpend, spendByCategory, isLoading } = useSpendAnalytics();

  // Last 6 months of data
  const recentMonths = monthlySpend.slice(-6);

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const hasCategory = spendByCategory.length > 0;
  const hasMonthly = recentMonths.length > 0;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left: Donut by category */}
      <div>
        <p className="text-sm font-semibold text-muted-foreground mb-3">Spend by Category</p>
        {hasCategory ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={spendByCategory}
                dataKey="spend_usd"
                nameKey="category"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {spendByCategory.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spend']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
            No spend data yet
          </div>
        )}
      </div>

      {/* Right: Area chart — monthly trend */}
      <div>
        <p className="text-sm font-semibold text-muted-foreground mb-3">Monthly Spend Trend</p>
        {hasMonthly ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={recentMonths} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spend']}
              />
              <Area
                type="monotone"
                dataKey="spend_usd"
                name="Spend"
                stroke="#6366f1"
                fill="url(#spendGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground">
            No monthly data yet
          </div>
        )}
      </div>
    </div>
  );
}
