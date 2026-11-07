-- ============================================================================
-- MARKET INTELLIGENCE TABLES FOR LITHIUMBUY
-- ============================================================================

-- Price Intelligence Table
CREATE TABLE IF NOT EXISTS market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type TEXT NOT NULL,
  purity TEXT DEFAULT 'battery_grade',
  region TEXT NOT NULL,
  price_usd DECIMAL(12,2) NOT NULL,
  price_change_24h DECIMAL(6,2) DEFAULT 0,
  market_trend TEXT CHECK (market_trend IN ('up', 'down', 'stable')) DEFAULT 'stable',
  confidence_score DECIMAL(5,2) DEFAULT 85.0,
  source TEXT DEFAULT 'perplexity',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dashboard KPIs Table (renamed to avoid conflict with existing tables)
CREATE TABLE IF NOT EXISTS market_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT UNIQUE NOT NULL,
  metric_value DECIMAL(15,2) NOT NULL,
  previous_value DECIMAL(15,2),
  change_percent DECIMAL(6,2),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market News Table
CREATE TABLE IF NOT EXISTS market_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  url TEXT,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')) DEFAULT 'neutral',
  sentiment_score DECIMAL(5,2),
  category TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Arbitrage Opportunities Table
CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type TEXT NOT NULL,
  purity TEXT DEFAULT 'battery_grade',
  buy_region TEXT NOT NULL,
  sell_region TEXT NOT NULL,
  buy_price DECIMAL(12,2) NOT NULL,
  sell_price DECIMAL(12,2) NOT NULL,
  profit_margin_percent DECIMAL(6,2) NOT NULL,
  confidence_score DECIMAL(5,2) DEFAULT 85.0,
  status TEXT CHECK (status IN ('active', 'expired', 'executed')) DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market Briefings Table (for daily summaries)
CREATE TABLE IF NOT EXISTS market_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_date DATE UNIQUE NOT NULL,
  executive_summary TEXT,
  key_highlights JSONB,
  price_outlook TEXT,
  risk_factors JSONB,
  opportunities JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_market_prices_region ON market_prices(region);
