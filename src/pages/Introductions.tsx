import { useState } from 'react';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Handshake, Plus, DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle,
} from 'lucide-react';
import {
  useIntroductions, useIntroductionStats, useCreateIntroduction, useUpdateIntroductionStatus,
} from '@/hooks/useIntroductions';
import type { Introduction, IntroductionStatus } from '@/services/introductions.service';
import { MatchmakingTeaser } from '@/components/matchmaking/MatchmakingTeaser';

const STATUS_STYLES: Record<IntroductionStatus, string> = {
  'Pending':        'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Introduced':     'bg-blue-100 text-blue-800 border-blue-200',
  'In Negotiation': 'bg-orange-100 text-orange-800 border-orange-200',
  'Deal Closed':    'bg-green-100 text-green-800 border-green-200',
  'Fee Due':        'bg-red-100 text-red-800 border-red-200',
  'Paid Out':       'bg-teal-100 text-teal-800 border-teal-200',
  'Expired':        'bg-gray-100 text-gray-500 border-gray-200',
  'Cancelled':      'bg-gray-100 text-gray-500 border-gray-200',
};

const PAYOUT_STYLES: Record<string, string> = {
  'Unpaid':     'bg-red-50 text-red-700',
  'Processing': 'bg-yellow-50 text-yellow-700',
  'Paid':       'bg-green-50 text-green-700',
};

const COMMODITIES = [
  'Lithium Carbonate', 'Lithium Hydroxide', 'Black Mass',
  'Cathode Material', 'Cobalt Sulfate', 'Nickel Sulfate', 'Other',
];

const STATUSES: IntroductionStatus[] = [
  'Pending', 'Introduced', 'In Negotiation', 'Deal Closed', 'Fee Due', 'Paid Out', 'Expired', 'Cancelled',
];

