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
    const { userId, style = 'professional' } = await req.json();

    console.log(`[generate-telebuy-avatar] Generating avatar for user: ${userId}, style: ${style}`);

    // Build prompt based on style
    let prompt = '';
    switch (style) {
      case 'professional':
        prompt = 'Professional business person headshot, wearing modern business attire, neutral office background, high quality portrait photo, corporate style, clean studio lighting, confident expression, 4K quality';
        break;
      case 'casual':
        prompt = 'Friendly professional person headshot, smart casual attire, modern workspace background, natural lighting, approachable expression, high quality portrait';
        break;
      case 'executive':
        prompt = 'Senior executive portrait, formal business attire, premium office setting, professional studio lighting, authoritative yet approachable expression, corporate headshot style';
        break;
      default:
        prompt = 'Professional business person portrait, modern corporate style, clean background, high quality headshot';
    }

    // Call Lovable AI Gateway with image generation model
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!aiResponse.ok) {
      const error = await aiResponse.text();
      console.error(`[generate-telebuy-avatar] AI Gateway error: ${error}`);
      throw new Error(`AI Gateway error: ${error}`);
    }

    const aiData = await aiResponse.json();
    
    // Extract image from response
    const message = aiData.choices?.[0]?.message;
    let imageData = null;
    let imageUrl = null;

    if (message?.content) {
      // Check if content is an array with image parts
      if (Array.isArray(message.content)) {
        const imagePart = message.content.find((part: any) => 
          part.type === 'image_url' || part.type === 'image'
        );
        if (imagePart) {
          imageData = imagePart.image_url?.url || imagePart.data;
        }
      } else if (typeof message.content === 'string' && message.content.startsWith('data:image')) {
        imageData = message.content;
      }
    }

    // If we got image data, upload to Supabase Storage
    if (imageData) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false }
      });

      // Extract base64 data if it's a data URL
      const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (base64Match) {
        const [, mimeType, base64Data] = base64Match;
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        const fileName = `avatars/${userId || crypto.randomUUID()}_${Date.now()}.${mimeType}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('telebuy-assets')
          .upload(fileName, binaryData, {
            contentType: `image/${mimeType}`,
            upsert: true
          });

        if (uploadError) {
          console.error('[generate-telebuy-avatar] Upload error:', uploadError);
        } else {
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('telebuy-assets')
            .getPublicUrl(fileName);
          imageUrl = publicUrl;
        }
      }
    }

    console.log(`[generate-telebuy-avatar] Successfully generated avatar`);

    return new Response(
      JSON.stringify({
        success: true,
        imageUrl: imageUrl,
        style
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate-telebuy-avatar] Error:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
