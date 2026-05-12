import { Lock, Zap, ArrowRight, Recycle, FlaskConical, Battery, Layers, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsSuperAdmin } from '@/hooks/useIsSuperAdmin';
import { useMyMatches } from '@/hooks/useIntroductions';
import { useStrategicPartnerStats } from '@/hooks/useStrategicPartners';
import type { Introduction } from '@/services/introductions.service';

// Static teaser pairs shown when no live matches exist for the user
const SEGMENT_PAIRS = [
  { seller: 'Battery Recycler',  buyer: 'Anode Manufacturer',   commodity: 'Black Mass / Precursor',       icon: Recycle,      color: 'text-green-600'  },
  { seller: 'Graphite Processor',buyer: 'Cell Manufacturer',     commodity: 'Active Anode Material',        icon: Layers,       color: 'text-teal-600'   },
  { seller: 'Lithium Refiner',   buyer: 'Cathode Manufacturer',  commodity: 'Lithium Hydroxide / Carbonate',icon: FlaskConical, color: 'text-blue-600'   },
  { seller: 'DOE Grant Recipient',buyer: 'Battery OEM',          commodity: 'Consortium + Offtake',         icon: Battery,      color: 'text-purple-600' },
];

const STATUS_COLORS: Record<string, string> = {
  'Pending':        'bg-yellow-100 text-yellow-800',
  'Introduced':     'bg-blue-100 text-blue-800',
  'In Negotiation': 'bg-orange-100 text-orange-800',
};

function LiveMatchCard({ intro }: { intro: Introduction }) {
  return (
    <Card className="border-primary/20 bg-primary/5 hover:border-primary/40 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Badge className={`text-xs ${STATUS_COLORS[intro.status] ?? 'bg-gray-100 text-gray-700'}`}>
            {intro.status}
          </Badge>
          {intro.intro_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />{intro.intro_date}
            </span>
          )}
        </div>

        <p className="text-sm font-semibold leading-tight">
          {intro.buyer_org} <ArrowRight className="inline h-3 w-3 mx-0.5" /> {intro.seller_org}
        </p>

        {intro.commodity && (
          <p className="text-xs text-muted-foreground mt-1">{intro.commodity}</p>
        )}

        {intro.deal_value_usd && (
          <p className="text-xs font-medium text-green-700 mt-2">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(intro.deal_value_usd)} pipeline
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TeaserCard({ seller, buyer, commodity, icon: Icon, color }: typeof SEGMENT_PAIRS[0]) {
  return (
    <Card className="relative overflow-hidden border-border/60">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <Icon className={`h-5 w-5 ${color}`} />
          <Badge variant="outline" className="text-xs gap-1">
            <Lock className="h-2.5 w-2.5" /> Match Pending
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm font-medium blur-sm select-none">
            <span>{seller}</span>
            <ArrowRight className="h-3 w-3 flex-shrink-0" />
            <span>{buyer}</span>
          </div>
          <p className="text-xs text-muted-foreground">{commodity}</p>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent pointer-events-none" />
      </CardContent>
    </Card>
  );
}

export function MatchmakingTeaser() {
  const { isSuperAdmin } = useIsSuperAdmin();
  const { data: myMatches = [], isLoading } = useMyMatches();
  const { data: stats } = useStrategicPartnerStats();

  const hasLiveMatches = myMatches.length > 0;
  const pipelineCount = stats?.tier1 ?? 0;

  return (
    <div className="mb-8 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          <h3 className="font-semibold text-sm">
            {hasLiveMatches ? 'Your Active Matches' : 'Pending Matchmaking Opportunities'}
          </h3>
          {hasLiveMatches && (
            <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
              {myMatches.length} live
            </Badge>
          )}
          {!hasLiveMatches && pipelineCount > 0 && (
            <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
              {pipelineCount} targets identified
            </Badge>
          )}
        </div>

        {isSuperAdmin ? (
          <a href="/admin">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
              CRM <ArrowRight className="h-3 w-3" />
            </Button>
          </a>
        ) : (
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1 opacity-60" disabled>
            <Lock className="h-3 w-3" /> Admin Only
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : hasLiveMatches ? (
        // Real matches — visible to the org that is named as buyer or seller
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {myMatches.slice(0, 6).map(m => (
            <LiveMatchCard key={m.id} intro={m} />
          ))}
        </div>
      ) : (
        // No live matches yet — show locked segment teasers
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SEGMENT_PAIRS.map(pair => <TeaserCard key={pair.seller} {...pair} />)}
          </div>
          {!isSuperAdmin && (
            <p className="text-xs text-muted-foreground text-center pt-1">
              LithiumBuy has {pipelineCount} strategic partners identified across Battery Recycler, Graphite Processor, and Lithium Refiner segments.
              Contact your account manager to activate introductions.
            </p>
          )}
        </>
      )}
    </div>
  );
}
