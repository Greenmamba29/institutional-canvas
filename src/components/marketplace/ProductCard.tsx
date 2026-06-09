import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Package, Beaker, TrendingUp } from "lucide-react";
import { VerificationBadge, type BadgeTier } from "@/components/shared/VerificationBadge";
import { useCurrency } from "@/hooks/useCurrency";

// Numeric purities get "%"; non-numeric grade labels render clean & title-cased.
function formatPurity(purity: string | number | null | undefined): string {
  if (purity === null || purity === undefined || purity === "") return "—";
  const raw = String(purity).trim();
  const numeric = Number(raw);
  if (raw !== "" && !Number.isNaN(numeric)) {
    return `${numeric}%`;
  }
  return raw
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface Product {
  id: string;
  name: string;
  product_type: string;
  purity_level: string;
  price_per_unit: number;
  currency: string;
  unit: string;
  availability: string;
  min_order_quantity: number | null;
  supplier_id: string;
}

interface ProductCardProps {
  product: Product;
  supplierName?: string;
  verificationTier?: BadgeTier;
}

export function ProductCard({ product, supplierName, verificationTier }: ProductCardProps) {
  const { format: formatPrice } = useCurrency();

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "in-stock":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "limited":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getProductTypeIcon = (type: string) => {
    switch (type) {
      case "raw":
        return <Package className="h-4 w-4" />;
      case "compound":
        return <Beaker className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <Link to={`/marketplace/suppliers/${product.supplier_id}`}>
      <Card className="group hover:border-primary/30 transition-all duration-300 border-glow h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                {getProductTypeIcon(product.product_type)}
              </div>
              <Badge variant="outline" className={getAvailabilityColor(product.availability)}>
                {product.availability === "in-stock" ? "In Stock" : 
                 product.availability === "limited" ? "Limited" : "Contact"}
              </Badge>
            </div>
            {verificationTier && (
              <VerificationBadge tier={verificationTier} />
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </h3>
            {supplierName && (
              <p className="text-sm text-muted-foreground">{supplierName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>Type:</span>
              <span className="font-medium text-foreground capitalize">
                {product.product_type}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span>Purity:</span>
              <span className="font-mono font-medium text-foreground">
                {formatPurity(product.purity_level)}
              </span>
            </div>
          </div>

          {product.min_order_quantity && (
            <p className="text-xs text-muted-foreground">
              Min. Order: {product.min_order_quantity} {product.unit}
            </p>
          )}
        </CardContent>

        <CardFooter className="pt-3 border-t border-border/50">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Price</span>
            <div className="text-right">
              <p className="font-mono text-xl font-bold text-primary">
                {formatPrice(product.price_per_unit)}
              </p>
              <p className="text-xs text-muted-foreground">per {product.unit}</p>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
