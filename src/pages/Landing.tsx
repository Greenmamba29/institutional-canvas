import { useState, useEffect, lazy, Suspense, memo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Video, 
  BarChart3, 
  Globe2, 
  Zap, 
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Building2,
  TrendingUp,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

// Lazy load images for performance
const lithiumHeroImg = '/logo.png'; // Fallback to logo for now
const telebuyImg = new URL('@/assets/landing/telebuy-interface.png', import.meta.url).href;
const dataVizImg = new URL('@/assets/landing/data-visualization.png', import.meta.url).href;

// Memoized components for performance
const StatCard = memo(({ value, label, color }: { value: string; label: string; color: string }) => (
  <div className="text-center">
    <div className={cn("text-2xl sm:text-3xl lg:text-4xl font-bold", color)}>{value}</div>
    <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{label}</div>
  </div>
));
StatCard.displayName = 'StatCard';

const FeatureItem = memo(({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
    <Icon className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
    <div>
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  </div>
));
FeatureItem.displayName = 'FeatureItem';

const PricingFeature = memo(({ children }: { children: React.ReactNode }) => (
  <li className="flex items-center gap-2 text-sm">
    <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
    <span>{children}</span>
  </li>
));
PricingFeature.displayName = 'PricingFeature';

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, signOut, user } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient Background - Simplified for performance */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-60">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] translate-x-1/2" />
      </div>

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border/50 py-3" : "py-4 sm:py-6"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg sm:text-xl font-bold">LithiumBuy</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Dashboard</Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={signOut}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign In</Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    <span className="hidden sm:inline">Get Access</span>
                    <span className="sm:hidden">Start</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 lg:pt-40 pb-16 sm:pb-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            {/* Badge */}
            <Badge className="mb-4 sm:mb-6 px-3 py-1.5 text-xs sm:text-sm font-medium bg-accent/10 text-accent border-accent/30">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
              #1 Lithium Marketplace
            </Badge>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6">
              <span className="block bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                Buy Lithium
              </span>
              <span className="block bg-gradient-to-r from-accent via-accent to-accent/70 bg-clip-text text-transparent">
                From Verified Suppliers
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
              The world's largest <strong className="text-foreground">lithium marketplace</strong> with{' '}
              <span className="text-primary font-medium">312+ verified suppliers</span>.{' '}
              Buy lithium carbonate, hydroxide, and battery-grade lithium.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-10 sm:mb-16">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-base px-6 py-5">
                  Buy Lithium Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/marketplace" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-6 py-5">
                  <Globe2 className="w-5 h-5 mr-2" />
                  Browse Suppliers
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative max-w-4xl mx-auto">
            <div className="relative rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm shadow-2xl">
              <img 
                src={telebuyImg} 
                alt="LithiumBuy marketplace interface" 
                className="w-full h-auto"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-center gap-6 sm:gap-10 lg:gap-16 mt-10 sm:mt-16 px-4">
            <StatCard value="$2.4B+" label="Lithium Traded" color="text-primary" />
            <div className="w-px h-10 bg-border/50" />
            <StatCard value="312" label="Suppliers" color="text-accent" />
            <div className="w-px h-10 bg-border/50 hidden sm:block" />
            <div className="hidden sm:block">
              <StatCard value="47" label="Countries" color="text-success" />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-10 sm:py-16 border-y border-border/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 tracking-widest uppercase">
            Trusted by industry leaders
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 lg:gap-12">
            {['Tesla', 'CATL', 'Panasonic', 'BYD', 'Samsung SDI', 'LG Energy'].map((name) => (
              <div 
                key={name} 
                className="text-base sm:text-lg lg:text-xl font-semibold text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-3 sm:mb-4 bg-primary/10 text-primary border-primary/30">Features</Badge>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              The Best Way to <span className="text-primary">Buy Lithium</span>
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto">
              Enterprise procurement with verified suppliers and AI-powered matching
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* TeleBuy - Large Card */}
            <div className="md:col-span-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-8">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Video className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-2xl font-bold">TeleBuy Connect</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Video-first negotiation</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 sm:mb-6">
                    Native video integration with real-time transcript analysis and AI-powered deal recommendations.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <FeatureItem icon={CheckCircle2} title="AI Summaries" desc="Real-time transcription" />
                    <FeatureItem icon={Lock} title="Privacy Controls" desc="End-to-end encrypted" />
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <img 
                    src={telebuyImg} 
                    alt="TeleBuy Interface" 
                    className="rounded-xl w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>

            {/* Trust Tiers */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold">Trust Tiers</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Verified supplier credentials with multi-level trust scoring.
              </p>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-accent/10 border border-accent/30">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                  <span className="font-medium text-sm">Gold Verified</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/50" />
                  <span className="text-muted-foreground text-sm">Silver Standard</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-lg bg-muted/20 border border-border/30">
                  <div className="w-2.5 h-2.5 rounded-full bg-muted/50" />
                  <span className="text-muted-foreground/70 text-sm">Bronze Basic</span>
                </div>
              </div>
            </div>

            {/* Real-Time Prices */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold">Live Prices</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Real-time lithium carbonate and hydroxide market prices.
              </p>
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xl sm:text-2xl font-bold text-primary font-mono">$24,500</span>
                  <span className="text-xs sm:text-sm text-muted-foreground">/MT</span>
                </div>
                <div className="flex items-center gap-1.5 text-success">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span className="text-xs sm:text-sm font-medium">Li₂CO₃ spot price</span>
                </div>
              </div>
            </div>

            {/* Global Coverage */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                  <Globe2 className="w-5 h-5 text-success" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold">Global Suppliers</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Verified suppliers from Chile, Australia, China, Argentina and more.
              </p>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold">47</div>
                  <div className="text-xs text-muted-foreground">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold">312</div>
                  <div className="text-xs text-muted-foreground">Suppliers</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold">24/7</div>
                  <div className="text-xs text-muted-foreground">Trading</div>
                </div>
              </div>
            </div>

            {/* Data Hub - Wide */}
            <div className="md:col-span-2 lg:col-span-1 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/30 text-xs">Architecture</Badge>
              <h3 className="text-lg sm:text-xl font-bold mb-2">Neural Trust Layer</h3>
              <p className="text-sm text-muted-foreground mb-4">
                AI infrastructure for market data, credential verification, and transaction reliability.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  <span>Ingestion Layer — Market Intel</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  <span>Supabase Data Hub</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                  <span>Reliability Layer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-3 sm:mb-4 bg-accent/10 text-accent border-accent/30">How It Works</Badge>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Enterprise-Grade <span className="text-accent">Infrastructure</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { num: 1, title: 'Ingestion Layer', desc: 'Real-time market data from 50+ sources including LME, CME, and proprietary feeds.', color: 'bg-primary/20 text-primary' },
              { num: 2, title: 'Supabase Data Hub', desc: 'PostgreSQL backbone with real-time subscriptions, RLS policies, and edge functions.', color: 'bg-accent/20 text-accent' },
              { num: 3, title: 'Reliability Layer', desc: 'Multi-region deployment with 99.99% uptime SLA and automatic failover.', color: 'bg-success/20 text-success' },
            ].map((step) => (
              <div key={step.num} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 sm:p-6">
                <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4", step.color)}>
                  <span className="font-bold text-lg">{step.num}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-3 sm:mb-4 bg-primary/10 text-primary border-primary/30">Pricing</Badge>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Start Buying Lithium <span className="text-primary">Today</span>
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto">
              From startup labs to Fortune 500 manufacturers
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Free */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-8">
              <h3 className="text-lg sm:text-xl font-bold mb-1">Free</h3>
              <p className="text-sm text-muted-foreground mb-4 sm:mb-6">For exploring</p>
              <div className="flex items-baseline gap-1 mb-6 sm:mb-8">
                <span className="text-3xl sm:text-4xl font-bold">$0</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                <PricingFeature>Basic supplier search</PricingFeature>
                <PricingFeature>3 RFQs per month</PricingFeature>
                <PricingFeature>Email support</PricingFeature>
              </ul>
              <Link to="/auth" className="block">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>

            {/* Pro - Featured */}
            <div className="relative bg-card/80 backdrop-blur-sm border-2 border-primary/50 rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:-mt-4 md:mb-4">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground text-xs">Most Popular</Badge>
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-1">Pro</h3>
              <p className="text-sm text-muted-foreground mb-4 sm:mb-6">For growing businesses</p>
              <div className="flex items-baseline gap-1 mb-6 sm:mb-8">
                <span className="text-3xl sm:text-4xl font-bold">$199</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                <PricingFeature>SPOT.ai Market Intelligence</PricingFeature>
                <PricingFeature>TeleBuy AI Summaries</PricingFeature>
                <PricingFeature>Unlimited RFQs</PricingFeature>
                <PricingFeature>Advanced analytics</PricingFeature>
                <PricingFeature>Priority support</PricingFeature>
              </ul>
              <Link to="/auth" className="block">
                <Button className="w-full bg-primary hover:bg-primary/90">Upgrade to Pro</Button>
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl sm:rounded-3xl p-5 sm:p-8">
              <h3 className="text-lg sm:text-xl font-bold mb-1">Enterprise</h3>
              <p className="text-sm text-muted-foreground mb-4 sm:mb-6">For large orgs</p>
              <div className="flex items-baseline gap-1 mb-6 sm:mb-8">
                <span className="text-3xl sm:text-4xl font-bold">$1,999</span>
                <span className="text-muted-foreground text-sm">/month</span>
              </div>
              <ul className="space-y-2.5 sm:space-y-3 mb-6 sm:mb-8">
                <PricingFeature>Full API access</PricingFeature>
                <PricingFeature>White-label options</PricingFeature>
                <PricingFeature>SSO / SAML integration</PricingFeature>
                <PricingFeature>Dedicated CSM</PricingFeature>
                <PricingFeature>Custom SLA</PricingFeature>
              </ul>
              <Button variant="outline" className="w-full">Contact Sales</Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl sm:rounded-3xl p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
            Ready to Buy Lithium?
          </h2>
          <p className="text-sm sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto">
            Join 847+ companies on the world's #1 lithium marketplace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground px-6 sm:px-8">
                <Building2 className="w-5 h-5 mr-2" />
                Buy Lithium Now
              </Button>
            </Link>
            <Link to="/marketplace" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-6 sm:px-8">
                <Globe2 className="w-5 h-5 mr-2" />
                View Suppliers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-16 px-4 sm:px-6 border-t border-border/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                </div>
                <span className="text-base sm:text-lg font-bold">LithiumBuy</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                The #1 marketplace to buy lithium online.
              </p>
            </div>
            
            {/* Buy Lithium */}
            <div>
              <h4 className="font-semibold mb-3 text-sm sm:text-base">Buy Lithium</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><Link to="/marketplace" className="hover:text-foreground transition-colors">Lithium Carbonate</Link></li>
                <li><Link to="/marketplace" className="hover:text-foreground transition-colors">Lithium Hydroxide</Link></li>
                <li><Link to="/marketplace" className="hover:text-foreground transition-colors">Battery Grade</Link></li>
              </ul>
            </div>
            
            {/* Resources */}
            <div>
              <h4 className="font-semibold mb-3 text-sm sm:text-base">Resources</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Lithium Prices</a></li>
                <li><a href="#features" className="hover:text-foreground transition-colors">Market Intel</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h4 className="font-semibold mb-3 text-sm sm:text-base">Company</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link></li>
                <li><a href="mailto:sales@lithiumbuy.com" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 sm:pt-8 border-t border-border/30">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © 2026 LithiumBuy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
