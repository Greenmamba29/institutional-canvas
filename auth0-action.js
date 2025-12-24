/**
 * Auth0 Action: Inject org_id Claim for Lithium Buy Multi-Tenancy
 * 
 * INSTRUCTIONS:
 * 1. Go to Auth0 Dashboard > Actions > Library
 * 2. Create a new Action: "Add org_id Claim"
 * 3. Copy/paste this code
 * 4. Deploy
 * 5. Go to Actions > Flows > Login
 * 6. Add "Add org_id Claim" action to the flow
 * 
 * IMPORTANT: 
 * - This assumes org_id is stored in user.app_metadata.org_id
 * - You can set org_id via Auth0 Management API when user creates/joins org
 * - Alternative: Manage org membership purely in Supabase (simpler for MVP)
 */

/**
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  // Option 1: Get org_id from user metadata (if set via Management API)
  const orgId = event.user.app_metadata?.org_id;
  
  if (orgId) {
    // Add to ID token (for frontend)
    api.idToken.setCustomClaim('org_id', orgId);
    
    // Add to Access token (for API calls to Supabase)
    api.accessToken.setCustomClaim('org_id', orgId);
  }
  
  // Option 2: If you don't use Auth0 metadata, you can skip this action
  // and rely purely on Supabase's org_members table + current_sub() helper
  // This is SIMPLER for MVP - just ensure JWT has 'sub' claim (default)
};

/**
 * MVP RECOMMENDATION:
 * 
 * For simplicity, DON'T use this action initially. Instead:
 * 
 * 1. Rely on Auth0's default 'sub' claim (user ID)
 * 2. Use Supabase's org_members table to map sub → org_id
 * 3. Use current_sub() helper in RLS policies
 * 4. OrganizationContext in frontend fetches user's orgs via get_my_organizations()
 * 
 * This approach is cleaner and doesn't require Auth0 Management API calls.
 * You can add the org_id claim optimization later if needed for performance.
 */
