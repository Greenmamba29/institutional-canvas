import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface FilterState {
  verificationTier: string[];
  productType: string[];
  purityLevel: string[];
  priceRange: [number, number];
  availability: string[];
}

interface SupplierFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
}

const VERIFICATION_TIERS = [
  { value: "gold", label: "Gold Verified", color: "bg-yellow-500" },
  { value: "silver", label: "Silver Verified", color: "bg-gray-400" },
  { value: "bronze", label: "Bronze Verified", color: "bg-orange-600" },
];

const PRODUCT_TYPES = [
  { value: "raw", label: "Raw Materials" },
  { value: "compound", label: "Compounds" },
  { value: "processed", label: "Processed" },
];

const PURITY_LEVELS = [
  { value: "99", label: "99%" },
  { value: "99.5", label: "99.5%" },
  { value: "99.9", label: "99.9%" },
];

const AVAILABILITY_OPTIONS = [
  { value: "in-stock", label: "In Stock" },
  { value: "limited", label: "Limited" },
  { value: "contact", label: "Contact for Availability" },
];

export function SupplierFilters({ filters, onFiltersChange, onReset }: SupplierFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeFiltersCount = 
    filters.verificationTier.length +
    filters.productType.length +
    filters.purityLevel.length +
    filters.availability.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 100000 ? 1 : 0);

  const handleCheckboxChange = (
    key: keyof Pick<FilterState, 'verificationTier' | 'productType' | 'purityLevel' | 'availability'>,
    value: string,
    checked: boolean
  ) => {
    const currentValues = filters[key];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);
    onFiltersChange({ ...filters, [key]: newValues });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Verification Tier */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Verification Tier</Label>
        <div className="space-y-2">
          {VERIFICATION_TIERS.map((tier) => (
            <div key={tier.value} className="flex items-center space-x-2">
              <Checkbox
                id={`tier-${tier.value}`}
                checked={filters.verificationTier.includes(tier.value)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("verificationTier", tier.value, !!checked)
                }
              />
              <label
                htmlFor={`tier-${tier.value}`}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <span className={`w-3 h-3 rounded-full ${tier.color}`} />
                {tier.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Product Type */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Product Type</Label>
        <div className="space-y-2">
          {PRODUCT_TYPES.map((type) => (
            <div key={type.value} className="flex items-center space-x-2">
              <Checkbox
                id={`type-${type.value}`}
                checked={filters.productType.includes(type.value)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("productType", type.value, !!checked)
                }
              />
              <label htmlFor={`type-${type.value}`} className="text-sm cursor-pointer">
                {type.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Purity Level */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Purity Level</Label>
        <div className="space-y-2">
          {PURITY_LEVELS.map((purity) => (
            <div key={purity.value} className="flex items-center space-x-2">
              <Checkbox
                id={`purity-${purity.value}`}
                checked={filters.purityLevel.includes(purity.value)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("purityLevel", purity.value, !!checked)
                }
              />
              <label htmlFor={`purity-${purity.value}`} className="text-sm cursor-pointer">
                {purity.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Price Range (USD/ton)
        </Label>
        <div className="px-2">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, priceRange: value as [number, number] })
            }
            min={0}
            max={100000}
            step={1000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>${filters.priceRange[0].toLocaleString()}</span>
            <span>${filters.priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Availability</Label>
        <div className="space-y-2">
          {AVAILABILITY_OPTIONS.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`availability-${option.value}`}
                checked={filters.availability.includes(option.value)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("availability", option.value, !!checked)
                }
              />
              <label htmlFor={`availability-${option.value}`} className="text-sm cursor-pointer">
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      {activeFiltersCount > 0 && (
        <Button variant="outline" className="w-full" onClick={onReset}>
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile: Sheet */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative shrink-0">
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="glass-panel rounded-xl p-4 sticky top-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">{activeFiltersCount}</Badge>
            )}
          </div>
          <FilterContent />
        </div>
      </aside>
    </>
  );
}
