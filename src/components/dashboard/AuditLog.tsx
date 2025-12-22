import { CheckCircle, XCircle, Flag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AuditLogEntry {
  id: string;
  type: 'approved' | 'cancelled' | 'flagged' | 'withdrawal';
  title: string;
  description: string;
  timestamp: string;
  action: string;
}

interface AuditLogProps {
  entries: AuditLogEntry[];
}

const typeConfig = {
  approved: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/20' },
  cancelled: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/20' },
  flagged: { icon: Flag, color: 'text-warning', bg: 'bg-warning/20' },
  withdrawal: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/20' },
};

export function AuditLog({ entries }: AuditLogProps) {
  return (
    <div className="glass-panel rounded-xl p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold tracking-wider">AUDIT LOG</h3>
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-secondary rounded text-muted-foreground">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button className="p-1 hover:bg-secondary rounded text-muted-foreground">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map((entry) => {
          const config = typeConfig[entry.type];
          const Icon = config.icon;

          return (
            <div key={entry.id} className="p-3 rounded-lg bg-secondary/30 border border-border/30 space-y-2">
              <div className="flex items-start gap-2">
                <div className={`p-1 rounded ${config.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium truncate">{entry.title}</p>
                    <span className="text-[10px] text-muted-foreground shrink-0">{entry.timestamp}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{entry.description}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full text-[10px] h-7">
                {entry.action}
              </Button>
            </div>
          );
        })}
      </div>

      <button className="w-full mt-4 flex items-center justify-center gap-1 text-xs font-semibold text-accent hover:text-accent/80 transition-colors">
        VIEW FULL CHAIN OF CUSTODY
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}
