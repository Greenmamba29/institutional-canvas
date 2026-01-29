import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useOrganization } from "@/context/OrganizationContext";
import { toast } from "@/hooks/use-toast";

interface TelebuyGuardResult {
  ok: boolean;
  code?: string;
  message?: string;
  orgId?: string;
  profile?: string;
  userId?: string;
}

/**
 * Hook to check TeleBuy access via the telebuy-guard Edge Function.
 * This enforces all 7 security checks server-side:
 * 1. Authentication required
 * 2. Kill switch check
 * 3. Super admin blocked
 * 4. Onboarding profile required
 * 5. Org membership verified
 * 6. Capability check (use_telebuy)
 * 7. Profile type restriction (buyer/supplier/soe only)
 */
export function useTelebuyGuard() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();

  const guardMutation = useMutation({
    mutationFn: async (action: string): Promise<TelebuyGuardResult> => {
      if (!user) {
        return {
          ok: false,
          code: "AUTH_REQUIRED",
          message: "Please log in to use TeleBuy.",
        };
      }

      if (!currentOrg?.id) {
        return {
          ok: false,
          code: "NO_ORG",
          message: "Please select an organization first.",
        };
      }

      const { data, error } = await supabase.functions.invoke("telebuy-guard", {
        body: {
          org_id: currentOrg.id,
          action,
        },
      });

      if (error) {
        console.error("TeleBuy guard error:", error);
        return {
          ok: false,
          code: "NETWORK_ERROR",
          message: "Unable to verify TeleBuy access. Please try again.",
        };
      }

      return data as TelebuyGuardResult;
    },
    onError: (error) => {
      console.error("TeleBuy guard mutation error:", error);
      toast({
        title: "TeleBuy Access Error",
        description: "Unable to verify TeleBuy access. Please try again.",
        variant: "destructive",
      });
    },
  });

  /**
   * Check TeleBuy access for a specific action.
   * Call this before starting any TeleBuy session.
   * 
   * @param action - The TeleBuy action being attempted (e.g., 'start_session', 'join_session')
   * @returns Promise resolving to guard result
   */
  const checkAccess = async (action: string): Promise<TelebuyGuardResult> => {
    return guardMutation.mutateAsync(action);
  };

  /**
   * Check access and show appropriate error toast if denied.
   * Returns true if access is granted, false otherwise.
   */
  const checkAccessWithFeedback = async (action: string): Promise<boolean> => {
    const result = await checkAccess(action);

    if (!result.ok) {
      toast({
        title: "TeleBuy Access Denied",
        description: result.message || "You don't have access to TeleBuy.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  return {
    checkAccess,
    checkAccessWithFeedback,
    isChecking: guardMutation.isPending,
    lastResult: guardMutation.data,
    error: guardMutation.error,
  };
}
