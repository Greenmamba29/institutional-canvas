/**
 * React Query hooks for Dashboard data
 */

import { useQuery } from '@tanstack/react-query';
import {
  getDashboardStats,
  getDashboardActivity,
} from '@/services/files.service';
import {
  checkCanProcess,
  checkUsageLimit,
} from '@/services/usage.service';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activity: (limit: number) => [...dashboardKeys.all, 'activity', limit] as const,
  usage: (userId: string) => [...dashboardKeys.all, 'usage', userId] as const,
  canProcess: (userId: string) => [...dashboardKeys.all, 'canProcess', userId] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const { data, error } = await getDashboardStats();
      if (error) throw error;
      return data;
    },
  });
}

export function useDashboardActivity(limit: number = 20) {
  return useQuery({
    queryKey: dashboardKeys.activity(limit),
    queryFn: async () => {
      const { data, error } = await getDashboardActivity(limit);
      if (error) throw error;
      return data;
    },
  });
}

export function useUsageLimit(userId: string) {
  return useQuery({
    queryKey: dashboardKeys.usage(userId),
    queryFn: async () => {
      const { data, error } = await checkUsageLimit(userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useCanProcess(userId: string, requested: number = 1) {
  return useQuery({
    queryKey: dashboardKeys.canProcess(userId),
    queryFn: async () => {
      const { data, error } = await checkCanProcess(userId, requested);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
