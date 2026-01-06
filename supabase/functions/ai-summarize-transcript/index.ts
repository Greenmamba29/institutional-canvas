import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, transcriptText } = await req.json();

    if (!sessionId || !transcriptText) {
      return new Response(
        JSON.stringify({ error: 'sessionId and transcriptText are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ai-summarize-transcript] Processing session: ${sessionId}`);

    // Call Lovable AI Gateway for summarization
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a business meeting analyst for LithiumBuy, a B2B lithium marketplace. 
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
}`
          },
          {
            role: 'user',
            content: `Analyze this TeleBuy session transcript:\n\n${transcriptText}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const error = await aiResponse.text();
      console.error(`[ai-summarize-transcript] AI Gateway error: ${error}`);
      throw new Error(`AI Gateway error: ${error}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices?.[0]?.message?.content;

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

    // Get auth header for RPC call
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

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
    }

    console.log(`[ai-summarize-transcript] Successfully processed session: ${sessionId}`);

    return new Response(
      JSON.stringify({
        success: true,
        sessionId,
        analysis,
        transcriptId: transcript?.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ai-summarize-transcript] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
