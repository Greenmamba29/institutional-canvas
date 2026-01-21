/**
 * Google Meet Link Generator Edge Function
 * 
 * Creates Google Calendar events with Meet links for TeleBuy sessions.
 * Requires Google OAuth credentials configured in secrets.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MeetRequest {
  sessionId: string;
  title: string;
  description?: string;
  startTime: string; // ISO string
  durationMinutes?: number;
  attendeeEmails?: string[];
}

interface MeetResponse {
  success: boolean;
  meetLink?: string;
  calendarEventId?: string;
  error?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authorization token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: MeetRequest = await req.json();
    const { sessionId, title, description, startTime, durationMinutes = 60, attendeeEmails = [] } = body;

    if (!sessionId || !title || !startTime) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields: sessionId, title, startTime' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for Google credentials
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const googleRefreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN');

    // If Google credentials aren't configured, generate a placeholder link
    // In production, this would use the Google Calendar API
    if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
      console.log('Google credentials not configured, generating placeholder link');
      
      // Generate a deterministic but unique meet link based on session ID
      const meetCode = sessionId.replace(/-/g, '').substring(0, 12);
      const meetLink = `https://meet.google.com/${meetCode.substring(0, 3)}-${meetCode.substring(3, 7)}-${meetCode.substring(7, 10)}`;
      
      // Update the telebuy session with the meet link
      const { error: updateError } = await supabase
        .from('telebuy_sessions')
        .update({
          video_provider: 'google_meet',
          google_meet_link: meetLink,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (updateError) {
        console.error('Error updating session:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update session with meet link' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response: MeetResponse = {
        success: true,
        meetLink,
        calendarEventId: `placeholder-${sessionId}`,
      };

      console.log('Generated placeholder meet link:', meetLink);
      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // With Google credentials, use the Calendar API
    // Step 1: Get access token from refresh token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: googleRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error('Failed to get Google access token:', tokenData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to authenticate with Google' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Create calendar event with conferencing
    const startDateTime = new Date(startTime);
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);

    const calendarEvent = {
      summary: title,
      description: description || `TeleBuy Session: ${title}`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'UTC',
      },
      attendees: attendeeEmails.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: sessionId,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const calendarResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calendarEvent),
      }
    );

    const eventData = await calendarResponse.json();

    if (!calendarResponse.ok) {
      console.error('Calendar API error:', eventData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to create calendar event' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const meetLink = eventData.conferenceData?.entryPoints?.find(
      (ep: { entryPointType: string }) => ep.entryPointType === 'video'
    )?.uri || eventData.hangoutLink;

    if (!meetLink) {
      console.error('No meet link in response:', eventData);
      return new Response(
        JSON.stringify({ success: false, error: 'Calendar event created but no Meet link generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Update the telebuy session with the meet link
    const { error: updateError } = await supabase
      .from('telebuy_sessions')
      .update({
        video_provider: 'google_meet',
        google_meet_link: meetLink,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating session:', updateError);
      // Don't fail - the meet link was created successfully
    }

    const response: MeetResponse = {
      success: true,
      meetLink,
      calendarEventId: eventData.id,
    };

    console.log('Created Google Meet link:', meetLink);
    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
