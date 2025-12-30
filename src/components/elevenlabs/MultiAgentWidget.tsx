/**
 * Multi-Agent Widget
 * Supports dual agents (buyer + supplier) with language selection
 */

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Globe, User, Building2, Activity } from 'lucide-react';
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

interface MultiAgentWidgetProps {
  telebuySessionId: string;
  userRole: AgentRole;
  userId?: string;
  orgId?: string;
  onAgentStateChange?: (state: 'idle' | 'active' | 'paused') => void;
}

const LANGUAGES: Record<AgentLanguage, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
};

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

export function MultiAgentWidget({
  telebuySessionId,
  userRole,
  userId,
  orgId,
  onAgentStateChange,
}: MultiAgentWidgetProps) {
  const [language, setLanguage] = useState<AgentLanguage>('en');
  const [agentState, setAgentState] = useState<'idle' | 'active' | 'paused'>('idle');
  const [agentSessionId, setAgentSessionId] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const widgetRef = useRef<ElevenLabsWidget | null>(null);

  useEffect(() => {
    setIsConfigured(isMultiAgentConfigured());
  }, []);

  useEffect(() => {
    if (agentState === 'idle') return;

    // Load ElevenLabs widget script
    const script = document.createElement('script');
    script.src = 'https://elevenlabs.io/convai-widget/index.js';
    script.async = true;

    script.onload = async () => {
      try {
        // Get agent configuration for role and language
        const { data: config } = await getAgentConfig(userRole, language);

        if (!config || !window.ElevenLabsWidget) {
          console.error('Agent configuration not found');
          return;
        }

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

        if (session) {
          setAgentSessionId(session.id);

          // Initialize ElevenLabs widget
          widgetRef.current = window.ElevenLabsWidget.init({
            agentId: config.elevenlabs_agent_id,
          });

          // Start session
          await startAgentSession(session.id, 'widget-' + session.id);
          setAgentState('active');
          onAgentStateChange?.('active');

          // Log initial message
          await logAgentMessage({
            agent_session_id: session.id,
            message_type: 'system_event',
            speaker_role: 'system',
            content: `Agent session started with ${userRole} role in ${LANGUAGES[language]}`,
            language,
          });
        }
      } catch (error) {
        console.error('Failed to initialize agent:', error);
        setAgentState('idle');
      }
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [agentState, language, userRole, telebuySessionId, userId, orgId, onAgentStateChange]);

  const handleStartAgent = () => {
    setAgentState('active');
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
  };

  const getRoleIcon = () => {
    switch (userRole) {
      case 'buyer':
        return <User className="h-5 w-5" />;
      case 'supplier':
        return <Building2 className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
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
          <Badge variant="outline" className="capitalize">
            {agentState}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Select
            value={language}
            onValueChange={(value) => setLanguage(value as AgentLanguage)}
            disabled={agentState !== 'idle'}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANGUAGES).map(([code, name]) => (
                <SelectItem key={code} value={code}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Agent Description */}
        <div className="text-sm text-muted-foreground">
          {userRole === 'buyer' ? (
            <p>
              Sterling assists buyers with product sourcing, supplier vetting, price negotiation,
              and market intelligence through TeleBuy™.
            </p>
          ) : (
            <p>
              Maxwell helps suppliers showcase products, optimize pricing strategies, highlight
              certifications, and build buyer relationships.
            </p>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {agentState === 'idle' ? (
            <Button onClick={handleStartAgent} className="w-full" size="sm">
              <Mic className="h-4 w-4 mr-2" />
              Start {userRole === 'buyer' ? 'Sterling' : 'Maxwell'}
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

        {/* Agent Info */}
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
