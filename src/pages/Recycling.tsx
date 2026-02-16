/**
 * Recycling Marketplace Page
 * Battery recycling materials: black mass, recycled lithium, cathode scrap
 * Pulls from Supabase listings + Airtable Products table
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { listAirtableRecords } from '@/services/airtable-crud.service';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Leaf, Search, ShieldCheck, Beaker, Recycle, Package } from 'lucide-react';

const RECYCLING_TYPES = ['black_mass', 'recycled_lithium', 'cathode_scrap', 'anode_scrap', 'electrolyte_recovery'] as const;
type RecyclingType = typeof RECYCLING_TYPES[number];

const TYPE_LABELS: Record<RecyclingType, string> = {
  black_mass: 'Black Mass',
  recycled_lithium: 'Recycled Lithium',
  cathode_scrap: 'Cathode Scrap',
  anode_scrap: 'Anode Scrap',
  electrolyte_recovery: 'Electrolyte Recovery',
};

const TYPE_ICONS: Record<RecyclingType, typeof Beaker> = {
  black_mass: Beaker,
  recycled_lithium: Recycle,
  cathode_scrap: Package,
  anode_scrap: Package,
  electrolyte_recovery: Beaker,
};

export default function Recycling() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Supabase listings filtered to recycling product types
  const { data: listings, isLoading: listingsLoading, error: listingsError, refetch } = useQuery({
    queryKey: ['recycling-listings', typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by product_type if available in schema
      if (typeFilter !== 'all') {
        query = query.eq('product_type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  // Airtable supplementary data (Products table filtered to recycling)
  const { data: airtableData, isLoading: airtableLoading } = useQuery({
    queryKey: ['airtable-recycling-products'],
    queryFn: async () => {
      try {
        const result = await listAirtableRecords('Products', {
          filter: "{Type}='black_mass'",
          maxRecords: 50,
        });
        return result.records ?? [];
      } catch {
        // Airtable not configured is non-fatal
        return [];
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const filteredListings = (listings ?? []).filter((item: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.product_type?.toLowerCase().includes(q)
    );
  });

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
              placeholder="Search materials, grades, suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-48">
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

        {/* Stats summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filteredListings.length}</p>
                <p className="text-xs text-muted-foreground">Active Listings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Leaf className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{(airtableData as any[])?.length ?? 0}</p>
                <p className="text-xs text-muted-foreground">ESG Certified</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Recycle className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-xs text-muted-foreground">Material Types</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary">
                <ShieldCheck className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">100%</p>
                <p className="text-xs text-muted-foreground">Chain of Custody</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: All / By Type */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Materials</TabsTrigger>
            <TabsTrigger value="black_mass">Black Mass</TabsTrigger>
            <TabsTrigger value="recycled_lithium">Recycled Lithium</TabsTrigger>
            <TabsTrigger value="scrap">Scrap Materials</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <ListingsGrid
              listings={filteredListings}
              isLoading={listingsLoading}
              error={listingsError}
              refetch={refetch}
            />
          </TabsContent>

          <TabsContent value="black_mass" className="space-y-4">
            <ListingsGrid
              listings={filteredListings.filter((l: any) => l.product_type === 'black_mass')}
              isLoading={listingsLoading}
              error={listingsError}
              refetch={refetch}
              emptyMessage="No black mass listings available"
            />
          </TabsContent>

          <TabsContent value="recycled_lithium" className="space-y-4">
            <ListingsGrid
              listings={filteredListings.filter((l: any) => l.product_type === 'recycled_lithium')}
              isLoading={listingsLoading}
              error={listingsError}
              refetch={refetch}
              emptyMessage="No recycled lithium listings available"
            />
          </TabsContent>

          <TabsContent value="scrap" className="space-y-4">
            <ListingsGrid
              listings={filteredListings.filter((l: any) =>
                l.product_type === 'cathode_scrap' || l.product_type === 'anode_scrap' || l.product_type === 'electrolyte_recovery'
              )}
              isLoading={listingsLoading}
              error={listingsError}
              refetch={refetch}
              emptyMessage="No scrap material listings available"
            />
          </TabsContent>
        </Tabs>
      </div>
    </LayoutShell>
  );
}

function ListingsGrid({
  listings,
  isLoading,
  error,
  refetch,
  emptyMessage = 'No recycling listings found',
}: {
  listings: any[];
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
    return (
      <EmptyState
        icon={Recycle}
        title="No listings"
        description={emptyMessage}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {listings.map((item: any) => (
        <Card key={item.id} className="hover:border-primary/30 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base">{item.name || 'Untitled Material'}</CardTitle>
              {item.product_type && (
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {TYPE_LABELS[item.product_type as RecyclingType] || item.product_type}
                </Badge>
              )}
            </div>
            <CardDescription className="line-clamp-2">
              {item.description || 'No description provided'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Grade</span>
              <span className="font-medium">{item.grade || item.purity || '—'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Min Order</span>
              <span className="font-medium">{item.minimum_order_quantity ? `${item.minimum_order_quantity} ${item.unit || 'MT'}` : '—'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Price</span>
              <span className="font-mono font-bold text-primary">
                {item.price_per_unit ? `$${Number(item.price_per_unit).toLocaleString()}/${item.unit || 'MT'}` : 'RFQ'}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-2">
              {item.certifications && (
                <Badge variant="secondary" className="text-[10px]">
                  <Leaf className="h-3 w-3 mr-1" />
                  ESG
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px]">
                <ShieldCheck className="h-3 w-3 mr-1" />
                CoC Tracked
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
