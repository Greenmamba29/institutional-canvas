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

const FEATURE_KEY = 'rfq_document_processing';

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
    const { documentId, documentText, documentType, orgId } = await req.json();

    if (!documentId || !documentText) {
      return new Response(
        JSON.stringify({ error: 'documentId and documentText are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ai-process-rfq-document] Processing document: ${documentId}, type: ${documentType}`);

    // =====================================================
    // AI GATING CHECK - Check feature flag before processing
    // =====================================================
    const { data: flagData, error: flagError } = await supabase.rpc('check_ai_feature_flag', {
      p_feature_key: FEATURE_KEY,
      p_org_id: orgId || null
    });

    if (flagError) {
      console.error('[ai-process-rfq-document] Flag check error:', flagError);
    }

    const flag = flagData?.[0];
    const isEnabled = flag?.is_enabled ?? false;
    isShadow = flag?.is_shadow ?? false;

    if (!isEnabled && !isShadow) {
      console.log(`[ai-process-rfq-document] Feature ${FEATURE_KEY} is disabled`);
      return new Response(
        JSON.stringify({ error: 'AI document processing is currently disabled', gated: true }),
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
      p_metadata: { document_id: documentId, document_type: documentType }
    });

    if (runError) {
      console.error('[ai-process-rfq-document] Start run error:', runError);
      throw new Error(`Failed to start AI run: ${runError.message}`);
    }

    runId = runData?.[0]?.run_id;
    console.log(`[ai-process-rfq-document] Started AI run: ${runId}, shadow: ${isShadow}`);

    // Build prompt based on document type
    let systemPrompt = `You are a document analyst for LithiumBuy, a B2B lithium marketplace.
Analyze the uploaded document and extract structured data.`;

    let extractionFields = '';
    switch (documentType) {
      case 'specification':
        extractionFields = `
- Product specifications (purity levels, grades, chemical composition)
- Packaging requirements
- Quality certifications required
- Testing standards mentioned`;
        break;
      case 'certificate':
        extractionFields = `
- Certificate type (ISO, IATF, environmental, etc.)
- Issuing authority
- Valid dates (issue and expiry)
- Scope/coverage
- Certificate number`;
        break;
      case 'pricing':
        extractionFields = `
- Price per unit (with currency)
- Volume tiers and discounts
- Payment terms
- Validity period
- Incoterms mentioned`;
        break;
      case 'contract':
        extractionFields = `
- Contract parties
- Key terms and conditions
- Delivery obligations
- Payment terms
- Warranty clauses
- Termination conditions`;
        break;
      default:
        extractionFields = `
- Document type detected
- Key information
- Dates mentioned
- Parties involved
- Important terms`;
    }

    systemPrompt += `\n\nExtract the following information:\n${extractionFields}

Format your response as JSON:
{
  "document_type": "detected type",
  "summary": "2-3 sentence summary",
  "extracted_data": {
    // structured extracted fields
  },
  "key_dates": [{"label": "string", "date": "YYYY-MM-DD or null"}],
  "entities_mentioned": ["company names, people, etc"],
  "action_required": "any action items or follow-ups needed",
  "confidence_score": 0.0-1.0
}`;

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this document:\n\n${documentText}` }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const error = await aiResponse.text();
      console.error(`[ai-process-rfq-document] AI Gateway error: ${error}`);
      throw new Error(`AI Gateway error: ${error}`);
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices?.[0]?.message?.content;

    // Parse JSON response
    let analysis;
    try {
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/) || 
                        analysisText.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : analysisText;
      analysis = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.warn('[ai-process-rfq-document] Could not parse AI response as JSON');
      analysis = {
        document_type: documentType || 'unknown',
        summary: analysisText,
        extracted_data: {},
        key_dates: [],
        entities_mentioned: [],
        action_required: null,
        confidence_score: 0.5
      };
    }

    // =====================================================
    // SHADOW MODE CHECK - Only save if NOT in shadow mode
    // =====================================================
    if (!isShadow) {
      const { error: updateError } = await supabase
        .from('rfq_documents')
        .update({
          ai_summary: analysis.summary,
          ai_extracted_data: analysis,
          ai_processed_at: new Date().toISOString(),
          processing_status: 'completed'
        })
        .eq('id', documentId);

      if (updateError) {
        console.error('[ai-process-rfq-document] Update error:', updateError);
      }
    } else {
      console.log('[ai-process-rfq-document] SHADOW MODE: Analysis completed but NOT saved to database');
    }

    // =====================================================
    // COMPLETE AI RUN - Update ledger
    // =====================================================
    if (runId) {
      await supabase.rpc('complete_ai_run', {
        p_run_id: runId,
        p_output_location: isShadow ? 'shadow_run_not_stored' : `rfq_documents/${documentId}`,
        p_success: true
      });
    }

    console.log(`[ai-process-rfq-document] Successfully processed document: ${documentId}, shadow: ${isShadow}`);

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        analysis,
        shadow: isShadow,
        runId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ai-process-rfq-document] Error:', error);

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
