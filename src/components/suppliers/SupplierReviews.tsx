import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, ThumbsUp, MessageSquare, ChevronDown, ChevronUp, PenSquare } from "lucide-react";
import { format } from "date-fns";
import { WriteReviewModal } from "@/components/reviews/WriteReviewModal";
import { incrementReviewHelpful } from "@/services/reviews.service";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supplierKeys } from "@/hooks/useSuppliers";

interface Review {
  id: string;
  rating: number;
  content: string;
  author: string;
  company: string | null;
  verified_purchase: boolean | null;
  helpful_count: number | null;
  created_at: string | null;
}

interface SupplierReviewsProps {
  reviews: Review[];
  supplierId: string;
  supplierName?: string;
}

export function SupplierReviews({ reviews, supplierId, supplierName }: SupplierReviewsProps) {
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "helpful">("newest");
  const [showAll, setShowAll] = useState(false);
  const [writeReviewOpen, setWriteReviewOpen] = useState(false);
  const queryClient = useQueryClient();

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      case "highest":
        return b.rating - a.rating;
      case "helpful":
        return (b.helpful_count || 0) - (a.helpful_count || 0);
      default:
        return 0;
    }
  });

  const displayedReviews = showAll ? sortedReviews : sortedReviews.slice(0, 5);

  const avgRating = reviews.length
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => r.rating === rating).length,
    percentage: reviews.length
      ? (reviews.filter((r) => r.rating === rating).length / reviews.length) * 100
      : 0,
  }));

  const handleMarkHelpful = async (reviewId: string) => {
    const { error } = await incrementReviewHelpful(reviewId);
    
    if (error) {
      toast.error("Failed to mark as helpful");
    } else {
      toast.success("Marked as helpful");
      queryClient.invalidateQueries({ queryKey: supplierKeys.reviews(supplierId) });
    }
  };

  if (reviews.length === 0) {
    return (
      <Card className="glass-panel border-border/50">
        <CardContent className="p-8 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
          <p className="text-muted-foreground mb-4">
            Be the first to review this supplier.
          </p>
          <Button onClick={() => setWriteReviewOpen(true)}>
            <PenSquare className="h-4 w-4 mr-2" />
            Write a Review
          </Button>
          <WriteReviewModal
            open={writeReviewOpen}
            onOpenChange={setWriteReviewOpen}
            supplierId={supplierId}
            supplierName={supplierName || "Supplier"}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: supplierKeys.reviews(supplierId) })}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card className="glass-panel border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Average Rating */}
            <div className="text-center md:border-r md:pr-6 border-border/50">
              <p className="text-5xl font-bold">{avgRating.toFixed(1)}</p>
              <div className="flex justify-center my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(avgRating)
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Based on {reviews.length} reviews
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="flex-1 space-y-2">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm w-8">{rating} ★</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          {(["newest", "highest", "helpful"] as const).map((option) => (
            <Button
              key={option}
              variant={sortBy === option ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setSortBy(option)}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Button>
          ))}
        </div>
        <Button onClick={() => setWriteReviewOpen(true)}>
          <PenSquare className="h-4 w-4 mr-2" />
          Write a Review
        </Button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {displayedReviews.map((review) => (
          <Card key={review.id} className="glass-panel border-border/50">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {review.author.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{review.author}</span>
                    {review.company && (
                      <span className="text-sm text-muted-foreground">
                        • {review.company}
                      </span>
                    )}
                    {review.verified_purchase && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                        Verified Purchase
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                    {review.created_at && (
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-foreground/90">{review.content}</p>

                  <div className="flex items-center gap-4 mt-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground"
                      onClick={() => handleMarkHelpful(review.id)}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      Helpful ({review.helpful_count || 0})
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Show More */}
      {reviews.length > 5 && (
        <div className="text-center">
          <Button variant="outline" onClick={() => setShowAll(!showAll)}>
            {showAll ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show All {reviews.length} Reviews
              </>
            )}
          </Button>
        </div>
      )}

      <WriteReviewModal
        open={writeReviewOpen}
        onOpenChange={setWriteReviewOpen}
        supplierId={supplierId}
        supplierName={supplierName || "Supplier"}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: supplierKeys.reviews(supplierId) })}
      />
    </div>
  );
}
