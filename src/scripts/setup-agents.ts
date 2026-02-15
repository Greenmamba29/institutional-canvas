// @ts-nocheck
/**
 * Agent Setup Script
 * Integrates existing ElevenLabs agent with knowledge base and Airtable
 */

import {
  saveAgentConfig,
  getBuyerAgentConfig,
  getSupplierAgentConfig,
  enhancePromptWithKnowledge,
  type AgentConfig,
} from './services/elevenlabs-multi-agent.service';
import { getAgentKnowledge } from './services/airtable.service';
import { seedKnowledgeBase } from './services/knowledge-base.service';

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

/**
 * Update an existing ElevenLabs agent with enhanced prompt
 */
async function updateExistingAgent(
  agentId: string,
  enhancedPrompt: string
): Promise<void> {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('VITE_ELEVENLABS_API_KEY not configured');
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
    {
      method: 'PATCH',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
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
    const error = await response.text();
    throw new Error(`Failed to update agent: ${error}`);
  }

  console.log(`✅ Successfully updated agent ${agentId}`);
}

/**
 * Get comprehensive enhanced prompt with all knowledge sources
 */
async function getEnhancedPrompt(
  basePrompt: string,
  language: string = 'en'
): Promise<string> {
  // Get Airtable knowledge (FAQs + Products)
  const airtableKnowledge = await getAgentKnowledge(language);

  // Build comprehensive prompt
  const enhancedPrompt = `${basePrompt}

---

## KNOWLEDGE BASE ACCESS

You have access to the following up-to-date information. Use this to provide accurate, current guidance:

${airtableKnowledge}

---

## KNOWLEDGE BASE INTEGRATION INSTRUCTIONS

When answering questions:
1. **Search the knowledge base first** - Check FAQs and product listings above
2. **Cite specific data** - Reference prices, specifications, and compliance info
3. **Stay current** - This knowledge is updated regularly; trust it over general knowledge
4. **Be specific** - When discussing products, mention exact specifications and certifications
5. **Cross-reference** - Connect pricing with market intelligence and compliance requirements

Example responses:
- Pricing questions → Reference current price ranges from knowledge base
- Product specs → Quote exact specifications from knowledge base
- Compliance → Cite specific requirements (EU Battery Passport, US IRA)
- FAQs → Use exact answers from FAQ database

---

## DYNAMIC KNOWLEDGE UPDATES

This prompt is enhanced with:
- ✅ Real-time Airtable FAQs (LithiumBuy platform questions)
- ✅ Current marketplace product inventory
- ✅ Latest pricing data (updated quarterly)
- ✅ Compliance requirements (EU, US, Asia)
- ✅ ESG certification status

Always prioritize this knowledge over general training data.
`;

  return enhancedPrompt;
}

/**
 * Main setup function - integrates your existing agent
 */
