import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompare } from "@/context/CompareContext";
import { X, CheckCircle, XCircle, Minus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CompareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompareModal({ open, onOpenChange }: CompareModalProps) {
  const { items, removeItem, clearAll } = useCompare();

  if (items.length === 0) {
    return null;
  }

  // Define comparison attributes based on item type
  const attributes =
    items[0]?.type === "product"
      ? [
          { key: "product_type", label: "Product Type" },
          { key: "purity_level", label: "Purity Level" },
          { key: "price_per_unit", label: "Price per Unit", format: "currency" },
          { key: "min_order_quantity", label: "Min Order" },
          { key: "availability", label: "Availability" },
        ]
      : [
          { key: "verification_tier", label: "Verification" },
          { key: "rating", label: "Rating" },
          { key: "location", label: "Location" },
          { key: "products_count", label: "Products" },
        ];

  const formatValue = (value: unknown, format?: string): string => {
    if (value === null || value === undefined) return "-";
    if (format === "currency" && typeof value === "number") {
      return `$${value.toLocaleString()}`;
    }
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }
    return String(value);
  };

  const renderValueCell = (value: unknown, format?: string) => {
    const displayValue = formatValue(value, format);
    
    if (displayValue === "-") {
      return <Minus className="h-4 w-4 text-muted-foreground" />;
    }

    return <span className="font-medium">{displayValue}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Compare {items[0]?.type === "product" ? "Products" : "Suppliers"}</span>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground w-40">
                    Attribute
                  </th>
                  {items.map((item) => (
                    <th key={item.id} className="text-center py-3 px-4 min-w-40">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate max-w-32">
                            {item.name}
                          </span>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attributes.map((attr) => (
                  <tr key={attr.key} className="border-b border-border/50">
                    <td className="py-3 px-4 text-sm text-muted-foreground">
                      {attr.label}
                    </td>
                    {items.map((item) => (
                      <td key={item.id} className="py-3 px-4 text-center text-sm">
                        {renderValueCell(
                          item.data[attr.key],
                          (attr as { format?: string }).format
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
