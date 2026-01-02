/**
 * React Query hooks for Suppliers
 * All reads use React Query for caching + automatic refetching
 */

import { useQuery } from '@tanstack/react-query';
import {
  getSuppliers,
  getFeaturedSuppliers,
  getSupplierById,
  getSupplierProducts,
  getSupplierCertifications,
  getSupplierReviews,
  searchSuppliers,
} from '@/services/suppliers.service';
import { useRealtimeSubscription } from './useRealtimeSubscription';

export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...supplierKeys.lists(), filters] as const,
  featured: () => [...supplierKeys.all, 'featured'] as const,
  details: () => [...supplierKeys.all, 'detail'] as const,
  detail: (id: string) => [...supplierKeys.details(), id] as const,
  products: (id: string) => [...supplierKeys.detail(id), 'products'] as const,
  certifications: (id: string) => [...supplierKeys.detail(id), 'certifications'] as const,
  reviews: (id: string) => [...supplierKeys.detail(id), 'reviews'] as const,
  search: (query: string) => [...supplierKeys.all, 'search', query] as const,
};

export function useSuppliers(options?: { verificationTier?: string; limit?: number }) {
  // Subscribe to realtime changes
  useRealtimeSubscription({
    table: 'suppliers',
    event: '*',
    queryKey: supplierKeys.all,
  });

  return useQuery({
    queryKey: supplierKeys.list(options ?? {}),
    queryFn: async () => {
      const { data, error } = await getSuppliers(options);
      if (error) throw error;
      return data;
    },
  });
}

export function useFeaturedSuppliers() {
  return useQuery({
    queryKey: supplierKeys.featured(),
    queryFn: async () => {
      const { data, error } = await getFeaturedSuppliers();
      if (error) throw error;
      return data;
    },
  });
}

export function useSupplier(supplierId: string) {
  return useQuery({
    queryKey: supplierKeys.detail(supplierId),
    queryFn: async () => {
      const { data, error } = await getSupplierById(supplierId);
      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });
}

export function useSupplierProducts(supplierId: string) {
  return useQuery({
    queryKey: supplierKeys.products(supplierId),
    queryFn: async () => {
      const { data, error } = await getSupplierProducts(supplierId);
      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });
}

export function useSupplierCertifications(supplierId: string) {
  return useQuery({
    queryKey: supplierKeys.certifications(supplierId),
    queryFn: async () => {
      const { data, error } = await getSupplierCertifications(supplierId);
      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });
}

export function useSupplierReviews(supplierId: string) {
  return useQuery({
    queryKey: supplierKeys.reviews(supplierId),
    queryFn: async () => {
      const { data, error } = await getSupplierReviews(supplierId);
      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });
}

export function useSupplierSearch(query: string) {
  return useQuery({
    queryKey: supplierKeys.search(query),
    queryFn: async () => {
      const { data, error } = await searchSuppliers(query);
      if (error) throw error;
      return data;
    },
    enabled: query.length >= 2,
  });
}
