// Supabase Client - Base client for auth operations
// For authenticated RPC calls, use createAuthenticatedClient from @/lib/supabase/authenticated-client
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { env } from '@/config/env';

// Use env() helper for secure credential management
const { SUPABASE_URL, SUPABASE_ANON_KEY } = env();

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