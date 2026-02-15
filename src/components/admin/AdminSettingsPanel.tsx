import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Key, Save } from 'lucide-react';

export function AdminSettingsPanel() {
  const [airtableKey, setAirtableKey] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!airtableKey.trim()) {
      toast({ title: 'Validation Error', description: 'API key cannot be empty.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Call the airtable-proxy edge function to update the key
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/airtable-proxy`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'update_key', key: airtableKey }),
        }
      );

      if (!response.ok) throw new Error('Failed to update key');

      toast({ title: 'Success', description: 'Airtable API key updated.' });
      setAirtableKey('');
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save key. Check edge function logs.', variant: 'destructive' });
    } finally {
      setSaving(false);
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
            Manage the Airtable API key used for ops sync. The key is stored as a Supabase Edge Function secret.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="airtable-key">Airtable API Key</Label>
            <Input
              id="airtable-key"
              type="password"
              placeholder="pat•••••••••"
              value={airtableKey}
              onChange={(e) => setAirtableKey(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={saving || !airtableKey.trim()}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving…' : 'Update Key'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
