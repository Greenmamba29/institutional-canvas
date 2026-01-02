import { useCompare } from '@/contexts/CompareContext';
import { useSupplier } from '@/hooks/useSuppliers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  MapPin,
  Star,
  Award,
  Clock,
  TrendingUp,
  Package,
  Globe,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  X,
} from 'lucide-react';
import { useLocation } from 'wouter';

interface SupplierComparisonData {
  id: string;
  data?: any;
  isLoading: boolean;
}

function ComparisonRow({
  label,
  icon: Icon,
  values,
}: {
  label: string;
  icon: any;
  values: (string | number | null | undefined)[];
}) {
  return (
    <div className="grid grid-cols-[200px_1fr] gap-4 py-3 border-b border-border last:border-b-0">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {values.map((value, idx) => (
          <div key={idx} className="text-sm">
            {value ?? <span className="text-muted-foreground italic">N/A</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="grid grid-cols-[200px_1fr] gap-4 py-3">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, j) => (
              <Skeleton key={j} className="h-5 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CompareModal() {
  const { selectedSuppliers, isCompareOpen, setIsCompareOpen, clearSuppliers, removeSupplier } =
    useCompare();
  const [, navigate] = useLocation();

  // Fetch full details for each supplier
  const supplierQueries: SupplierComparisonData[] = selectedSuppliers.map((s) => {
    const query = useSupplier(s.id);
    return {
      id: s.id,
      data: query.data?.data,
      isLoading: query.isLoading,
    };
  });

  const isLoading = supplierQueries.some((q) => q.isLoading);
  const suppliers = supplierQueries.map((q) => q.data).filter(Boolean);

  const handleClose = () => {
    setIsCompareOpen(false);
  };

  const handleViewSupplier = (supplierId: string) => {
    navigate(`/suppliers/${supplierId}`);
    handleClose();
  };

  // Pad arrays to 4 for consistent grid
  const padArray = <T,>(arr: T[], length: number = 4): (T | undefined)[] => {
    return [...arr, ...Array(length - arr.length).fill(undefined)];
  };

  return (
    <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Compare Suppliers ({selectedSuppliers.length})
          </DialogTitle>
          <DialogDescription>
            Side-by-side comparison of supplier details, ratings, and certifications
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <LoadingState />
        ) : (
          <div className="space-y-6">
            {/* Supplier Headers */}
            <div className="grid grid-cols-[200px_1fr] gap-4">
              <div className="text-sm font-medium text-muted-foreground">Supplier</div>
              <div className="grid grid-cols-4 gap-4">
                {padArray(suppliers).map((supplier, idx) =>
                  supplier ? (
                    <div key={supplier.id} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base">{supplier.name}</h3>
                          <Badge
                            variant={
                              supplier.verification_tier === 'gold'
                                ? 'default'
                                : supplier.verification_tier === 'silver'
                                  ? 'secondary'
                                  : 'outline'
                            }
                            className="mt-1"
                          >
                            {supplier.verification_tier}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeSupplier(supplier.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleViewSupplier(supplier.id)}
                      >
                        View Details
                      </Button>
                    </div>
                  ) : (
                    <div key={idx} className="text-sm text-muted-foreground italic">
                      Empty slot
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Comparison Rows */}
            <div className="space-y-0 border border-border rounded-lg overflow-hidden">
              <ComparisonRow
                label="Rating"
                icon={Star}
                values={padArray(suppliers).map((s) =>
                  s ? `⭐ ${s.rating.toFixed(1)} (${s.review_count} reviews)` : undefined
                )}
              />

              <ComparisonRow
                label="Transactions"
                icon={TrendingUp}
                values={padArray(suppliers).map((s) =>
                  s ? `${s.transaction_count} completed` : undefined
                )}
              />

              <ComparisonRow
                label="Response Time"
                icon={Clock}
                values={padArray(suppliers).map((s) => s?.response_time ?? undefined)}
              />

              <ComparisonRow
                label="Years in Business"
                icon={Calendar}
                values={padArray(suppliers).map((s) =>
                  s?.years_in_business ? `${s.years_in_business} years` : undefined
                )}
              />

              <ComparisonRow
                label="Location"
                icon={MapPin}
                values={padArray(suppliers).map((s) => {
                  const location = s?.locations?.[0];
                  return location ? `${location.city ?? location.country}, ${location.country}` : undefined;
                })}
              />

              <ComparisonRow
                label="Products"
                icon={Package}
                values={padArray(suppliers).map((s) =>
                  s?.products?.length ? `${s.products.length} products` : undefined
                )}
              />

              <ComparisonRow
                label="Price Range"
                icon={DollarSign}
                values={padArray(suppliers).map((s) => {
                  if (!s?.products?.length) return undefined;
                  const prices = s.products.map((p: any) => p.price_per_unit);
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  const currency = s.products[0].currency;
                  return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
                })}
              />

              <ComparisonRow
                label="Certifications"
                icon={Award}
                values={padArray(suppliers).map((s) =>
                  s?.certifications?.length
                    ? s.certifications.map((c: any) => c.certification_type).join(', ')
                    : undefined
                )}
              />

              <ComparisonRow
                label="Website"
                icon={Globe}
                values={padArray(suppliers).map((s) => {
                  const website = s?.supplier_profiles?.[0]?.website;
                  return website ? (
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:underline"
                    >
                      Visit
                    </a>
                  ) : undefined;
                })}
              />

              <ComparisonRow
                label="Email"
                icon={Mail}
                values={padArray(suppliers).map((s) => {
                  const email = s?.supplier_profiles?.[0]?.contact_email;
                  return email ? (
                    <a href={`mailto:${email}`} className="text-gold hover:underline truncate block">
                      {email}
                    </a>
                  ) : undefined;
                })}
              />

              <ComparisonRow
                label="Phone"
                icon={Phone}
                values={padArray(suppliers).map((s) => s?.supplier_profiles?.[0]?.phone ?? undefined)}
              />

              <ComparisonRow
                label="Specialties"
                icon={Package}
                values={padArray(suppliers).map((s) => {
                  const specialties = s?.supplier_profiles?.[0]?.specialties;
                  return specialties?.length ? specialties.join(', ') : undefined;
                })}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="outline" onClick={clearSuppliers}>
                Clear All
              </Button>
              <Button variant="ghost" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
