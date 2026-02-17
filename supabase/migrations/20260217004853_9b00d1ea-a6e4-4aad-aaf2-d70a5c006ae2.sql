-- Fix place_auction_bid to use org_members lookup instead of jwt_org_id()
-- This resolves "Missing org_id in JWT" error since Supabase Auth JWT 
-- does not consistently include org_id in claims.

CREATE OR REPLACE FUNCTION public.place_auction_bid(
  p_auction_id uuid, 
  p_amount numeric, 
  p_currency text
)
RETURNS auction_bids
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_org uuid;
  v_auc public.auctions;
  v_row public.auction_bids;
BEGIN
  -- Look up org_id from org_members instead of JWT claims
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  SELECT org_id INTO v_org 
  FROM public.org_members 
  WHERE user_id = v_user 
  ORDER BY created_at ASC 
  LIMIT 1;
  
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'User is not a member of any organization';
  END IF;
  
  -- Validate auction exists and is live
  SELECT * INTO v_auc FROM public.auctions WHERE id = p_auction_id;
  IF NOT FOUND THEN 
    RAISE EXCEPTION 'Auction not found'; 
  END IF;
  
  IF v_auc.status != 'live' THEN
    RAISE EXCEPTION 'Auction is not currently active';
  END IF;
  
  -- Validate bid amount exceeds current bid + increment
  IF v_auc.current_bid IS NOT NULL AND v_auc.bid_increment IS NOT NULL THEN
    IF p_amount < (v_auc.current_bid + v_auc.bid_increment) THEN
      RAISE EXCEPTION 'Bid must be at least % (current bid + increment)', 
        v_auc.current_bid + v_auc.bid_increment;
    END IF;
  ELSIF v_auc.starting_bid IS NOT NULL AND p_amount < v_auc.starting_bid THEN
    RAISE EXCEPTION 'Bid must be at least the starting bid of %', v_auc.starting_bid;
  END IF;
  
  -- Prevent bidding on own auction
  IF v_auc.org_id = v_org THEN
    RAISE EXCEPTION 'Cannot bid on your own auction';
  END IF;
  
  -- Insert bid
  INSERT INTO public.auction_bids(auction_id, org_id, created_by, bidder_id, amount, currency, status, placed_at)
  VALUES (p_auction_id, v_org, v_user, v_user, p_amount, COALESCE(p_currency, 'USD'), 'active', NOW())
  RETURNING * INTO v_row;
  
  -- Update auction current_bid
  UPDATE public.auctions 
  SET current_bid = p_amount, updated_at = NOW()
  WHERE id = p_auction_id AND (current_bid IS NULL OR current_bid < p_amount);
  
  -- Mark previous highest bidder as outbid
  UPDATE public.auction_bids 
  SET status = 'outbid'
  WHERE auction_id = p_auction_id 
    AND id != v_row.id 
    AND status = 'active';
  
  -- Notify auction owner
  INSERT INTO public.notifications(org_id, type, title, body, entity_type, entity_id)
  VALUES (v_auc.org_id, 'auction_bid_placed', 'New auction bid', 
    format('New bid of %s %s placed on "%s"', p_amount, COALESCE(p_currency, 'USD'), v_auc.title),
    'auction', v_auc.id);
  
  -- Notify outbid users
  INSERT INTO public.notifications(org_id, type, title, body, entity_type, entity_id)
  SELECT DISTINCT ab.org_id, 'system'::notification_type, 'You were outbid!',
    format('Someone placed a higher bid of %s %s on "%s"', p_amount, COALESCE(p_currency, 'USD'), v_auc.title),
    'auction', v_auc.id
  FROM public.auction_bids ab
  WHERE ab.auction_id = p_auction_id 
    AND ab.org_id != v_org
    AND ab.id != v_row.id;
  
  RETURN v_row;
END;
$function$;