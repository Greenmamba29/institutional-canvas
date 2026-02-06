import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SkillInvocationPayload {
  skill_name: string;
  skill_version: string;
  org_id: string | null;
  user_id: string | null;
  input_hash: string;
  success: boolean;
  error_code?: string;
  error_message?: string;
  duration_ms: number;
  tool_calls: Array<{
    tool: string;
    success: boolean;
    duration_ms: number;
    error?: string;
  }>;
  context_snapshot: {
    profile: string;
    subscription_tier: string;
    is_super_admin: boolean;
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
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with service role for insert permission
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const payload: SkillInvocationPayload = await req.json();

    // Validate required fields
    if (!payload.skill_name || typeof payload.success !== "boolean") {
      return new Response(
        JSON.stringify({ error: "Missing required fields: skill_name, success" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert skill invocation record
    const { data, error } = await supabase
      .from("skill_invocations")
      .insert({
        skill_name: payload.skill_name,
        skill_version: payload.skill_version || "1.0.0",
        org_id: payload.org_id || null,
        user_id: payload.user_id || null,
        input_hash: payload.input_hash || null,
        success: payload.success,
        error_code: payload.error_code || null,
        error_message: payload.error_message || null,
        duration_ms: payload.duration_ms || null,
        tool_calls: payload.tool_calls || [],
        context_snapshot: payload.context_snapshot || null,
      })
      .select("invocation_id")
      .single();

    if (error) {
      console.error("Failed to log skill invocation:", error);
      return new Response(
        JSON.stringify({ error: "Failed to log invocation", details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      `[SkillAudit] Logged: ${payload.skill_name} ${payload.success ? "✓" : "✗"} ${payload.duration_ms}ms`
    );

    return new Response(
      JSON.stringify({
        ok: true,
        invocation_id: data.invocation_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Log skill invocation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
