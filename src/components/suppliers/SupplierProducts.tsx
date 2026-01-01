import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Beaker, TrendingUp, ShoppingCart } from "lucide-react";

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
}

interface SupplierProductsProps {
  products: Product[];
  onRequestQuote: () => void;
}

export function SupplierProducts({ products, onRequestQuote }: SupplierProductsProps) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  };

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
        return <Package className="h-5 w-5" />;
      case "compound":
        return <Beaker className="h-5 w-5" />;
      default:
        return <TrendingUp className="h-5 w-5" />;
    }
  };

  if (products.length === 0) {
    return (
      <Card className="glass-panel border-border/50">
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products available</h3>
          <p className="text-muted-foreground">
            This supplier hasn't listed any products yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="glass-panel border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {getProductTypeIcon(product.product_type)}
                </div>
                <div>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {product.product_type}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={getAvailabilityColor(product.availability)}>
                {product.availability === "in-stock" ? "In Stock" : 
                 product.availability === "limited" ? "Limited" : "Contact"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
              <div>
                <span className="text-muted-foreground">Purity:</span>
                <span className="ml-2 font-mono font-medium">{product.purity_level}%</span>
              </div>
              <div>
                <span className="text-muted-foreground">Min Order:</span>
                <span className="ml-2 font-mono font-medium">
                  {product.min_order_quantity || "N/A"} {product.unit}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div>
                <p className="font-mono text-xl font-bold text-primary">
                  {formatPrice(product.price_per_unit, product.currency)}
                </p>
                <p className="text-xs text-muted-foreground">per {product.unit}</p>
              </div>
              <Button size="sm" onClick={onRequestQuote}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Request Quote
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
