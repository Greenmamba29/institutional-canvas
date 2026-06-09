import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useCurrency } from '@/hooks/useCurrency';

interface ChartDataPoint {
  date: string;
  value: number;
}

interface GMVChartProps {
  data: ChartDataPoint[];
  title?: string;
  subtitle?: string;
  /** Real total GMV across the period in canonical USD. */
  totalGMV?: number;
}

export function GMVChart({ data, title = "Daily GMV & Fees", subtitle = "30-DAY AGGREGATED REVENUE STREAM", totalGMV }: GMVChartProps) {
  const { format } = useCurrency();
  return (
    <div className="glass-panel rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-[10px] text-muted-foreground tracking-wider">{subtitle}</p>
        </div>
        <select className="text-xs bg-secondary/50 border border-border/50 rounded-md px-2 py-1 text-muted-foreground">
          <option>Last 30 Days</option>
          <option>Last 7 Days</option>
          <option>Last 90 Days</option>
        </select>
      </div>
      
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gmvGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              hide 
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number) => [format(value), 'GMV']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              fill="url(#gmvGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
        {typeof totalGMV === 'number' && (
          <div>
            <p className="text-[10px] text-muted-foreground tracking-wider">TOTAL GMV</p>
            <p className="text-lg font-bold font-mono">{format(totalGMV)}</p>
          </div>
        )}
        <button className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors ml-auto">
          Performance →
        </button>
      </div>
    </div>
  );
}
