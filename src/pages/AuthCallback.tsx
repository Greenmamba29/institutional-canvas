import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AUTH_CONFIG } from '@/lib/auth/config';

/**
 * Auth Callback Page
 * 
 * Handles OAuth redirects (Google, Apple), email verification, and password recovery callbacks.
 * With PKCE flow, Supabase sends ?code= in query params (not hash tokens).
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for errors in URL params
        const params = new URLSearchParams(window.location.search);
        const errorDescription = params.get('error_description') || params.get('error');
        
        if (errorDescription) {
          setError(errorDescription);
          toast({
            title: 'Authentication error',
            description: errorDescription,
            variant: 'destructive',
          });
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }

        // PKCE flow: exchange the ?code= param for a session
        const code = params.get('code');
        
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            throw exchangeError;
          }

          if (data.session) {
            toast({
              title: 'Welcome!',
              description: 'You have successfully signed in.',
            });

            const redirectTo = sessionStorage.getItem('auth_redirect') || AUTH_CONFIG.redirectUrls.afterSignIn;
            sessionStorage.removeItem('auth_redirect');
            navigate(redirectTo, { replace: true });
            return;
          }
        }

        // Fallback: check hash params (for non-PKCE flows like password recovery)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');

        if (type === 'recovery') {
          navigate('/auth', { replace: true });
          return;
        }

        // If we have hash tokens (implicit flow fallback)
        const accessToken = hashParams.get('access_token');
        if (accessToken) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            const redirectTo = sessionStorage.getItem('auth_redirect') || AUTH_CONFIG.redirectUrls.afterSignIn;
            sessionStorage.removeItem('auth_redirect');
            navigate(redirectTo, { replace: true });
            return;
          }
        }

        // No code or tokens - wait briefly for auth state change then redirect
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            const redirectTo = sessionStorage.getItem('auth_redirect') || AUTH_CONFIG.redirectUrls.afterSignIn;
            sessionStorage.removeItem('auth_redirect');
            navigate(redirectTo, { replace: true });
            subscription.unsubscribe();
          }
        });

        // Timeout: redirect to auth if nothing happens
        setTimeout(() => {
          subscription.unsubscribe();
          navigate('/auth', { replace: true });
        }, 5000);

      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        toast({
          title: 'Authentication error',
          description: err.message || 'Failed to complete authentication. Please try again.',
          variant: 'destructive',
        });
        setTimeout(() => navigate('/auth'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  );
}
