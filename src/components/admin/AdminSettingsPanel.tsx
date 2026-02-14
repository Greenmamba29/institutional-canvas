import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Key, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function AdminSettingsPanel() {
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('airtable-proxy', {
        body: { action: 'update_key', key: apiKey.trim() },
      });
      if (error) throw error;
      toast({ title: 'API Key Updated', description: 'Airtable API key saved successfully.' });
      setApiKey('');
      setConnectionStatus('unknown');
    } catch (err) {
      toast({ title: 'Error', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('airtable-proxy', {
        body: { action: 'test_connection' },
      });
      if (error) throw error;
      setConnectionStatus(data?.ok ? 'connected' : 'error');
    } catch {
      setConnectionStatus('error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Airtable Integration
          </CardTitle>
          <CardDescription>
            Manage the Airtable Personal Access Token used for analytics sync.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="airtable-key">API Key</Label>
            <Input
              id="airtable-key"
              type="password"
              placeholder="pat_xxxxxxxxxxxx"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving || !apiKey.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Key
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Test Connection
            </Button>
          </div>

          {connectionStatus !== 'unknown' && (
            <div className={`flex items-center gap-2 text-sm ${connectionStatus === 'connected' ? 'text-success' : 'text-destructive'}`}>
              {connectionStatus === 'connected' ? (
                <><CheckCircle className="h-4 w-4" /> Connected successfully</>
              ) : (
                <><AlertCircle className="h-4 w-4" /> Connection failed — check your API key</>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
