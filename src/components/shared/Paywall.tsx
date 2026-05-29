/**
 * Paywall — inline gate for Pro/Enterprise features.
 *
 * Pro  $599/month  — grant intelligence, readiness, evidence vault
 * Enterprise $4,999/month — partner matching, funding pipeline, TeleBuy, auctions
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
    price: '$599',
    period: '/month',
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    defaultBenefits: [
      'Unlimited RFQs & purchase orders',
      'Grant tracker — DOE, DOD, ARPA-E',
      'Eligibility scoring engine',
      'Grant readiness dashboard',
      'Evidence vault (document management)',
      'Supplier verification & risk scores',
      'Market & grant intelligence hub',
      'Priority support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: '$4,999',
    period: '/month',
    icon: Crown,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    borderColor: 'border-accent/20',
    defaultBenefits: [
      'Everything in Pro',
      'Partner matching & consortium builder',
      'Funding pipeline automation',
      'TeleBuy video negotiations',
      'Auction system access',
      'API access & webhooks',
      'SSO & white-label options',
      'Dedicated account manager',
    ],
  },
};

export function Paywall({ feature, description, requiredTier, benefits, className }: PaywallProps) {
  const navigate = useNavigate();
  const config = TIER_CONFIG[requiredTier];
  const Icon = config.icon;
  const featureBenefits = benefits || config.defaultBenefits;

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
            <CardDescription className="text-base mt-2">{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-4 border-y border-border/50">
            <span className="text-4xl font-bold">{config.price}</span>
            <span className="text-muted-foreground">{config.period}</span>
            <p className="text-xs text-muted-foreground mt-1">Annual billing available — save 20%</p>
          </div>

          <ul className="space-y-3">
            {featureBenefits.map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className={cn("p-1 rounded-full mt-0.5 shrink-0", config.bgColor)}>
                  <Check className={cn("h-3 w-3", config.color)} />
                </div>
                <span className="text-sm text-muted-foreground">{benefit}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-3 pt-2">
            <Button
              onClick={() => navigate('/settings/billing', { state: { tier: requiredTier } })}
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Upgrade to {config.name}
            </Button>
            {requiredTier === 'enterprise' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = 'mailto:sales@lithiumbuy.com?subject=Enterprise Plan Inquiry'}
              >
                Contact Sales Instead
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
            Requires {config.name} — {config.price}{config.period}
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
