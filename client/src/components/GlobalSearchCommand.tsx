import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { useDebounce } from '@/hooks/useDebounce';
import { apiRequest } from '@/lib/queryClient';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Building2, Package, Search, MapPin } from 'lucide-react';

interface SearchResult {
  suppliers: Array<{
    id: string;
    name: string;
    country: string;
    rating: number;
    verification_tier: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    price_per_unit: number;
    currency: string;
    supplier_id: string;
    supplier_name?: string;
  }>;
}

export function GlobalSearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [, navigate] = useLocation();
  const debouncedQuery = useDebounce(query, 300);

  // CMD+K keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search API call
  const { data: results, isLoading } = useQuery<SearchResult>({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      const res = await apiRequest(
        'GET',
        `/api/search?q=${encodeURIComponent(debouncedQuery)}&type=all`
      );
      return res.json();
    },
    enabled: debouncedQuery.length > 2,
  });

  const handleSelect = (path: string) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setQuery('');
    }
  };

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder="Search suppliers, products, or locations..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && debouncedQuery.length > 2 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Search className="h-4 w-4 animate-spin mx-auto mb-2" />
            Searching...
          </div>
        )}

        {!isLoading && debouncedQuery.length > 2 && (
          <>
            <CommandEmpty>No results found for "{debouncedQuery}"</CommandEmpty>

            {/* Suppliers */}
            {results?.suppliers && results.suppliers.length > 0 && (
              <>
                <CommandGroup heading="Suppliers">
                  {results.suppliers.map((supplier) => (
                    <CommandItem
                      key={supplier.id}
                      value={`supplier-${supplier.id}`}
                      onSelect={() => handleSelect(`/suppliers/${supplier.id}`)}
                      className="cursor-pointer"
                    >
                      <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div className="flex items-center justify-between w-full">
                        <div className="flex-1">
                          <div className="font-medium">{supplier.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {supplier.country}
                            {supplier.verification_tier && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-gold/10 text-gold">
                                {supplier.verification_tier}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground ml-4">
                          ⭐ {supplier.rating.toFixed(1)}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {results?.products && results.products.length > 0 && <CommandSeparator />}
              </>
            )}

            {/* Products */}
            {results?.products && results.products.length > 0 && (
              <CommandGroup heading="Products">
                {results.products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={`product-${product.id}`}
                    onSelect={() =>
                      handleSelect(`/suppliers/${product.supplier_id}?product=${product.id}`)
                    }
                    className="cursor-pointer"
                  >
                    <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        {product.supplier_name && (
                          <div className="text-xs text-muted-foreground">
                            by {product.supplier_name}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-gold ml-4">
                        {product.currency} {product.price_per_unit.toLocaleString()}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}

        {debouncedQuery.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Type to search suppliers and products</p>
            <p className="text-xs mt-1">Minimum 3 characters required</p>
          </div>
        )}

        {debouncedQuery.length > 0 && debouncedQuery.length < 3 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <p>Type at least 3 characters to search</p>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
