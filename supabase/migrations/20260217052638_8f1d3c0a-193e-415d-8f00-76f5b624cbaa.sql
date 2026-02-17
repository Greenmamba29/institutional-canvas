
-- close_ended_auctions: auto-close expired live auctions, pick winner, notify
CREATE OR REPLACE FUNCTION public.close_ended_auctions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction RECORD;
  v_winner_bid RECORD;
  v_closed_count INT := 0;
BEGIN
  FOR v_auction IN
    SELECT id, title, org_id
    FROM auctions
    WHERE status = 'live' AND ends_at <= now()
  LOOP
    -- Find highest bid
    SELECT id, bidder_id, amount
    INTO v_winner_bid
    FROM auction_bids
    WHERE auction_id = v_auction.id
    ORDER BY amount DESC
    LIMIT 1;

    -- Update auction to ended
    UPDATE auctions
    SET status = 'ended',
        winner_id = v_winner_bid.bidder_id,
        current_bid = COALESCE(v_winner_bid.amount, current_bid),
        updated_at = now()
    WHERE id = v_auction.id;

    IF v_winner_bid.id IS NOT NULL THEN
      -- Mark winning bid
      UPDATE auction_bids SET status = 'won'
      WHERE id = v_winner_bid.id;

      -- Mark all other bids as lost
      UPDATE auction_bids SET status = 'lost'
      WHERE auction_id = v_auction.id AND id != v_winner_bid.id;

      -- Notify the winner via notifications table
      INSERT INTO notifications (org_id, user_id, title, body, type, entity_type, entity_id)
      VALUES (
        v_auction.org_id,
        v_winner_bid.bidder_id,
        'You won: ' || v_auction.title,
        'Your bid of $' || v_winner_bid.amount || ' won the auction.',
        'auction_won',
        'auction',
        v_auction.id
      );
    END IF;

    v_closed_count := v_closed_count + 1;
  END LOOP;

  RETURN jsonb_build_object('closed', v_closed_count);
END;
$$;
