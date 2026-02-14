import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export function AuditLogPanel() {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['admin-audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domain_events')
        .select('id, created_at, actor_user_id, entity_type, event_type, payload')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive">Failed to load audit log: {(error as Error).message}</p>;
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Payload</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events?.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No events found</TableCell>
            </TableRow>
          )}
          {events?.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {e.created_at ? format(new Date(e.created_at), 'MMM d, HH:mm:ss') : '—'}
              </TableCell>
              <TableCell className="font-mono text-xs truncate max-w-[120px]">
                {e.actor_user_id ? e.actor_user_id.slice(0, 8) + '…' : 'system'}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">{e.entity_type}</Badge>
              </TableCell>
              <TableCell className="text-sm">{e.event_type}</TableCell>
              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                {e.payload ? JSON.stringify(e.payload).slice(0, 80) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
