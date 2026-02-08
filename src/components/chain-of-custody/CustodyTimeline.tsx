/**
 * CustodyTimeline - Visual timeline of material provenance
 */

import { Package, Truck, Factory, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CustodyEventCard } from './CustodyEventCard';
import { 
  type CustodyChain, 
  type CustodyEventType,
  custodyEventConfig 
} from '@/services/custody.service';
import { cn } from '@/lib/utils';

interface CustodyTimelineProps {
  chain: CustodyChain;
}

const eventOrder: CustodyEventType[] = [
  'origin',
  'extraction',
  'processing',
  'inspection',
  'transport',
  'storage',
  'delivery',
];

function getProgressValue(currentStatus: CustodyEventType): number {
  const index = eventOrder.indexOf(currentStatus);
  if (index === -1) return 0;
  return ((index + 1) / eventOrder.length) * 100;
}

export function CustodyTimeline({ chain }: CustodyTimelineProps) {
  const progress = getProgressValue(chain.currentStatus);
  const currentConfig = custodyEventConfig[chain.currentStatus];
  const isComplete = chain.currentStatus === 'delivery';
  
  // Sort events by timestamp
  const sortedEvents = [...chain.events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {chain.productType}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {chain.quantity} {chain.unit} • Origin: {chain.originCountry}
              </p>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                currentConfig.bgColor, 
                currentConfig.color,
                "border-0"
              )}
            >
              {isComplete ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <Truck className="h-3 w-3 mr-1 animate-pulse" />
              )}
              {currentConfig.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Journey Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <p className="text-2xl font-bold font-mono">{chain.events.length}</p>
              <p className="text-xs text-muted-foreground">Total Events</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <p className="text-2xl font-bold font-mono">
                {chain.events.filter(e => e.verifiedBy).length}
              </p>
              <p className="text-xs text-muted-foreground">Verified</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <p className="text-2xl font-bold font-mono">
                {chain.events.reduce((acc, e) => acc + e.documents.length, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Timeline Events */}
      <div className="pl-2">
        {sortedEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Events Recorded</h3>
              <p className="text-muted-foreground max-w-sm">
                Chain of custody events will appear here as the material progresses through the supply chain.
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedEvents.map((event, index) => (
            <CustodyEventCard
              key={event.id}
              event={event}
              isLast={index === sortedEvents.length - 1}
              isActive={event.eventType === chain.currentStatus}
            />
          ))
        )}
      </div>
    </div>
  );
}
