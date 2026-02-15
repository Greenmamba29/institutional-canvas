/**
 * Hook to check if the current user is a super admin
 * Queries the super_admins table directly (RLS enforced)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export function useIsSuperAdmin() {
  const { user } = useAuth();

  const { data: isSuperAdmin = false, isLoading } = useQuery({
    queryKey: ['super-admin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) {
        console.error('[useIsSuperAdmin]', error.message);
        return false;
      }
      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  return { isSuperAdmin, isLoading };
}
