import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AUTH_CONFIG } from '@/lib/auth/config';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const STEPS = ['Verifying credentials...', 'Setting up session...', 'Redirecting...'];

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const stepTimer = setInterval(() => setStep(prev => Math.min(prev + 1, STEPS.length - 1)), 1200);

    const handleAuthCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const errorDescription = params.get('error_description') || params.get('error');

        if (errorDescription) {
          setError(errorDescription);
          toast({ title: 'Authentication error', description: errorDescription, variant: 'destructive' });
          return;
        }

        const code = params.get('code');

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;

          if (data.session) {
            setStep(2);

            // Check if first-time user (no org membership)
            const { data: orgMembers } = await supabase
              .from('org_members' as any)
              .select('id')
              .eq('user_id', data.session.user.id)
              .limit(1);

            const isNewUser = !orgMembers || orgMembers.length === 0;

            if (isNewUser) {
              sessionStorage.setItem('is_new_user', 'true');
              toast({ title: 'Welcome!', description: 'Let\'s get you set up.' });
              navigate('/onboarding', { replace: true });
            } else {
              toast({ title: 'Welcome back!', description: 'You have successfully signed in.' });
              const redirectTo = sessionStorage.getItem('auth_redirect') || AUTH_CONFIG.redirectUrls.afterSignIn;
              sessionStorage.removeItem('auth_redirect');
              navigate(redirectTo, { replace: true });
            }
            return;
          }
        }

        // Fallback: hash params (password recovery)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        if (type === 'recovery') { navigate('/auth', { replace: true }); return; }

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

        // Wait for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            const redirectTo = sessionStorage.getItem('auth_redirect') || AUTH_CONFIG.redirectUrls.afterSignIn;
            sessionStorage.removeItem('auth_redirect');
            navigate(redirectTo, { replace: true });
            subscription.unsubscribe();
          }
        });

        setTimeout(() => { subscription.unsubscribe(); navigate('/auth', { replace: true }); }, 5000);
      } catch (err: any) {
        console.error('Auth callback error:', err);
        const msg = err.message || 'Authentication failed';
        // Provider-specific messages
        const friendlyMsg = msg.toLowerCase().includes('google') ? 'Google authentication failed. Please try again.'
          : msg.toLowerCase().includes('apple') ? 'Apple sign-in was cancelled or failed.'
          : msg;
        setError(friendlyMsg);
        toast({ title: 'Authentication error', description: friendlyMsg, variant: 'destructive' });
      }
    };

    handleAuthCallback();
    return () => clearInterval(stepTimer);
  }, [navigate, toast]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm glass-panel rounded-2xl p-8 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Authentication Failed</h2>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/auth')} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" /> Try Again
            </Button>
            <Button variant="outline" onClick={() => window.location.href = 'mailto:support@lithiumbuy.com'} className="w-full">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm glass-panel rounded-2xl p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <div className="p-3 rounded-xl bg-gradient-gold">
            <Sparkles className="h-6 w-6 text-accent-foreground" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Completing Authentication</h2>
          <p className="text-sm text-muted-foreground">{STEPS[step]}</p>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-1.5" />
        <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
      </div>
    </div>
  );
}
