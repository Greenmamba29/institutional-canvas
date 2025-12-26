/**
 * Organization Service
 * 
 * Wraps all organization-related RPC calls.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
import { callAuthenticatedRpc } from '@/lib/supabase/authenticated-client';

type Organization = Database['public']['Tables']['organizations']['Row'];
type OrgMember = Database['public']['Tables']['org_members']['Row'];

export interface CreateOrganizationParams {
  name: string;
  orgType: 'buyer' | 'supplier' | 'admin' | 'partner';
  email?: string;
  phone?: string;
}

export interface InviteOrgMemberParams {
  orgId: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

export interface ClaimMembershipParams {
  orgId: string;
  inviteToken?: string;
}

/**
 * Get all organizations the current user belongs to
 */
export async function getMyOrganizations(
  client: SupabaseClient<Database>
): Promise<{ data: Organization[] | null; error: Error | null }> {
  return callAuthenticatedRpc<Organization[]>(client, 'get_my_organizations');
}

/**
 * Create a new organization
 */
export async function createOrganization(
  client: SupabaseClient<Database>,
  params: CreateOrganizationParams
): Promise<{ data: Organization | null; error: Error | null }> {
  return callAuthenticatedRpc<Organization>(client, 'create_organization', {
    p_org_type: params.orgType,
    p_name: params.name,
    p_email: params.email,
    p_phone: params.phone,
  });
}

/**
 * Invite a new member to an organization
 */
export async function inviteOrgMember(
  client: SupabaseClient<Database>,
  params: InviteOrgMemberParams
): Promise<{ data: OrgMember | null; error: Error | null }> {
  return callAuthenticatedRpc<OrgMember>(client, 'invite_org_member', {
    p_org_id: params.orgId,
    p_user_email: params.email,
    p_role: params.role,
  });
}

/**
 * Claim membership in an organization
 */
export async function claimOrgMembership(
  client: SupabaseClient<Database>,
  params: ClaimMembershipParams
): Promise<{ data: OrgMember | null; error: Error | null }> {
  return callAuthenticatedRpc<OrgMember>(client, 'claim_org_membership', {
    p_org_id: params.orgId,
    p_invite_token: params.inviteToken,
  });
}

/**
 * Get all members of an organization
 */
export async function getOrgMembers(
  client: SupabaseClient<Database>,
  orgId: string
): Promise<{ data: OrgMember[] | null; error: Error | null }> {
  return callAuthenticatedRpc<OrgMember[]>(client, 'get_org_members', {
    p_org_id: orgId,
  });
}
