/**
 * PriceAlertManager — create and manage price threshold alerts.
 * Gracefully handles missing price_alerts table.
 */

import { useState } from 'react';
import { usePriceAlerts, type CreateAlertParams } from '@/hooks/usePriceAlerts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Bell, Trash2, Plus } from 'lucide-react';

const COMMODITIES = ['Li Carbonate', 'Li Hydroxide', 'Lithium Metal', 'Spodumene'];

export function PriceAlertManager() {
  const { alerts, isLoading, createAlert, deleteAlert, isCreating } = usePriceAlerts();

  const [commodity, setCommodity] = useState<string>(COMMODITIES[0]);
  const [alertType, setAlertType] = useState<'above' | 'below'>('above');
  const [threshold, setThreshold] = useState<string>('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseFloat(threshold);
    if (isNaN(parsed) || parsed <= 0) return;

    const params: CreateAlertParams = {
      commodity,
      alert_type: alertType,
      threshold_usd: parsed,
    };
    createAlert(params);
    setThreshold('');
  }

  if (isLoading) {
    return <Skeleton className="h-32 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      {/* Active alerts list */}
      {alerts.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          <Bell className="mx-auto h-6 w-6 mb-2 opacity-40" />
          No active price alerts. Create one below.
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className="flex items-center justify-between rounded-lg border border-border p-3"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-medium">{alert.commodity}</p>
                  <p className="text-xs text-muted-foreground">
                    Alert when price goes{' '}
                    <Badge variant="secondary" className="text-[10px]">
                      {alert.alert_type}
                    </Badge>{' '}
                    <span className="font-mono">${alert.threshold_usd.toLocaleString()}/MT</span>
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteAlert(alert.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add alert form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-border/50">
        <Select value={commodity} onValueChange={setCommodity}>
          <SelectTrigger className="sm:w-44">
            <SelectValue placeholder="Commodity" />
          </SelectTrigger>
          <SelectContent>
            {COMMODITIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={alertType} onValueChange={v => setAlertType(v as 'above' | 'below')}>
          <SelectTrigger className="sm:w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="above">Above</SelectItem>
            <SelectItem value="below">Below</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="Threshold USD/MT"
          value={threshold}
          onChange={e => setThreshold(e.target.value)}
          className="sm:w-44"
          min={0}
          step={100}
        />

        <Button type="submit" disabled={isCreating || !threshold} className="gap-1 shrink-0">
          <Plus className="h-4 w-4" />
          Add Alert
        </Button>
      </form>
    </div>
  );
}
