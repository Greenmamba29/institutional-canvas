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
  orgType: 'buyer' | 'supplier' | 'admin' | 'soe';
  email?: string;
  phone?: string;
  // SOE-specific fields (required when orgType === 'soe')
  governmentId?: string;
  jurisdiction?: string;
  soeCategory?: string;
  parentMinistry?: string;
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
  // Use correct parameter order from SQL function signature
  const rpcParams = {
    p_org_type: params.orgType,
    p_name: params.name,
    p_email: params.email || null,
    p_phone: params.phone || null,
    // SOE-specific fields
    p_government_id: params.governmentId || null,
    p_jurisdiction: params.jurisdiction || null,
    p_soe_category: params.soeCategory || null,
    p_parent_ministry: params.parentMinistry || null,
  };

  const result = await callAuthenticatedRpc<Organization>(client, 'create_organization', rpcParams);

  if (result.error) {
    // Log only non-sensitive error info
    console.error('[Organization Service] Create organization failed:', result.error.message);
  }

  return result;
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
 * NOTE: Uses direct query until RPC is created in backend
 */
export async function claimOrgMembership(
  client: SupabaseClient<Database>,
  params: ClaimMembershipParams
): Promise<{ data: OrgMember | null; error: Error | null }> {
  // Use direct query until RPC is available
  const { data, error } = await client
    .from('org_members')
    .select('*')
    .eq('org_id', params.orgId)
    .single();
  
  return { data, error: error ? new Error(error.message) : null };
}

/**
 * Get all members of an organization
 * NOTE: Uses direct query until RPC is created in backend
 */
export async function getOrgMembers(
  client: SupabaseClient<Database>,
  orgId: string
): Promise<{ data: OrgMember[] | null; error: Error | null }> {
  // Use direct query until RPC is available
  const { data, error } = await client
    .from('org_members')
    .select('*')
    .eq('org_id', orgId);
  
  return { data, error: error ? new Error(error.message) : null };
}
