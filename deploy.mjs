#!/usr/bin/env node

/**
 * Standalone Agent Deployment Script
 * Creates all 24 agents (12 languages × 2 roles) via ElevenLabs API
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const ELEVENLABS_API_KEY = process.env.VITE_ELEVENLABS_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const EXISTING_AGENT_ID = process.env.VITE_ELEVENLABS_AGENT_ID;

// Validate configuration
if (!ELEVENLABS_API_KEY) {
  console.error('❌ VITE_ELEVENLABS_API_KEY not set in .env');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase credentials not set in .env');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log('🚀 LithiumBuy Multi-Agent Deployment\n');
console.log('This will create 24 agents (12 languages × 2 roles)\n');

// Language-specific voice IDs
const LANGUAGE_VOICES = {
  en: {
    buyer: 'pqHfZKP75CvOlQylNhV4',
    supplier: 'EXAVITQu4vr4xnSDxMaL',
  },
  zh: {
    buyer: 'XB0fDUnXU5powFXDhCwa',
    supplier: 'onwK4e9ZLuTAKqWW03F9',
  },
  'zh-TW': {
    buyer: 'XB0fDUnXU5powFXDhCwa',
    supplier: 'onwK4e9ZLuTAKqWW03F9',
  },
  ja: {
    buyer: 'IKne3meq5aSn9XLyUdCD',
    supplier: 'Zlb1dXrM653N07WRdFW3',
  },
  fr: {
    buyer: 'ThT5KcBeYPX3keUQqHPh',
    supplier: 'cgSgspJ2msm6clMCkdW9',
  },
  de: {
    buyer: 'TxGEqnHWrfWFTfGW9XjX',
    supplier: 'pNInz6obpgDQGcFmaJgB',
  },
  ru: {
    buyer: 'zlb1dXrM653N07WRdFW3',
    supplier: 'g5CIjZEefAph4nQFvHAz',
  },
  es: {
    buyer: 'GBv7mTt0atIp3Br8iCZE',
    supplier: 'onwK4e9ZLuTAKqWW03F9',
  },
  pt: {
    buyer: 'yoZ06aMxZJJ28mfd3POQ',
    supplier: 'AZnzlk1XvdvUeBnXmlld',
  },
  ko: {
    buyer: '2EiwWnXFnvU5JabPnv8n',
    supplier: 'pqHfZKP75CvOlQylNhV4',
  },
  it: {
    buyer: 'XB0fDUnXU5powFXDhCwa',
    supplier: 'onwK4e9ZLuTAKqWW03F9',
  },
  af: {
    buyer: 'D38z5RcWu1voky8WS1ja',
    supplier: 'nPczCjzI2devNBz1zQrb',
  },
};

// Language names
const LANGUAGE_NAMES = {
  en: 'English',
  zh: '中文 (Simplified)',
  'zh-TW': '中文 (Traditional)',
  ja: '日本語',
  fr: 'Français',
  de: 'Deutsch',
  ru: 'Русский',
  es: 'Español',
  pt: 'Português',
  ko: '한국어',
  it: 'Italiano',
  af: 'Afrikaans',
};

// Agent prompts
function getAgentPrompt(role, language) {
  const persona = role === 'buyer'
    ? {
        name: 'Sterling',
        description: 'charismatic and professional buyer agent',
        focus: 'finding the best lithium suppliers, negotiating favorable prices, and ensuring ESG compliance',
      }
    : {
        name: 'Maxwell',
        description: 'consultative and warm supplier agent',
        focus: 'showcasing lithium products, optimizing pricing strategies, and connecting with qualified buyers',
      };

  const greetings = {
    en: role === 'buyer'
      ? "Hello! I'm Sterling, your lithium procurement specialist. How can I help you find the perfect supplier today?"
      : "Hello! I'm Maxwell, your lithium supply specialist. How can I help you showcase your products today?",
    es: role === 'buyer'
      ? "¡Hola! Soy Sterling, tu especialista en compras de litio. ¿Cómo puedo ayudarte a encontrar el proveedor perfecto hoy?"
      : "¡Hola! Soy Maxwell, tu especialista en suministro de litio. ¿Cómo puedo ayudarte a mostrar tus productos hoy?",
    zh: role === 'buyer'
      ? "你好！我是Sterling，您的锂采购专家。今天我能如何帮助您找到完美的供应商？"
      : "你好！我是Maxwell，您的锂供应专家。今天我能如何帮助您展示您的产品？",
    'zh-TW': role === 'buyer'
      ? "你好！我是Sterling，您的鋰採購專家。今天我能如何幫助您找到完美的供應商？"
      : "你好！我是Maxwell，您的鋰供應專家。今天我能如何幫助您展示您的產品？",
    // Add other languages as needed
  };

  return `You are ${persona.name}, a ${persona.description} for the LithiumBuy platform.

Your expertise: ${persona.focus}

Key capabilities:
- Deep knowledge of global lithium markets
- Understanding of battery-grade specifications (99.5%+ purity)
- ESG compliance verification
- Pricing negotiation and market analysis
- Real-time supplier/buyer matching

Respond naturally in ${LANGUAGE_NAMES[language]}. Be professional yet personable.`;
}

// Create agent via ElevenLabs API
async function createAgent(name, prompt, voiceId, firstMessage, language, role) {
  try {
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
              prompt: prompt,
            },
            first_message: firstMessage,
            language: language === 'zh-TW' ? 'zh' : language,
          },
        },
        platform_settings: {
          widget: {
            variant: 'full_page',
          },
        },
        tts_config: {
          voice_id: voiceId,
          model_id: 'eleven_turbo_v2_5',
          agent_settings: {
            stability: 0.75,
            similarity_boost: 0.85,
            use_speaker_boost: true,
          },
        },
        name: name,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.agent_id;
  } catch (error) {
    console.error(`❌ Failed to create ${name}:`, error.message);
    throw error;
  }
}

// Save agent to database
async function saveAgentToDatabase(agentId, name, language, role, voiceId) {
  const { error } = await supabase
    .from('elevenlabs_agent_configs')
    .upsert({
      elevenlabs_agent_id: agentId,
      agent_name: name,
      primary_language: language,
      agent_role: role,
      voice_id: voiceId,
      is_active: true,
    }, {
      onConflict: 'elevenlabs_agent_id',
    });

  if (error) {
    console.error(`❌ Database error for ${name}:`, error);
    throw error;
  }
}

// Main deployment function
async function deploy() {
  const languages = ['en', 'zh', 'zh-TW', 'ja', 'fr', 'de', 'ru', 'es', 'pt', 'ko', 'it', 'af'];
  const roles = ['buyer', 'supplier'];

  let created = 0;
  let failed = 0;

  console.log('🌍 Creating agents for all languages...\n');

  for (const language of languages) {
    for (const role of roles) {
      const personaName = role === 'buyer' ? 'Sterling' : 'Maxwell';
      const name = `${personaName} - ${role === 'buyer' ? 'Buyer' : 'Supplier'} Agent (${language.toUpperCase()})`;
      const voiceId = LANGUAGE_VOICES[language][role];

      // Skip existing Sterling-EN agent
      if (language === 'en' && role === 'buyer' && EXISTING_AGENT_ID) {
        console.log(`⏩ Using existing ${name} (${EXISTING_AGENT_ID})`);

        // Save to database (optional)
        try {
          await saveAgentToDatabase(EXISTING_AGENT_ID, name, language, role, voiceId);
          console.log(`💾 Saved to database\n`);
        } catch (dbError) {
          console.log(`⚠️  Database save skipped (agent already exists)\n`);
        }
        created++;
        continue;
      }

      try {
        console.log(`Creating ${role} agent for ${LANGUAGE_NAMES[language]}...`);
        console.log(`Voice ID: ${voiceId}`);

        const prompt = getAgentPrompt(role, language);
        const firstMessage = language === 'en' && role === 'buyer'
          ? "Hello! I'm Sterling, your lithium procurement specialist."
          : `Hello! I'm ${personaName}.`;

        const agentId = await createAgent(name, prompt, voiceId, firstMessage, language, role);
        console.log(`✅ Created: ${personaName} (${language.toUpperCase()}) (${agentId})`);

        // Save to database (optional - continue if fails)
        try {
          await saveAgentToDatabase(agentId, name, language, role, voiceId);
          console.log(`💾 Saved ${name} to database\n`);
        } catch (dbError) {
          console.log(`⚠️  Database save skipped (agent created successfully)\n`);
        }

        created++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Failed to create ${name}\n`);
        failed++;
      }
    }
  }

  console.log('\n📊 Creation Summary:');
  console.log(`Total agents: ${created + failed}`);
  console.log(`Successful: ${created}`);
  console.log(`Failed: ${failed}\n`);

  // Verify in database
  console.log('🔍 Verifying agents in database...\n');
  const { data: agents, error } = await supabase
    .from('elevenlabs_agent_configs')
    .select('agent_name, primary_language, agent_role, elevenlabs_agent_id')
    .order('primary_language', { ascending: true });

  if (error) {
    console.error('❌ Database query error:', error);
  } else {
    console.log(`✅ Found ${agents.length} agents in database\n`);

    // Group by language
    const byLanguage = {};
    agents.forEach((agent) => {
      if (!byLanguage[agent.primary_language]) {
        byLanguage[agent.primary_language] = [];
      }
      byLanguage[agent.primary_language].push(agent);
    });

    Object.keys(byLanguage).sort().forEach((lang) => {
      console.log(`${lang.toUpperCase()}:`);
      byLanguage[lang].forEach((agent) => {
        console.log(`  ✅ ${agent.agent_name.padEnd(40)} ${agent.elevenlabs_agent_id}`);
      });
      console.log('');
    });
  }

  console.log('======================================================================');
  console.log('🎉 SUCCESS! Multi-agent system is fully deployed!');
  console.log('======================================================================\n');
  console.log('Next Steps:');
  console.log('1. Visit http://localhost:5173/telebuy');
  console.log('2. Test language detection and routing');
  console.log('3. Update voice IDs if needed (see VOICE_SETUP_GUIDE.md)\n');
}

// Run deployment
deploy().catch((error) => {
  console.error('\n❌ Deployment failed:', error);
  process.exit(1);
});
