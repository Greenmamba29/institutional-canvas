import { useState } from "react";
import { Link } from "react-router-dom";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { TrustBadge } from "@/components/shared/TrustBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Store,
  Search,
  Filter,
  Grid3X3,
  List,
  MapPin,
  Package,
  ArrowUpRight
} from "lucide-react";
import { listings, formatCurrency, formatVolume } from "@/data/mockData";

export default function Marketplace() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState("");

  const filteredListings = listings.filter(listing =>
    listing.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.origin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Marketplace"
          description="Browse verified lithium and battery metals listings"
          icon={Store}
        />

        {/* Filters bar */}
        <div className="glass-panel rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by commodity, supplier, origin..."
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
            <span className="text-sm text-muted-foreground mr-2">{filteredListings.length} listings</span>
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

        {/* Listings grid */}
        {viewMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredListings.map((listing) => (
              <Link
                key={listing.id}
                to={`/marketplace/${listing.id}`}
                className="card-premium p-5 group hover:border-primary/30 transition-all duration-300 border-glow"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-mono text-muted-foreground">{listing.id}</span>
                  <StatusPill status={listing.status} />
                </div>

                <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                  {listing.commodity}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{listing.supplierName}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Grade</span>
                    <span className="font-medium">{listing.grade}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Purity</span>
                    <span className="font-mono">{listing.purity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Volume</span>
                    <span className="font-mono font-bold">{formatVolume(listing.volume, listing.unit)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {listing.origin}
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xl font-bold text-gradient-primary">
                      {formatCurrency(listing.pricePerUnit)}
                    </p>
                    <p className="text-xs text-muted-foreground">per {listing.unit}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Listing</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Supplier</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Grade</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Volume</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Price</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredListings.map((listing) => (
                  <tr key={listing.id} className="table-row-interactive">
                    <td className="py-4 px-4">
                      <Link to={`/marketplace/${listing.id}`} className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium hover:text-primary transition-colors">{listing.commodity}</p>
                          <p className="text-xs text-muted-foreground font-mono">{listing.id}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium">{listing.supplierName}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {listing.origin}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium">{listing.grade}</p>
                      <p className="text-xs text-muted-foreground font-mono">{listing.purity}</p>
                    </td>
                    <td className="py-4 px-4 text-right font-mono font-bold">
                      {formatVolume(listing.volume, listing.unit)}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-mono font-bold text-primary">{formatCurrency(listing.pricePerUnit)}</p>
                      <p className="text-xs text-muted-foreground">/{listing.unit}</p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <StatusPill status={listing.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
