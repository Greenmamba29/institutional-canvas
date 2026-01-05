import { Button } from '@/components/ui/button';
import { ShoppingCart, FileCheck, CreditCard } from 'lucide-react';

interface TeleBuyActionBarProps {
  onAddToCart: () => void;
  onReviewAgreement: () => void;
  onConfirmPurchase: () => void;
  isDisabled?: boolean;
}

export function TeleBuyActionBar({
  onAddToCart,
  onReviewAgreement,
  onConfirmPurchase,
  isDisabled = false,
}: TeleBuyActionBarProps) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border p-4">
      <div className="flex items-center justify-center gap-4 max-w-4xl mx-auto">
        <Button
          variant="outline"
          size="lg"
          onClick={onAddToCart}
          disabled={isDisabled}
          className="flex-1 max-w-[200px]"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={onReviewAgreement}
          disabled={isDisabled}
          className="flex-1 max-w-[200px]"
        >
          <FileCheck className="h-4 w-4 mr-2" />
          Review Agreement
        </Button>
        <Button
          size="lg"
          onClick={onConfirmPurchase}
          disabled={isDisabled}
          className="flex-1 max-w-[200px] bg-primary hover:bg-primary/90"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Confirm Purchase
        </Button>
      </div>
    </div>
  );
}
