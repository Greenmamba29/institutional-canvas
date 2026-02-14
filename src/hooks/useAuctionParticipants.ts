/**
 * Auction Participants React Query Hooks
 *
 * Provides hooks for listing/upserting auction companies and contacts.
 * Write operations use authenticated Supabase client for RLS enforcement.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthenticatedClient } from '@/hooks/useAuthenticatedClient';
import {
  listAuctionCompanies,
  upsertAuctionCompany,
  listAuctionContacts,
} from '@/services/auction-participants.service';
import { toast } from 'sonner';

export const participantKeys = {
  companies: (filters?: Record<string, string>) => ['auction-companies', filters] as const,
  contacts: (filters?: Record<string, string>) => ['auction-contacts', filters] as const,
};

/**
 * List auction companies with optional filters
 */
export function useAuctionCompanies(options?: { company_type?: string; auction_role?: string; country?: string }) {
  return useQuery({
    queryKey: participantKeys.companies(options as Record<string, string>),
    queryFn: async () => {
      const { data, error } = await listAuctionCompanies(options);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/**
 * Create or update an auction company (authenticated)
 */
export function useUpsertAuctionCompany() {
  const queryClient = useQueryClient();
  const { getClient } = useAuthenticatedClient();

  return useMutation({
    mutationFn: async (params: Parameters<typeof upsertAuctionCompany>[1]) => {
      const client = await getClient();
      const { data, error } = await upsertAuctionCompany(client, params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auction-companies'] });
      toast.success('Auction company saved');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save company');
    },
  });
}

/**
 * List auction contacts with optional filters
 */
export function useAuctionContacts(options?: { company_id?: string; lead_status?: string }) {
  return useQuery({
    queryKey: participantKeys.contacts(options as Record<string, string>),
    queryFn: async () => {
      const { data, error } = await listAuctionContacts(options);
      if (error) throw error;
      return data ?? [];
    },
  });
}
