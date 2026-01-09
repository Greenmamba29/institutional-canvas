/**
 * Environment Configuration & Validation
 * 
 * This module provides runtime validation of required environment variables
 * and feature flags for optional services.
 */

// Required environment variables
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

// Optional feature flags
const OPTIONAL_ENV_VARS = [
  'VITE_ELEVENLABS_AGENT_ID',
  'VITE_ELEVENLABS_BUYER_AGENT_ID',
  'VITE_ELEVENLABS_SUPPLIER_AGENT_ID',
  'VITE_ELEVENLABS_CONCIERGE_AGENT_ID',
] as const;

interface EnvConfig {
  // Required
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
 * Validate all required environment variables are present
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required vars
  for (const varName of REQUIRED_ENV_VARS) {
    const value = import.meta.env[varName];
    if (!value || value === 'undefined' || value === '') {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }
  
  // Check Supabase URL format
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.includes('supabase.co')) {
    warnings.push('VITE_SUPABASE_URL does not appear to be a valid Supabase URL');
  }
  
  // Check for legacy env var name
  if (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY && !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    warnings.push('VITE_SUPABASE_PUBLISHABLE_KEY is deprecated. Use VITE_SUPABASE_ANON_KEY instead.');
  }
  
  // Warn about missing optional features
  if (!import.meta.env.VITE_ELEVENLABS_AGENT_ID) {
    warnings.push('ElevenLabs not configured - AI voice features will be disabled');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get validated environment configuration
 * Throws if required variables are missing
 */
export function getEnvConfig(): EnvConfig {
  const validation = validateEnv();
  
  if (!validation.valid) {
    console.error('❌ Environment validation failed:');
    validation.errors.forEach(err => console.error(`  - ${err}`));
    throw new Error(`Environment validation failed: ${validation.errors.join(', ')}`);
  }
  
  // Log warnings
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Environment warnings:');
    validation.warnings.forEach(warn => console.warn(`  - ${warn}`));
  }
  
  // Support both legacy and new env var names during migration
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  return {
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: anonKey,
    
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
  try {
    const config = getEnvConfig();
    return config.features[feature];
  } catch {
    return false;
  }
}

/**
 * Get environment status for health checks
 */
export function getEnvStatus(): { status: 'ok' | 'error' | 'warning'; details: ValidationResult } {
  const validation = validateEnv();
  
  if (!validation.valid) {
    return { status: 'error', details: validation };
  }
  
  if (validation.warnings.length > 0) {
    return { status: 'warning', details: validation };
  }
  
  return { status: 'ok', details: validation };
}

// Export singleton config for convenience
let _cachedConfig: EnvConfig | null = null;

export function env(): EnvConfig {
  if (!_cachedConfig) {
    _cachedConfig = getEnvConfig();
  }
  return _cachedConfig;
}
