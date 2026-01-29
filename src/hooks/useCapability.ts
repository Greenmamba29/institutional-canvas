import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook to check if the current user has a specific capability.
 * Capabilities are derived from the user's onboarding profile type.
 * Super admins have all capabilities.
 * 
 * @param capability - The capability key to check (e.g., 'use_telebuy', 'create_rfq')
 * @returns Query result with boolean indicating if user has the capability
 */
export function useCapability(capability: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["capability", user?.id, capability],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("has_capability", {
        p_capability: capability,
      });

      if (error) {
        console.error("Capability check error:", error);
        return false;
      }

      return data ?? false;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Hook to check multiple capabilities at once.
 * Returns an object with capability keys mapped to boolean values.
 * 
 * @param capabilities - Array of capability keys to check
 * @returns Query result with object mapping capabilities to booleans
 */
export function useCapabilities(capabilities: string[]) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["capabilities", user?.id, capabilities.sort().join(",")],
    queryFn: async () => {
      const results: Record<string, boolean> = {};

      // Run all capability checks in parallel
      const checks = await Promise.all(
        capabilities.map(async (cap) => {
          const { data, error } = await supabase.rpc("has_capability", {
            p_capability: cap,
          });
          return { cap, hasCapability: error ? false : (data ?? false) };
        })
      );

      checks.forEach(({ cap, hasCapability }) => {
        results[cap] = hasCapability;
      });

      return results;
    },
    enabled: !!user && capabilities.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to check if current user is a super admin.
 * Super admins have unrestricted access to all features.
 * 
 * @returns Query result with boolean indicating super admin status
 */
export function useSuperAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is_super_admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_super_admin");

      if (error) {
        console.error("Super admin check error:", error);
        return false;
      }

      return data ?? false;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get the current user's onboarding profile type.
 * Returns null if user hasn't completed onboarding.
 * 
 * @returns Query result with profile type ('buyer' | 'supplier' | 'soe' | 'investor' | null)
 */
export function useUserProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_user_profile");

      if (error) {
        console.error("Profile check error:", error);
        return null;
      }

      return data as "buyer" | "supplier" | "soe" | "investor" | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
