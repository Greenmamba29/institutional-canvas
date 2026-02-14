import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function SuppliersPanel() {
  const { data: suppliers, isLoading, error } = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('org_id, display_name, verification_tier, claim_status')
        .order('display_name', { ascending: true })
        .limit(100);
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
    return <p className="text-destructive">Failed to load suppliers: {(error as Error).message}</p>;
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Claim Status</TableHead>
            <TableHead>Verification</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers?.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No suppliers found</TableCell>
            </TableRow>
          )}
          {suppliers?.map((s) => (
            <TableRow key={s.org_id}>
              <TableCell className="font-medium">{s.display_name || '—'}</TableCell>
              <TableCell>
                <Badge variant={s.claim_status === 'claimed' ? 'default' : 'outline'} className="capitalize">
                  {s.claim_status || 'unclaimed'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">{s.verification_tier || 'none'}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
