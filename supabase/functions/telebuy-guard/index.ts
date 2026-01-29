import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GuardResult {
  ok: boolean;
  code?: string;
  message?: string;
  orgId?: string;
  profile?: string;
  userId?: string;
}

/**
 * TeleBuy Guard Edge Function
 * Enforces 7 checks before any TeleBuy action:
 * 1. Authentication required
 * 2. Kill switch check
 * 3. Super admin blocked from acting
 * 4. Onboarding profile required
 * 5. Org membership verified
 * 6. Capability check
 * 7. Profile type restriction
 */
async function requireTelebuyAccess(
  supabase: SupabaseClient,
  orgId: string
): Promise<GuardResult> {
  // 1. Must be authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      code: "AUTH_REQUIRED",
      message: "Authentication required.",
    };
  }

  // 2. Kill switch - check system_read_only feature flag
  const { data: ffData, error: ffErr } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("key", "system_read_only")
    .maybeSingle();

  if (ffErr) {
    console.error("Feature flag check error:", ffErr);
    return {
      ok: false,
      code: "FLAG_READ_ERROR",
      message: "Unable to read system flags.",
    };
  }

  const ff = ffData as { enabled: boolean } | null;
  if (ff?.enabled) {
    return {
      ok: false,
      code: "READ_ONLY",
      message: "System is in read-only mode.",
    };
  }

  // 3. Disallow super admins from acting as users
  const { data: isSuperAdmin, error: saErr } = await supabase.rpc(
    "is_super_admin"
  );

  if (saErr) {
    console.error("Super admin check error:", saErr);
    return {
      ok: false,
      code: "ADMIN_CHECK_ERROR",
      message: "Unable to verify admin status.",
    };
  }

  if (isSuperAdmin) {
    return {
      ok: false,
      code: "ADMIN_BLOCKED",
      message: "Admins cannot initiate TeleBuy sessions.",
    };
  }

  // 4. Must have onboarding profile
  const { data: profile, error: profErr } = await supabase.rpc(
    "get_user_profile"
  );

  if (profErr) {
    console.error("Profile check error:", profErr);
    return {
      ok: false,
      code: "PROFILE_CHECK_ERROR",
      message: "Unable to verify profile.",
    };
  }

  if (!profile) {
    return {
      ok: false,
      code: "PROFILE_REQUIRED",
      message: "Onboarding profile required. Please complete onboarding first.",
    };
  }

  // 5. Must be org member - query org_members directly since is_org_member might not exist
  const { data: memberData, error: memberErr } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberErr) {
    console.error("Org membership check error:", memberErr);
    return {
      ok: false,
      code: "ORG_CHECK_ERROR",
      message: "Unable to verify organization membership.",
    };
  }

  if (!memberData) {
    return {
      ok: false,
      code: "NOT_ORG_MEMBER",
      message: "You are not a member of this organization.",
    };
  }

  // 6. Capability check - use_telebuy via profile_capabilities
  const { data: capData, error: capErr } = await supabase
    .from("profile_capabilities")
    .select("capability_key")
    .eq("profile", profile)
    .eq("capability_key", "use_telebuy")
    .maybeSingle();

  if (capErr) {
    console.error("Capability check error:", capErr);
    return {
      ok: false,
      code: "CAPABILITY_CHECK_ERROR",
      message: "Unable to verify TeleBuy access.",
    };
  }

  if (!capData) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "TeleBuy access not allowed for this user profile.",
    };
  }

  // 7. Profile type restriction - only buyers and suppliers can use TeleBuy
  if (!["buyer", "supplier", "soe"].includes(profile)) {
    return {
      ok: false,
      code: "PROFILE_NOT_ALLOWED",
      message: "TeleBuy is only available to buyers, suppliers, and SOEs.",
    };
  }

  return {
    ok: true,
    orgId,
    profile,
    userId: user.id,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: "AUTH_REQUIRED",
          message: "Missing authorization header.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const body = await req.json();
    const { org_id, action } = body;

    if (!org_id) {
      return new Response(
        JSON.stringify({
          ok: false,
          code: "MISSING_ORG_ID",
          message: "Organization ID is required.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Run the 7-check guard
    const guardResult = await requireTelebuyAccess(supabase, org_id);

    if (!guardResult.ok) {
      console.log(`TeleBuy guard blocked: ${guardResult.code} for action: ${action}`);
      return new Response(JSON.stringify(guardResult), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log successful access check to domain_events
    await supabase.from("domain_events").insert({
      org_id,
      actor_user_id: guardResult.userId,
      entity_type: "telebuy",
      event_type: "access_granted",
      payload: {
        action,
        profile: guardResult.profile,
      },
    });

    console.log(`TeleBuy access granted for user ${guardResult.userId}, profile: ${guardResult.profile}`);

    return new Response(
      JSON.stringify({
        ok: true,
        orgId: guardResult.orgId,
        profile: guardResult.profile,
        userId: guardResult.userId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("TeleBuy guard error:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
