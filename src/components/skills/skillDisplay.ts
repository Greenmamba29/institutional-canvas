/**
 * Skill display metadata
 *
 * Maps internal skill identifiers to human-friendly display names and
 * maps numeric recommendation priorities to a clean tiered label/variant.
 *
 * This is the single source of truth for how skills are labelled in the
 * Suggested-Actions UI, replacing raw dev-y ids (e.g. "rfq.create",
 * "lb-rfq-orchestrate") and raw "Priority: N" text.
 */

/**
 * Friendly display names keyed by skill identifier.
 *
 * Both the dotted skill names used by the recommendation engine
 * (e.g. "rfq.create") and the long-form skill ids (e.g.
 * "lb-rfq-orchestrate") are covered so the UI always has a clean label.
 */
const SKILL_DISPLAY_NAMES: Record<string, string> = {
  // Dotted skill names (recommendation engine)
  'rfq.create': 'Create RFQ',
  'rfq.list': 'View RFQs',
  'rfq.respond': 'Respond to RFQ',
  'auction.bid': 'Place Bid',
  'auction.list': 'View Auctions',
  'auction.settle': 'Settle Auction',
  'telebuy.start': 'Schedule TeleBuy',
  'telebuy.list': 'View TeleBuy Sessions',
  'deal.award': 'Award Best Bid',
  'deal.view': 'View Deal',
  'order.create': 'Create Order',
  'order.view': 'View Order',
  'order.update': 'Update Order',

  // Long-form skill ids
  'lb-rfq-orchestrate': 'Orchestrate RFQ',
  'lb-bid-to-deal': 'Award Best Bid',
  'lb-telebuy-session': 'Schedule TeleBuy',
  'lb-telebuy-summarize': 'Summarize TeleBuy',
  'lb-market-pulse': 'Market Pulse',
  'lb-grant-match': 'Match Grants',
  'lb-procure-custody': 'Log Custody Event',
  'lb-auction-monitor': 'Monitor Auction',
};

/**
 * Resolve a friendly display name for a skill.
 *
 * Falls back to a title-cased version of the identifier (stripping the
 * dotted/dashed dev formatting) so unknown skills still render cleanly.
 */
export function getSkillDisplayName(skillName: string, fallback?: string): string {
  const mapped = SKILL_DISPLAY_NAMES[skillName];
  if (mapped) return mapped;

  // Clean up any remaining dev-y formatting for unknown skills.
  const cleaned = skillName
    .replace(/^lb-/, '')
    .replace(/[._-]/g, ' ')
    .trim();

  if (cleaned) {
    return cleaned
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return fallback || skillName;
}

export type PriorityTier = 'high' | 'medium' | 'low';

/**
 * Map a numeric recommendation priority to a tier.
 *
 * The recommendation engine scores skills roughly in the 1-15 range
 * (base 5, plus context boosts). We bucket those into three tiers.
 */
export function getPriorityTier(priority: number): PriorityTier {
  if (priority >= 9) return 'high';
  if (priority >= 6) return 'medium';
  return 'low';
}

const PRIORITY_LABELS: Record<PriorityTier, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function getPriorityLabel(priority: number): string {
  return PRIORITY_LABELS[getPriorityTier(priority)];
}

/**
 * Tailwind classes for the priority chip, themed for the dark/gold palette.
 * - high  -> primary/amber emphasis
 * - medium -> muted
 * - low   -> subtle
 */
const PRIORITY_CHIP_CLASSES: Record<PriorityTier, string> = {
  high: 'border-primary/40 bg-primary/15 text-primary',
  medium: 'border-border bg-muted text-muted-foreground',
  low: 'border-transparent bg-muted/40 text-muted-foreground/80',
};

export function getPriorityChipClasses(priority: number): string {
  return PRIORITY_CHIP_CLASSES[getPriorityTier(priority)];
}
