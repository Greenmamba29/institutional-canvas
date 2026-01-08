import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Zap, Globe, Loader2, KeyRound, AlertCircle } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { useToast } from '@/hooks/use-toast';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isUpdatePasswordMode, setIsUpdatePasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Check for URL hash errors and recovery tokens
  useEffect(() => {
    // Parse URL hash for Supabase auth responses
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const errorDescription = hashParams.get('error_description');
    const errorCode = hashParams.get('error_code');
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    // Handle error from Supabase redirect (e.g., expired link)
    if (errorDescription) {
      setAuthError(errorDescription.replace(/\+/g, ' '));
      toast({
        title: 'Authentication Error',
        description: errorDescription.replace(/\+/g, ' '),
        variant: 'destructive',
        duration: 8000,
      });
      // Clear the hash to prevent showing error again on refresh
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    // Check for recovery flow - Supabase sends type=recovery in hash
    const isRecoveryFlow = type === 'recovery' && accessToken;
    
    if (isRecoveryFlow) {
      console.log('[Auth] Recovery flow detected, showing password update form');
      setIsUpdatePasswordMode(true);
      // Don't clear hash yet - Supabase needs to process the token
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Auth state changed:', event, session?.user?.email);
      setSession(session);
      
      // Detect password recovery flow
      if (event === 'PASSWORD_RECOVERY') {
        console.log('[Auth] PASSWORD_RECOVERY event received');
        setIsUpdatePasswordMode(true);
        return;
      }

      // Handle successful sign in after email confirmation
      if (event === 'SIGNED_IN' && !isUpdatePasswordMode) {
        // Check if this is from email confirmation (not recovery)
        const hashType = new URLSearchParams(window.location.hash.substring(1)).get('type');
        if (hashType !== 'recovery') {
          toast({
            title: 'Welcome!',
            description: 'You have been signed in successfully.',
          });
        }
      }
      
      // Only redirect if authenticated, not in password update mode, and not recovery
      if (session && !isUpdatePasswordMode && type !== 'recovery') {
        const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Don't redirect if we're in a recovery flow
      if (session && !isRecoveryFlow && !isUpdatePasswordMode) {
        const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isResetMode) {
        // Get the redirect URL - this must match what's configured in Supabase Dashboard
        // Go to: Supabase Dashboard > Authentication > URL Configuration
        // Add your domain to "Redirect URLs" (e.g., https://yourdomain.com/auth)
        const redirectTo = `${window.location.origin}/auth`;
        
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        });

        if (error) throw error;

        toast({
          title: 'Reset link sent',
          description: 'Check your email for a password reset link.',
          duration: 8000,
        });
        setIsResetMode(false);
      } else if (isSignUp) {
        // Get the redirect URL - this must match what's configured in Supabase Dashboard
        const redirectTo = `${window.location.origin}/auth`;
        
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
          },
        });

        if (error) throw error;

        // Check if user was auto-confirmed (email confirmation disabled)
        if (data.session) {
          toast({
            title: 'Account created!',
            description: 'Welcome to LithiumBuy. Redirecting to onboarding...',
          });
        } else {
          // Email confirmation is required
          toast({
            title: 'Check your email',
            description: 'We sent you a confirmation link. Please check your inbox and click the link to activate your account.',
            duration: 8000,
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Welcome back!',
          description: 'You have successfully signed in.',
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      
      // Parse Supabase error messages into user-friendly ones
      let errorTitle = isResetMode ? 'Reset failed' : isSignUp ? 'Sign up failed' : 'Sign in failed';
      let errorMessage = error.message || 'Please check your credentials and try again.';
      
      // Handle specific error cases
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials or use "Forgot password" to reset.';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead or use "Forgot password" to reset your password.';
        setIsSignUp(false); // Switch to sign in mode
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your inbox and click the confirmation link we sent you.';
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please wait a few minutes and try again.';
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
        duration: 8000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both password fields are identical.',
        variant: 'destructive',
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (error) throw error;
      
      toast({
        title: 'Password updated successfully!',
        description: 'You can now sign in with your new password.',
      });
      
      setIsUpdatePasswordMode(false);
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect to dashboard since they're already authenticated
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Password update error:', error);
      toast({
        title: 'Password update failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade encryption and compliance for every transaction',
    },
    {
      icon: Zap,
      title: 'Real-Time Trading',
      description: 'Live auctions, instant RFQs, and AI-powered price discovery',
    },
    {
      icon: Globe,
      title: 'Global Marketplace',
      description: 'Connect with verified suppliers and buyers worldwide',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }} />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="mb-4">
              <Logo size="lg" layoutLabel="B2B Trading Platform" />
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold leading-tight mb-4">
                The Future of<br />
                <span className="text-gradient-primary">Lithium Trading</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-md">
                Institutional-grade marketplace for battery metals. Secure transactions, 
                verified suppliers, and AI-powered market intelligence.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4 p-4 rounded-xl bg-card/40 backdrop-blur-sm border border-border/30">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8">
            <p className="text-xs text-muted-foreground">
              Trusted by leading battery manufacturers and mining operations worldwide
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center mb-12">
            <Logo size="lg" layoutLabel="Trading Platform" />
          </div>

          <div className="glass-panel rounded-2xl p-8 space-y-6">
            {/* Show auth error banner if present */}
            {authError && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Authentication Error</p>
                  <p className="text-xs opacity-80">{authError}</p>
                </div>
                <button 
                  onClick={() => setAuthError(null)}
                  className="text-xs hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {isUpdatePasswordMode ? (
              <>
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <KeyRound className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold">Set New Password</h2>
                  <p className="text-muted-foreground">
                    Enter your new password below
                  </p>
                </div>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      minLength={6}
                      className="h-11"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 text-base font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating password...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUpdatePasswordMode(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="text-sm text-primary hover:underline"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">
                    {isResetMode ? 'Reset Password' : isSignUp ? 'Create Account' : 'Welcome Back'}
                  </h2>
                  <p className="text-muted-foreground">
                    {isResetMode
                      ? 'Enter your email to receive a reset link'
                      : isSignUp 
                        ? 'Enter your details to get started' 
                        : 'Sign in to access your trading dashboard'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11"
                    />
                  </div>

                  {!isResetMode && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {!isSignUp && (
                          <button
                            type="button"
                            onClick={() => setIsResetMode(true)}
                            className="text-xs text-primary hover:underline"
                            disabled={isLoading}
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        minLength={6}
                        className="h-11"
                      />
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 text-base font-semibold"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isResetMode ? 'Sending...' : isSignUp ? 'Creating account...' : 'Signing in...'}
                      </>
                    ) : (
                      isResetMode ? 'Send Reset Link' : isSignUp ? 'Create Account' : 'Sign In'
                    )}
                  </Button>
                </form>

                <div className="text-center space-y-2">
                  {isResetMode ? (
                    <button
                      type="button"
                      onClick={() => setIsResetMode(false)}
                      className="text-sm text-primary hover:underline"
                      disabled={isLoading}
                    >
                      Back to sign in
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsSignUp(!isSignUp)}
                      className="text-sm text-primary hover:underline"
                      disabled={isLoading}
                    >
                      {isSignUp 
                        ? 'Already have an account? Sign in' 
                        : "Don't have an account? Sign up"}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Security Info */}
            <div className="text-center pt-2">
              <div className="flex items-center justify-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2 text-xs">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Secure</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Fast</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>
            {' '}and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
