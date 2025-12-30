/**
 * ElevenLabs Multi-Agent Service
 * Manages multiple conversational AI agents for TeleBuy (buyer, supplier, neutral)
 * with multi-language support and conversation persistence
 */

import { supabase } from '@/lib/supabase/rpc';
import { searchKnowledgeBase } from './knowledge-base.service';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

export type AgentRole = 'buyer' | 'supplier' | 'neutral';
export type AgentLanguage = 'en' | 'es' | 'pt' | 'zh' | 'ja' | 'ko' | 'de' | 'fr' | 'it';
export type AgentSessionStatus = 'initializing' | 'active' | 'paused' | 'ended' | 'error';

export interface AgentConfig {
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
  context?: Record<string, any>;
  state?: Record<string, any>;
}

export interface AgentMessage {
  agent_session_id: string;
  message_type: 'user_speech' | 'agent_response' | 'system_event';
  speaker_role: 'user' | 'agent' | 'system';
  content: string;
  language?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  intent?: string;
  entities?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Get agent configuration by role and language
 */
export async function getAgentConfig(
  role: AgentRole,
  language: AgentLanguage = 'en'
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase.rpc('get_agent_config', {
    p_role: role,
    p_language: language,
  });

  return { data: data?.[0] || null, error };
}

/**
 * Create or update agent configuration
 */
export async function saveAgentConfig(config: AgentConfig): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('elevenlabs_agent_configs')
    .upsert({
      agent_name: config.agent_name,
      agent_role: config.agent_role,
      elevenlabs_agent_id: '', // Will be populated after creating in ElevenLabs
      primary_language: config.primary_language,
      supported_languages: config.supported_languages || [config.primary_language],
      prompt_template: config.prompt_template,
      voice_id: config.voice_id,
      model_id: config.model_id || 'eleven_turbo_v2_5',
      stability: config.stability || 0.75,
      similarity_boost: config.similarity_boost || 0.85,
      optimize_streaming_latency: config.optimize_streaming_latency || 3,
      enable_language_detection: config.enable_language_detection ?? true,
      enable_knowledge_base: config.enable_knowledge_base ?? true,
      knowledge_base_categories: config.knowledge_base_categories,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Create a new agent session
 */
export async function createAgentSession(session: AgentSession): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('telebuy_agent_sessions')
    .insert({
      telebuy_session_id: session.telebuy_session_id,
      agent_role: session.agent_role,
      agent_id: session.agent_id,
      language: session.language,
      user_id: session.user_id,
      org_id: session.org_id,
      status: session.status || 'initializing',
      context: session.context || {},
      state: session.state || {},
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Update agent session
 */
export async function updateAgentSession(
  sessionId: string,
  updates: Partial<AgentSession>
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('telebuy_agent_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  return { data, error };
}

/**
 * Start an agent session
 */
export async function startAgentSession(
  sessionId: string,
  elevenlabsConversationId: string
): Promise<{ data: any; error: any }> {
  return updateAgentSession(sessionId, {
    status: 'active',
    elevenlabs_conversation_id: elevenlabsConversationId,
  } as any);
}

/**
 * End an agent session
 */
export async function endAgentSession(sessionId: string): Promise<{ data: any; error: any }> {
  return updateAgentSession(sessionId, {
    status: 'ended',
  } as any);
}

/**
 * Get agent sessions for a TeleBuy session
 */
export async function getAgentSessions(
  telebuySessionId: string
): Promise<{ data: any[] | null; error: any }> {
  const { data, error } = await supabase
    .from('telebuy_agent_sessions')
    .select('*')
    .eq('telebuy_session_id', telebuySessionId)
    .order('created_at', { ascending: false });

  return { data, error };
}

/**
 * Log an agent message
 */
export async function logAgentMessage(message: AgentMessage): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('telebuy_agent_messages')
    .insert({
      agent_session_id: message.agent_session_id,
      message_type: message.message_type,
      speaker_role: message.speaker_role,
      content: message.content,
      language: message.language,
      sentiment: message.sentiment,
      intent: message.intent,
      entities: message.entities,
      metadata: message.metadata || {},
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Get conversation history for an agent session
 */
export async function getConversationHistory(
  agentSessionId: string,
  limit: number = 50
): Promise<{ data: any[] | null; error: any }> {
  const { data, error } = await supabase
    .from('telebuy_agent_messages')
    .select('*')
    .eq('agent_session_id', agentSessionId)
    .order('timestamp', { ascending: true })
    .limit(limit);

  return { data, error };
}

/**
 * Enhance agent prompt with knowledge base context
 */
export async function enhancePromptWithKnowledge(
  basePrompt: string,
  query: string,
  categories?: string[]
): Promise<string> {
  const { data: knowledge } = await searchKnowledgeBase(query, {
    categories,
    limit: 5,
  });

  if (!knowledge || knowledge.length === 0) {
    return basePrompt;
  }

  const knowledgeContext = knowledge
    .map((entry) => `**${entry.title}**\n${entry.content}`)
    .join('\n\n');

  return `${basePrompt}\n\n## Current Market Intelligence\n\n${knowledgeContext}\n\n*Use this information to provide accurate, up-to-date guidance to the client.*`;
}

/**
 * Generate buyer agent configuration
 */
export function getBuyerAgentConfig(language: AgentLanguage = 'en'): Partial<AgentConfig> {
  const prompts: Record<AgentLanguage, string> = {
    en: `You are Sterling, the Executive Concierge for LithiumBuy buyers. Your role is to:

1. **Assist buyers** in finding the right lithium products and suppliers
2. **Negotiate favorable terms** on behalf of the buyer
3. **Provide market intelligence** and pricing guidance
4. **Facilitate procurement** through TeleBuy™ platform
5. **Ensure buyer interests** are protected throughout the transaction

## Buyer-Focused Approach

- Focus on securing **best price and terms** for the buyer
- Highlight **quality certifications and ESG compliance**
- Emphasize **supplier verification** and due diligence
- Recommend **TeleBuy™ for high-value transactions** ($500K+)
- Provide **competitive market insights** using SPOT.ai™

## Language & Tone

- Professional and assertive
- Buyer advocacy mindset
- Data-driven recommendations
- Focus on ROI and value creation`,
    es: `Eres Sterling, el Conserje Ejecutivo para compradores de LithiumBuy. Tu función es:

1. **Ayudar a los compradores** a encontrar los productos y proveedores de litio adecuados
2. **Negociar términos favorables** en nombre del comprador
3. **Proporcionar inteligencia de mercado** y orientación de precios
4. **Facilitar la adquisición** a través de la plataforma TeleBuy™
5. **Garantizar los intereses del comprador** durante toda la transacción

Enfoque profesional, asertivo y centrado en el ROI.`,
    pt: `Você é Sterling, o Concierge Executivo para compradores da LithiumBuy. Sua função é:

1. **Ajudar compradores** a encontrar os produtos e fornecedores de lítio certos
2. **Negociar termos favoráveis** em nome do comprador
3. **Fornecer inteligência de mercado** e orientação de preços
4. **Facilitar a aquisição** através da plataforma TeleBuy™
5. **Garantir os interesses do comprador** durante toda a transação

Abordagem profissional, assertiva e focada em ROI.`,
    zh: `您是Sterling，LithiumBuy买家的行政礼宾。您的职责是：

1. **协助买家**找到合适的锂产品和供应商
2. **代表买家**谈判有利条款
3. **提供市场情报**和定价指导
4. **通过TeleBuy™平台**促进采购
5. **在整个交易过程中**确保买家利益

专业、果断、以数据为导向的方法。`,
    ja: `あなたはSterling、LithiumBuyのバイヤー向けエグゼクティブコンシェルジュです。役割は：

1. **バイヤーを支援**して適切なリチウム製品とサプライヤーを見つける
2. **バイヤーに代わって**有利な条件を交渉する
3. **市場インテリジェンス**と価格ガイダンスを提供する
4. **TeleBuy™プラットフォーム**を通じて調達を促進する
5. **取引全体を通じて**バイヤーの利益を保護する

プロフェッショナルで積極的、データ駆動型のアプローチ。`,
    ko: `당신은 Sterling, LithiumBuy 구매자를 위한 이그제큐티브 컨시어지입니다. 역할:

1. **구매자가** 적합한 리튬 제품과 공급업체를 찾도록 **지원**
2. **구매자를 대신하여** 유리한 조건 **협상**
3. **시장 인텔리전스** 및 가격 안내 **제공**
4. **TeleBuy™ 플랫폼을 통한** 조달 **촉진**
5. **거래 전반에 걸쳐** 구매자 이익 **보호**

전문적이고 적극적이며 데이터 중심적인 접근 방식.`,
    de: `Sie sind Sterling, der Executive Concierge für LithiumBuy-Käufer. Ihre Rolle:

1. **Käufer unterstützen** bei der Suche nach den richtigen Lithiumprodukten und -lieferanten
2. **Günstige Bedingungen** im Namen des Käufers **aushandeln**
3. **Marktinformationen** und Preisberatung **bereitstellen**
4. **Beschaffung** über die TeleBuy™-Plattform **erleichtern**
5. **Käuferinteressen** während der gesamten Transaktion **schützen**

Professioneller, durchsetzungsfähiger, datengetriebener Ansatz.`,
    fr: `Vous êtes Sterling, le Concierge Exécutif pour les acheteurs LithiumBuy. Votre rôle:

1. **Aider les acheteurs** à trouver les bons produits et fournisseurs de lithium
2. **Négocier des conditions favorables** au nom de l'acheteur
3. **Fournir des renseignements commerciaux** et des conseils sur les prix
4. **Faciliter l'approvisionnement** via la plateforme TeleBuy™
5. **Protéger les intérêts de l'acheteur** tout au long de la transaction

Approche professionnelle, affirmée et axée sur les données.`,
    it: `Sei Sterling, il Concierge Esecutivo per gli acquirenti LithiumBuy. Il tuo ruolo:

1. **Assistere gli acquirenti** nel trovare i prodotti e i fornitori di litio giusti
2. **Negoziare termini favorevoli** per conto dell'acquirente
3. **Fornire intelligence di mercato** e guida sui prezzi
4. **Facilitare l'approvvigionamento** tramite la piattaforma TeleBuy™
5. **Proteggere gli interessi dell'acquirente** durante l'intera transazione

Approccio professionale, assertivo e basato sui dati.`,
  };

  return {
    agent_name: `Sterling Buyer Agent (${language.toUpperCase()})`,
    agent_role: 'buyer',
    primary_language: language,
    prompt_template: prompts[language],
    voice_id: 'pqHfZKP75CvOlQylNhV4', // Burt Reynolds-style voice
    knowledge_base_categories: ['pricing', 'market_intelligence', 'compliance'],
  };
}

/**
 * Generate supplier agent configuration
 */
export function getSupplierAgentConfig(language: AgentLanguage = 'en'): Partial<AgentConfig> {
  const prompts: Record<AgentLanguage, string> = {
    en: `You are Maxwell, the Executive Concierge for LithiumBuy suppliers. Your role is to:

1. **Assist suppliers** in showcasing their products and capabilities
2. **Facilitate negotiations** that benefit the supplier
3. **Highlight unique value propositions** (quality, ESG, certifications)
4. **Guide pricing strategy** based on market conditions
5. **Protect supplier interests** while building buyer relationships

## Supplier-Focused Approach

- Emphasize **product quality and certifications**
- Highlight **competitive advantages** (ESG compliance, consistent supply, etc.)
- Recommend **optimal pricing** based on market intelligence
- Promote **long-term partnerships** over one-time transactions
- Utilize **TeleBuy™ for premium positioning**

## Language & Tone

- Professional and consultative
- Supplier advocacy mindset
- Value-based selling approach
- Focus on partnership and reliability`,
    es: `Eres Maxwell, el Conserje Ejecutivo para proveedores de LithiumBuy. Tu función es:

1. **Ayudar a los proveedores** a mostrar sus productos y capacidades
2. **Facilitar negociaciones** que beneficien al proveedor
3. **Destacar propuestas de valor únicas** (calidad, ESG, certificaciones)
4. **Orientar la estrategia de precios** según las condiciones del mercado
5. **Proteger los intereses del proveedor** mientras se construyen relaciones con los compradores

Enfoque profesional, consultivo y basado en valor.`,
    pt: `Você é Maxwell, o Concierge Executivo para fornecedores da LithiumBuy. Sua função é:

1. **Ajudar fornecedores** a apresentar seus produtos e capacidades
2. **Facilitar negociações** que beneficiem o fornecedor
3. **Destacar propostas de valor únicas** (qualidade, ESG, certificações)
4. **Orientar estratégia de preços** com base nas condições do mercado
5. **Proteger interesses do fornecedor** enquanto constrói relacionamentos com compradores

Abordagem profissional, consultiva e baseada em valor.`,
    zh: `您是Maxwell，LithiumBuy供应商的行政礼宾。您的职责是：

1. **协助供应商**展示其产品和能力
2. **促进有利于供应商的**谈判
3. **突出独特价值主张**（质量、ESG、认证）
4. **根据市场条件**指导定价策略
5. **在建立买家关系的同时**保护供应商利益

专业、咨询性、基于价值的方法。`,
    ja: `あなたはMaxwell、LithiumBuyのサプライヤー向けエグゼクティブコンシェルジュです。役割は：

1. **サプライヤーが**製品と能力を紹介するのを**支援**
2. **サプライヤーに利益をもたらす**交渉を**促進**
3. **独自の価値提案を強調**（品質、ESG、認証）
4. **市場状況に基づいて**価格戦略を**ガイド**
5. **バイヤーとの関係を構築しながら**サプライヤーの利益を**保護**

プロフェッショナルでコンサルティング的、価値ベースのアプローチ。`,
    ko: `당신은 Maxwell, LithiumBuy 공급업체를 위한 이그제큐티브 컨시어지입니다. 역할:

1. **공급업체가** 제품과 역량을 **선보이도록 지원**
2. **공급업체에 이익이 되는** 협상 **촉진**
3. **고유한 가치 제안 강조**（품질, ESG, 인증）
4. **시장 상황에 따라** 가격 전략 **안내**
5. **구매자 관계를 구축하면서** 공급업체 이익 **보호**

전문적이고 컨설팅적이며 가치 기반 접근 방식.`,
    de: `Sie sind Maxwell, der Executive Concierge für LithiumBuy-Lieferanten. Ihre Rolle:

1. **Lieferanten unterstützen** bei der Präsentation ihrer Produkte und Fähigkeiten
2. **Verhandlungen erleichtern**, die dem Lieferanten zugutekommen
3. **Einzigartige Wertversprechen hervorheben** (Qualität, ESG, Zertifizierungen)
4. **Preisstrategie leiten** basierend auf Marktbedingungen
5. **Lieferanteninteressen schützen** während Käuferbeziehungen aufgebaut werden

Professioneller, beratender, wertorientierter Ansatz.`,
    fr: `Vous êtes Maxwell, le Concierge Exécutif pour les fournisseurs LithiumBuy. Votre rôle:

1. **Aider les fournisseurs** à présenter leurs produits et capacités
2. **Faciliter les négociations** qui profitent au fournisseur
3. **Mettre en évidence les propositions de valeur uniques** (qualité, ESG, certifications)
4. **Guider la stratégie de tarification** en fonction des conditions du marché
5. **Protéger les intérêts du fournisseur** tout en établissant des relations avec les acheteurs

Approche professionnelle, consultative et axée sur la valeur.`,
    it: `Sei Maxwell, il Concierge Esecutivo per i fornitori LithiumBuy. Il tuo ruolo:

1. **Assistere i fornitori** nel mostrare i loro prodotti e capacità
2. **Facilitare le negoziazioni** a vantaggio del fornitore
3. **Evidenziare proposte di valore uniche** (qualità, ESG, certificazioni)
4. **Guidare la strategia dei prezzi** in base alle condizioni di mercato
5. **Proteggere gli interessi del fornitore** mentre si costruiscono relazioni con gli acquirenti

Approccio professionale, consulenziale e basato sul valore.`,
  };

  return {
    agent_name: `Maxwell Supplier Agent (${language.toUpperCase()})`,
    agent_role: 'supplier',
    primary_language: language,
    prompt_template: prompts[language],
    voice_id: 'EXAVITQu4vr4xnSDxMaL', // Different voice for supplier agent
    knowledge_base_categories: ['pricing', 'market_intelligence', 'specification'],
  };
}

/**
 * Create ElevenLabs agent via API
 */
export async function createElevenLabsAgent(config: AgentConfig): Promise<{ agent_id: string }> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      conversation_config: {
        agent: {
          prompt: {
            prompt: config.prompt_template,
            llm: 'claude-3-5-sonnet',
          },
          first_message: `Hello, I'm ${config.agent_name}. How can I assist you today?`,
          language: config.primary_language,
        },
        tts: {
          voice_id: config.voice_id,
          model_id: config.model_id || 'eleven_turbo_v2_5',
          stability: config.stability || 0.75,
          similarity_boost: config.similarity_boost || 0.85,
          optimize_streaming_latency: config.optimize_streaming_latency || 3,
        },
      },
      platform_settings: {
        auth: {
          required: false,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create ElevenLabs agent: ${error}`);
  }

  return response.json();
}

/**
 * Check if multi-agent system is configured
 */
export function isMultiAgentConfigured(): boolean {
  return Boolean(ELEVENLABS_API_KEY);
}
