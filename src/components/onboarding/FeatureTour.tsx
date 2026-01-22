/**
 * FeatureTour - Interactive feature walkthrough for new users
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Package, 
  Video, 
  BarChart3, 
  FileText, 
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  forRoles: ('buyer' | 'supplier' | 'soe' | 'admin')[];
  benefits: string[];
  color: string;
}

const features: Feature[] = [
  {
    id: 'marketplace',
    title: 'Global Marketplace',
    description: 'Access verified lithium suppliers worldwide with real-time pricing and availability.',
    icon: <ShoppingCart className="h-8 w-8" />,
    forRoles: ['buyer', 'soe', 'admin'],
    benefits: [
      'Browse 500+ verified suppliers',
      'Real-time market pricing',
      'Compare specs side-by-side',
    ],
    color: 'primary',
  },
  {
    id: 'rfq',
    title: 'Smart RFQs',
    description: 'Create request-for-quotes and receive competitive bids from qualified suppliers.',
    icon: <FileText className="h-8 w-8" />,
    forRoles: ['buyer', 'soe', 'admin'],
    benefits: [
      'AI-powered supplier matching',
      'Automated bid comparison',
      'Compliance documentation',
    ],
    color: 'accent',
  },
  {
    id: 'telebuy',
    title: 'TeleBuy Connect',
    description: 'Video-first negotiations with integrated deal room and e-signatures.',
    icon: <Video className="h-8 w-8" />,
    forRoles: ['buyer', 'supplier', 'soe', 'admin'],
    benefits: [
      'HD video conferencing',
      'Screen sharing & co-browsing',
      'Integrated e-signatures',
    ],
    color: 'success',
  },
  {
    id: 'ai-studio',
    title: 'SPOT.ai Intelligence',
    description: 'AI-powered market insights, price forecasting, and risk analysis.',
    icon: <BarChart3 className="h-8 w-8" />,
    forRoles: ['buyer', 'supplier', 'soe', 'admin'],
    benefits: [
      '30-day price forecasts',
      'Supplier risk scoring',
      'Market trend analysis',
    ],
    color: 'warning',
  },
  {
    id: 'listings',
    title: 'Product Listings',
    description: 'Showcase your products to global buyers with detailed specifications.',
    icon: <Package className="h-8 w-8" />,
    forRoles: ['supplier', 'admin'],
    benefits: [
      'Rich product catalogs',
      'Specification sheets',
      'Certification uploads',
    ],
    color: 'primary',
  },
  {
    id: 'messaging',
    title: 'Secure Messaging',
    description: 'Connect with trading partners through encrypted direct messages.',
    icon: <MessageSquare className="h-8 w-8" />,
    forRoles: ['buyer', 'supplier', 'soe', 'admin'],
    benefits: [
      'End-to-end encryption',
      'File attachments',
      'Read receipts',
    ],
    color: 'accent',
  },
];

interface FeatureTourProps {
  userRole: 'buyer' | 'supplier' | 'soe' | 'admin';
  onComplete: () => void;
  onSkip: () => void;
}

export function FeatureTour({ userRole, onComplete, onSkip }: FeatureTourProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Filter features based on user role
  const relevantFeatures = features.filter(f => f.forRoles.includes(userRole));
  const currentFeature = relevantFeatures[currentIndex];
  const isLastFeature = currentIndex === relevantFeatures.length - 1;
  
  const handleNext = () => {
    if (isLastFeature) {
      onComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
      primary: { bg: 'bg-primary/10', text: 'text-primary', ring: 'ring-primary/20' },
      accent: { bg: 'bg-accent/10', text: 'text-accent', ring: 'ring-accent/20' },
      success: { bg: 'bg-success/10', text: 'text-success', ring: 'ring-success/20' },
      warning: { bg: 'bg-warning/10', text: 'text-warning', ring: 'ring-warning/20' },
    };
    return colorMap[color] || colorMap.primary;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold mb-3">
          <Sparkles className="h-3 w-3" />
          FEATURE TOUR
        </div>
        <h2 className="text-xl font-semibold mb-2">Explore Your Tools</h2>
        <p className="text-muted-foreground text-sm">
          Discover the features available to you as a {userRole}
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-2">
        {relevantFeatures.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={cn(
              'h-2 rounded-full transition-all duration-300',
              index === currentIndex 
                ? 'w-8 bg-primary' 
                : index < currentIndex
                  ? 'w-2 bg-success'
                  : 'w-2 bg-muted'
            )}
          />
        ))}
      </div>

      {/* Feature card */}
      <div className="glass-panel rounded-2xl p-8 text-center animate-fade-in" key={currentFeature.id}>
        <div className={cn(
          'w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center ring-4',
          getColorClasses(currentFeature.color).bg,
          getColorClasses(currentFeature.color).text,
          getColorClasses(currentFeature.color).ring
        )}>
          {currentFeature.icon}
        </div>
        
        <h3 className="text-2xl font-bold mb-3">{currentFeature.title}</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          {currentFeature.description}
        </p>
        
        {/* Benefits list */}
        <div className="space-y-3 mb-8">
          {currentFeature.benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-3 text-sm text-left bg-muted/30 rounded-lg px-4 py-3"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CheckCircle2 className={cn('h-5 w-5 shrink-0', getColorClasses(currentFeature.color).text)} />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} of {relevantFeatures.length}
          </span>
          
          <Button onClick={handleNext} className="gap-2">
            {isLastFeature ? (
              <>
                Get Started
                <Rocket className="h-4 w-4" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Skip button */}
      <div className="text-center">
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip tour and go to dashboard
        </button>
      </div>
    </div>
  );
}