CREATE INDEX IF NOT EXISTS idx_market_prices_updated ON market_prices(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_news_published ON market_news(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_news_sentiment ON market_news(sentiment);
CREATE INDEX IF NOT EXISTS idx_arbitrage_status ON arbitrage_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_arbitrage_margin ON arbitrage_opportunities(profit_margin_percent DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitrage_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_briefings ENABLE ROW LEVEL SECURITY;

-- Public read access policies
CREATE POLICY "Public read market_prices" ON market_prices FOR SELECT USING (true);
CREATE POLICY "Public read market_kpis" ON market_kpis FOR SELECT USING (true);
CREATE POLICY "Public read market_news" ON market_news FOR SELECT USING (true);
CREATE POLICY "Public read arbitrage_opportunities" ON arbitrage_opportunities FOR SELECT USING (true);
CREATE POLICY "Public read market_briefings" ON market_briefings FOR SELECT USING (true);

-- Service role write policies
CREATE POLICY "Service write market_prices" ON market_prices FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update market_prices" ON market_prices FOR UPDATE USING (true);
CREATE POLICY "Service write market_kpis" ON market_kpis FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update market_kpis" ON market_kpis FOR UPDATE USING (true);
CREATE POLICY "Service write market_news" ON market_news FOR INSERT WITH CHECK (true);
CREATE POLICY "Service write arbitrage_opportunities" ON arbitrage_opportunities FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update arbitrage_opportunities" ON arbitrage_opportunities FOR UPDATE USING (true);
CREATE POLICY "Service write market_briefings" ON market_briefings FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update market_briefings" ON market_briefings FOR UPDATE USING (true);

-- ============================================================================
-- REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE market_prices;
ALTER PUBLICATION supabase_realtime ADD TABLE market_kpis;
ALTER PUBLICATION supabase_realtime ADD TABLE market_news;
ALTER PUBLICATION supabase_realtime ADD TABLE arbitrage_opportunities;
ALTER PUBLICATION supabase_realtime ADD TABLE market_briefings;

-- ============================================================================
-- SEED DATA
-- ============================================================================

INSERT INTO market_kpis (metric_name, metric_value) VALUES
  ('avg_lithium_price', 13500),
  ('total_suppliers', 247),
  ('total_buyers', 89),
  ('active_auctions', 12),
  ('pending_rfqs', 34),
  ('arbitrage_count', 5),
  ('price_change_24h', 2.3)
ON CONFLICT (metric_name) DO UPDATE SET 
  metric_value = EXCLUDED.metric_value,
  updated_at = NOW();

INSERT INTO market_prices (product_type, purity, region, price_usd, price_change_24h, market_trend, confidence_score) VALUES
  ('Lithium Carbonate', 'battery_grade', 'Asia', 12800, 1.5, 'up', 92),
  ('Lithium Carbonate', 'battery_grade', 'Europe', 14200, 2.3, 'up', 89),
  ('Lithium Hydroxide', 'battery_grade', 'Americas', 15500, -0.8, 'down', 87),
  ('Lithium Carbonate', 'technical_grade', 'Asia', 11200, 0.5, 'stable', 85),
  ('Spodumene Concentrate', '6%', 'Australia', 1450, 3.2, 'up', 94)
ON CONFLICT DO NOTHING;

INSERT INTO market_news (title, summary, source, url, sentiment, sentiment_score, category) VALUES
  (
    'Tesla Signs Major Lithium Supply Deal with Chilean Producer',
    'Tesla has secured a multi-year lithium supply agreement with SQM, ensuring stable supply for Gigafactory operations through 2030.',
    'Reuters',
    'https://reuters.com/tesla-lithium-deal',
    'positive',
    0.85,
    'supply_chain'
  ),
  (
    'Chile Implements New Lithium Export Quotas',
    'Chilean government announces new export restrictions on lithium, affecting global supply chains and potentially increasing prices.',
    'Bloomberg',
    'https://bloomberg.com/chile-lithium',
    'negative',
    0.72,
    'regulatory'
  ),
  (
    'EV Sales Surge 45% in Q4, Driving Lithium Demand',
    'Global electric vehicle sales exceeded expectations in Q4, with China leading growth and boosting demand for battery-grade lithium.',
    'Financial Times',
    'https://ft.com/ev-sales',
    'positive',
    0.91,
    'demand'
  )
ON CONFLICT DO NOTHING;

INSERT INTO arbitrage_opportunities (product_type, purity, buy_region, sell_region, buy_price, sell_price, profit_margin_percent, expires_at) VALUES
  ('Lithium Carbonate', 'battery_grade', 'Asia', 'Europe', 12800, 14200, 5.6, NOW() + INTERVAL '24 hours'),
  ('Lithium Hydroxide', 'battery_grade', 'Americas', 'Asia', 15500, 16200, 4.4, NOW() + INTERVAL '18 hours'),
  ('Lithium Carbonate', 'technical_grade', 'Asia', 'Americas', 11200, 11900, 3.2, NOW() + INTERVAL '36 hours')
ON CONFLICT DO NOTHING;

-- (Legacy third-party inbound webhook RPC removed; see 20261107000000_drop_legacy_inbound_webhook_rpc.sql)

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_market_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'kpis', (SELECT jsonb_object_agg(metric_name, metric_value) FROM market_kpis),
    'price_count', (SELECT COUNT(*) FROM market_prices),
    'news_count', (SELECT COUNT(*) FROM market_news WHERE created_at > NOW() - INTERVAL '24 hours'),
    'active_arbitrage', (SELECT COUNT(*) FROM arbitrage_opportunities WHERE status = 'active'),
    'last_updated', NOW()
  ) INTO result;
  
  RETURN result;
END;
$$;