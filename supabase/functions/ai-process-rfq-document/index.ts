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
    const { documentId, documentText, documentType } = await req.json();

    if (!documentId || !documentText) {
      return new Response(
        JSON.stringify({ error: 'documentId and documentText are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ai-process-rfq-document] Processing document: ${documentId}, type: ${documentType}`);

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

    // Update document in database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });

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

    console.log(`[ai-process-rfq-document] Successfully processed document: ${documentId}`);

    return new Response(
      JSON.stringify({
        success: true,
        documentId,
        analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ai-process-rfq-document] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
