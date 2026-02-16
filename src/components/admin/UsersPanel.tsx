import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';

export function UsersPanel() {
  const { isSuperAdmin } = useIsSuperAdmin();

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, tier, created_at, org_id')
        .order('created_at', { ascending: false })
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
    return <p className="text-destructive">Failed to load users: {(error as Error).message}</p>;
  }

  // Defense-in-depth: hide sensitive columns if somehow rendered outside super admin context
  const showSensitive = isSuperAdmin;

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            {showSensitive && <TableHead>Email</TableHead>}
            <TableHead>Tier</TableHead>
            {showSensitive && <TableHead>Org ID</TableHead>}
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.length === 0 && (
            <TableRow>
              <TableCell colSpan={showSensitive ? 5 : 3} className="text-center text-muted-foreground py-8">No users found</TableCell>
            </TableRow>
          )}
          {users?.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
              {showSensitive && <TableCell className="text-muted-foreground">{u.email || '—'}</TableCell>}
              <TableCell>
                <Badge variant="outline" className="capitalize">{u.tier || 'free'}</Badge>
              </TableCell>
              {showSensitive && (
                <TableCell className="text-muted-foreground text-xs font-mono">
                  {u.org_id ? u.org_id.slice(0, 8) + '…' : '—'}
                </TableCell>
              )}
              <TableCell className="text-muted-foreground text-sm">
                {u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
