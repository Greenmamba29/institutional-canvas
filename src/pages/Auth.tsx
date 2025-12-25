import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Shield, Zap, Globe, Mail, Chrome } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function Auth() {
  const { isAuthenticated, isLoading, loginWithRedirect, loginWithGoogle, loginWithMagicLink } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  const handleSSO = () => {
    loginWithRedirect();
  };

  const handleGoogle = () => {
    loginWithGoogle();
  };

  const handleMagicLink = () => {
    loginWithMagicLink();
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
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-gold">
                <Sparkles className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Lithium & Lux</h1>
                <p className="text-xs text-muted-foreground uppercase tracking-widest">B2B Trading Platform</p>
              </div>
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

      {/* Right Panel - Login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
            <div className="p-3 rounded-xl bg-gradient-gold">
              <Sparkles className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Lithium & Lux</h1>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">Trading Platform</p>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Welcome Back</h2>
              <p className="text-muted-foreground">
                Sign in to access your trading dashboard
              </p>
            </div>

            {/* Primary SSO Button */}
            <Button
              onClick={handleSSO}
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Continue with SSO
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">or continue with</span>
              </div>
            </div>

            {/* Alternative Login Methods */}
            <div className="space-y-3">
              {/* Google OAuth Button */}
              <Button
                onClick={handleGoogle}
                disabled={isLoading}
                variant="outline"
                className="w-full h-11 text-sm font-medium gap-3 border-border hover:bg-accent hover:text-accent-foreground"
              >
                <Chrome className="h-5 w-5" />
                Continue with Google
              </Button>

              {/* Magic Link Button */}
              <Button
                onClick={handleMagicLink}
                disabled={isLoading}
                variant="outline"
                className="w-full h-11 text-sm font-medium gap-3 border-border hover:bg-accent hover:text-accent-foreground"
              >
                <Mail className="h-5 w-5" />
                Continue with Email Link
              </Button>
            </div>

            {/* Security Info */}
            <div className="text-center space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Enterprise authentication powered by Auth0
              </p>
              <div className="flex items-center justify-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2 text-xs">
                  <Shield className="h-3.5 w-3.5" />
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Zap className="h-3.5 w-3.5" />
                  <span>MFA Enabled</span>
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
