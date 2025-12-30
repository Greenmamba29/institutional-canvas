/**
 * Multi-Language Agent Creator
 * Creates separate ElevenLabs agents for each language
 */

import {
  AgentLanguage,
  getBuyerAgentConfig,
  getSupplierAgentConfig,
  saveAgentConfig,
  type AgentConfig,
} from '../services/elevenlabs-multi-agent.service';
import { getAgentKnowledge } from '../services/airtable.service';
import { searchKnowledgeBase } from '../services/knowledge-base.service';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

/**
 * Voice IDs optimized for each language
 * These are ElevenLabs voice IDs that work well for each language
 */
const LANGUAGE_VOICES: Record<AgentLanguage, { buyer: string; supplier: string }> = {
  en: {
    buyer: 'pqHfZKP75CvOlQylNhV4', // Burt Reynolds-style (Sterling)
    supplier: 'EXAVITQu4vr4xnSDxMaL', // Professional male (Maxwell)
  },
  es: {
    buyer: 'VR6AewLTigWG4xSOukaG', // Spanish male
    supplier: 'TX3LPaxmHKxFdv7VOQHJ', // Spanish professional
  },
  pt: {
    buyer: 'yoZ06aMxZJJ28mfd3POQ', // Portuguese male
    supplier: 'flq6f7yk4E4fJM5XTYuZ', // Portuguese professional
  },
  zh: {
    buyer: 'XB0fDUnXU5powFXDhCwa', // Chinese male
    supplier: 'onwK4e9ZLuTAKqWW03F9', // Chinese professional
  },
  ja: {
    buyer: 'IKne3meq5aSn9XLyUdCD', // Japanese male
    supplier: 'bVMeCyTHy58xNoL34h3p', // Japanese professional
  },
  ko: {
    buyer: 'pFZP5JQG7iQjIQuC4Bku', // Korean male
    supplier: 'piTKgcLEGmPE4e6mEKli', // Korean professional
  },
  de: {
    buyer: 'TxGEqnHWrfWFTfGW9XjX', // German male
    supplier: 'pNInz6obpgDQGcFmaJgB', // German professional
  },
  fr: {
    buyer: 'ThT5KcBeYPX3keUQqHPh', // French male
    supplier: '21m00Tcm4TlvDq8ikWAM', // French professional
  },
  it: {
    buyer: 'XrExE9yKIg1WjnnlVkGX', // Italian male
    supplier: 'MF3mGyEYCl7XYWbV9V6O', // Italian professional
  },
};

/**
 * Get enhanced prompt with knowledge base for a specific language
 */
async function getEnhancedPrompt(
  basePrompt: string,
  language: AgentLanguage
): Promise<string> {
  try {
    // Get Airtable knowledge for this language
    const airtableKnowledge = await getAgentKnowledge(language);

    // Get knowledge base data (pricing is universal, but we'll fetch in English and note it)
    const { data: pricingData } = await searchKnowledgeBase('lithium pricing', {
      categories: ['pricing'],
      language: language === 'en' ? 'en' : 'en', // Fallback to English for pricing
      limit: 5,
    });

    const pricingContext = pricingData
      ?.map((entry) => `**${entry.title}**\n${entry.content}`)
      .join('\n\n') || '';

    return `${basePrompt}

---

## KNOWLEDGE BASE ACCESS

You have access to the following up-to-date information:

### Current Pricing Data
${pricingContext}

### FAQs and Marketplace (${language.toUpperCase()})
${airtableKnowledge}

---

## KNOWLEDGE BASE INTEGRATION INSTRUCTIONS

When answering questions:
1. **Search the knowledge base first** - Use the data provided above
2. **Cite specific data** - Reference exact prices, specifications, and compliance info
3. **Stay current** - This knowledge is updated regularly
4. **Be specific** - Mention exact specifications and certifications
5. **Use native language** - Communicate naturally in ${language.toUpperCase()}

Always prioritize this knowledge over general training data.
`;
  } catch (error) {
    console.error(`Error getting enhanced prompt for ${language}:`, error);
    return basePrompt;
  }
}

/**
 * Create a single language-specific agent in ElevenLabs
 */
