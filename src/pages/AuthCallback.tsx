import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AUTH_CONFIG } from '@/lib/auth/config';

/**
 * Auth Callback Page
 * 
 * Handles OAuth redirects, email verification, and password recovery callbacks.
 * Supabase redirects here after OAuth sign-in or email confirmation.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Parse URL hash for auth tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const errorDescription = hashParams.get('error_description');

        // Check for errors in URL
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

        // Handle password recovery flow
        if (type === 'recovery') {
          // Password recovery - redirect to auth page to update password
          navigate('/auth', { replace: true });
          return;
        }

        // Handle OAuth and email verification
        if (accessToken) {
          // Exchange the code/tokens for a session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }

          if (session) {
            // Successfully authenticated
            toast({
              title: 'Welcome!',
              description: 'You have successfully signed in.',
            });

            // Redirect to intended destination or dashboard
            const redirectTo = sessionStorage.getItem('auth_redirect') || AUTH_CONFIG.redirectUrls.afterSignIn;
            sessionStorage.removeItem('auth_redirect');
            navigate(redirectTo, { replace: true });
          } else {
            // No session but we have tokens - wait for auth state change
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
              if (event === 'SIGNED_IN' && newSession) {
                const redirectTo = sessionStorage.getItem('auth_redirect') || AUTH_CONFIG.redirectUrls.afterSignIn;
                sessionStorage.removeItem('auth_redirect');
                navigate(redirectTo, { replace: true });
              } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                // Handle sign out or token refresh
                navigate('/auth', { replace: true });
              }
            });

            // Cleanup subscription after 10 seconds if no redirect happened
            setTimeout(() => {
              subscription.unsubscribe();
              if (!session) {
                navigate('/auth', { replace: true });
              }
            }, 10000);
          }
        } else {
          // No tokens in URL - redirect to auth
          navigate('/auth', { replace: true });
        }
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
