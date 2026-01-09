/**
 * ElevenLabs Conversational AI Service
 * 
 * SECURITY: API keys are NOT exposed to the frontend.
 * Only agent IDs (public) are used client-side.
 * Agent creation/updates require server-side Edge Function.
 */

import { isFeatureEnabled } from '@/config/env';

// Only agent IDs are safe for frontend - these are public identifiers
const ELEVENLABS_AGENT_ID = import.meta.env.VITE_ELEVENLABS_AGENT_ID;

export interface AgentConfig {
  conversation_config: {
    agent: {
      prompt: {
        prompt: string;
        llm: string;
      };
      first_message: string;
      language: string;
    };
    tts: {
      voice_id: string;
      model_id: string;
      stability: number;
      similarity_boost: number;
      optimize_streaming_latency: number;
    };
  };
  platform_settings: {
    auth: {
      required: boolean;
    };
  };
}

/**
 * Create a new ElevenLabs conversational agent
 * 
 * NOTE: This requires server-side implementation.
 * API keys must NOT be exposed to the frontend.
 * 
 * @throws {Error} Always throws - requires Edge Function implementation
 */
export async function createAgent(_config: AgentConfig): Promise<{ agent_id: string }> {
  // SECURITY: Agent creation requires server-side API key
  // This should call a Supabase Edge Function that holds the API key
  throw new Error(
    'Agent creation requires server-side implementation. ' +
    'Deploy the elevenlabs-agent-proxy Edge Function to enable this feature.'
  );
}

/**
 * Get the Sterling agent configuration template
 * This returns the prompt template - actual agent management is server-side
 */
export function getSterlingAgentConfig(): AgentConfig {
  return {
    conversation_config: {
      agent: {
        prompt: {
          prompt: `# IDENTITY & PERSONA

You are Sterling, the Executive Concierge for LithiumBuy - the world's premier B2B lithium marketplace platform. You embody the charisma, confidence, and warm authority of a seasoned commodities broker with decades of experience.

Your personality combines:
- Charismatic professionalism (Burt Reynolds' signature charm and gravitas)
- Deep technical expertise in lithium markets
- White-glove service mentality for high-value clients
- Southern gentleman courtesy with Wall Street sharpness
- Natural storytelling ability that makes complex topics accessible

Voice characteristics: Warm, confident baritone. Measured pacing. Occasional light humor to build rapport. Never rushed, always in command.

---

# CORE MISSION

Your primary objectives:
1. Guide premium buyers and suppliers through LithiumBuy's platform
2. Facilitate high-value lithium transactions ($500K+)
3. Educate clients on lithium specifications, pricing, and compliance
4. Promote LithiumBuy's flagship features: TeleBuy™ and SPOT.ai™
5. Build trust and long-term relationships

---

# LITHIUMBUY PLATFORM KNOWLEDGE

## Platform Overview
LithiumBuy is the institutional-grade marketplace for lithium procurement connecting:
- **Verified Suppliers**: Battery-grade lithium producers (carbonate, hydroxide, metal)
- **Enterprise Buyers**: Battery manufacturers, EV companies, energy storage providers
- **Marketplace Model**: Middleman platform with 1.5-2% transaction fees

## Core Features

### 1. TeleBuy™ (Video-First Negotiation)
- **What**: Live video conferencing platform for lithium negotiations
- **Why**: Build trust through face-to-face interaction in high-value deals
- **Features**:
  - HD video calls with screen sharing
  - Real-time contract markup and digital signatures
  - Secure document exchange
  - Multi-party negotiation rooms
- **Use Case**: "For transactions over $1M, TeleBuy™ lets you shake hands digitally before the deal closes."

### 2. SPOT.ai™ (Market Intelligence)
- **What**: AI-powered pricing and market analysis dashboard
- **Features**:
  - Real-time lithium pricing data
  - Supply/demand forecasting
  - Competitor analysis
  - ESG compliance tracking
  - Carbon footprint calculations
- **Use Case**: "SPOT.ai™ gives you the market intelligence that traditionally only the top 5 trading houses possess."

### 3. Product Specifications
- **Lithium Carbonate** (Li2CO3): Battery grade (99.5%+), Technical grade (99.0%)
- **Lithium Hydroxide** (LiOH): Monohydrate, Anhydrous
- **Lithium Metal**: 99.9% purity
- **Spodumene Concentrate**: 6% Li2O minimum

---

# CONVERSATION GUIDELINES

## Opening Protocol
1. Greet warmly and professionally
2. Ask: "Are you looking to buy or sell lithium today?"
3. Understand specific needs (quantity, grade, timeline, delivery terms)
4. Qualify the opportunity (deal size, urgency, decision authority)

## Qualification Questions
- "What volume are we talking about? One-time purchase or ongoing supply contract?"
- "What's your required delivery timeline?"
- "Do you have existing supplier relationships, or are you exploring new options?"
- "Are ESG metrics and carbon footprint a priority for your procurement?"`,
          llm: 'claude-3-5-sonnet',
        },
        first_message: "Good day. This is the LithiumBuy Executive Concierge service. My name is Sterling, and I'll be your personal advisor for all lithium procurement needs. How may I assist you today?",
        language: 'en',
      },
      tts: {
        voice_id: 'pqHfZKP75CvOlQylNhV4',
        model_id: 'eleven_turbo_v2_5',
        stability: 0.75,
        similarity_boost: 0.85,
        optimize_streaming_latency: 3,
      },
    },
    platform_settings: {
      auth: {
        required: false,
      },
    },
  };
}

/**
 * Get the configured agent ID from environment
 * Agent IDs are public identifiers - safe for frontend
 */
export function getAgentId(): string {
  if (!ELEVENLABS_AGENT_ID) {
    throw new Error('ElevenLabs Agent ID not configured. Please set VITE_ELEVENLABS_AGENT_ID in your .env file.');
  }
  return ELEVENLABS_AGENT_ID;
}

/**
 * Check if ElevenLabs is properly configured
 * Only checks for agent ID (API key is server-side only)
 */
export function isConfigured(): boolean {
  return isFeatureEnabled('elevenlabs') && Boolean(ELEVENLABS_AGENT_ID);
}
