/**
 * useCheckout — Stripe Checkout integration hook
 *
 * Calls the create-checkout-session edge function and redirects to Stripe.
 * On return from Stripe, invalidates the subscription cache so the gate
 * reflects the new tier immediately.
 */

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useOrganization } from '@/context/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { STRIPE_PRODUCTS, type StripePlan } from '@/lib/stripe/config';
import { toast } from 'sonner';

export type BillingCycle = 'monthly' | 'annual';

interface UseCheckoutReturn {
  startCheckout: (plan: StripePlan, cycle: BillingCycle) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useCheckout(): UseCheckoutReturn {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle return from Stripe Checkout
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const cancelled = searchParams.get('cancelled');
    const billing   = searchParams.get('billing') as BillingCycle | null;

    if (sessionId) {
      // Invalidate subscription queries so SubscriptionGate re-checks access
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-gate'] });

      toast.success('Subscription activated!', {
        description: `Your ${billing === 'annual' ? 'annual' : 'monthly'} plan is now active. Welcome to LithiumBuy.`,
        duration: 6000,
      });

      // Clean up the URL params
      navigate('/dashboard', { replace: true });
    } else if (cancelled === '1') {
      toast.info('Checkout cancelled', {
        description: 'Your subscription was not changed.',
      });
      navigate('/settings/billing', { replace: true });
    }
  }, [searchParams, queryClient, navigate]);

  const startCheckout = async (plan: StripePlan, cycle: BillingCycle) => {
    if (!user || !currentOrg) {
      setError('You must be logged in with an organization to subscribe.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const product = STRIPE_PRODUCTS[plan];
      const priceId = cycle === 'annual' ? product.annualPriceId : product.priceId;

      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            priceId,
            organizationId: currentOrg.id,
            returnUrl: `${window.location.origin}/settings/billing`,
            billing: cycle,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Checkout failed');
      }

      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout (or Billing Portal for upgrades)
        window.location.href = data.checkoutUrl;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Checkout failed. Please try again.';
      setError(msg);
      toast.error('Checkout error', { description: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return { startCheckout, isLoading, error };
}

/**
 * useGracePeriod — checks if the current org is in a payment grace period.
 * Used by SubscriptionGate to show a warning banner without revoking access.
 */
export function useGracePeriod() {
  const { user } = useAuth();

  return {
    data: useGracePeriodQuery(user?.id),
  };
}

function useGracePeriodQuery(userId: string | undefined) {
  const [state, setState] = useState<{
    inGracePeriod: boolean;
    daysRemaining: number;
  }>({ inGracePeriod: false, daysRemaining: 0 });

  useEffect(() => {
    if (!userId) return;

    supabase.rpc('is_in_grace_period').then(({ data }) => {
      if (data) {
        supabase.rpc('grace_period_days_remaining').then(({ data: days }) => {
          setState({ inGracePeriod: true, daysRemaining: days ?? 0 });
        });
      }
    });
  }, [userId]);

  return state;
}
