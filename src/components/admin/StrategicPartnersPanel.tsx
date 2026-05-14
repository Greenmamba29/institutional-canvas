import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ExternalLink, ChevronDown, ChevronUp, Star, Target, Calendar, Building2 } from 'lucide-react';
import { useStrategicPartners, useStrategicPartnerStats, useUpdateStrategicPartner } from '@/hooks/useStrategicPartners';
import type { StrategicPartner } from '@/services/strategicPartners.service';

const TIER_STYLES: Record<string, string> = {
  'Tier 1 — High Priority':  'bg-red-100 text-red-800 border-red-200',
  'Tier 2 — Medium Priority': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Tier 3 — Long Horizon':    'bg-blue-100 text-blue-800 border-blue-200',
};

const STATUS_STYLES: Record<string, string> = {
  'Not Started':       'bg-gray-100 text-gray-600',
  'Researching':       'bg-blue-100 text-blue-700',
  'Outreach Sent':     'bg-yellow-100 text-yellow-700',
  'In Conversation':   'bg-orange-100 text-orange-700',
  'Partnership Agreed':'bg-green-100 text-green-700',
  'Active Partner':    'bg-emerald-100 text-emerald-700',
};

const OUTREACH_STATUSES = [
  'Not Started', 'Researching', 'Outreach Sent',
  'In Conversation', 'Partnership Agreed', 'Active Partner',
];

const TIERS = ['Tier 1 — High Priority', 'Tier 2 — Medium Priority', 'Tier 3 — Long Horizon'];
const SEGMENTS = [
  'Battery Recycler', 'Graphite Processor', 'Lithium Refiner', 'Anode Manufacturer',
  'Black Mass Trader', 'State Energy Office', 'University / National Lab',
  'Hyperscaler / Data Center', 'Defense Supplier', 'Grid Storage Operator',
];

function PriorityStars({ score }: { score: number | null }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`h-3 w-3 ${n <= (score ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
        />
      ))}
    </span>
  );
}

function StatsBar() {
  const { data: stats, isLoading } = useStrategicPartnerStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  const cards = [
    { label: 'Total Targets', value: stats?.total ?? 0, color: 'text-blue-600' },
    { label: 'Tier 1 Priority', value: stats?.tier1 ?? 0, color: 'text-red-600' },
    { label: 'In Progress', value: stats?.inProgress ?? 0, color: 'text-orange-600' },
    { label: 'Active Partners', value: stats?.activePartners ?? 0, color: 'text-green-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map(({ label, value, color }) => (
        <Card key={label}>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PartnerRow({ partner }: { partner: StrategicPartner }) {
  const [expanded, setExpanded] = useState(false);
  const update = useUpdateStrategicPartner();

  return (
    <>
      <tr
        className="border-b border-border/40 hover:bg-muted/30 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="py-3 px-4">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
            <div>
              <p className="font-medium text-sm">{partner.organization_name}</p>
              <p className="text-xs text-muted-foreground">{partner.hq_city} · {partner.country}</p>
            </div>
          </div>
        </td>
        <td className="py-3 px-4">
          <Badge className={`text-xs border ${TIER_STYLES[partner.partner_tier ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
            {partner.partner_tier?.replace(' — High Priority', '').replace(' — Medium Priority', '').replace(' — Long Horizon', '') ?? '—'}
          </Badge>
        </td>
        <td className="py-3 px-4 text-xs text-muted-foreground">{partner.segment ?? '—'}</td>
        <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
          <Select
            value={partner.outreach_status ?? 'Not Started'}
            onValueChange={v => update.mutate({ id: partner.id, updates: { outreach_status: v } })}
          >
            <SelectTrigger className="h-7 text-xs w-36 border-0 bg-transparent p-0 focus:ring-0">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[partner.outreach_status ?? 'Not Started'] ?? ''}`}>
                {partner.outreach_status ?? 'Not Started'}
              </span>
            </SelectTrigger>
            <SelectContent>
              {OUTREACH_STATUSES.map(s => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>
        <td className="py-3 px-4"><PriorityStars score={partner.priority_score} /></td>
        <td className="py-3 px-4 text-xs text-muted-foreground max-w-[200px] truncate">{partner.next_action ?? '—'}</td>
        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
          {partner.next_action_date ? (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />{partner.next_action_date}
            </span>
          ) : '—'}
        </td>
        <td className="py-3 px-4">
          {partner.website && (
            <a href={partner.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </a>
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-border/40 bg-muted/20">
          <td colSpan={8} className="px-6 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <Target className="h-3 w-3" /> Key Opportunity
                </div>
                <p className="text-sm leading-relaxed">{partner.key_opportunity ?? '—'}</p>

                {partner.revenue_streams && partner.revenue_streams.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {partner.revenue_streams.map(rs => (
                      <Badge key={rs} variant="outline" className="text-xs">{rs}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {partner.contact_name && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</p>
                    <p className="text-sm">{partner.contact_name}</p>
                    {partner.contact_email && (
                      <a href={`mailto:${partner.contact_email}`} className="text-xs text-primary hover:underline">
                        {partner.contact_email}
                      </a>
                    )}
                  </div>
                )}
                {partner.notes && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</p>
                    <p className="text-sm text-muted-foreground">{partner.notes}</p>
                  </div>
                )}
                <div className="flex gap-2 mt-2">
                  {partner.linkedin_url && (
                    <a href={partner.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-7 text-xs">LinkedIn</Button>
                    </a>
                  )}
                  {partner.website && (
                    <a href={partner.website} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-7 text-xs">Website</Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function StrategicPartnersPanel() {
  const [tierFilter, setTierFilter] = useState<string>('');
  const [segmentFilter, setSegmentFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: partners, isLoading, error } = useStrategicPartners({
    tier: tierFilter || undefined,
    segment: segmentFilter || undefined,
    status: statusFilter || undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Strategic Partners CRM</h2>
        </div>
        <p className="text-xs text-muted-foreground">Admin only · {partners?.length ?? 0} targets</p>
      </div>

      <StatsBar />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger className="h-8 text-xs w-44">
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="" className="text-xs">All Tiers</SelectItem>
            {TIERS.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="h-8 text-xs w-48">
            <SelectValue placeholder="All Segments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="" className="text-xs">All Segments</SelectItem>
            {SEGMENTS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-xs w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="" className="text-xs">All Statuses</SelectItem>
            {OUTREACH_STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
          </SelectContent>
        </Select>

        {(tierFilter || segmentFilter || statusFilter) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setTierFilter(''); setSegmentFilter(''); setStatusFilter(''); }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : error ? (
        <p className="text-destructive text-sm">Failed to load partners: {(error as Error).message}</p>
      ) : (
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Organization</th>
                <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Tier</th>
                <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Segment</th>
                <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Priority</th>
                <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Next Action</th>
                <th className="text-left py-2 px-4 text-xs font-semibold text-muted-foreground">Date</th>
                <th className="py-2 px-4" />
              </tr>
            </thead>
            <tbody>
              {partners?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-muted-foreground text-sm">
                    No partners match the current filters
                  </td>
                </tr>
              ) : (
                partners?.map(p => <PartnerRow key={p.id} partner={p} />)
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