function formatCurrency(value: number | null) {
  if (!value) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar() {
  const { data: stats, isLoading } = useIntroductionStats();

  const cards = [
    { label: 'Total Introductions', value: stats?.total ?? 0, icon: Handshake, color: 'text-blue-600' },
    { label: 'Pipeline Value', value: formatCurrency(stats?.totalPipelineValue ?? 0), icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Fees Earned', value: formatCurrency(stats?.totalFeesEarned ?? 0), icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Fees Due', value: formatCurrency(stats?.feesDue ?? 0), icon: DollarSign, color: 'text-red-600' },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-3">
              <Icon className={`h-5 w-5 ${color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-bold">{value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Create dialog ─────────────────────────────────────────────────────────────

function CreateIntroductionDialog() {
  const [open, setOpen] = useState(false);
  const createIntro = useCreateIntroduction();

  const [form, setForm] = useState({
    introducer_name: '', introducer_email: '', introducer_org: '',
    buyer_org: '', buyer_contact: '', buyer_email: '',
    seller_org: '', seller_contact: '', seller_email: '',
    commodity: '', intro_date: '', deal_value_usd: '',
    intro_fee_percent: '0.5', notes: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createIntro.mutateAsync({
      introducer_name: form.introducer_name,
      introducer_email: form.introducer_email || undefined,
      introducer_org: form.introducer_org || undefined,
      buyer_org: form.buyer_org,
      buyer_contact: form.buyer_contact || undefined,
      buyer_email: form.buyer_email || undefined,
      seller_org: form.seller_org,
      seller_contact: form.seller_contact || undefined,
      seller_email: form.seller_email || undefined,
      commodity: form.commodity || undefined,
      intro_date: form.intro_date || undefined,
      deal_value_usd: form.deal_value_usd ? Number(form.deal_value_usd) : undefined,
      intro_fee_percent: Number(form.intro_fee_percent),
      notes: form.notes || undefined,
    });
    setOpen(false);
    setForm({ introducer_name: '', introducer_email: '', introducer_org: '', buyer_org: '', buyer_contact: '', buyer_email: '', seller_org: '', seller_contact: '', seller_email: '', commodity: '', intro_date: '', deal_value_usd: '', intro_fee_percent: '0.5', notes: '' });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />Log Introduction</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log New Introduction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Introducer Name *</Label>
              <Input required value={form.introducer_name} onChange={e => set('introducer_name', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Introducer Org</Label>
              <Input value={form.introducer_org} onChange={e => set('introducer_org', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Buyer Org *</Label>
              <Input required value={form.buyer_org} onChange={e => set('buyer_org', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Seller Org *</Label>
              <Input required value={form.seller_org} onChange={e => set('seller_org', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Commodity</Label>
              <Select value={form.commodity} onValueChange={v => set('commodity', v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {COMMODITIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Intro Date</Label>
              <Input type="date" value={form.intro_date} onChange={e => set('intro_date', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Deal Value (USD)</Label>
              <Input type="number" min="0" step="1000" value={form.deal_value_usd} onChange={e => set('deal_value_usd', e.target.value)} placeholder="e.g. 500000" />
            </div>
            <div className="space-y-1">
              <Label>Intro Fee %</Label>
              <Input type="number" min="0" max="10" step="0.1" value={form.intro_fee_percent} onChange={e => set('intro_fee_percent', e.target.value)} />
            </div>
          </div>
          {form.deal_value_usd && (
            <p className="text-sm text-muted-foreground">
              Estimated fee: <span className="font-semibold text-green-600">
                {formatCurrency(Number(form.deal_value_usd) * Number(form.intro_fee_percent) / 100)}
              </span>
            </p>
          )}
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={createIntro.isPending}>
            {createIntro.isPending ? 'Saving...' : 'Log Introduction'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Introduction card ─────────────────────────────────────────────────────────

function IntroductionCard({ intro }: { intro: Introduction }) {
  const updateStatus = useUpdateIntroductionStatus();

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">
              {intro.buyer_org} ↔ {intro.seller_org}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              via {intro.introducer_name}{intro.introducer_org ? ` (${intro.introducer_org})` : ''}
            </p>
          </div>
          <Badge className={`text-xs border ${STATUS_STYLES[intro.status]}`}>
            {intro.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {intro.commodity && (
          <p className="text-xs text-muted-foreground">{intro.commodity}</p>
        )}

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-muted/40 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Deal Value</p>
            <p className="text-sm font-semibold">{formatCurrency(intro.deal_value_usd)}</p>
          </div>
          <div className="bg-muted/40 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Fee %</p>
            <p className="text-sm font-semibold">{intro.intro_fee_percent ?? 0.5}%</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Fee</p>
            <p className="text-sm font-bold text-green-700">{formatCurrency(intro.intro_fee_amount)}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYOUT_STYLES[intro.payout_status]}`}>
            {intro.payout_status}
          </span>
          {intro.intro_date && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />{intro.intro_date}
            </span>
          )}
        </div>

        <Select
          value={intro.status}
          onValueChange={v => updateStatus.mutate({ id: intro.id, status: v as IntroductionStatus })}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function Introductions() {
  const { data: introductions = [], isLoading, error } = useIntroductions();

  if (error) {
    return (
      <LayoutShell>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Failed to load introductions</h2>
          <p className="text-muted-foreground">{(error as Error).message}</p>
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <PageHeader
        title="Introduction Deals"
        description="Track buyer-seller introductions and earn intro fees when deals close"
        actions={<CreateIntroductionDialog />}
      />

      <StatsBar />

      <MatchmakingTeaser />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      ) : introductions.length === 0 ? (
        <div className="glass-panel rounded-xl p-10 text-center mt-4">
          <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No introductions yet</h3>
          <p className="text-muted-foreground mb-4">
            Log your first introduction to start tracking intro fees
          </p>
          <CreateIntroductionDialog />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {introductions.map(intro => (
            <IntroductionCard key={intro.id} intro={intro} />
          ))}
        </div>
      )}
    </LayoutShell>
  );
}
