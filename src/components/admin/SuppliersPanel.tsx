import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export function SuppliersPanel() {
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['admin', 'suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
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
            <TableHead>Company</TableHead>
            <TableHead>Verification</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers?.map((s) => (
            <TableRow key={s.org_id}>
              <TableCell className="font-medium">{s.display_name || '—'}</TableCell>
              <TableCell>
                <Badge variant={s.verification_tier ? 'default' : 'secondary'} className="capitalize">
                  {s.verification_tier || 'unverified'}
                </Badge>
              </TableCell>
              <TableCell>—</TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {s.claim_status || 'unclaimed'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {(!suppliers || suppliers.length === 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No suppliers found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
