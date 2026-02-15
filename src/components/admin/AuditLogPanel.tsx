import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export function AuditLogPanel() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['admin', 'audit-log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('domain_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events?.map((evt) => (
            <TableRow key={evt.id}>
              <TableCell>
                <Badge variant="outline">{evt.event_type}</Badge>
              </TableCell>
              <TableCell className="text-sm">
                <span className="text-muted-foreground">{evt.entity_type}</span>
                {evt.entity_id && <span className="ml-1 font-mono text-xs">{evt.entity_id.slice(0, 8)}</span>}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {evt.actor_user_id?.slice(0, 8) || '—'}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(evt.created_at), 'MMM d, HH:mm:ss')}
              </TableCell>
            </TableRow>
          ))}
          {(!events || events.length === 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No events found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
