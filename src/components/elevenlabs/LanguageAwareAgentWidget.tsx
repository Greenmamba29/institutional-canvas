// @ts-nocheck
/**
 * Language-Aware Agent Widget
 * Routes to language-specific agents with automatic detection
 */

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, MicOff, Globe, User, Building2, RefreshCw, Info } from 'lucide-react';
import {
  AgentRole,
  AgentLanguage,
  isMultiAgentConfigured,
  createAgentSession,
  getAgentConfig,
  startAgentSession,
  endAgentSession,
  logAgentMessage,
} from '@/services/elevenlabs-multi-agent.service';
import {
  detectUserLanguage,
  getStoredLanguagePreference,
  storeLanguagePreference,
  getLanguageName,
  getSupportedLanguages,
} from '@/services/language-detection.service';

interface LanguageAwareAgentWidgetProps {
  telebuySessionId: string;
  userRole: AgentRole;
  userId?: string;
  orgId?: string;
  onAgentStateChange?: (state: 'idle' | 'active' | 'paused') => void;
}

interface ElevenLabsWidget {
  startSession: () => void;
  endSession: () => void;
}

declare global {
  interface Window {
    ElevenLabsWidget?: {
      init: (config: { agentId: string }) => ElevenLabsWidget;
    };
  }
}

