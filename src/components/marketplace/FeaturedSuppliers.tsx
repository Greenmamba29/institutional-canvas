import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Star, Package, MapPin, ChevronRight } from "lucide-react";
import { useFeaturedSuppliers } from "@/hooks/useSuppliers";
import { VerificationBadge, type BadgeTier } from "@/components/shared/VerificationBadge";

export function FeaturedSuppliers() {
  const { data: suppliers, isLoading } = useFeaturedSuppliers();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Featured Suppliers</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="glass-panel">
              <CardContent className="p-4">
                <Skeleton className="h-12 w-12 rounded-lg mb-3" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Featured Suppliers</h2>
        <Link 
          to="/marketplace?tab=suppliers" 
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {suppliers.map((supplier) => {
          const publicProfile = supplier.public_profile as Record<string, unknown> | null;
          const capabilities = supplier.capabilities as Record<string, unknown> | null;
          
          return (
            <Link 
              key={supplier.org_id} 
              to={`/marketplace/suppliers/${supplier.org_id}`}
            >
              <Card className="glass-panel hover:border-primary/30 transition-all h-full group">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg bg-primary/10">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <VerificationBadge 
                      tier={(supplier.verification_tier as BadgeTier) || 'basic'} 
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {supplier.display_name || 'Unnamed Supplier'}
                    </h3>
                    {publicProfile?.headquarters && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {String(publicProfile.headquarters)}
                      </p>
                    )}
                  </div>

                  {capabilities?.products && Array.isArray(capabilities.products) && (
                    <div className="flex flex-wrap gap-1">
                      {(capabilities.products as string[]).slice(0, 2).map((product, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {product.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {capabilities?.capacity_mt && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {Number(capabilities.capacity_mt).toLocaleString()} MT capacity
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