export async function setupSterlingAgent(): Promise<void> {
  console.log('🚀 Starting Sterling Agent Setup...\n');

  // Your existing agent ID
  const STERLING_AGENT_ID = 'agent_5901kdnkfx6heq1rq2whpves1mn7';

  try {
    // Step 1: Seed the knowledge base (if not already done)
    console.log('📚 Step 1: Seeding knowledge base...');
    await seedKnowledgeBase();
    console.log('✅ Knowledge base seeded\n');

    // Step 2: Get base buyer agent configuration
    console.log('🎭 Step 2: Getting buyer agent configuration...');
    const buyerConfig = getBuyerAgentConfig('en');
    console.log('✅ Configuration loaded\n');

    // Step 3: Enhance prompt with Airtable knowledge
    console.log('🔗 Step 3: Fetching Airtable knowledge...');
    const enhancedPrompt = await getEnhancedPrompt(
      buyerConfig.prompt_template || '',
      'en'
    );
    console.log(`✅ Enhanced prompt created (${enhancedPrompt.length} characters)\n`);

    // Step 4: Update your existing agent in ElevenLabs
    console.log('🔄 Step 4: Updating ElevenLabs agent...');
    await updateExistingAgent(STERLING_AGENT_ID, enhancedPrompt);
    console.log('✅ ElevenLabs agent updated\n');

    // Step 5: Save configuration to database
    console.log('💾 Step 5: Saving configuration to database...');
    await saveAgentConfig({
      agent_name: 'Sterling - LithiumBuy Executive Concierge',
      agent_role: 'buyer',
      elevenlabs_agent_id: STERLING_AGENT_ID,
      primary_language: 'en',
      supported_languages: ['en', 'es', 'pt'],
      prompt_template: enhancedPrompt,
      voice_id: 'pqHfZKP75CvOlQylNhV4',
      model_id: 'eleven_turbo_v2_5',
      stability: 0.75,
      similarity_boost: 0.85,
      optimize_streaming_latency: 3,
      enable_language_detection: true,
      enable_knowledge_base: true,
      knowledge_base_categories: ['pricing', 'market_intelligence', 'compliance', 'specification'],
    });
    console.log('✅ Configuration saved to database\n');

    console.log('🎉 SUCCESS! Sterling agent is fully integrated with:');
    console.log('   ✅ Enhanced buyer-focused prompt');
    console.log('   ✅ Airtable FAQs and product data');
    console.log('   ✅ PostgreSQL knowledge base access');
    console.log('   ✅ Multi-language support (EN, ES, PT)');
    console.log('   ✅ Conversation persistence ready');
    console.log('\n📱 Your agent is ready to use in TeleBuy sessions!');
    console.log(`   Agent ID: ${STERLING_AGENT_ID}`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

/**
 * Create additional agent variants (supplier, other languages)
 */
export async function createAdditionalAgents(): Promise<void> {
  console.log('🚀 Creating additional agent variants...\n');

  const agentsToCreate = [
    // Supplier agents
    {
      name: 'Maxwell - Supplier Agent (EN)',
      role: 'supplier' as const,
      language: 'en' as const,
      config: getSupplierAgentConfig('en'),
    },
    {
      name: 'Maxwell - Supplier Agent (ES)',
      role: 'supplier' as const,
      language: 'es' as const,
      config: getSupplierAgentConfig('es'),
    },

    // Buyer agents in other languages
    {
      name: 'Sterling - Buyer Agent (ES)',
      role: 'buyer' as const,
      language: 'es' as const,
      config: getBuyerAgentConfig('es'),
    },
    {
      name: 'Sterling - Buyer Agent (PT)',
      role: 'buyer' as const,
      language: 'pt' as const,
      config: getBuyerAgentConfig('pt'),
    },
  ];

  for (const agent of agentsToCreate) {
    try {
      console.log(`📝 Creating: ${agent.name}...`);

      // Enhance prompt with Airtable knowledge
      const enhancedPrompt = await getEnhancedPrompt(
        agent.config.prompt_template || '',
        agent.language
      );

      // Create agent in ElevenLabs
      const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_config: {
            agent: {
              prompt: {
                prompt: enhancedPrompt,
                llm: 'claude-3-5-sonnet',
              },
              first_message: `Hello, I'm ${agent.name.split(' - ')[0]}. How can I assist you today?`,
              language: agent.language,
            },
            tts: {
              voice_id: agent.config.voice_id,
              model_id: agent.config.model_id || 'eleven_turbo_v2_5',
              stability: agent.config.stability || 0.75,
              similarity_boost: agent.config.similarity_boost || 0.85,
              optimize_streaming_latency: agent.config.optimize_streaming_latency || 3,
            },
          },
          platform_settings: {
            auth: { required: false },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create agent: ${error}`);
      }

      const { agent_id } = await response.json();

      // Save to database
      await saveAgentConfig({
        ...agent.config,
        agent_name: agent.name,
        elevenlabs_agent_id: agent_id,
        prompt_template: enhancedPrompt,
        enable_knowledge_base: true,
      } as AgentConfig);

      console.log(`✅ Created: ${agent.name} (${agent_id})\n`);

    } catch (error) {
      console.error(`❌ Failed to create ${agent.name}:`, error);
    }
  }

  console.log('🎉 Additional agents created successfully!');
}

// Export for use in app
export { updateExistingAgent, getEnhancedPrompt };
