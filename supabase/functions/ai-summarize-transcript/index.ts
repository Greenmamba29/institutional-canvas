import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const FEATURE_KEY = 'transcript_summarization';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  let runId: string | null = null;
  let isShadow = false;

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const authClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { sessionId, transcriptText, orgId } = await req.json();

    if (!sessionId || !transcriptText) {
      return new Response(
        JSON.stringify({ error: 'sessionId and transcriptText are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ai-summarize-transcript] Processing session: ${sessionId}`);

    // =====================================================
    // AI GATING CHECK - Check feature flag before processing
    // =====================================================
    const { data: flagData, error: flagError } = await supabase.rpc('check_ai_feature_flag', {
      p_feature_key: FEATURE_KEY,
      p_org_id: orgId || null
    });

    if (flagError) {
      console.error('[ai-summarize-transcript] Flag check error:', flagError);
    }

    const flag = flagData?.[0];
    const isEnabled = flag?.is_enabled ?? false;
    isShadow = flag?.is_shadow ?? false;

    if (!isEnabled && !isShadow) {
      console.log(`[ai-summarize-transcript] Feature ${FEATURE_KEY} is disabled`);
      return new Response(
        JSON.stringify({ error: 'AI transcript summarization is currently disabled', gated: true }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =====================================================
    // START AI RUN - Create ledger entry
    // =====================================================
    const { data: runData, error: runError } = await supabase.rpc('start_ai_run', {
      p_feature_key: FEATURE_KEY,
      p_trigger_source: 'system',
      p_org_id: orgId || null,
      p_metadata: { session_id: sessionId }
    });

    if (runError) {
      console.error('[ai-summarize-transcript] Start run error:', runError);
      throw new Error(`Failed to start AI run: ${runError.message}`);
    }

    runId = runData?.[0]?.run_id;
    console.log(`[ai-summarize-transcript] Started AI run: ${runId}, shadow: ${isShadow}`);

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY secret is not set');
    }

    // Call Anthropic API for summarization
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You are a business meeting analyst for LithiumBuy, a B2B lithium marketplace.
Analyze TeleBuy video call transcripts and extract:
1. A concise summary (2-3 sentences)
2. Key discussion points (bullet list)
3. Action items with responsible parties
4. Any pricing or quantity negotiations mentioned
5. Next steps agreed upon

Format your response as JSON:
{
  "summary": "string",
  "key_points": ["point1", "point2"],
  "action_items": [{"item": "string", "owner": "string", "deadline": "string or null"}],
  "pricing_discussed": {"mentioned": boolean, "details": "string or null"},
  "next_steps": ["step1", "step2"]
}`,
        messages: [
          {
            role: 'user',
            content: `Analyze this TeleBuy session transcript:\n\n${transcriptText}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const error = await aiResponse.text();
      console.error(`[ai-summarize-transcript] Anthropic API error: ${error}`);
      throw new Error(`Anthropic API error: ${error}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.content?.[0]?.text;

    // Parse the JSON response
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/) || 
                        analysisText.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : analysisText;
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.warn('[ai-summarize-transcript] Could not parse AI response as JSON, using raw text');
      analysis = {
        summary: analysisText,
        key_points: [],
        action_items: [],
        pricing_discussed: { mentioned: false, details: null },
        next_steps: []
      };
    }

    // =====================================================
    // SHADOW MODE CHECK - Only save if NOT in shadow mode
    // =====================================================
    let transcriptId = null;
    if (!isShadow) {
      // Save to database using RPC
      const { data: transcript, error: saveError } = await supabase.rpc('save_telebuy_transcript', {
        p_session_id: sessionId,
        p_transcript_text: transcriptText,
        p_ai_summary: analysis.summary,
        p_ai_action_items: analysis.action_items,
        p_ai_key_points: analysis.key_points,
        p_duration_seconds: null,
        p_speaker_segments: []
      });

      if (saveError) {
        console.error('[ai-summarize-transcript] Save error:', saveError);
        // Don't fail completely, still return the analysis
      } else {
        transcriptId = transcript?.id;
      }
    } else {
      console.log('[ai-summarize-transcript] SHADOW MODE: Analysis completed but NOT saved to database');
    }

    // =====================================================
    // COMPLETE AI RUN - Update ledger
    // =====================================================
    if (runId) {
      await supabase.rpc('complete_ai_run', {
        p_run_id: runId,
        p_output_location: isShadow ? 'shadow_run_not_stored' : `telebuy_transcripts/${transcriptId || sessionId}`,
        p_success: true
      });
    }

    console.log(`[ai-summarize-transcript] Successfully processed session: ${sessionId}, shadow: ${isShadow}`);

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        analysis,
        transcriptId,
        shadow: isShadow,
        runId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ai-summarize-transcript] Error:', error);

    // Complete AI run with failure
    if (runId) {
      await supabase.rpc('complete_ai_run', {
        p_run_id: runId,
        p_success: false,
        p_error_message: errorMessage
      });
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
