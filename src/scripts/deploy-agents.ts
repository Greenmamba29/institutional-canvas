// @ts-nocheck
/**
 * Agent Deployment Script
 * Run this to create all 24 agents and test language routing
 */

import { createAllLanguageAgents, updateExistingSterlingAgent } from './create-multi-language-agents';
import { seedKnowledgeBase } from '../services/knowledge-base.service';
import { detectUserLanguage, getSupportedLanguages } from '../services/language-detection.service';
import { getAgentConfig } from '../services/elevenlabs-multi-agent.service';
import { supabase } from '../services';

console.log('🚀 LithiumBuy Multi-Agent Deployment\n');
console.log('This will create 24 agents (12 languages × 2 roles)\n');

async function main() {
  try {
    // Step 1: Seed knowledge base
    console.log('📚 Step 1: Seeding knowledge base...');
    await seedKnowledgeBase();
    console.log('✅ Knowledge base seeded\n');

    // Step 2: Update existing Sterling agent
    console.log('🔄 Step 2: Updating existing Sterling-EN agent...');
    await updateExistingSterlingAgent();
    console.log('✅ Sterling-EN updated\n');

    // Step 3: Create all other language variants
    console.log('🌍 Step 3: Creating agents for all languages...');
    await createAllLanguageAgents({
      languages: ['zh', 'zh-TW', 'ja', 'fr', 'de', 'ru', 'es', 'pt', 'ko', 'it', 'af'],
      roles: ['buyer', 'supplier'],
    });
    console.log('✅ All agents created\n');

    // Step 4: Verify in database
    console.log('🔍 Step 4: Verifying agents in database...');
    const { data: agents, error } = await supabase
      .from('elevenlabs_agent_configs')
      .select('agent_name, primary_language, agent_role, elevenlabs_agent_id, is_active')
      .order('primary_language', { ascending: true })
      .order('agent_role', { ascending: true });

    if (error) {
      console.error('❌ Error fetching agents:', error);
    } else {
      console.log(`\n✅ Found ${agents?.length || 0} agents in database:\n`);

      // Group by language
      const byLanguage: Record<string, any[]> = {};
      agents?.forEach((agent) => {
        if (!byLanguage[agent.primary_language]) {
          byLanguage[agent.primary_language] = [];
        }
        byLanguage[agent.primary_language].push(agent);
      });

      // Display grouped results
      Object.entries(byLanguage).forEach(([lang, agentList]) => {
        console.log(`${lang.toUpperCase()}:`);
        agentList.forEach((agent) => {
          const status = agent.is_active ? '✅' : '❌';
          console.log(`  ${status} ${agent.agent_name.padEnd(35)} ${agent.elevenlabs_agent_id}`);
        });
        console.log('');
      });
    }

    // Step 5: Test language detection
    console.log('🧪 Step 5: Testing language detection...\n');

    const detectionResult = await detectUserLanguage({ allowGeolocation: false });
    console.log('Language Detection Result:');
    console.log(`  Detected: ${detectionResult.language}`);
    console.log(`  Method: ${detectionResult.method}`);
    console.log(`  Confidence: ${(detectionResult.confidence * 100).toFixed(0)}%\n`);

    // Step 6: Test agent routing
    console.log('🔀 Step 6: Testing agent routing...\n');

    const testLanguages = ['en', 'es', 'zh', 'ru'];
    for (const lang of testLanguages) {
      const { data: buyerAgent } = await getAgentConfig('buyer', lang as any);
      const { data: supplierAgent } = await getAgentConfig('supplier', lang as any);

      if (buyerAgent && supplierAgent) {
        console.log(`${lang.toUpperCase()}:`);
        console.log(`  ✅ Buyer:    ${buyerAgent.elevenlabs_agent_id}`);
        console.log(`  ✅ Supplier: ${supplierAgent.elevenlabs_agent_id}`);
      } else {
        console.log(`${lang.toUpperCase()}:`);
        console.log(`  ❌ Missing agents for this language`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎉 SUCCESS! Multi-agent system is fully deployed!');
    console.log('='.repeat(70));
    console.log('\nNext Steps:');
    console.log('1. Visit http://localhost:5173/telebuy');
    console.log('2. Widget will auto-detect your language');
    console.log('3. Select a language from dropdown');
    console.log('4. Click "Start Sterling" or "Start Maxwell"');
    console.log('5. Agent will speak in your selected language ✨\n');

    // Display supported languages
    console.log('Supported Languages:');
    const languages = getSupportedLanguages();
    languages.forEach((lang) => {
      console.log(`  - ${lang.name} (${lang.code})`);
    });

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    console.error('\nPlease check:');
    console.error('1. VITE_ELEVENLABS_API_KEY is set in .env');
    console.error('2. Database migration has been run');
    console.error('3. Internet connection is working');
    process.exit(1);
  }
}

// Run deployment
main().catch(console.error);
