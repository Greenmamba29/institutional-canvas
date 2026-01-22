/**
 * RoleSelection - User role selection during onboarding
 */

import { 
  ShoppingCart, 
  Package, 
  Landmark, 
  Shield,
  Check,
  Users,
  Globe,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type UserRole = 'buyer' | 'supplier' | 'soe';

interface RoleOption {
  id: UserRole;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  badge?: string;
}

const roleOptions: RoleOption[] = [
  {
    id: 'buyer',
    title: 'Buyer',
    subtitle: 'Purchase lithium materials',
    description: 'Access global suppliers, create RFQs, and manage procurement workflows.',
    icon: <ShoppingCart className="h-7 w-7" />,
    features: [
      'Browse verified suppliers',
      'Create RFQs & receive bids',
      'Negotiate via TeleBuy',
      'Access SPOT.ai insights',
    ],
    color: 'primary',
  },
  {
    id: 'supplier',
    title: 'Supplier',
    subtitle: 'Sell lithium products',
    description: 'List your products, respond to RFQs, and connect with global buyers.',
    icon: <Package className="h-7 w-7" />,
    features: [
      'Create product listings',
      'Respond to RFQs',
      'Manage buyer relationships',
      'Track sales analytics',
    ],
    color: 'accent',
  },
  {
    id: 'soe',
    title: 'State Owned Entity',
    subtitle: 'Government procurement',
    description: 'Strategic procurement with compliance tracking and regulatory oversight.',
    icon: <Landmark className="h-7 w-7" />,
    features: [
      'Compliance documentation',
      'Regulatory oversight',
      'Strategic reserves',
      'Government protocols',
    ],
    color: 'success',
    badge: 'Government',
  },
];

interface RoleSelectionProps {
  selectedRole: UserRole | null;
  onSelectRole: (role: UserRole) => void;
}

export function RoleSelection({ selectedRole, onSelectRole }: RoleSelectionProps) {
  const getColorClasses = (color: string, isSelected: boolean) => {
    if (!isSelected) {
      return {
        border: 'border-border hover:border-muted-foreground',
        bg: 'bg-transparent',
        icon: 'bg-muted text-muted-foreground',
      };
    }
    
    const colorMap: Record<string, { border: string; bg: string; icon: string }> = {
      primary: { 
        border: 'border-primary ring-2 ring-primary/20', 
        bg: 'bg-primary/5',
        icon: 'bg-primary/10 text-primary'
      },
      accent: { 
        border: 'border-accent ring-2 ring-accent/20', 
        bg: 'bg-accent/5',
        icon: 'bg-accent/10 text-accent'
      },
      success: { 
        border: 'border-success ring-2 ring-success/20', 
        bg: 'bg-success/5',
        icon: 'bg-success/10 text-success'
      },
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">What brings you to LithiumBuy?</h2>
        <p className="text-muted-foreground text-sm">
          Select your primary role to personalize your experience
        </p>
      </div>

      <div className="grid gap-4">
        {roleOptions.map((role) => {
          const isSelected = selectedRole === role.id;
          const colors = getColorClasses(role.color, isSelected);
          
          return (
            <button
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              className={cn(
                'relative w-full text-left p-5 rounded-xl border-2 transition-all duration-200',
                colors.border,
                colors.bg
              )}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                </div>
              )}
              
              {/* Badge */}
              {role.badge && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium">
                    {role.badge}
                  </span>
                </div>
              )}

              <div className="flex gap-4">
                {/* Icon */}
                <div className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  colors.icon
                )}>
                  {role.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{role.title}</h3>
                    <span className="text-xs text-muted-foreground">• {role.subtitle}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {role.description}
                  </p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {role.features.slice(0, 3).map((feature, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-xs text-muted-foreground"
                      >
                        <Check className="h-3 w-3" />
                        {feature}
                      </span>
                    ))}
                    {role.features.length > 3 && (
                      <span className="px-2 py-1 text-xs text-muted-foreground">
                        +{role.features.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 text-sm">
        <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-muted-foreground">
            <strong className="text-foreground">Note:</strong> Your role determines which features are highlighted. 
            You can access additional features through your organization settings later.
          </p>
        </div>
      </div>
    </div>
  );
}
