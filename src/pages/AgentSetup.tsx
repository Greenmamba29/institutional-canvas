/**
 * Agent Setup Page
 * One-click integration of Sterling agent with knowledge base and Airtable
 */

import { useState } from 'react';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Zap, Database, Globe, BookOpen } from 'lucide-react';
import {
  saveAgentConfig,
  getBuyerAgentConfig,
  type AgentLanguage,
} from '@/services/elevenlabs-multi-agent.service';
import { getAgentKnowledge, isAirtableConfigured } from '@/services/airtable.service';
import { seedKnowledgeBase, searchKnowledgeBase } from '@/services/knowledge-base.service';

const STERLING_AGENT_ID = 'agent_5901kdnkfx6heq1rq2whpves1mn7';
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

type SetupStep = {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
};

export default function AgentSetup() {
  const [steps, setSteps] = useState<SetupStep[]>([
    { name: 'Seed Knowledge Base', status: 'pending' },
    { name: 'Fetch Airtable Data', status: 'pending' },
    { name: 'Enhance Agent Prompt', status: 'pending' },
    { name: 'Update ElevenLabs Agent', status: 'pending' },
    { name: 'Save Configuration', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState('');

  const updateStep = (index: number, status: SetupStep['status'], message?: string) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, status, message } : step))
    );
  };

  const getEnhancedPrompt = async (basePrompt: string, language: AgentLanguage = 'en'): Promise<string> => {
    // Get Airtable knowledge (FAQs + Products)
    const airtableKnowledge = await getAgentKnowledge(language);

    // Search knowledge base for recent pricing
    const { data: pricingData } = await searchKnowledgeBase('lithium pricing', {
      categories: ['pricing'],
      limit: 5,
    });

    const pricingContext = pricingData
      ?.map((entry) => `**${entry.title}**\n${entry.content}`)
      .join('\n\n') || '';

    // Build comprehensive prompt
    return `${basePrompt}

---

## KNOWLEDGE BASE ACCESS

You have access to the following up-to-date information. Use this to provide accurate, current guidance:

### Current Pricing Data
${pricingContext}

### FAQs and Marketplace
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
  };

  const updateElevenLabsAgent = async (agentId: string, enhancedPrompt: string): Promise<void> => {
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
  };

  const runSetup = async () => {
    setIsRunning(true);

    try {
      // Step 1: Seed Knowledge Base
      updateStep(0, 'running');
      await seedKnowledgeBase();
      updateStep(0, 'success', 'Knowledge base seeded with pricing and compliance data');

      // Step 2: Fetch Airtable Data
      updateStep(1, 'running');
      const airtableData = await getAgentKnowledge('en');
      const hasAirtableData = airtableData.length > 0;
      updateStep(
        1,
        hasAirtableData ? 'success' : 'error',
        hasAirtableData
          ? 'FAQs and marketplace data fetched'
          : 'No Airtable data (check configuration)'
      );

      // Step 3: Enhance Agent Prompt
      updateStep(2, 'running');
      const buyerConfig = getBuyerAgentConfig('en');
      const enhanced = await getEnhancedPrompt(buyerConfig.prompt_template || '', 'en');
      setEnhancedPrompt(enhanced);
      updateStep(2, 'success', `Enhanced prompt created (${enhanced.length} chars)`);

      // Step 4: Update ElevenLabs Agent
      updateStep(3, 'running');
      await updateElevenLabsAgent(STERLING_AGENT_ID, enhanced);
      updateStep(3, 'success', 'Agent updated in ElevenLabs');

      // Step 5: Save Configuration
      updateStep(4, 'running');
      await saveAgentConfig({
        agent_name: 'Sterling - LithiumBuy Executive Concierge',
        agent_role: 'buyer',
        primary_language: 'en',
        supported_languages: ['en', 'es', 'pt'],
        prompt_template: enhanced,
        voice_id: 'pqHfZKP75CvOlQylNhV4',
        model_id: 'eleven_turbo_v2_5',
        stability: 0.75,
        similarity_boost: 0.85,
        optimize_streaming_latency: 3,
        enable_language_detection: true,
        enable_knowledge_base: true,
        knowledge_base_categories: ['pricing', 'market_intelligence', 'compliance', 'specification'],
      });
      updateStep(4, 'success', 'Configuration saved to database');

    } catch (error) {
      console.error('Setup error:', error);
      const currentStep = steps.findIndex((s) => s.status === 'running');
      if (currentStep >= 0) {
        updateStep(currentStep, 'error', (error as Error).message);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: SetupStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const allSuccess = steps.every((s) => s.status === 'success');
  const hasError = steps.some((s) => s.status === 'error');
  const airtableConfigured = isAirtableConfigured();

  return (
    <LayoutShell>
      <PageHeader
        title="Sterling Agent Setup"
        description="Integrate your ElevenLabs agent with knowledge base and Airtable"
      />

      <div className="mt-6 space-y-6 max-w-4xl">
        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="text-sm">ElevenLabs API</span>
              </div>
              <Badge variant={ELEVENLABS_API_KEY ? 'default' : 'destructive'}>
                {ELEVENLABS_API_KEY ? 'Configured' : 'Not Configured'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Airtable Integration</span>
              </div>
              <Badge variant={airtableConfigured ? 'default' : 'secondary'}>
                {airtableConfigured ? 'Configured' : 'Optional'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-green-600" />
                <span className="text-sm">Agent ID</span>
              </div>
              <code className="text-xs bg-secondary px-2 py-1 rounded">
                {STERLING_AGENT_ID}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Setup Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Setup Steps</CardTitle>
            <CardDescription>
              Click "Run Setup" to integrate Sterling with all knowledge sources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="mt-0.5">{getStatusIcon(step.status)}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{step.name}</p>
                  {step.message && (
                    <p className="text-xs text-muted-foreground mt-1">{step.message}</p>
                  )}
                </div>
              </div>
            ))}

            <Button
              onClick={runSetup}
              disabled={isRunning || !ELEVENLABS_API_KEY}
              className="w-full mt-4"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Setup...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Run Setup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Success Message */}
        {allSuccess && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Setup Complete!</strong> Sterling is now integrated with:
              <ul className="mt-2 space-y-1 text-sm">
                <li>✅ PostgreSQL knowledge base (pricing, specs, compliance)</li>
                {airtableConfigured && <li>✅ Airtable FAQs and marketplace data</li>}
                <li>✅ Multi-language support (EN, ES, PT)</li>
                <li>✅ Conversation persistence enabled</li>
              </ul>
              <p className="mt-3 text-sm">
                Your agent is ready to use in TeleBuy sessions!
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {hasError && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Setup encountered an error. Check the step messages above and verify your configuration.
            </AlertDescription>
          </Alert>
        )}

        {/* Enhanced Prompt Preview */}
        {enhancedPrompt && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enhanced Prompt Preview</CardTitle>
              <CardDescription>
                This is what Sterling now has access to
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-secondary p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
                {enhancedPrompt.substring(0, 2000)}...
                {enhancedPrompt.length > 2000 && (
                  <span className="text-muted-foreground">
                    \n\n[{enhancedPrompt.length - 2000} more characters]
                  </span>
                )}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>After setup completes:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Go to TeleBuy page</li>
              <li>Start a session with Sterling agent</li>
              <li>Ask about pricing, products, or FAQs</li>
              <li>Sterling will use the integrated knowledge base</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
