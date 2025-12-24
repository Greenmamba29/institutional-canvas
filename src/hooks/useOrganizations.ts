/**
 * Organization Hooks
 * 
 * React Query hooks for organization management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { createAuthenticatedClient } from '@/lib/supabase/authenticated-client';
import {
  getMyOrganizations,
  createOrganization,
  inviteOrgMember,
  claimOrgMembership,
  getOrgMembers,
  CreateOrganizationParams,
  InviteOrgMemberParams,
  ClaimMembershipParams,
} from '@/services/organizations.service';

/**
 * Fetch all organizations the current user belongs to
 */
export function useMyOrganizations() {
  const { getAccessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['my-organizations'],
    queryFn: async () => {
      const token = await getAccessToken();
      const client = createAuthenticatedClient(token);
      const { data, error } = await getMyOrganizations(client);
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Create a new organization
 */
export function useCreateOrganization() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateOrganizationParams) => {
      const token = await getAccessToken();
      const client = createAuthenticatedClient(token);
      const { data, error } = await createOrganization(client, params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
    },
  });
}

/**
 * Invite a member to an organization
 */
export function useInviteOrgMember() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: InviteOrgMemberParams) => {
      const token = await getAccessToken();
      const client = createAuthenticatedClient(token);
      const { data, error } = await inviteOrgMember(client, params);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['org-members', variables.orgId] });
    },
  });
}

/**
 * Claim membership in an organization
 */
export function useClaimMembership() {
  const { getAccessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: ClaimMembershipParams) => {
      const token = await getAccessToken();
      const client = createAuthenticatedClient(token);
      const { data, error } = await claimOrgMembership(client, params);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-organizations'] });
    },
  });
}

/**
 * Fetch members of an organization
 */
export function useOrgMembers(orgId: string | undefined) {
  const { getAccessToken, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['org-members', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const token = await getAccessToken();
      const client = createAuthenticatedClient(token);
      const { data, error } = await getOrgMembers(client, orgId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAuthenticated && !!orgId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
