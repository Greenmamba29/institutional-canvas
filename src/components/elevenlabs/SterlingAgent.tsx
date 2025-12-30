/**
 * Sterling Agent Component
 * Embeds the ElevenLabs conversational AI agent for LithiumBuy
 */

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mic, Info } from 'lucide-react';
import { getAgentId, isConfigured } from '@/services/elevenlabs.service';

interface ElevenLabsWidget {
  startSession: () => void;
  endSession: () => void;
}

declare global {
  interface Window {
    ElevenLabsWidget?: {
      init: (config: {
        agentId: string;
        apiKey?: string;
      }) => ElevenLabsWidget;
    };
  }
}

export function SterlingAgent() {
  const widgetRef = useRef<ElevenLabsWidget | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if ElevenLabs is configured
    if (!isConfigured()) {
      console.warn('ElevenLabs is not configured. Please set VITE_ELEVENLABS_API_KEY and VITE_ELEVENLABS_AGENT_ID in your .env file.');
      return;
    }

    // Load ElevenLabs widget script
    const script = document.createElement('script');
    script.src = 'https://elevenlabs.io/convai-widget/index.js';
    script.async = true;

    script.onload = () => {
      if (window.ElevenLabsWidget && containerRef.current) {
        try {
          const agentId = getAgentId();

          // Initialize the widget
          widgetRef.current = window.ElevenLabsWidget.init({
            agentId: agentId,
          });

          console.log('ElevenLabs Sterling agent initialized');
        } catch (error) {
          console.error('Failed to initialize ElevenLabs widget:', error);
        }
      }
    };

    script.onerror = () => {
      console.error('Failed to load ElevenLabs widget script');
    };

    document.body.appendChild(script);

    // Cleanup
    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.endSession();
        } catch (error) {
          console.error('Error ending ElevenLabs session:', error);
        }
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  if (!isConfigured()) {
    return (
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-5 w-5 text-orange-600" />
            Sterling AI Agent Not Configured
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="text-sm">
              The Sterling AI concierge service requires ElevenLabs configuration.
              Please contact your administrator to set up the voice agent.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          Sterling - AI Executive Concierge
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Meet Sterling, your dedicated AI concierge for lithium procurement.
            Click the widget below to start a voice conversation and get expert guidance
            on TeleBuy™ sessions, market intelligence, and high-value transactions.
          </p>
          <div className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg">
            <strong>💡 Pro Tip:</strong> Sterling can help you navigate suppliers,
            pricing trends, and facilitate deals over $500K through our premium TeleBuy™ platform.
          </div>
          {/* The ElevenLabs widget will be automatically injected here */}
          <div id="elevenlabs-widget-container" className="min-h-[60px]" />
        </div>
      </CardContent>
    </Card>
  );
}