async function createLanguageAgent(
  role: 'buyer' | 'supplier',
  language: AgentLanguage,
  config: Partial<AgentConfig>
): Promise<{ agent_id: string }> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('VITE_ELEVENLABS_API_KEY not configured');
  }

  const enhancedPrompt = await getEnhancedPrompt(config.prompt_template || '', language);

  const voiceId = LANGUAGE_VOICES[language][role];
  const agentName = role === 'buyer'
    ? `Sterling (${language.toUpperCase()})`
    : `Maxwell (${language.toUpperCase()})`;

  const firstMessage = {
    en: `Hello, I'm ${agentName}. How can I assist you today?`,
    es: `Hola, soy ${agentName}. ¿Cómo puedo ayudarte hoy?`,
    pt: `Olá, sou ${agentName}. Como posso ajudá-lo hoje?`,
    zh: `您好，我是${agentName}。今天我能为您做些什么？`,
    ja: `こんにちは、${agentName}です。今日はどのようにお手伝いしましょうか？`,
    ko: `안녕하세요, 저는 ${agentName}입니다. 오늘 어떻게 도와드릴까요?`,
    de: `Hallo, ich bin ${agentName}. Wie kann ich Ihnen heute helfen?`,
    fr: `Bonjour, je suis ${agentName}. Comment puis-je vous aider aujourd'hui?`,
    it: `Ciao, sono ${agentName}. Come posso aiutarti oggi?`,
  };

  console.log(`Creating ${role} agent for ${language.toUpperCase()}...`);
  console.log(`Voice ID: ${voiceId}`);

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
            prompt: enhancedPrompt,
            llm: 'claude-3-5-sonnet',
          },
          first_message: firstMessage[language],
          language: language,
        },
        tts: {
          voice_id: voiceId,
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
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create agent: ${error}`);
  }

  const result = await response.json();
  console.log(`✅ Created: ${agentName} (${result.agent_id})`);

  return result;
}

/**
 * Save agent configuration to database
 */
async function saveAgentToDatabase(
  agentId: string,
  role: 'buyer' | 'supplier',
  language: AgentLanguage,
  config: Partial<AgentConfig>
): Promise<void> {
  const agentName = role === 'buyer'
    ? `Sterling - Buyer Agent (${language.toUpperCase()})`
    : `Maxwell - Supplier Agent (${language.toUpperCase()})`;

  const voiceId = LANGUAGE_VOICES[language][role];

  await saveAgentConfig({
    agent_name: agentName,
    agent_role: role,
    primary_language: language,
    supported_languages: [language],
    prompt_template: config.prompt_template || '',
    voice_id: voiceId,
    model_id: 'eleven_turbo_v2_5',
    stability: 0.75,
    similarity_boost: 0.85,
    optimize_streaming_latency: 3,
    enable_language_detection: true,
    enable_knowledge_base: true,
    knowledge_base_categories: ['pricing', 'market_intelligence', 'compliance', 'specification'],
  });

  console.log(`💾 Saved ${agentName} to database`);
}

/**
 * Create all language variants for buyer and supplier agents
 */
export async function createAllLanguageAgents(options?: {
  languages?: AgentLanguage[];
  roles?: Array<'buyer' | 'supplier'>;
}): Promise<void> {
  const languages: AgentLanguage[] = options?.languages || ['en', 'es', 'pt'];
  const roles = options?.roles || ['buyer', 'supplier'];

  console.log('🚀 Creating multi-language agents...\n');
  console.log(`Languages: ${languages.join(', ')}`);
  console.log(`Roles: ${roles.join(', ')}\n`);

  const results: Array<{
    role: string;
    language: string;
    agentId: string;
    success: boolean;
    error?: string;
  }> = [];

  for (const role of roles) {
    for (const language of languages) {
      try {
        // Get base configuration
        const config = role === 'buyer'
          ? getBuyerAgentConfig(language)
          : getSupplierAgentConfig(language);

        // Create agent in ElevenLabs
        const { agent_id } = await createLanguageAgent(role, language, config);

        // Save to database
        await saveAgentToDatabase(agent_id, role, language, config);

        results.push({
          role,
          language,
          agentId: agent_id,
          success: true,
        });

        // Rate limiting: wait 2 seconds between creations
        await new Promise((resolve) => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Failed to create ${role} agent for ${language}:`, error);
        results.push({
          role,
          language,
          agentId: '',
          success: false,
          error: (error as Error).message,
        });
      }
    }
  }

  // Summary
  console.log('\n📊 Creation Summary:');
  console.log(`Total agents: ${results.length}`);
  console.log(`Successful: ${results.filter((r) => r.success).length}`);
  console.log(`Failed: ${results.filter((r) => !r.success).length}`);

  console.log('\n✅ Successful Agents:');
  results
    .filter((r) => r.success)
    .forEach((r) => {
      console.log(`  ${r.role.padEnd(10)} ${r.language.toUpperCase().padEnd(5)} ${r.agentId}`);
    });

  if (results.some((r) => !r.success)) {
    console.log('\n❌ Failed Agents:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`  ${r.role.padEnd(10)} ${r.language.toUpperCase().padEnd(5)} ${r.error}`);
      });
  }
}

/**
 * Update existing Sterling agent with English configuration
 */
export async function updateExistingSterlingAgent(): Promise<void> {
  const STERLING_AGENT_ID = 'agent_5901kdnkfx6heq1rq2whpves1mn7';

  console.log('🔄 Updating existing Sterling agent...');

  try {
    const config = getBuyerAgentConfig('en');
    const enhancedPrompt = await getEnhancedPrompt(config.prompt_template || '', 'en');

    // Update in ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/agents/${STERLING_AGENT_ID}`,
      {
        method: 'PATCH',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_config: {
            agent: {
              prompt: {
                prompt: enhancedPrompt,
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update agent: ${await response.text()}`);
    }

    console.log('✅ ElevenLabs agent updated');

    // Save to database
    await saveAgentToDatabase(STERLING_AGENT_ID, 'buyer', 'en', config);

    console.log('✅ Sterling agent fully integrated');
  } catch (error) {
    console.error('❌ Failed to update Sterling agent:', error);
    throw error;
  }
}

// Export for use in other scripts
export { createLanguageAgent, saveAgentToDatabase };
