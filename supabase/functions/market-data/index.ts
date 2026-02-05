 import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
 
 const MAKE_API_KEY = Deno.env.get('MAKE_API_KEY');
 const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
 const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 };
 
 // Make.com Data Store IDs
 const DATA_STORES = {
   prices: '73727',
   kpis: '73730',
   news: '73723',
   arbitrage: '73728',
 };
 
 interface DataStoreRecord {
   key: string;
   data: Record<string, any>;
 }
 
 async function fetchDataStore(storeId: string): Promise<DataStoreRecord[]> {
   if (!MAKE_API_KEY) {
     throw new Error('MAKE_API_KEY is not configured');
   }
 
   const response = await fetch(
     `https://us1.make.com/api/v2/data-stores/${storeId}/data`,
     {
       headers: {
         'Authorization': `Token ${MAKE_API_KEY}`,
         'Content-Type': 'application/json',
       },
     }
   );
 
   if (!response.ok) {
     const errorText = await response.text();
     console.error(`Make.com API error for store ${storeId}:`, errorText);
     throw new Error(`Make.com API error (${response.status}): ${errorText}`);
   }
 
   const result = await response.json();
   return result.records || [];
 }
 
 async function syncPricesToSupabase(supabase: any, records: DataStoreRecord[]) {
   const prices = records.map(r => ({
     product_type: r.data.product_type || 'lithium_carbonate',
     purity: r.data.purity || '99.5%',
     region: r.data.region || 'Global',
     price_usd: parseFloat(r.data.price_usd) || 0,
     price_change_24h: parseFloat(r.data.price_change_24h) || 0,
     market_trend: r.data.market_trend || 'stable',
     source: r.data.source || 'make.com',
     confidence_score: parseFloat(r.data.confidence_score) || 0.85,
     updated_at: new Date().toISOString(),
   }));
 
   const { error } = await supabase
     .from('market_prices')
     .upsert(prices, { onConflict: 'product_type,region' });
 
   if (error) {
     console.error('Error syncing prices:', error);
     throw error;
   }
 
   return prices.length;
 }
 
 async function syncKpisToSupabase(supabase: any, records: DataStoreRecord[]) {
   const kpis = records.map(r => ({
     metric_name: r.data.metric_name,
     metric_value: parseFloat(r.data.metric_value) || 0,
     previous_value: parseFloat(r.data.previous_value) || 0,
     change_percent: parseFloat(r.data.change_percent) || 0,
     updated_at: new Date().toISOString(),
   }));
 
   const { error } = await supabase
     .from('market_kpis')
     .upsert(kpis, { onConflict: 'metric_name' });
 
   if (error) {
     console.error('Error syncing KPIs:', error);
     throw error;
   }
 
   return kpis.length;
 }
 
 async function syncNewsToSupabase(supabase: any, records: DataStoreRecord[]) {
   const news = records.map(r => ({
     title: r.data.title,
     summary: r.data.summary,
     source: r.data.source,
     url: r.data.url,
     sentiment: r.data.sentiment || 'neutral',
     sentiment_score: parseFloat(r.data.sentiment_score) || 0,
     category: r.data.category || 'market',
     published_at: r.data.published_at || new Date().toISOString(),
   }));
 
   const { error } = await supabase
     .from('market_news')
     .upsert(news, { onConflict: 'title' });
 
   if (error) {
     console.error('Error syncing news:', error);
     throw error;
   }
 
   return news.length;
 }
 
 async function syncArbitrageToSupabase(supabase: any, records: DataStoreRecord[]) {
   const arbitrage = records.map(r => ({
     product_type: r.data.product_type || 'lithium_carbonate',
     purity: r.data.purity,
     buy_region: r.data.buy_region,
     sell_region: r.data.sell_region,
     buy_price: parseFloat(r.data.buy_price) || 0,
     sell_price: parseFloat(r.data.sell_price) || 0,
     profit_margin_percent: parseFloat(r.data.profit_margin_percent) || 0,
     confidence_score: parseFloat(r.data.confidence_score) || 0.8,
     status: r.data.status || 'active',
     detected_at: r.data.detected_at || new Date().toISOString(),
   }));
 
   const { error } = await supabase
     .from('arbitrage_opportunities')
     .upsert(arbitrage, { onConflict: 'product_type,buy_region,sell_region' });
 
   if (error) {
     console.error('Error syncing arbitrage:', error);
     throw error;
   }
 
   return arbitrage.length;
 }
 
 serve(async (req) => {
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     const url = new URL(req.url);
     const dataType = url.searchParams.get('type') || 'all';
 
     console.log(`Fetching market data from Make.com: ${dataType}`);
 
     if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
       throw new Error('Supabase configuration missing');
     }
 
     const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
     const results: Record<string, any> = {};
 
     // Fetch and sync based on type parameter
     if (dataType === 'all' || dataType === 'prices') {
       try {
         const priceRecords = await fetchDataStore(DATA_STORES.prices);
         results.prices = await syncPricesToSupabase(supabase, priceRecords);
         console.log(`Synced ${results.prices} price records`);
       } catch (err) {
         console.error('Prices sync failed:', err);
         results.prices = { error: String(err) };
       }
     }
 
     if (dataType === 'all' || dataType === 'kpis') {
       try {
         const kpiRecords = await fetchDataStore(DATA_STORES.kpis);
         results.kpis = await syncKpisToSupabase(supabase, kpiRecords);
         console.log(`Synced ${results.kpis} KPI records`);
       } catch (err) {
         console.error('KPIs sync failed:', err);
         results.kpis = { error: String(err) };
       }
     }
 
     if (dataType === 'all' || dataType === 'news') {
       try {
         const newsRecords = await fetchDataStore(DATA_STORES.news);
         results.news = await syncNewsToSupabase(supabase, newsRecords);
         console.log(`Synced ${results.news} news records`);
       } catch (err) {
         console.error('News sync failed:', err);
         results.news = { error: String(err) };
       }
     }
 
     if (dataType === 'all' || dataType === 'arbitrage') {
       try {
         const arbRecords = await fetchDataStore(DATA_STORES.arbitrage);
         results.arbitrage = await syncArbitrageToSupabase(supabase, arbRecords);
         console.log(`Synced ${results.arbitrage} arbitrage records`);
       } catch (err) {
         console.error('Arbitrage sync failed:', err);
         results.arbitrage = { error: String(err) };
       }
     }
 
     // Log the sync event
     await supabase.from('webhook_events').insert({
       event_type: 'market_data_refresh',
       source: 'market-data',
       payload: { dataType, results, timestamp: new Date().toISOString() },
       status: 'success',
     });
 
     return new Response(
       JSON.stringify({
         success: true,
         message: 'Market data refreshed from Make.com Data Stores',
         results,
         timestamp: new Date().toISOString(),
       }),
       {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 200,
       }
     );
   } catch (error: unknown) {
     console.error('Market data fetch error:', error);
     const errorMessage = error instanceof Error ? error.message : 'Unknown error';
 
     return new Response(
       JSON.stringify({
         success: false,
         error: errorMessage,
       }),
       {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 500,
       }
     );
   }
 });