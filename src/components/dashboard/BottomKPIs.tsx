import { FileText, CheckCircle, Lock, AlertTriangle, LucideIcon } from 'lucide-react';

interface BottomKPI {
  label: string;
  value: string | number;
  icon: LucideIcon;
}

interface BottomKPIsProps {
  kpis?: BottomKPI[];
}

const defaultKPIs: BottomKPI[] = [
  { label: 'ACTIVE RFQs', value: 263, icon: FileText },
  { label: 'SETTLED ORDERS', value: 526, icon: CheckCircle },
  { label: 'ESCROW HOLDINGS', value: '$1.8B', icon: Lock },
  { label: 'MARKET ALERTS', value: 12, icon: AlertTriangle },
];

export function BottomKPIs({ kpis = defaultKPIs }: BottomKPIsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="glass-panel rounded-lg p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <kpi.icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground tracking-wider">{kpi.label}</p>
            <p className="text-xl font-bold font-mono">{kpi.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