export function LanguageAwareAgentWidget({
  telebuySessionId,
  userRole,
  userId,
  orgId,
  onAgentStateChange,
}: LanguageAwareAgentWidgetProps) {
  const [language, setLanguage] = useState<AgentLanguage>('en');
  const [detectedLanguage, setDetectedLanguage] = useState<AgentLanguage | null>(null);
  const [agentState, setAgentState] = useState<'idle' | 'active' | 'paused'>('idle');
  const [agentSessionId, setAgentSessionId] = useState<string | null>(null);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [languageDetecting, setLanguageDetecting] = useState(false);
  const widgetRef = useRef<ElevenLabsWidget | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Detect language on mount
  useEffect(() => {
    const detectLanguage = async () => {
      setLanguageDetecting(true);
      try {
        // Check stored preference first
        const stored = getStoredLanguagePreference();
        if (stored) {
          setLanguage(stored.language);
          setDetectedLanguage(stored.language);
        } else {
          // Auto-detect from browser
          const detected = await detectUserLanguage();
          setLanguage(detected.language);
          setDetectedLanguage(detected.language);
        }
      } catch (error) {
        console.error('Language detection failed:', error);
        setLanguage('en'); // fallback
      } finally {
        setLanguageDetecting(false);
      }
    };

    detectLanguage();
    setIsConfigured(isMultiAgentConfigured());
  }, []);

  // Cleanup widget on unmount or language change
  useEffect(() => {
    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.endSession();
        } catch (error) {
          console.error('Error ending widget session:', error);
        }
      }
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
      }
    };
  }, [language]);

  const handleLanguageChange = async (newLanguage: AgentLanguage) => {
    // If agent is active, we need to stop it first
    if (agentState === 'active') {
      await handleStopAgent();
    }

    setLanguage(newLanguage);
    storeLanguagePreference(newLanguage);
  };

  const initializeWidget = async () => {
    // Get agent configuration for current role and language
    const { data: config } = await getAgentConfig(userRole, language);

    if (!config || !window.ElevenLabsWidget) {
      throw new Error(`No agent found for ${userRole} role in ${language.toUpperCase()}`);
    }

    setCurrentAgentId(config.elevenlabs_agent_id);

    // Create agent session in database
    const { data: session } = await createAgentSession({
      telebuy_session_id: telebuySessionId,
      agent_role: userRole,
      agent_id: config.elevenlabs_agent_id,
      language,
      user_id: userId,
      org_id: orgId,
      status: 'initializing',
    });

    if (!session) {
      throw new Error('Failed to create agent session');
    }

    setAgentSessionId(session.id);

    // Initialize ElevenLabs widget
    widgetRef.current = window.ElevenLabsWidget.init({
      agentId: config.elevenlabs_agent_id,
    });

    // Start session
    await startAgentSession(session.id, 'widget-' + session.id);

    // Log initial message
    await logAgentMessage({
      agent_session_id: session.id,
      message_type: 'system_event',
      speaker_role: 'system',
      content: `Agent session started with ${userRole} role in ${getLanguageName(language)}`,
      language,
    });

    return session.id;
  };

  const handleStartAgent = async () => {
    setAgentState('active');
    onAgentStateChange?.('active');

    try {
      // Load ElevenLabs widget script if not already loaded
      if (!scriptRef.current) {
        const script = document.createElement('script');
        script.src = 'https://elevenlabs.io/convai-widget/index.js';
        script.async = true;

        script.onload = async () => {
          try {
            await initializeWidget();
          } catch (error) {
            console.error('Failed to initialize agent:', error);
            setAgentState('idle');
            onAgentStateChange?.('idle');
          }
        };

        script.onerror = () => {
          console.error('Failed to load ElevenLabs widget script');
          setAgentState('idle');
          onAgentStateChange?.('idle');
        };

        document.body.appendChild(script);
        scriptRef.current = script;
      } else {
        await initializeWidget();
      }
    } catch (error) {
      console.error('Error starting agent:', error);
      setAgentState('idle');
      onAgentStateChange?.('idle');
    }
  };

  const handleStopAgent = async () => {
    if (widgetRef.current) {
      try {
        widgetRef.current.endSession();
      } catch (error) {
        console.error('Error ending widget session:', error);
      }
    }

    if (agentSessionId) {
      await endAgentSession(agentSessionId);

      // Log end message
      await logAgentMessage({
        agent_session_id: agentSessionId,
        message_type: 'system_event',
        speaker_role: 'system',
        content: 'Agent session ended',
        language,
      });
    }

    setAgentState('idle');
    onAgentStateChange?.('idle');
    widgetRef.current = null;
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'buyer':
        return <User className="h-5 w-5" />;
      case 'supplier':
        return <Building2 className="h-5 w-5" />;
      default:
        return <RefreshCw className="h-5 w-5" />;
    }
  };

  const getRoleName = () => {
    switch (userRole) {
      case 'buyer':
        return 'Sterling (Buyer Agent)';
      case 'supplier':
        return 'Maxwell (Supplier Agent)';
      default:
        return 'AI Agent';
    }
  };

  const getRoleColor = () => {
    switch (userRole) {
      case 'buyer':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'supplier':
        return 'bg-green-500/10 text-green-700 border-green-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  if (!isConfigured) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {getRoleIcon()}
            AI Agent Not Configured
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Multi-agent system requires configuration. Please contact your administrator.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border ${getRoleColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {getRoleIcon()}
            {getRoleName()}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {agentState}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Language Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Language</span>
            </div>
            {detectedLanguage && detectedLanguage !== language && (
              <Badge variant="secondary" className="text-xs">
                Detected: {getLanguageName(detectedLanguage)}
              </Badge>
            )}
          </div>
          <Select
            value={language}
            onValueChange={(value) => handleLanguageChange(value as AgentLanguage)}
            disabled={agentState !== 'idle' || languageDetecting}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {getSupportedLanguages().map(({ code, name }) => (
                <SelectItem key={code} value={code}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Language Switch Notice */}
        {agentState === 'active' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Stop the agent to change language. Each language uses a different agent optimized for that language.
            </AlertDescription>
          </Alert>
        )}

        {/* Agent Description */}
        <div className="text-sm text-muted-foreground">
          {userRole === 'buyer' ? (
            <p>
              Sterling assists buyers with product sourcing, supplier vetting, price negotiation,
              and market intelligence. Speaks {getLanguageName(language)} natively.
            </p>
          ) : (
            <p>
              Maxwell helps suppliers showcase products, optimize pricing strategies, highlight
              certifications, and build buyer relationships. Speaks {getLanguageName(language)} natively.
            </p>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {agentState === 'idle' ? (
            <Button
              onClick={handleStartAgent}
              disabled={!isConfigured || languageDetecting}
              className="w-full"
              size="sm"
            >
              <Mic className="h-4 w-4 mr-2" />
              Start {userRole === 'buyer' ? 'Sterling' : 'Maxwell'}
              {language !== 'en' && ` (${language.toUpperCase()})`}
            </Button>
          ) : (
            <Button onClick={handleStopAgent} variant="destructive" className="w-full" size="sm">
              <MicOff className="h-4 w-4 mr-2" />
              End Session
            </Button>
          )}
        </div>

        {/* Widget Container */}
        {agentState !== 'idle' && (
          <div id="elevenlabs-widget-container" className="min-h-[80px] border rounded-lg p-3 bg-background" />
        )}

        {/* Current Agent Info */}
        {currentAgentId && agentState === 'active' && (
          <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded">
            <strong>Active Agent:</strong> {currentAgentId}
          </div>
        )}

        {/* Agent Tips */}
        <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded">
          <strong>💡 Tip:</strong>{' '}
          {userRole === 'buyer'
            ? 'Ask Sterling about pricing trends, supplier certifications, or ESG compliance.'
            : 'Ask Maxwell about competitive positioning, optimal pricing, or market opportunities.'}
        </div>
      </CardContent>
    </Card>
  );
}
