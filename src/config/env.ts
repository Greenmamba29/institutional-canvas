/**
 * Environment Configuration
 * 
 * IMPORTANT: In Lovable, VITE_* environment variables are NOT supported.
 * Supabase credentials are hardcoded from the connected project.
 * This module provides a safe config accessor that never throws.
 */

// Hardcoded Supabase credentials (from connected project)
const SUPABASE_URL = 'https://vuekwckknfjivjighhfd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZWt3Y2trbmZqaXZqaWdoaGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTczNTcsImV4cCI6MjA2Nzk5MzM1N30.9NqjmpF9qqaTALfP2VAAii13vjZTI9IKOf_CSRT9lbo';

interface EnvConfig {
  // Required - always available
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  
  // Feature flags
  features: {
    elevenlabs: boolean;
    knowledgeBase: boolean;
  };
  
  // Optional IDs (safe for frontend)
  ELEVENLABS_AGENT_ID?: string;
  ELEVENLABS_BUYER_AGENT_ID?: string;
  ELEVENLABS_SUPPLIER_AGENT_ID?: string;
  ELEVENLABS_CONCIERGE_AGENT_ID?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate environment (non-throwing, for health checks)
 */
export function validateEnv(): ValidationResult {
  const warnings: string[] = [];
  
  // Check for optional features
  const hasElevenLabs = Boolean(
    import.meta.env.VITE_ELEVENLABS_AGENT_ID ||
    import.meta.env.VITE_ELEVENLABS_CONCIERGE_AGENT_ID
  );
  
  if (!hasElevenLabs) {
    warnings.push('ElevenLabs not configured - AI voice features will be disabled');
  }
  
  // Always valid since Supabase is hardcoded
  return {
    valid: true,
    errors: [],
    warnings,
  };
}

/**
 * Get environment configuration (never throws)
 */
export function getEnvConfig(): EnvConfig {
  return {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    
    features: {
      elevenlabs: Boolean(
        import.meta.env.VITE_ELEVENLABS_AGENT_ID ||
        import.meta.env.VITE_ELEVENLABS_CONCIERGE_AGENT_ID
      ),
      knowledgeBase: false, // Disabled until DB table exists
    },
    
    ELEVENLABS_AGENT_ID: import.meta.env.VITE_ELEVENLABS_AGENT_ID,
    ELEVENLABS_BUYER_AGENT_ID: import.meta.env.VITE_ELEVENLABS_BUYER_AGENT_ID,
    ELEVENLABS_SUPPLIER_AGENT_ID: import.meta.env.VITE_ELEVENLABS_SUPPLIER_AGENT_ID,
    ELEVENLABS_CONCIERGE_AGENT_ID: import.meta.env.VITE_ELEVENLABS_CONCIERGE_AGENT_ID,
  };
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof EnvConfig['features']): boolean {
  const config = getEnvConfig();
  return config.features[feature];
}

/**
 * Get environment status for health checks
 */
export function getEnvStatus(): { status: 'ok' | 'error' | 'warning'; details: ValidationResult } {
  const validation = validateEnv();
  
  if (validation.warnings.length > 0) {
    return { status: 'warning', details: validation };
  }
  
  return { status: 'ok', details: validation };
}

// Cached config singleton
let _cachedConfig: EnvConfig | null = null;

/**
 * Get environment config (cached, never throws)
 */
export function env(): EnvConfig {
  if (!_cachedConfig) {
    _cachedConfig = getEnvConfig();
  }
  return _cachedConfig;
}
