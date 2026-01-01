import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Package, Beaker, TrendingUp } from "lucide-react";
import { VerificationBadge } from "@/components/shared/VerificationBadge";

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

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
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
        return <Package className="h-4 w-4" />;
      case "compound":
        return <Beaker className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
              Product
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase hidden md:table-cell">
              Type
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">
              Purity
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase hidden lg:table-cell">
              Min Order
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
              Price
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/30">
          {products.map((product) => (
            <tr key={product.id} className="table-row-interactive">
              <td className="py-4 px-4">
                <Link
                  to={`/marketplace/suppliers/${product.supplier_id}`}
                  className="flex items-center gap-3"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    {getProductTypeIcon(product.product_type)}
                  </div>
                  <div>
                    <p className="font-medium hover:text-primary transition-colors">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {product.id.slice(0, 8)}...
                    </p>
                  </div>
                </Link>
              </td>
              <td className="py-4 px-4 hidden md:table-cell">
                <Badge variant="outline" className="capitalize">
                  {product.product_type}
                </Badge>
              </td>
              <td className="py-4 px-4 hidden sm:table-cell">
                <span className="font-mono">{product.purity_level}%</span>
              </td>
              <td className="py-4 px-4 text-right font-mono hidden lg:table-cell">
                {product.min_order_quantity || "—"} {product.unit}
              </td>
              <td className="py-4 px-4 text-right">
                <p className="font-mono font-bold text-primary">
                  {formatPrice(product.price_per_unit, product.currency)}
                </p>
                <p className="text-xs text-muted-foreground">/{product.unit}</p>
              </td>
              <td className="py-4 px-4 text-right">
                <Badge variant="outline" className={getAvailabilityColor(product.availability)}>
                  {product.availability === "in-stock" ? "In Stock" : 
                   product.availability === "limited" ? "Limited" : "Contact"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
