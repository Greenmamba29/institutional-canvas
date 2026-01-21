/**
 * Paywall Component
 * 
 * Reusable paywall screen for gating Pro/Enterprise features.
 * Shows feature benefits and upgrade CTA with Stripe integration.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Lock, Sparkles, Zap, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PaywallProps {
  feature: string;
  description?: string;
  requiredTier: 'pro' | 'enterprise';
  benefits?: string[];
  className?: string;
}

const TIER_CONFIG = {
  pro: {
    name: 'Pro',
    price: '$199',
    period: '/month',
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    defaultBenefits: [
      'SPOT.ai Market Intelligence',
      'AI-powered supplier matching',
      'TeleBuy video negotiations with transcripts',
      'Unlimited RFQs',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: '$1,999',
    period: '/month',
    icon: Crown,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/20',
    defaultBenefits: [
      'Everything in Pro',
      'API access',
      'White-label options',
      'SSO authentication',
      'Dedicated account manager',
      'Custom integrations',
    ],
  },
};

export function Paywall({
  feature,
  description,
  requiredTier,
  benefits,
  className,
}: PaywallProps) {
  const navigate = useNavigate();
  const config = TIER_CONFIG[requiredTier];
  const Icon = config.icon;
  const featureBenefits = benefits || config.defaultBenefits;

  const handleUpgrade = () => {
    navigate('/settings/billing', { state: { tier: requiredTier } });
  };

  return (
    <div className={cn("flex items-center justify-center min-h-[60vh] p-6", className)}>
      <Card className={cn("max-w-lg w-full glass-panel", config.borderColor)}>
        <CardHeader className="text-center pb-2">
          <div className={cn("mx-auto p-4 rounded-full mb-4", config.bgColor)}>
            <Lock className={cn("h-8 w-8", config.color)} />
          </div>
          <Badge variant="outline" className={cn("mx-auto mb-2", config.color)}>
            <Icon className="h-3 w-3 mr-1" />
            {config.name} Feature
          </Badge>
          <CardTitle className="text-2xl">{feature}</CardTitle>
          {description && (
            <CardDescription className="text-base mt-2">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price Display */}
          <div className="text-center py-4 border-y border-border/50">
            <span className="text-4xl font-bold">{config.price}</span>
            <span className="text-muted-foreground">{config.period}</span>
          </div>

          {/* Benefits List */}
          <ul className="space-y-3">
            {featureBenefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className={cn("p-1 rounded-full mt-0.5", config.bgColor)}>
                  <Check className={cn("h-3 w-3", config.color)} />
                </div>
                <span className="text-sm text-muted-foreground">{benefit}</span>
              </li>
            ))}
          </ul>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-2">
            <Button 
              onClick={handleUpgrade} 
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade to {config.name}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Cancel anytime. No questions asked.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Inline upgrade prompt for use within feature cards
 */
interface UpgradePromptProps {
  feature: string;
  tier: 'pro' | 'enterprise';
  className?: string;
}

export function UpgradePrompt({ feature, tier, className }: UpgradePromptProps) {
  const navigate = useNavigate();
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-lg border",
      config.bgColor,
      config.borderColor,
      className
    )}>
      <div className="flex items-center gap-3">
        <Icon className={cn("h-5 w-5", config.color)} />
        <div>
          <p className="text-sm font-medium">{feature}</p>
          <p className="text-xs text-muted-foreground">
            Requires {config.name} subscription
          </p>
        </div>
      </div>
      <Button 
        size="sm" 
        variant="outline"
        onClick={() => navigate('/settings/billing', { state: { tier } })}
      >
        Upgrade
      </Button>
    </div>
  );
}
