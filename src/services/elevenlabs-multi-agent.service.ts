/**
 * ElevenLabs Multi-Agent Service
 * Manages multiple conversational AI agents for TeleBuy (buyer, supplier, neutral)
 * with multi-language support
 * 
 * SECURITY: API keys are NEVER used client-side. All ElevenLabs API calls
 * must go through Supabase Edge Functions.
 * 
 * This service uses environment variables for AGENT IDs only (safe for frontend).
 * The actual ELEVENLABS_API_KEY must be stored in Supabase Edge Function secrets.
 */

import { isFeatureEnabled } from '@/config/env';

// Agent IDs only - safe for frontend (not API keys!)
const ELEVENLABS_BUYER_AGENT_ID = import.meta.env.VITE_ELEVENLABS_BUYER_AGENT_ID;
const ELEVENLABS_SUPPLIER_AGENT_ID = import.meta.env.VITE_ELEVENLABS_SUPPLIER_AGENT_ID;
const ELEVENLABS_CONCIERGE_AGENT_ID = import.meta.env.VITE_ELEVENLABS_CONCIERGE_AGENT_ID;

export type AgentRole = 'buyer' | 'supplier' | 'neutral';
export type AgentLanguage = 'en' | 'es' | 'pt' | 'zh' | 'zh-TW' | 'ja' | 'ko' | 'de' | 'fr' | 'it' | 'ru' | 'af';
export type AgentSessionStatus = 'initializing' | 'active' | 'paused' | 'ended' | 'error';

export interface MultiAgentConfig {
  agent_name: string;
  agent_role: AgentRole;
  primary_language: AgentLanguage;
  supported_languages?: AgentLanguage[];
  prompt_template: string;
  voice_id: string;
  model_id?: string;
  stability?: number;
  similarity_boost?: number;
  optimize_streaming_latency?: number;
  enable_language_detection?: boolean;
  enable_knowledge_base?: boolean;
  knowledge_base_categories?: string[];
}

export interface AgentSession {
  id?: string;
  telebuy_session_id: string;
  agent_role: AgentRole;
  agent_id: string;
  language: AgentLanguage;
  user_id?: string;
  org_id?: string;
  status?: AgentSessionStatus;
  elevenlabs_conversation_id?: string;
  context?: Record<string, unknown>;
  state?: Record<string, unknown>;
}

