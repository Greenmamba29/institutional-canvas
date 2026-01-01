import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Package, FileText, Users, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";

interface SearchResult {
  id: string;
  type: "supplier" | "product" | "rfq";
  title: string;
  subtitle?: string;
  badge?: string;
}

export function GlobalSearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  // Keyboard shortcut to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search when query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }

    const search = async () => {
      setIsSearching(true);
      try {
        const searchResults: SearchResult[] = [];

        // Search products
        const { data: products } = await supabase
          .from("products")
          .select("id, name, product_type, purity_level")
          .ilike("name", `%${debouncedQuery}%`)
          .limit(5);

        if (products) {
          searchResults.push(
            ...products.map((p) => ({
              id: p.id,
              type: "product" as const,
              title: p.name,
              subtitle: `${p.product_type} - ${p.purity_level}`,
              badge: "Product",
            }))
          );
        }

        // Search RFQs
        const { data: rfqs } = await supabase
          .from("rfqs")
          .select("id, title, status")
          .ilike("title", `%${debouncedQuery}%`)
          .limit(5);

        if (rfqs) {
          searchResults.push(
            ...rfqs.map((r) => ({
              id: r.id,
              type: "rfq" as const,
              title: r.title,
              subtitle: r.status,
              badge: "RFQ",
            }))
          );
        }

        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    search();
  }, [debouncedQuery]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      setQuery("");

      switch (result.type) {
        case "supplier":
          navigate(`/marketplace/suppliers/${result.id}`);
          break;
        case "product":
          navigate(`/marketplace?product=${result.id}`);
          break;
        case "rfq":
          navigate(`/rfqs?id=${result.id}`);
          break;
      }
    },
    [navigate]
  );

  const getIcon = (type: string) => {
    switch (type) {
      case "supplier":
        return Building2;
      case "product":
        return Package;
      case "rfq":
        return FileText;
      default:
        return Search;
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search suppliers, products, RFQs..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isSearching && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {!isSearching && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {!isSearching && results.length > 0 && (
            <CommandGroup heading="Results">
              {results.map((result) => {
                const Icon = getIcon(result.type);
                return (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground">{result.subtitle}</p>
                      )}
                    </div>
                    {result.badge && (
                      <Badge variant="outline" className="text-xs">
                        {result.badge}
                      </Badge>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          <CommandSeparator />

          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => { setOpen(false); navigate("/marketplace"); }}>
              <Building2 className="mr-2 h-4 w-4" />
              Browse Marketplace
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); navigate("/rfqs"); }}>
              <FileText className="mr-2 h-4 w-4" />
              View RFQs
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); navigate("/team"); }}>
              <Users className="mr-2 h-4 w-4" />
              Team Settings
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); navigate("/settings"); }}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
