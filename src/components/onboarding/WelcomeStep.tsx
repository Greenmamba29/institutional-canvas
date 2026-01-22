/**
 * WelcomeStep - Initial welcome screen for onboarding
 */

import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  ArrowRight, 
  Shield, 
  Globe, 
  Zap,
  TrendingUp,
} from 'lucide-react';

interface WelcomeStepProps {
  userEmail?: string;
  onContinue: () => void;
  onLogout: () => void;
}

export function WelcomeStep({ userEmail, onContinue, onLogout }: WelcomeStepProps) {
  const highlights = [
    {
      icon: <Globe className="h-5 w-5" />,
      title: 'Global Network',
      description: '500+ verified suppliers across 40 countries',
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'Enterprise Security',
      description: 'SOC 2 compliant with end-to-end encryption',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'AI-Powered',
      description: 'Smart matching and price forecasting',
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: '$2B+ Traded',
      description: 'Trusted by Fortune 500 companies',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-gold flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-accent-foreground" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-success flex items-center justify-center">
              <Shield className="h-4 w-4 text-success-foreground" />
            </div>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-3">
          Welcome to <span className="text-gradient-primary">LithiumBuy</span>
        </h1>
        <p className="text-muted-foreground text-lg mb-2">
          The world's premier B2B lithium marketplace
        </p>
        {userEmail && (
          <p className="text-sm text-muted-foreground">
            Signed in as <span className="text-foreground font-medium">{userEmail}</span>
          </p>
        )}
      </div>

      {/* Platform highlights */}
      <div className="grid grid-cols-2 gap-4">
        {highlights.map((item, index) => (
          <div
            key={index}
            className="glass-panel rounded-xl p-4 text-center hover:border-primary/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary mx-auto mb-3 flex items-center justify-center">
              {item.icon}
            </div>
            <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
            <p className="text-xs text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="space-y-4">
        <Button onClick={onContinue} className="w-full h-12 text-base gap-2">
          Get Started
          <ArrowRight className="h-5 w-5" />
        </Button>
        
        <p className="text-center text-sm text-muted-foreground">
          Setup takes less than 2 minutes
        </p>
      </div>

      {/* Sign out option */}
      <div className="text-center pt-4 border-t border-border">
        <button
          onClick={onLogout}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign out and use a different account
        </button>
      </div>
    </div>
  );
}
