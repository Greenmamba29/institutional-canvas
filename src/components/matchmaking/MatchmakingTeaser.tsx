import { Lock, Zap, ArrowRight, Recycle, FlaskConical, Battery, Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { useStrategicPartnerStats } from '@/hooks/useStrategicPartners';

interface MatchPair {
  seller: string;
  buyer: string;
  commodity: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const MATCH_PAIRS: MatchPair[] = [
  {
    seller: 'Battery Recycler',
    buyer: 'Anode Manufacturer',
    commodity: 'Black Mass / Precursor',
    icon: Recycle,
    color: 'text-green-600',
  },
  {
    seller: 'Graphite Processor',
    buyer: 'Cell Manufacturer',
    commodity: 'Active Anode Material',
    icon: Layers,
    color: 'text-teal-600',
  },
  {
    seller: 'Lithium Refiner',
    buyer: 'Cathode Manufacturer',
    commodity: 'Lithium Hydroxide / Carbonate',
    icon: FlaskConical,
    color: 'text-blue-600',
  },
  {
    seller: 'DOE Grant Recipient',
    buyer: 'Battery OEM',
    commodity: 'Consortium + Offtake',
    icon: Battery,
    color: 'text-purple-600',
  },
];

function TeaserCard({ pair, revealed }: { pair: MatchPair; revealed: boolean }) {
  const Icon = pair.icon;
  return (
    <Card className="relative overflow-hidden border-border/60 hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Icon className={`h-5 w-5 ${pair.color}`} />
          {!revealed && (
            <Badge variant="outline" className="text-xs gap-1">
              <Lock className="h-2.5 w-2.5" /> Match Pending
            </Badge>
          )}
          {revealed && (
            <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
              Active
            </Badge>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <span className={revealed ? '' : 'blur-sm select-none'}>{pair.seller}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className={revealed ? '' : 'blur-sm select-none'}>{pair.buyer}</span>
          </div>
          <p className="text-xs text-muted-foreground">{pair.commodity}</p>
        </div>

        {!revealed && (
          <div className="absolute inset-0 flex items-end justify-center pb-3 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
        )}
      </CardContent>
    </Card>
  );
}

export function MatchmakingTeaser() {
  const { isSuperAdmin } = useIsSuperAdmin();
  const { data: stats } = useStrategicPartnerStats();

  const activeCount = (stats?.tier1 ?? 0);

  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <h3 className="font-semibold text-sm">Pending Matchmaking Opportunities</h3>
          {activeCount > 0 && (
            <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
              {activeCount} targets identified
            </Badge>
          )}
        </div>

        {isSuperAdmin ? (
          <a href="/admin">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              View CRM <ArrowRight className="h-3 w-3" />
            </Button>
          </a>
        ) : (
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 opacity-60" disabled>
            <Lock className="h-3 w-3" /> Admin Only
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MATCH_PAIRS.map(pair => (
          <TeaserCard key={pair.seller} pair={pair} revealed={isSuperAdmin} />
        ))}
      </div>

      {!isSuperAdmin && (
        <p className="text-xs text-muted-foreground text-center pt-1">
          LithiumBuy has identified {activeCount} strategic partners across Battery Recycler, Graphite Processor, and Lithium Refiner segments.
          Contact your account manager to activate introductions.
        </p>
      )}
    </div>
  );
}
