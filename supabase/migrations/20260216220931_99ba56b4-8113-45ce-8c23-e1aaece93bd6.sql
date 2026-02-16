
-- Add product_type enum
DO $$ BEGIN
  CREATE TYPE public.auction_product_type AS ENUM (
    'lithium_carbonate', 'lithium_hydroxide', 'spodumene', 'black_mass', 'recycled_material'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add bid_status enum
DO $$ BEGIN
  CREATE TYPE public.auction_bid_status AS ENUM ('active', 'outbid', 'withdrawn', 'winning');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add notification_type enum
DO $$ BEGIN
  CREATE TYPE public.auction_notification_type AS ENUM ('outbid', 'winning', 'auction_ending', 'auction_won', 'auction_lost');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Ensure auction_status enum has all needed values
ALTER TYPE public.auction_status ADD VALUE IF NOT EXISTS 'draft';
ALTER TYPE public.auction_status ADD VALUE IF NOT EXISTS 'scheduled';
ALTER TYPE public.auction_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE public.auction_status ADD VALUE IF NOT EXISTS 'closing';
ALTER TYPE public.auction_status ADD VALUE IF NOT EXISTS 'closed';
ALTER TYPE public.auction_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Add missing columns to auctions table
ALTER TABLE public.auctions
  ADD COLUMN IF NOT EXISTS product_type public.auction_product_type,
  ADD COLUMN IF NOT EXISTS quantity numeric,
  ADD COLUMN IF NOT EXISTS unit text DEFAULT 'MT',
  ADD COLUMN IF NOT EXISTS starting_bid numeric,
  ADD COLUMN IF NOT EXISTS current_bid numeric,
  ADD COLUMN IF NOT EXISTS bid_increment numeric DEFAULT 500,
  ADD COLUMN IF NOT EXISTS start_time timestamptz,
  ADD COLUMN IF NOT EXISTS end_time timestamptz,
  ADD COLUMN IF NOT EXISTS winner_id uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS extended_count integer DEFAULT 0;

-- Add missing columns to auction_bids table
ALTER TABLE public.auction_bids
  ADD COLUMN IF NOT EXISTS bidder_id uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS status public.auction_bid_status DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS placed_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS ip_address text;

-- Create auction_notifications table
CREATE TABLE IF NOT EXISTS public.auction_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid REFERENCES public.auctions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  type public.auction_notification_type NOT NULL,
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Enable RLS
ALTER TABLE public.auction_notifications ENABLE ROW LEVEL SECURITY;

-- RLS: Users can read their own notifications
CREATE POLICY "Users can view own auction notifications"
  ON public.auction_notifications FOR SELECT
  USING (user_id = auth.uid());

-- RLS: System can insert notifications (via SECURITY DEFINER functions)
CREATE POLICY "System can insert auction notifications"
  ON public.auction_notifications FOR INSERT
  WITH CHECK (true);

-- RLS: Users can mark their own as read
CREATE POLICY "Users can update own auction notifications"
  ON public.auction_notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id_amount ON public.auction_bids(auction_id, amount DESC);
CREATE INDEX IF NOT EXISTS idx_auction_bids_bidder_id ON public.auction_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON public.auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON public.auctions(end_time);
CREATE INDEX IF NOT EXISTS idx_auction_notifications_user_id ON public.auction_notifications(user_id, read_at);
