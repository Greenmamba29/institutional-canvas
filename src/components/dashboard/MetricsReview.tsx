import { useCurrency } from '@/hooks/useCurrency';

interface MetricsReviewProps {
  /** Real platform GMV in canonical USD (sum of order totals). */
  totalGMV: number;
  /** Count of verified supplier firms. */
  verifiedFirms?: number;
  /** Count of gold-tier verified suppliers. */
  goldTierSuppliers?: number;
}

export function MetricsReview({
  totalGMV,
  verifiedFirms,
  goldTierSuppliers,
}: MetricsReviewProps) {
  const { format } = useCurrency();

  return (
    <div className="glass-panel rounded-xl p-5 space-y-4">
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-mono">{format(totalGMV)}</span>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-secondary/40 text-muted-foreground rounded">
            TOTAL GMV
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground tracking-wider mt-1">
          GROSS MERCHANDISE VALUE
        </p>
      </div>

      <div className="space-y-2 text-xs">
        {typeof verifiedFirms === 'number' && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">VERIFIED FIRMS</span>
            <span className="font-semibold">{verifiedFirms} Firm <span className="text-success">VERIFIED</span></span>
          </div>
        )}
        {typeof goldTierSuppliers === 'number' && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">GOLD TIER SUPPLIERS</span>
            <span className="font-semibold">{goldTierSuppliers} <span className="text-accent">GOLD TIER</span></span>
          </div>
        )}
      </div>
    </div>
  );
}
