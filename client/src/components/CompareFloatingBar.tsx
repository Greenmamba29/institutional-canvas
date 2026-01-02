import { useCompare } from '@/contexts/CompareContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CompareFloatingBar() {
  const { selectedSuppliers, removeSupplier, clearSuppliers, setIsCompareOpen } = useCompare();

  if (selectedSuppliers.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-card border-t border-border shadow-lg',
        'animate-in slide-in-from-bottom duration-300'
      )}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Selected suppliers */}
          <div className="flex items-center gap-3 flex-1 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm font-medium whitespace-nowrap">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span>Compare ({selectedSuppliers.length}/4):</span>
            </div>

            <div className="flex items-center gap-2">
              {selectedSuppliers.map((supplier) => (
                <Badge
                  key={supplier.id}
                  variant="secondary"
                  className="pl-3 pr-1.5 py-1.5 gap-2 whitespace-nowrap"
                >
                  <span className="font-medium">{supplier.name}</span>
                  <button
                    onClick={() => removeSupplier(supplier.id)}
                    className="hover:bg-muted rounded-sm p-0.5 transition-colors"
                    aria-label={`Remove ${supplier.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={clearSuppliers}>
              Clear All
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCompareOpen(true)}
              disabled={selectedSuppliers.length < 2}
              className="gap-2"
            >
              Compare Now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