export interface AgentMessage {
  agent_session_id: string;
  message_type: 'user_speech' | 'agent_response' | 'system_event';
  speaker_role: 'user' | 'agent' | 'system';
  content: string;
  language?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  intent?: string;
  entities?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Check if multi-agent system is configured
 * Only checks for agent IDs (not API keys - those are server-side only)
 */
export function isMultiAgentConfigured(): boolean {
  // Check feature flag first
  if (!isFeatureEnabled('elevenlabs')) {
    return false;
  }
  
  return Boolean(ELEVENLABS_BUYER_AGENT_ID || ELEVENLABS_SUPPLIER_AGENT_ID || ELEVENLABS_CONCIERGE_AGENT_ID);
}

/**
 * Get agent configuration by role and language
 * Returns agent ID from environment variables
 */
export async function getAgentConfig(
  role: AgentRole,
  _language: AgentLanguage = 'en'
): Promise<{ data: { elevenlabs_agent_id: string } | null; error: Error | null }> {
  if (!isMultiAgentConfigured()) {
    return { data: null, error: new Error('ElevenLabs is not configured. Enable it in your environment.') };
  }
  
  try {
    let agentId: string | undefined;
    
    switch (role) {
      case 'buyer':
        agentId = ELEVENLABS_BUYER_AGENT_ID || ELEVENLABS_CONCIERGE_AGENT_ID;
        break;
      case 'supplier':
        agentId = ELEVENLABS_SUPPLIER_AGENT_ID || ELEVENLABS_CONCIERGE_AGENT_ID;
        break;
      case 'neutral':
        agentId = ELEVENLABS_CONCIERGE_AGENT_ID;
        break;
    }
    
    if (!agentId) {
      return { data: null, error: new Error(`No agent configured for role: ${role}`) };
    }
    
    return { 
      data: { elevenlabs_agent_id: agentId }, 
      error: null 
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Create a new agent session (mock implementation)
 * TODO: Implement via Supabase Edge Function when tables are created
 */
export async function createAgentSession(session: AgentSession): Promise<{ data: AgentSession | null; error: Error | null }> {
  if (!isMultiAgentConfigured()) {
    return { data: null, error: new Error('ElevenLabs is not configured') };
  }
  
  try {
    // Generate a mock session ID
    const mockSession: AgentSession = {
      ...session,
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: session.status || 'initializing',
    };
    
    console.log('[ElevenLabs] Created agent session (mock):', mockSession.id);
    return { data: mockSession, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Start an agent session (mock implementation)
 */
export async function startAgentSession(
  sessionId: string,
  elevenlabsConversationId: string
): Promise<{ data: { id: string; status: string } | null; error: Error | null }> {
  try {
    console.log(`[ElevenLabs] Started agent session (mock): ${sessionId} with conversation: ${elevenlabsConversationId}`);
    return { 
      data: { id: sessionId, status: 'active' }, 
      error: null 
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * End an agent session (mock implementation)
 */
export async function endAgentSession(sessionId: string): Promise<{ data: { id: string; status: string } | null; error: Error | null }> {
  try {
    console.log(`[ElevenLabs] Ended agent session (mock): ${sessionId}`);
    return { 
      data: { id: sessionId, status: 'ended' }, 
      error: null 
    };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Log an agent message (mock implementation)
 */
export async function logAgentMessage(message: AgentMessage): Promise<{ data: AgentMessage | null; error: Error | null }> {
  try {
    console.log('[ElevenLabs] Logged agent message (mock):', message.content.substring(0, 50) + '...');
    return { data: message, error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Get conversation history for an agent session (mock implementation)
 */
export async function getConversationHistory(
  agentSessionId: string,
  _limit: number = 50
): Promise<{ data: AgentMessage[] | null; error: Error | null }> {
  try {
    console.log(`[ElevenLabs] Getting conversation history for session (mock): ${agentSessionId}`);
    return { data: [], error: null };
  } catch (error) {
    return { data: null, error: error as Error };
  }
}

/**
 * Generate buyer agent configuration
 */
export function getBuyerAgentConfig(language: AgentLanguage = 'en'): Partial<MultiAgentConfig> {
  const prompts: Record<AgentLanguage, string> = {
    en: `You are Sterling, the Executive Concierge for LithiumBuy buyers. Your role is to:

1. **Assist buyers** in finding the right lithium products and suppliers
2. **Negotiate favorable terms** on behalf of the buyer
3. **Provide market intelligence** and pricing guidance
4. **Facilitate procurement** through TeleBuy™ platform
5. **Ensure buyer interests** are protected throughout the transaction

Professional and assertive, data-driven recommendations.`,
    es: `Eres Sterling, el Conserje Ejecutivo para compradores de LithiumBuy. Enfoque profesional y centrado en el ROI.`,
    pt: `Você é Sterling, o Concierge Executivo para compradores da LithiumBuy. Abordagem profissional e focada em ROI.`,
    zh: `您是Sterling，LithiumBuy买家的行政礼宾。专业、果断、以数据为导向的方法。`,
    'zh-TW': `您是Sterling，LithiumBuy買家的行政禮賓。專業、果斷、以數據為導向的方法。`,
    ja: `あなたはSterling、LithiumBuyのバイヤー向けエグゼクティブコンシェルジュです。プロフェッショナルで積極的、データ駆動型のアプローチ。`,
    ko: `당신은 Sterling, LithiumBuy 구매자를 위한 이그제큐티브 컨시어지입니다. 전문적이고 적극적이며 데이터 중심적인 접근 방식.`,
    de: `Sie sind Sterling, der Executive Concierge für LithiumBuy-Käufer. Professioneller, durchsetzungsfähiger, datengetriebener Ansatz.`,
    fr: `Vous êtes Sterling, le Concierge Exécutif pour les acheteurs LithiumBuy. Approche professionnelle, affirmée et axée sur les données.`,
    it: `Sei Sterling, il Concierge Esecutivo per gli acquirenti LithiumBuy. Approccio professionale, assertivo e basato sui dati.`,
    ru: `Вы Sterling, исполнительный консьерж для покупателей LithiumBuy. Профессиональный, напористый, основанный на данных подход.`,
    af: `Jy is Sterling, die Uitvoerende Portier vir LithiumBuy kopers. Professionele, selfversekerde, data-gedrewe benadering.`,
  };

  return {
    agent_name: `Sterling Buyer Agent (${language.toUpperCase()})`,
    agent_role: 'buyer',
    primary_language: language,
    prompt_template: prompts[language],
    voice_id: 'pqHfZKP75CvOlQylNhV4',
    knowledge_base_categories: ['pricing', 'market_intelligence', 'compliance'],
  };
}

/**
 * Generate supplier agent configuration
 */
export function getSupplierAgentConfig(language: AgentLanguage = 'en'): Partial<MultiAgentConfig> {
  const prompts: Record<AgentLanguage, string> = {
    en: `You are Maxwell, the Executive Concierge for LithiumBuy suppliers. Your role is to:

1. **Assist suppliers** in showcasing their products and capabilities
2. **Facilitate negotiations** that benefit the supplier
3. **Highlight unique value propositions** (quality, ESG, certifications)
4. **Guide pricing strategy** based on market conditions
5. **Protect supplier interests** while building buyer relationships

Professional and consultative, value-based selling approach.`,
    es: `Eres Maxwell, el Conserje Ejecutivo para proveedores de LithiumBuy. Enfoque profesional, consultivo y basado en valor.`,
    pt: `Você é Maxwell, o Concierge Executivo para fornecedores da LithiumBuy. Abordagem profissional, consultiva e baseada em valor.`,
    zh: `您是Maxwell，LithiumBuy供应商的行政礼宾。专业、咨询性、基于价值的方法。`,
    'zh-TW': `您是Maxwell，LithiumBuy供應商的行政禮賓。專業、諮詢性、基於價值的方法。`,
    ja: `あなたはMaxwell、LithiumBuyのサプライヤー向けエグゼクティブコンシェルジュです。プロフェッショナルでコンサルティング的、価値ベースのアプローチ。`,
    ko: `당신은 Maxwell, LithiumBuy 공급업체를 위한 이그제큐티브 컨시어지입니다. 전문적이고 컨설팅적이며 가치 기반 접근 방식.`,
    de: `Sie sind Maxwell, der Executive Concierge für LithiumBuy-Lieferanten. Professioneller, beratender, wertorientierter Ansatz.`,
    fr: `Vous êtes Maxwell, le Concierge Exécutif pour les fournisseurs LithiumBuy. Approche professionnelle, consultative et axée sur la valeur.`,
    it: `Sei Maxwell, il Concierge Esecutivo per i fornitori LithiumBuy. Approccio professionale, consulenziale e basato sul valore.`,
    ru: `Вы Maxwell, исполнительный консьерж для поставщиков LithiumBuy. Профессиональный, консультативный, ценностно-ориентированный подход.`,
    af: `Jy is Maxwell, die Uitvoerende Portier vir LithiumBuy verskaffers. Professionele, raadgewende, waarde-gebaseerde benadering.`,
  };

  return {
    agent_name: `Maxwell Supplier Agent (${language.toUpperCase()})`,
    agent_role: 'supplier',
    primary_language: language,
    prompt_template: prompts[language],
    voice_id: 'pqHfZKP75CvOlQylNhV4',
    knowledge_base_categories: ['pricing', 'market_intelligence', 'products'],
  };
}
