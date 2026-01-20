/**
 * Daily.co Room Management Edge Function
 * 
 * Securely manages Daily.co rooms for TeleBuy video sessions.
 * Keeps API key server-side and validates user authentication.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');
const DAILY_DOMAIN = Deno.env.get('DAILY_DOMAIN') || 'lithiumbuy.daily.co';

interface RoomConfig {
  name?: string;
  privacy?: 'public' | 'private';
  properties?: {
    start_video_off?: boolean;
    start_audio_off?: boolean;
    enable_recording?: string;
    max_participants?: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key is configured
    if (!DAILY_API_KEY) {
      console.error('DAILY_API_KEY not configured in Supabase secrets');
      return new Response(
        JSON.stringify({ error: 'Daily.co integration not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { action, roomName, config } = await req.json() as {
      action: 'create' | 'delete' | 'get';
      roomName?: string;
      config?: RoomConfig;
    };

    // Handle create room action
    if (action === 'create') {
      const name = config?.name || `lithiumbuy-${Date.now()}`;
      
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          privacy: config?.privacy || 'private',
          properties: {
            start_video_off: false,
            start_audio_off: false,
            max_participants: 10,
            ...config?.properties,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Daily.co API error:', errorData);
        return new Response(
          JSON.stringify({ error: `Daily.co API error: ${errorData.error || response.statusText}` }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      
      // Log room creation for audit
      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'daily_room_created',
        entity_type: 'daily_room',
        entity_id: data.name,
        outcome: 'success',
        metadata: { room_url: data.url },
      });

      return new Response(
        JSON.stringify({ url: data.url, name: data.name }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle delete room action
    if (action === 'delete') {
      if (!roomName) {
        return new Response(
          JSON.stringify({ error: 'roomName is required for delete action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${DAILY_API_KEY}` },
      });

      if (!response.ok && response.status !== 404) {
        return new Response(
          JSON.stringify({ error: `Failed to delete room: ${response.statusText}` }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log room deletion for audit
      await supabase.from('audit_log').insert({
        user_id: user.id,
        action: 'daily_room_deleted',
        entity_type: 'daily_room',
        entity_id: roomName,
        outcome: 'success',
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle get room info action
    if (action === 'get') {
      if (!roomName) {
        return new Response(
          JSON.stringify({ error: 'roomName is required for get action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
        headers: { 'Authorization': `Bearer ${DAILY_API_KEY}` },
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: `Failed to get room info: ${response.statusText}` }),
          { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({ data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: create, delete, or get' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
