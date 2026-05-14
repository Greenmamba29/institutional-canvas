import { useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Store,
  Search,
  Filter,
  Grid3X3,
  List,
  MapPin,
  Package,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { useListings } from "@/hooks/useListings";
import { usePrices } from "@/hooks/useMarketData";

// Format currency helper
function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// Map availability to status for StatusPill
function mapAvailability(availability: string | null): 'active' | 'reserved' | 'sold' {
  switch (availability) {
    case 'in-stock': return 'active';
    case 'limited': return 'reserved';
    case 'contact': return 'sold';
    default: return 'active';
  }
}

export default function Marketplace() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products, isLoading, error } = useListings();
  const { data: marketPrices } = usePrices();

  // Filter products based on search
  const filteredProducts = products?.filter(product =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.product_type?.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  // Get market trend for a product type
  const getMarketTrend = (productName: string) => {
    const price = marketPrices?.find(p => 
      productName.toLowerCase().includes(p.product_type?.toLowerCase() ?? '')
    );
    return price?.market_trend ?? 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-success" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-destructive" />;
      default: return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Failed to load marketplace listings</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Lithium & Recycling Marketplace"
          description="Browse verified listings for primary lithium and advanced battery recycling materials"
          icon={Store}
        />

        {/* Filters bar */}
        <div className="glass-panel rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-2">
              {isLoading ? '...' : `${filteredProducts.length} listings`}
            </span>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-premium p-5 space-y-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-8 w-1/3 ml-auto" />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No listings found</h3>
            <p className="text-muted-foreground">Try adjusting your search criteria</p>
          </div>
        )}

        {/* Listings grid */}
        {!isLoading && viewMode === 'grid' && filteredProducts.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/marketplace/${product.id}`}
                className="card-premium p-5 group hover:border-primary/30 transition-all duration-300 border-glow"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground">
                    {product.id.slice(0, 8)}
                  </span>
                  <StatusPill status={mapAvailability(product.availability)} />
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  {getTrendIcon(getMarketTrend(product.name ?? ''))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 capitalize">
                  {product.product_type}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Purity</span>
                    <span className="font-mono">{isNaN(Number(product.purity_level)) ? product.purity_level : `${product.purity_level}%`}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Min Order</span>
                    <span className="font-mono font-bold">
                      {product.min_order_quantity} {product.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Availability</span>
                    <span className="capitalize">{product.availability?.replace('-', ' ')}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    {product.unit}
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xl font-bold text-gradient-primary">
                      {formatCurrency(Number(product.price_per_unit))}
                    </p>
                    <p className="text-xs text-muted-foreground">per {product.unit}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* List view */}
        {!isLoading && viewMode === 'list' && filteredProducts.length > 0 && (
          <div className="glass-panel rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Product</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Purity</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Min Order</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Price</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="table-row-interactive">
                    <td className="py-4 px-4">
                      <Link to={`/marketplace/${product.id}`} className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium hover:text-primary transition-colors">
                              {product.name}
                            </p>
                            {getTrendIcon(getMarketTrend(product.name ?? ''))}
                          </div>
                          <p className="text-xs text-muted-foreground font-mono">
                            {product.id.slice(0, 8)}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium capitalize">{product.product_type}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-mono">{isNaN(Number(product.purity_level)) ? product.purity_level : `${product.purity_level}%`}</p>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold">
                      {product.min_order_quantity} {product.unit}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-mono font-bold text-primary">
                        {formatCurrency(Number(product.price_per_unit))}
                      </p>
                      <p className="text-xs text-muted-foreground">/{product.unit}</p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <StatusPill status={mapAvailability(product.availability)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
