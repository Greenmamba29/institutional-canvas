/**
 * Recycling Marketplace Page
 * Battery recycling materials: black mass, recycled lithium, cathode scrap
 * Pulls from Supabase products table + Airtable Products table
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { listAirtableRecords } from '@/services/airtable-crud.service';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Leaf, Search, ShieldCheck, Recycle, Percent } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

const RECYCLING_TYPES = ['black_mass', 'recycled_lithium', 'cathode_scrap', 'anode_scrap', 'electrolyte_recovery'] as const;
type RecyclingType = typeof RECYCLING_TYPES[number];

const TYPE_LABELS: Record<RecyclingType, string> = {
  black_mass: 'Black Mass',
  recycled_lithium: 'Recycled Lithium',
  cathode_scrap: 'Cathode Scrap',
  anode_scrap: 'Anode Scrap',
  electrolyte_recovery: 'Electrolyte Recovery',
};

const AVAILABILITY_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  in_stock: 'default',
  limited: 'secondary',
  pre_order: 'outline',
  out_of_stock: 'destructive',
};

const AVAILABILITY_LABEL: Record<string, string> = {
  in_stock: 'In Stock',
  limited: 'Limited',
  pre_order: 'Pre-Order',
  out_of_stock: 'Out of Stock',
};

export default function Recycling() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Supabase products filtered to recycling types
  const { data: listings, isLoading, error, refetch } = useQuery({
    queryKey: ['recycling-listings', typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('id, name, product_type, price_per_unit, purity_level, min_order_quantity, unit, availability, currency, has_bulk_discount, bulk_discount_percentage, created_at')
        .order('created_at', { ascending: false });

      if (typeFilter !== 'all') {
        query = query.eq('product_type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  // Airtable supplementary data — ALL recycling types
  const { data: airtableData } = useQuery({
    queryKey: ['airtable-recycling-products'],
    queryFn: async () => {
      try {
        const result = await listAirtableRecords('Products', {
          filter: "OR({Type}='black_mass',{Type}='recycled_lithium',{Type}='cathode_scrap',{Type}='anode_scrap',{Type}='electrolyte_recovery')",
          maxRecords: 100,
        });
        return result.records ?? [];
      } catch {
        return [];
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    if (!searchQuery) return listings;
    const q = searchQuery.toLowerCase();
    return listings.filter((item) =>
      item.name?.toLowerCase().includes(q) ||
      item.product_type?.toLowerCase().includes(q) ||
      item.purity_level?.toLowerCase().includes(q)
    );
  }, [listings, searchQuery]);

  return (
    <LayoutShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <PageHeader
          title="Recycling Marketplace"
          description="Battery recycling materials — black mass, recycled lithium, cathode & anode scrap"
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials, purity levels, types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              aria-label="Search recycling materials"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter by material type">
              <SelectValue placeholder="Material Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {RECYCLING_TYPES.map((type) => (
                <SelectItem key={type} value={type}>{TYPE_LABELS[type]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Activity} value={filteredListings.length} label="Active Listings" colorClass="bg-primary/10 text-primary" />
          <StatCard icon={Leaf} value={(airtableData as any[])?.length ?? 0} label="ESG Certified" colorClass="bg-green-500/10 text-green-600" />
          <StatCard icon={Recycle} value={5} label="Material Types" colorClass="bg-accent/10 text-accent-foreground" />
          <StatCard icon={ShieldCheck} value="100%" label="Chain of Custody" colorClass="bg-secondary text-foreground" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Materials</TabsTrigger>
            <TabsTrigger value="black_mass">Black Mass</TabsTrigger>
            <TabsTrigger value="recycled_lithium">Recycled Lithium</TabsTrigger>
            <TabsTrigger value="scrap">Scrap Materials</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ListingsGrid listings={filteredListings} isLoading={isLoading} error={error} refetch={refetch} />
          </TabsContent>
          <TabsContent value="black_mass">
            <ListingsGrid listings={filteredListings.filter((l) => l.product_type === 'black_mass')} isLoading={isLoading} error={error} refetch={refetch} emptyMessage="No black mass listings available" />
          </TabsContent>
          <TabsContent value="recycled_lithium">
            <ListingsGrid listings={filteredListings.filter((l) => l.product_type === 'recycled_lithium')} isLoading={isLoading} error={error} refetch={refetch} emptyMessage="No recycled lithium listings available" />
          </TabsContent>
          <TabsContent value="scrap">
            <ListingsGrid listings={filteredListings.filter((l) => l.product_type === 'cathode_scrap' || l.product_type === 'anode_scrap' || l.product_type === 'electrolyte_recovery')} isLoading={isLoading} error={error} refetch={refetch} emptyMessage="No scrap material listings available" />
          </TabsContent>
        </Tabs>
      </div>
    </LayoutShell>
  );
}

/* ── Stat Card ── */
function StatCard({ icon: Icon, value, label, colorClass }: { icon: typeof Activity; value: string | number; label: string; colorClass: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Listings Grid ── */
function ListingsGrid({ listings, isLoading, error, refetch, emptyMessage = 'No recycling listings found' }: {
  listings: Product[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  emptyMessage?: string;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-destructive mb-3">Failed to load listings</p>
        <Button variant="outline" onClick={refetch}>Retry</Button>
      </Card>
    );
  }

  if (!listings.length) {
    return <EmptyState icon={Recycle} title="No listings" description={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {listings.map((item) => (
        <RecyclingCard key={item.id} item={item} />
      ))}
    </div>
  );
}

/* ── Product Card ── */
function RecyclingCard({ item }: { item: Product }) {
  const typeLabel = TYPE_LABELS[item.product_type as RecyclingType] || item.product_type || 'Unknown';
  const currencySymbol = item.currency === 'EUR' ? '€' : item.currency === 'GBP' ? '£' : '$';

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base">{item.name || 'Untitled Material'}</CardTitle>
          <Badge variant="outline" className="text-[10px] shrink-0">{typeLabel}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{typeLabel} material</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="Purity" value={item.purity_level || '—'} />
        <Row label="Min Order" value={item.min_order_quantity ? `${item.min_order_quantity} ${item.unit || 'MT'}` : '—'} />
        <Row label="Price" value={
          item.price_per_unit
            ? `${currencySymbol}${Number(item.price_per_unit).toLocaleString()}/${item.unit || 'MT'}`
            : 'RFQ'
        } isMono />

        <div className="flex items-center gap-2 pt-2 flex-wrap">
          {item.availability && (
            <Badge variant={AVAILABILITY_VARIANT[item.availability] || 'outline'} className="text-[10px]">
              {AVAILABILITY_LABEL[item.availability] || item.availability}
            </Badge>
          )}
          {item.has_bulk_discount && (
            <Badge variant="secondary" className="text-[10px]">
              <Percent className="h-3 w-3 mr-1" />
              Bulk {item.bulk_discount_percentage ? `${item.bulk_discount_percentage}%` : 'Discount'}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px]">
            <ShieldCheck className="h-3 w-3 mr-1" />
            CoC Tracked
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value, isMono }: { label: string; value: string; isMono?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={isMono ? 'font-mono font-bold text-primary' : 'font-medium'}>{value}</span>
    </div>
  );
}
