/**
 * React Query hooks for Products
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
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
  created_at: string;
  updated_at: string;
}

export interface ProductFilters {
  productType?: string[];
  purityLevel?: string[];
  availability?: string[];
  priceRange?: [number, number];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price_per_unit' | 'created_at' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

async function fetchProducts(filters: ProductFilters = {}) {
  const {
    productType,
    purityLevel,
    availability,
    priceRange,
    search,
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = filters;

  let query = supabase.from('products').select('*', { count: 'exact' });

  // Apply filters
  if (productType && productType.length > 0) {
    query = query.in('product_type', productType);
  }

  if (purityLevel && purityLevel.length > 0) {
    query = query.in('purity_level', purityLevel);
  }

  if (availability && availability.length > 0) {
    query = query.in('availability', availability);
  }

  if (priceRange) {
    query = query.gte('price_per_unit', priceRange[0]).lte('price_per_unit', priceRange[1]);
  }

  if (search && search.length >= 2) {
    query = query.ilike('name', `%${search}%`);
  }

  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    products: data as Product[],
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  };
}

export function useProducts(filters: ProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => fetchProducts(filters),
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!productId,
  });
}
