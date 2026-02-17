
-- Drop existing function (different return type)
DROP FUNCTION IF EXISTS public.place_auction_bid(uuid, numeric, text);

-- Recreate with anti-sniping logic, returns jsonb
CREATE OR REPLACE FUNCTION public.place_auction_bid(
  p_auction_id uuid,
  p_amount numeric,
  p_currency text DEFAULT 'USD'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction     auctions%ROWTYPE;
  v_bidder_id   uuid := auth.uid();
  v_org_id      uuid;
  v_min_bid     numeric;
  v_bid_id      uuid;
  v_time_remaining interval;
  v_was_extended boolean := false;
BEGIN
  IF EXISTS (SELECT 1 FROM feature_flags WHERE key = 'kill_switch' AND enabled = true) THEN
    RAISE EXCEPTION 'System is currently in maintenance mode';
  END IF;

  IF v_bidder_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Ensure profile exists for FK constraint
  INSERT INTO public.profiles (id, email)
  VALUES (v_bidder_id, (SELECT email FROM auth.users WHERE id = v_bidder_id))
  ON CONFLICT (id) DO NOTHING;

  -- Get org_id from org_members
  SELECT om.org_id INTO v_org_id
  FROM org_members om WHERE om.user_id = v_bidder_id LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User is not a member of any organization';
  END IF;

  -- Lock and fetch auction
  SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Auction not found'; END IF;
  IF v_auction.status <> 'live' THEN RAISE EXCEPTION 'Auction is not live (status: %)', v_auction.status; END IF;
  IF v_auction.ends_at IS NOT NULL AND v_auction.ends_at < now() THEN RAISE EXCEPTION 'Auction has already ended'; END IF;
  IF v_org_id = v_auction.org_id THEN RAISE EXCEPTION 'You cannot bid on your own auction'; END IF;

  -- Calculate minimum bid
  IF v_auction.current_bid IS NOT NULL THEN
    v_min_bid := v_auction.current_bid + COALESCE(v_auction.bid_increment, 500);
  ELSE
    v_min_bid := COALESCE(v_auction.starting_bid, 0);
  END IF;

  IF p_amount < v_min_bid THEN RAISE EXCEPTION 'Bid must be at least %', v_min_bid; END IF;

  -- Mark previous high bidder as outbid
  UPDATE auction_bids SET status = 'outbid' WHERE auction_id = p_auction_id AND status = 'active';

  -- Insert the new bid
  INSERT INTO auction_bids (auction_id, bidder_id, org_id, created_by, amount, currency, status, placed_at)
  VALUES (p_auction_id, v_bidder_id, v_org_id, v_bidder_id, p_amount, p_currency, 'active', now())
  RETURNING id INTO v_bid_id;

  -- ANTI-SNIPING: Extend by 2 min if bid in last 2 min
  IF v_auction.ends_at IS NOT NULL THEN
    v_time_remaining := v_auction.ends_at - now();
    IF v_time_remaining <= interval '2 minutes' AND v_time_remaining > interval '0 seconds' THEN
      UPDATE auctions
      SET ends_at = now() + interval '2 minutes',
          end_time = now() + interval '2 minutes',
          extended_count = COALESCE(extended_count, 0) + 1,
          current_bid = p_amount,
          updated_at = now()
      WHERE id = p_auction_id;
      v_was_extended := true;
    ELSE
      UPDATE auctions SET current_bid = p_amount, updated_at = now() WHERE id = p_auction_id;
    END IF;
  ELSE
    UPDATE auctions SET current_bid = p_amount, updated_at = now() WHERE id = p_auction_id;
  END IF;

  -- Create outbid notifications
  INSERT INTO auction_notifications (auction_id, user_id, type)
  SELECT p_auction_id, ab.bidder_id, 'outbid'
  FROM auction_bids ab
  WHERE ab.auction_id = p_auction_id AND ab.status = 'outbid'
    AND ab.bidder_id IS NOT NULL AND ab.bidder_id <> v_bidder_id
  GROUP BY ab.bidder_id;

  RETURN jsonb_build_object(
    'bid_id', v_bid_id,
    'amount', p_amount,
    'currency', p_currency,
    'org_id', v_org_id,
    'was_extended', v_was_extended,
    'extended_count', CASE WHEN v_was_extended THEN COALESCE(v_auction.extended_count, 0) + 1 ELSE COALESCE(v_auction.extended_count, 0) END
  );
END;
$$;
