// Supabase Client - Base client for auth operations
// For authenticated RPC calls, use createAuthenticatedClient from @/lib/supabase/authenticated-client
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Hardcoded values - VITE_* env vars are not supported in Lovable
const SUPABASE_URL = 'https://vuekwckknfjivjighhfd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZWt3Y2trbmZqaXZqaWdoaGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTczNTcsImV4cCI6MjA2Nzk5MzM1N30.9NqjmpF9qqaTALfP2VAAii13vjZTI9IKOf_CSRT9lbo';

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce', // Use PKCE flow (redirect-based, no popups) for secure authentication
    detectSessionInUrl: true, // Detect session in URL hash (for redirect flows)
  }
});