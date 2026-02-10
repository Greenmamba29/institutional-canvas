import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Shield, Zap, Globe, Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Google icon SVG component
const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Apple icon SVG component
const AppleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

// Demo credentials for easy testing
// Password must meet Supabase requirements: 12+ chars, upper/lower/number/special
const DEMO_CREDENTIALS = {
  email: 'demo@lithiumbuy.com',
  password: 'Demo@Lithium2024!',
};

// Error message mapping for better UX
const getAuthErrorMessage = (error: any): string => {
  const code = error?.code || error?.message || '';
  
  if (code.includes('invalid_credentials') || code.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials or sign up for a new account.';
  }
  if (code.includes('user_not_found') || code.includes('User not found')) {
    return 'No account found with this email. Please sign up first.';
  }
  if (code.includes('email_not_confirmed')) {
    return 'Please confirm your email before signing in. Check your inbox for a confirmation link.';
  }
  if (code.includes('too_many_requests') || code.includes('rate_limit')) {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  if (code.includes('user_already_exists') || code.includes('User already registered')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (code.includes('weak_password')) {
    return 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.';
  }
  if (code.includes('invalid_email')) {
    return 'Please enter a valid email address.';
  }
  
  return error?.message || 'An unexpected error occurred. Please try again.';
};

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
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check for existing session and detect PASSWORD_RECOVERY event
  useEffect(() => {
    // Helper function to check if URL contains recovery token
    const checkRecoveryToken = (): boolean => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      return hashParams.get('type') === 'recovery';
    };

    // Check URL hash for password recovery token BEFORE checking session
    // Supabase includes recovery tokens in the hash: #access_token=...&type=recovery
    const isRecoveryFlow = checkRecoveryToken();
    
    if (isRecoveryFlow) {
      // Set password update mode immediately to prevent redirect
      setIsUpdatePasswordMode(true);
      // Notify user that recovery link was verified
      toast({
        title: 'Reset link verified',
        description: 'Enter your new password below.',
      });
    }

    // Set up auth state listener FIRST to catch PASSWORD_RECOVERY event
    // This must be registered before getSession() to catch the event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      // Detect password recovery flow from reset link
      if (event === 'PASSWORD_RECOVERY') {
        setIsUpdatePasswordMode(true);
        // Stay on auth page to update password - don't redirect
        return;
      }
      
      // Only redirect if not in update password mode and not a recovery flow
      // Check URL hash directly to avoid race conditions with state updates
      if (session && !isUpdatePasswordMode && !checkRecoveryToken()) {
        const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    });

    // Check for existing session AFTER setting up the listener
    // This ensures PASSWORD_RECOVERY event is handled before redirect
    // NOTE: We do NOT redirect here - let onAuthStateChange handle all redirects
    // to avoid race conditions between the two callbacks
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Only set session state here - redirect is handled by onAuthStateChange
    });

    return () => subscription.unsubscribe();
  }, [navigate, location, isUpdatePasswordMode]);

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
      const errorMessage = getAuthErrorMessage(error);
      
      toast({
        title: isResetMode ? 'Reset failed' : isSignUp ? 'Sign up failed' : 'Sign in failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // If sign-in failed with invalid credentials, suggest signing up
      if (!isSignUp && !isResetMode && (error?.code?.includes('invalid_credentials') || error?.message?.includes('Invalid login credentials'))) {
        toast({
          title: 'Need an account?',
          description: 'Click "Sign up" below to create a new account.',
          duration: 6000,
        });
      }
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
      title: 'Lithium Recycling',
      description: 'Advanced marketplace for black mass and closed-loop battery materials',
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
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-gold">
                <Sparkles className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">LithiumBuy</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">Lithium & Recycling Marketplace</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold leading-tight mb-4">
                The Global Authority in<br />
                <span className="text-gradient-primary">Lithium & Recycling</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-md">
                The world's leading institutional marketplace for primary lithium procurement and advanced battery recycling.
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
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
            <div className="p-3 rounded-xl bg-gradient-gold">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">LithiumBuy</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Lithium & Recycling</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-8 space-y-6">
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
                        : 'Sign in to the Lithium & Recycling console'}
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

                {/* OAuth Providers */}
                {!isResetMode && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12"
                        onClick={async () => {
                          setIsLoading(true);
                          try {
                            const { error } = await supabase.auth.signInWithOAuth({
                              provider: 'google',
                              options: {
                                redirectTo: `${window.location.origin}/auth/callback`,
                                queryParams: {
                                  access_type: 'offline',
                                  prompt: 'consent',
                                },
                              },
                            });
                            if (error) throw error;
                          } catch (error: any) {
                            toast({
                              title: 'Google sign in failed',
                              description: error.message || 'Please try again or use email/password.',
                              variant: 'destructive',
                            });
                            setIsLoading(false);
                          }
                        }}
                        disabled={isLoading}
                      >
                        <GoogleIcon />
                        <span className="ml-2">Continue with Google</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12"
                        onClick={async () => {
                          setIsLoading(true);
                          try {
                            const { error } = await supabase.auth.signInWithOAuth({
                              provider: 'apple',
                              options: {
                                redirectTo: `${window.location.origin}/auth/callback`,
                              },
                            });
                            if (error) throw error;
                          } catch (error: any) {
                            toast({
                              title: 'Apple sign in failed',
                              description: error.message || 'Please try again or use email/password.',
                              variant: 'destructive',
                            });
                            setIsLoading(false);
                          }
                        }}
                        disabled={isLoading}
                      >
                        <AppleIcon />
                        <span className="ml-2">Continue with Apple</span>
                      </Button>
                    </div>
                  </>
                )}

                {/* Demo Account Quick Fill - Shows on Sign In AND Sign Up */}
                {!isResetMode && (
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">
                      {isSignUp ? 'Or use demo credentials:' : 'Quick access for testing:'}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        // Fill in demo credentials
                        setEmail(DEMO_CREDENTIALS.email);
                        setPassword(DEMO_CREDENTIALS.password);
                        
                        // If in sign-up mode, just fill the form
                        if (isSignUp) {
                          toast({
                            title: 'Demo credentials filled',
                            description: 'Click "Create Account" to sign up with the demo account.',
                          });
                          return;
                        }
                        
                        // Try to sign in with demo account
                        setIsLoading(true);
                        try {
                          const { error: signInError } = await supabase.auth.signInWithPassword({
                            email: DEMO_CREDENTIALS.email,
                            password: DEMO_CREDENTIALS.password,
                          });
                          
                          if (signInError) {
                            // If sign in fails, try to sign up
                            if (signInError.message?.includes('Invalid login credentials')) {
                              const { error: signUpError, data } = await supabase.auth.signUp({
                                email: DEMO_CREDENTIALS.email,
                                password: DEMO_CREDENTIALS.password,
                                options: {
                                  emailRedirectTo: `${window.location.origin}/auth`,
                                },
                              });
                              
                              if (signUpError) {
                                throw signUpError;
                              }
                              
                              if (data.session) {
                                toast({
                                  title: 'Demo account created!',
                                  description: 'Welcome to LithiumBuy. Redirecting...',
                                });
                              } else {
                                toast({
                                  title: 'Demo account created',
                                  description: 'Please check email to confirm, or disable email confirmation in Supabase settings for testing.',
                                  duration: 8000,
                                });
                              }
                            } else {
                              throw signInError;
                            }
                          } else {
                            toast({
                              title: 'Welcome back!',
                              description: 'Signed in with demo account.',
                            });
                          }
                        } catch (error: any) {
                          console.error('Demo login error:', error);
                          toast({
                            title: 'Demo login failed',
                            description: getAuthErrorMessage(error),
                            variant: 'destructive',
                          });
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="w-full text-xs"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        'Use Demo Account'
                      )}
                    </Button>
                  </div>
                )}

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
