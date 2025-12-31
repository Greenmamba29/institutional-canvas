#!/usr/bin/env node

/**
 * Simplified Multi-Language Agent Deployment
 * Creates 2 agents (Sterling buyer, Maxwell supplier) with ALL languages enabled
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const ELEVENLABS_API_KEY = process.env.VITE_ELEVENLABS_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const EXISTING_BUYER_AGENT_ID = process.env.VITE_ELEVENLABS_AGENT_ID;

if (!ELEVENLABS_API_KEY) {
  console.error('❌ Missing VITE_ELEVENLABS_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// All supported languages
const SUPPORTED_LANGUAGES = ['en', 'es', 'zh', 'ja', 'fr', 'de', 'ru', 'pt', 'ko', 'it'];

// Greetings in each language
const GREETINGS = {
  buyer: {
    en: "Hello! I'm Sterling, your lithium procurement specialist. How can I help you find the perfect supplier today?",
    es: "¡Hola! Soy Sterling, tu especialista en compras de litio. ¿Cómo puedo ayudarte a encontrar el proveedor perfecto hoy?",
    zh: "你好！我是Sterling，您的锂采购专家。今天我能如何帮助您找到完美的供应商？",
    ja: "こんにちは！私はSterling、あなたのリチウム調達スペシャリストです。今日、完璧なサプライヤーを見つけるお手伝いをさせてください。",
    fr: "Bonjour ! Je suis Sterling, votre spécialiste en approvisionnement de lithium. Comment puis-je vous aider à trouver le fournisseur parfait aujourd'hui ?",
    de: "Hallo! Ich bin Sterling, Ihr Lithium-Beschaffungsspezialist. Wie kann ich Ihnen heute helfen, den perfekten Lieferanten zu finden?",
    ru: "Здравствуйте! Я Sterling, ваш специалист по закупкам лития. Как я могу помочь вам найти идеального поставщика сегодня?",
    pt: "Olá! Sou Sterling, seu especialista em aquisição de lítio. Como posso ajudá-lo a encontrar o fornecedor perfeito hoje?",
    ko: "안녕하세요! 저는 Sterling입니다, 귀하의 리튬 조달 전문가입니다. 오늘 완벽한 공급업체를 찾는 데 어떻게 도와드릴까요?",
    it: "Ciao! Sono Sterling, il tuo specialista nell'approvvigionamento di litio. Come posso aiutarti a trovare il fornitore perfetto oggi?",
  },
  supplier: {
    en: "Hello! I'm Maxwell, your lithium supply specialist. How can I help you showcase your products today?",
    es: "¡Hola! Soy Maxwell, tu especialista en suministro de litio. ¿Cómo puedo ayudarte a mostrar tus productos hoy?",
    zh: "你好！我是Maxwell，您的锂供应专家。今天我能如何帮助您展示您的产品？",
    ja: "こんにちは！私はMaxwell、あなたのリチウム供給スペシャリストです。今日、あなたの製品を紹介するお手伝いをさせてください。",
    fr: "Bonjour ! Je suis Maxwell, votre spécialiste en fourniture de lithium. Comment puis-je vous aider à présenter vos produits aujourd'hui ?",
    de: "Hallo! Ich bin Maxwell, Ihr Lithium-Versorgungsspezialist. Wie kann ich Ihnen heute helfen, Ihre Produkte zu präsentieren?",
    ru: "Здравствуйте! Я Maxwell, ваш специалист по поставкам лития. Как я могу помочь вам продемонстрировать ваши продукты сегодня?",
    pt: "Olá! Sou Maxwell, seu especialista em fornecimento de lítio. Como posso ajudá-lo a mostrar seus produtos hoje?",
    ko: "안녕하세요! 저는 Maxwell입니다, 귀하의 리튬 공급 전문가입니다. 오늘 제품을 소개하는 데 어떻게 도와드릴까요?",
    it: "Ciao! Sono Maxwell, il tuo specialista nella fornitura di litio. Come posso aiutarti a presentare i tuoi prodotti oggi?",
  }
};

// Create agent with multiple languages
async function createMultilingualAgent(name, role, voiceId) {
  const prompt = role === 'buyer'
    ? `You are Sterling, a charismatic and professional buyer agent for the LithiumBuy platform.

Your expertise: finding the best lithium suppliers, negotiating favorable prices, and ensuring ESG compliance

Key capabilities:
- Deep knowledge of global lithium markets
- Understanding of battery-grade specifications (99.5%+ purity)
- ESG compliance verification
- Pricing negotiation and market analysis
- Real-time supplier/buyer matching

Respond naturally in the user's language. Be professional yet personable.`
    : `You are Maxwell, a consultative and warm supplier agent for the LithiumBuy platform.

Your expertise: showcasing lithium products, optimizing pricing strategies, and connecting with qualified buyers

Key capabilities:
- Deep knowledge of global lithium markets
- Understanding of battery-grade specifications (99.5%+ purity)
- ESG compliance verification
- Pricing negotiation and market analysis
- Real-time supplier/buyer matching

Respond naturally in the user's language. Be professional yet personable.`;

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        conversation_config: {
          agent: {
            prompt: {
              prompt: prompt,
            },
            first_message: GREETINGS[role].en,
            language: 'en',
          },
          language_presets: {
            es: { overrides: { agent: { first_message: GREETINGS[role].es } } },
            zh: { overrides: { agent: { first_message: GREETINGS[role].zh } } },
            ja: { overrides: { agent: { first_message: GREETINGS[role].ja } } },
            fr: { overrides: { agent: { first_message: GREETINGS[role].fr } } },
            de: { overrides: { agent: { first_message: GREETINGS[role].de } } },
            ru: { overrides: { agent: { first_message: GREETINGS[role].ru } } },
            pt: { overrides: { agent: { first_message: GREETINGS[role].pt } } },
            ko: { overrides: { agent: { first_message: GREETINGS[role].ko } } },
            it: { overrides: { agent: { first_message: GREETINGS[role].it } } },
          },
        },
        platform_settings: {
          widget: {
            variant: 'full',
          },
        },
        tts_config: {
          voice_id: voiceId,
          model_id: 'eleven_turbo_v2_5',
        },
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

// Save agent mapping to database
async function saveAgentMapping(buyerAgentId, supplierAgentId) {
  try {
    // Save both agents
    const { error: buyerError } = await supabase
      .from('agent_config')
      .upsert({
        agent_id: buyerAgentId,
        role: 'buyer',
        is_active: true,
      }, {
        onConflict: 'agent_id',
      });

    if (buyerError) {
      console.log(`⚠️  Database save skipped for buyer: ${buyerError.message}`);
    }

    const { error: supplierError } = await supabase
      .from('agent_config')
      .upsert({
        agent_id: supplierAgentId,
        role: 'supplier',
        is_active: true,
      }, {
        onConflict: 'agent_id',
      });

    if (supplierError) {
      console.log(`⚠️  Database save skipped for supplier: ${supplierError.message}`);
    }
  } catch (error) {
    console.log(`⚠️  Database operations skipped: ${error.message}`);
  }
}

// Main deployment
async function deploy() {
  console.log('🚀 LithiumBuy Multi-Language Agent Deployment\n');
  console.log('Creating 2 agents with support for all languages...\n');

  let buyerAgentId = EXISTING_BUYER_AGENT_ID;
  let supplierAgentId;

  // Use existing Sterling buyer agent
  if (EXISTING_BUYER_AGENT_ID) {
    console.log(`✅ Using existing Sterling (Buyer) agent`);
    console.log(`   Agent ID: ${EXISTING_BUYER_AGENT_ID}\n`);
  } else {
    console.log('Creating Sterling (Buyer) agent...');
    buyerAgentId = await createMultilingualAgent(
      'Sterling - LithiumBuy Buyer Agent',
      'buyer',
      'XB0fDUnXU5powFXDhCwa'
    );
    console.log(`✅ Created Sterling (Buyer) agent`);
    console.log(`   Agent ID: ${buyerAgentId}\n`);
  }

  // Create Maxwell supplier agent
  console.log('Creating Maxwell (Supplier) agent...');
  supplierAgentId = await createMultilingualAgent(
    'Maxwell - LithiumBuy Supplier Agent',
    'supplier',
    'EXAVITQu4vr4xnSDxMaL'
  );
  console.log(`✅ Created Maxwell (Supplier) agent`);
  console.log(`   Agent ID: ${supplierAgentId}\n`);

  // Save to database
  await saveAgentMapping(buyerAgentId, supplierAgentId);

  console.log('📊 Deployment Summary:');
  console.log(`   Buyer Agent (Sterling):   ${buyerAgentId}`);
  console.log(`   Supplier Agent (Maxwell): ${supplierAgentId}`);
  console.log(`   Supported Languages: ${SUPPORTED_LANGUAGES.join(', ')}\n`);

  console.log('✅ SUCCESS! Multi-language agent system deployed!\n');
  console.log('🌍 Both agents support: English, Spanish, Chinese, Japanese, French, German, Russian, Portuguese, Korean, Italian');
  console.log('\nNext steps:');
  console.log('1. Update src/lib/agent-config.ts with the agent IDs');
  console.log('2. Test at http://localhost:5173/telebuy');
  console.log('3. The agents will automatically switch languages based on user input');
}

// Run deployment
deploy().catch(error => {
  console.error('\n❌ Deployment failed:', error.message);
  process.exit(1);
});
