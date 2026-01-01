import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Store,
  Search,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useProducts, type ProductFilters } from "@/hooks/useProducts";
import { SupplierFilters, type FilterState } from "@/components/marketplace/SupplierFilters";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { ProductList } from "@/components/marketplace/ProductList";
import { useDebounce } from "@/hooks/useDebounce";

const DEFAULT_FILTERS: FilterState = {
  verificationTier: [],
  productType: [],
  purityLevel: [],
  priceRange: [0, 100000],
  availability: [],
};

export default function Marketplace() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"created_at" | "price_per_unit" | "name">("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const debouncedSearch = useDebounce(searchQuery, 300);

  const productFilters: ProductFilters = useMemo(
    () => ({
      productType: filters.productType.length > 0 ? filters.productType : undefined,
      purityLevel: filters.purityLevel.length > 0 ? filters.purityLevel : undefined,
      availability: filters.availability.length > 0 ? filters.availability : undefined,
      priceRange:
        filters.priceRange[0] > 0 || filters.priceRange[1] < 100000
          ? filters.priceRange
          : undefined,
      search: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
      page,
      limit: 20,
      sortBy,
      sortOrder,
    }),
    [filters, debouncedSearch, page, sortBy, sortOrder]
  );

  const { data, isLoading, error, refetch } = useProducts(productFilters);

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
    setPage(1);
  }, []);

  const handleSortChange = (value: string) => {
    const [field, order] = value.split("-") as [typeof sortBy, typeof sortOrder];
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Marketplace"
          description="Browse verified lithium products from trusted suppliers"
          icon={Store}
        />

        {/* Search and Sort Bar */}
        <div className="glass-panel rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-border/50"
              />
            </div>
            <SupplierFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onReset={handleResetFilters}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at-desc">Newest First</SelectItem>
                <SelectItem value="created_at-asc">Oldest First</SelectItem>
                <SelectItem value="price_per_unit-asc">Price: Low to High</SelectItem>
                <SelectItem value="price_per_unit-desc">Price: High to Low</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Desktop Sidebar - shown by SupplierFilters component */}
          <SupplierFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />

          {/* Product Grid/List */}
          <div className="flex-1 space-y-4">
            {/* Results Count */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {isLoading
                  ? "Loading..."
                  : `${data?.total || 0} products found`}
              </span>
              {data && data.totalPages > 1 && (
                <span>
                  Page {data.page} of {data.totalPages}
                </span>
              )}
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className={viewMode === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="glass-panel rounded-xl p-4">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2 mb-4" />
                    <Skeleton className="h-20 w-full mb-4" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="glass-panel rounded-xl p-8 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Failed to load products</h3>
                <p className="text-muted-foreground mb-4">
                  There was an error loading the marketplace. Please try again.
                </p>
                <Button onClick={() => refetch()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && data?.products.length === 0 && (
              <div className="glass-panel rounded-xl p-8 text-center">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search query.
                </p>
                <Button onClick={handleResetFilters} variant="outline">
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* Products Display */}
            {!isLoading && !error && data && data.products.length > 0 && (
              <>
                {viewMode === "grid" ? (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {data.products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <ProductList products={data.products} />
                )}

                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (data.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= data.totalPages - 2) {
                        pageNum = data.totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="icon"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      disabled={page === data.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
