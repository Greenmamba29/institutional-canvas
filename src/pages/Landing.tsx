import { useEffect, useState } from 'react';
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
  Users,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import hero images
import lithiumHeroImg from '@/assets/landing/lithium-crystal-hero.png';
import telebuyImg from '@/assets/landing/telebuy-interface.png';
import dataVizImg from '@/assets/landing/data-visualization.png';

export default function Landing() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Ambient Background */}
      <div className="ambient-bg fixed inset-0 pointer-events-none z-0" />
      
      {/* Cursor Light */}
      <div 
        className="cursor-light hidden md:block"
        style={{ 
          left: mousePosition.x, 
          top: mousePosition.y,
        }}
      />

      {/* Sticky Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrollY > 50 ? "glass-nav py-3" : "py-6"
      )}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">LithiumBuy</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#architecture" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Architecture</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="neon-btn-cyan">
                Get Access
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Enterprise Badge */}
          <Badge className="mb-8 px-4 py-2 text-sm font-medium bg-accent/10 text-accent border-accent/30 hover:bg-accent/20">
            <Sparkles className="w-4 h-4 mr-2" />
            Enterprise 2.0 — Now Available
          </Badge>

          {/* Massive Typography */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6">
            <span className="apple-text-gradient">Intelligence</span>
            <br />
            <span className="gold-text-gradient">Verified.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            The first procurement platform powered by a{' '}
            <span className="text-primary font-medium">Neural Trust Layer</span> and{' '}
            <span className="text-accent font-medium">real-time negotiation intelligence</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/auth">
              <Button size="lg" className="neon-btn-cyan text-lg px-8 py-6">
                Start Trading
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 glass-basic">
              <Video className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* 3D Tablet Frame with Hero Image */}
          <div className="perspective-2000 mx-auto max-w-4xl">
            <div 
              className="preserve-3d transition-transform duration-300 ease-out"
              style={{
                transform: `rotateX(${(mousePosition.y - window.innerHeight / 2) * 0.01}deg) rotateY(${(mousePosition.x - window.innerWidth / 2) * 0.01}deg)`
              }}
            >
              <div className="glass-tablet rounded-3xl p-3 shadow-2xl">
                <div className="relative rounded-2xl overflow-hidden border border-border/50">
                  <img 
                    src={telebuyImg} 
                    alt="LithiumBuy Platform Interface" 
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Stats */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-8 md:gap-16">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary">$2.4B+</div>
            <div className="text-sm text-muted-foreground">Transaction Volume</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-accent">127</div>
            <div className="text-sm text-muted-foreground">Enterprise Buyers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-success">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime SLA</div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 border-y border-border/30">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground mb-8 tracking-widest uppercase">
            Trusted by Industry Leaders
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50">
            {['Tesla', 'CATL', 'Panasonic', 'BYD', 'Samsung SDI', 'LG Energy'].map((name) => (
              <div key={name} className="text-xl font-semibold text-muted-foreground">
                {name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Built for <span className="text-gradient-primary">Enterprise</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature designed for billion-dollar procurement workflows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Large TeleBuy Card */}
            <div className="md:col-span-2 md:row-span-2 glass-frosted rounded-3xl p-8 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Video className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">TeleBuy Connect</h3>
                    <p className="text-muted-foreground">Video-first negotiation</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-6 max-w-md">
                  Native video integration with real-time transcript analysis, sentiment tracking, and AI-powered deal recommendations.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="glass-basic rounded-xl p-4">
                    <CheckCircle2 className="w-5 h-5 text-success mb-2" />
                    <div className="font-medium">AI Summaries</div>
                    <div className="text-sm text-muted-foreground">Real-time transcription</div>
                  </div>
                  <div className="glass-basic rounded-xl p-4">
                    <Lock className="w-5 h-5 text-accent mb-2" />
                    <div className="font-medium">Privacy Controls</div>
                    <div className="text-sm text-muted-foreground">End-to-end encrypted</div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-2/3 opacity-80 group-hover:opacity-100 transition-opacity">
                <img src={telebuyImg} alt="TeleBuy Interface" className="rounded-tl-2xl" />
              </div>
            </div>

            {/* Trust Tiers Card */}
            <div className="glass-gradient-border rounded-3xl p-6 relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-xl font-bold">Trust Tiers</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Verified supplier credentials with multi-level trust scoring.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-accent/10 border border-accent/30">
                  <div className="w-3 h-3 rounded-full bg-accent" />
                  <span className="font-medium">Gold Verified</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                  <span className="text-muted-foreground">Silver Standard</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="w-3 h-3 rounded-full bg-muted" />
                  <span className="text-muted-foreground">Bronze Basic</span>
                </div>
              </div>
            </div>

            {/* SPOT.ai Card */}
            <div className="glass-basic rounded-3xl p-6 spotlight-sweep relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-xl font-bold">SPOT.ai</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Real-time lithium price forecasting powered by market intelligence.
              </p>
              <div className="glass-inset rounded-xl p-4">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-2xl font-bold text-primary font-mono">$24,500</span>
                  <span className="text-sm text-muted-foreground">/MT</span>
                </div>
                <div className="flex items-center gap-2 text-success">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">+3.2% vs yesterday</span>
                </div>
              </div>
            </div>

            {/* Global Coverage Card */}
            <div className="glass-basic rounded-3xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                  <Globe2 className="w-5 h-5 text-success" />
                </div>
                <h3 className="text-xl font-bold">Global Coverage</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Access verified suppliers across 47 countries and 6 continents.
              </p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">47</div>
                  <div className="text-xs text-muted-foreground">Countries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">312</div>
                  <div className="text-xs text-muted-foreground">Suppliers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-xs text-muted-foreground">Support</div>
                </div>
              </div>
            </div>

            {/* Data Hub Card - Wide */}
            <div className="md:col-span-2 glass-frosted rounded-3xl p-6 relative overflow-hidden">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">Architecture</Badge>
                  <h3 className="text-2xl font-bold mb-2">Neural Trust Layer</h3>
                  <p className="text-muted-foreground mb-4">
                    Our proprietary AI infrastructure processes market data, verifies credentials, and ensures transaction reliability.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span>Ingestion Layer — Market Intelligence Live</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span>Supabase Data Hub — The Brain</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span>Reliability Layer — Trust is not optional</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 relative">
                  <img 
                    src={dataVizImg} 
                    alt="Neural Trust Layer Visualization" 
                    className="rounded-2xl w-full h-48 object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="mb-4 bg-accent/10 text-accent border-accent/30">How It Works</Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                Enterprise-Grade <span className="text-gradient-gold">Infrastructure</span>
              </h2>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Ingestion Layer</h3>
                    <p className="text-muted-foreground">
                      Real-time market data from 50+ sources including LME, CME, and proprietary feeds.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center">
                    <span className="text-accent font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Supabase Data Hub</h3>
                    <p className="text-muted-foreground">
                      PostgreSQL backbone with real-time subscriptions, RLS policies, and edge functions.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-success/20 flex items-center justify-center">
                    <span className="text-success font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Reliability Layer</h3>
                    <p className="text-muted-foreground">
                      Multi-region deployment with 99.99% uptime SLA and automatic failover.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="glass-tablet rounded-3xl p-4">
                <img 
                  src={lithiumHeroImg} 
                  alt="Lithium Crystal Formation" 
                  className="rounded-2xl w-full"
                />
              </div>
              {/* Floating data cards */}
              <div className="absolute -left-4 top-1/4 glass-basic rounded-xl p-4 shadow-glow animate-float">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-sm font-medium">Live Feed</span>
                </div>
              </div>
              <div className="absolute -right-4 bottom-1/4 glass-gradient-border rounded-xl p-4">
                <div className="text-sm text-muted-foreground">Processing</div>
                <div className="text-xl font-bold text-primary font-mono">1.2M</div>
                <div className="text-xs text-muted-foreground">events/sec</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">Pricing</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, <span className="text-gradient-primary">Transparent</span> Pricing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free, upgrade when you're ready
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Tier */}
            <div className="glass-basic rounded-3xl p-8 relative">
              <h3 className="text-xl font-bold mb-2">Free</h3>
              <p className="text-muted-foreground mb-6">For exploring the platform</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Basic supplier search</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>3 RFQs per month</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Email support</span>
                </li>
              </ul>
              <Link to="/auth" className="block">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>

            {/* Pro Tier */}
            <div className="glass-gradient-border rounded-3xl p-8 relative scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <p className="text-muted-foreground mb-6">For growing businesses</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-bold">$199</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>SPOT.ai Market Intelligence</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>TeleBuy AI Summaries</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Unlimited RFQs</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Link to="/auth" className="block">
                <Button className="w-full neon-btn-cyan">Upgrade to Pro</Button>
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="glass-basic rounded-3xl p-8 relative">
              <h3 className="text-xl font-bold mb-2">Enterprise</h3>
              <p className="text-muted-foreground mb-6">For large organizations</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-bold">$1,999</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Full API access</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>White-label options</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>SSO / SAML integration</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Dedicated CSM</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Custom SLA</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full">Contact Sales</Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center glass-frosted rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to transform your procurement?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join 127+ enterprise buyers already using LithiumBuy for their critical supply chain needs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" className="neon-btn-gold text-lg px-8">
                  <Building2 className="w-5 h-5 mr-2" />
                  Start Enterprise Trial
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="text-lg px-8 glass-basic">
                  <Users className="w-5 h-5 mr-2" />
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">LithiumBuy</span>
            </div>
            
            <p className="text-muted-foreground text-center">
              Designed for the future of procurement.
            </p>
            
            <p className="text-sm text-muted-foreground">
              © 2026 LithiumBuy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
