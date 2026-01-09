/**
 * Agent Setup Page
 * 
 * NOTE: This page is disabled until server-side ElevenLabs integration is complete.
 * API keys must NOT be exposed in the frontend.
 */

import { LayoutShell } from '@/components/layout/LayoutShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Lock, Zap, Database, BookOpen, Server } from 'lucide-react';
import { isFeatureEnabled } from '@/config/env';

const STERLING_AGENT_ID = 'agent_5901kdnkfx6heq1rq2whpves1mn7';

export default function AgentSetup() {
  const elevenlabsEnabled = isFeatureEnabled('elevenlabs');

  return (
    <LayoutShell>
      <PageHeader
        title="Sterling Agent Setup"
        description="Integrate your ElevenLabs agent with knowledge base and Airtable"
      />

      <div className="mt-6 space-y-6 max-w-4xl">
        {/* Security Notice */}
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Server-Side Integration Required</strong>
            <p className="mt-1 text-sm">
              Agent configuration requires the ElevenLabs API key, which must be stored securely 
              on the server (Supabase Edge Function). This page will be enabled once the 
              <code className="mx-1 px-1 bg-amber-100 dark:bg-amber-900 rounded">elevenlabs-agent-proxy</code> 
              Edge Function is deployed.
            </p>
          </AlertDescription>
        </Alert>

        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="text-sm">ElevenLabs Feature Flag</span>
              </div>
              <Badge variant={elevenlabsEnabled ? 'default' : 'secondary'}>
                {elevenlabsEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-blue-600" />
                <span className="text-sm">Edge Function (API Key)</span>
              </div>
              <Badge variant="destructive">Not Deployed</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-green-600" />
                <span className="text-sm">Knowledge Base</span>
              </div>
              <Badge variant="secondary">Optional</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-orange-600" />
                <span className="text-sm">Agent ID</span>
              </div>
              <code className="text-xs bg-secondary px-2 py-1 rounded">
                {STERLING_AGENT_ID}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Required Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Required Steps to Enable</CardTitle>
            <CardDescription>
              Complete these steps to enable agent configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Deploy Edge Function</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create <code>supabase/functions/elevenlabs-agent-proxy/index.ts</code> to securely 
                  handle ElevenLabs API calls server-side.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Add API Key to Supabase Secrets</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add <code>ELEVENLABS_API_KEY</code> to Supabase Edge Function secrets 
                  (not in frontend .env files).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-5 w-5 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Update This Page</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Modify this page to call the Edge Function instead of using client-side API calls.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disabled State */}
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Setup Steps (Disabled)
            </CardTitle>
            <CardDescription>
              These steps will be available after server-side integration is complete
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
                Seed Knowledge Base
              </li>
              <li className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
                Fetch Airtable Data
              </li>
              <li className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
                Enhance Agent Prompt
              </li>
              <li className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
                Update ElevenLabs Agent
              </li>
              <li className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
                Save Configuration
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
