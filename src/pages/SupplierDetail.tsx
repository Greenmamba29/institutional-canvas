import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  Phone,
  Mail,
  Star,
  Package,
  Award,
  MessageSquare,
  Video,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useSupplier, useSupplierProducts, useSupplierCertifications, useSupplierReviews } from "@/hooks/useSuppliers";
import { VerificationBadge, type BadgeTier } from "@/components/shared/VerificationBadge";
import { SupplierProducts } from "@/components/suppliers/SupplierProducts";
import { SupplierReviews } from "@/components/suppliers/SupplierReviews";
import { SupplierCertifications } from "@/components/suppliers/SupplierCertifications";
import { QuoteRequestModal } from "@/components/suppliers/QuoteRequestModal";
import { ScheduleTeleBuyModal } from "@/components/suppliers/ScheduleTeleBuyModal";

export default function SupplierDetail() {
  const { id } = useParams<{ id: string }>();
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [telebuyModalOpen, setTelebuyModalOpen] = useState(false);

  const { data: supplier, isLoading, error, refetch } = useSupplier(id || "");
  const { data: products } = useSupplierProducts(id || "");
  const { data: certifications } = useSupplierCertifications(id || "");
  const { data: reviews } = useSupplierReviews(id || "");

  if (isLoading) {
    return (
      <LayoutShell>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </LayoutShell>
    );
  }

  if (error || !supplier) {
    return (
      <LayoutShell>
        <div className="glass-panel rounded-xl p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Supplier not found</h3>
          <p className="text-muted-foreground mb-4">
            The supplier you're looking for doesn't exist or you don't have access.
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/marketplace">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Marketplace
              </Link>
            </Button>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </LayoutShell>
    );
  }

  const verificationTier = (supplier.verification_tier as BadgeTier) || "basic";
  const displayName = supplier.display_name || "Unnamed Supplier";
  const avgRating = reviews?.length 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/marketplace">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="p-3 rounded-xl bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                <VerificationBadge tier={verificationTier} />
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {avgRating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    {avgRating.toFixed(1)} ({reviews?.length || 0} reviews)
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {products?.length || 0} products
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto md:ml-0">
            <Button variant="outline" onClick={() => setTelebuyModalOpen(true)}>
              <Video className="h-4 w-4 mr-2" />
              Schedule TeleBuy
            </Button>
            <Button onClick={() => setQuoteModalOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Request Quote
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="products" className="space-y-6">
              <TabsList className="glass-panel">
                <TabsTrigger value="products" className="gap-2">
                  <Package className="h-4 w-4" />
                  Products
                  {products?.length ? (
                    <Badge variant="secondary" className="ml-1">
                      {products.length}
                    </Badge>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="reviews" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Reviews
                  {reviews?.length ? (
                    <Badge variant="secondary" className="ml-1">
                      {reviews.length}
                    </Badge>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="certifications" className="gap-2">
                  <Award className="h-4 w-4" />
                  Certifications
                  {certifications?.length ? (
                    <Badge variant="secondary" className="ml-1">
                      {certifications.length}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="products">
                <SupplierProducts 
                  products={products || []} 
                  onRequestQuote={() => setQuoteModalOpen(true)} 
                />
              </TabsContent>

              <TabsContent value="reviews">
                <SupplierReviews 
                  reviews={reviews || []} 
                  supplierId={id || ""} 
                  supplierName={displayName}
                />
              </TabsContent>

              <TabsContent value="certifications">
                <SupplierCertifications certifications={certifications || []} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Supplier Info */}
          <div className="space-y-4">
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Supplier Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {supplier.public_profile && typeof supplier.public_profile === 'object' && (
                  <>
                    {(supplier.public_profile as Record<string, unknown>).website && (
                      <div className="flex items-center gap-3 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={String((supplier.public_profile as Record<string, unknown>).website)}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {String((supplier.public_profile as Record<string, unknown>).website)}
                        </a>
                      </div>
                    )}
                    {(supplier.public_profile as Record<string, unknown>).description && (
                      <p className="text-sm text-muted-foreground">
                        {String((supplier.public_profile as Record<string, unknown>).description)}
                      </p>
                    )}
                  </>
                )}

                {supplier.capabilities && Array.isArray(supplier.capabilities) && supplier.capabilities.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Capabilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {(supplier.capabilities as string[]).map((cap: string, i: number) => (
                        <Badge key={i} variant="outline">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="glass-panel border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">
                      {products?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Products</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">
                      {reviews?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Reviews</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">
                      {certifications?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Certifications</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      {avgRating > 0 ? avgRating.toFixed(1) : "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <QuoteRequestModal
        open={quoteModalOpen}
        onOpenChange={setQuoteModalOpen}
        supplierId={id || ""}
        products={products || []}
      />

      <ScheduleTeleBuyModal
        open={telebuyModalOpen}
        onOpenChange={setTelebuyModalOpen}
        supplierId={id || ""}
        supplierName={displayName}
      />
    </LayoutShell>
  );
}
