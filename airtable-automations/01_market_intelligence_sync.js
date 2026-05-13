// ─────────────────────────────────────────────────────────────────────────────
// Automation: Market Intelligence Sync
// Trigger:    Scheduled (daily, e.g. 6:00 AM UTC)
// Tables:     Market Prices, Dashboard KPIs, Market News
//
// Secrets to add in this automation:
//   AIRTABLE_WEBHOOK_SECRET  →  your custom shared secret
//   SUPABASE_WEBHOOK_URL     →  https://vuekwckknfjivjighhfd.supabase.co/functions/v1/airtable-market-webhook
//   SUPABASE_ANON_KEY        →  (Supabase anon key from dashboard)
//
// No input variables needed — reads from the base directly.
// ─────────────────────────────────────────────────────────────────────────────

const webhookSecret = input.secret('AIRTABLE_WEBHOOK_SECRET');
const webhookUrl    = input.secret('SUPABASE_WEBHOOK_URL');
const anonKey       = input.secret('SUPABASE_ANON_KEY');

if (!webhookSecret) throw new Error('Missing secret: AIRTABLE_WEBHOOK_SECRET');
if (!webhookUrl)    throw new Error('Missing secret: SUPABASE_WEBHOOK_URL');
if (!anonKey)       throw new Error('Missing secret: SUPABASE_ANON_KEY');

async function syncTable(tableName, fields, supabaseTable) {
  const table = base.getTable(tableName);
  const query = await table.selectRecordsAsync({ fields });
  const records = query.records.map(r => {
    const obj = { airtable_id: r.id };
    for (const f of fields) {
      const val = r.getCellValue(f);
      // Skip linked record arrays and attachments
      if (Array.isArray(val) && val.length > 0 && val[0].id && val[0].id.startsWith('rec')) continue;
      if (Array.isArray(val) && val.length > 0 && val[0].url) continue;
      // Flatten select objects
      if (val && typeof val === 'object' && val.name !== undefined) {
        obj[f] = val.name;
      } else if (Array.isArray(val) && val.length > 0 && val[0].name !== undefined) {
        obj[f] = val.map(v => v.name);
      } else {
        obj[f] = val;
      }
    }
    return obj;
  });

  if (records.length === 0) {
    console.log(`${tableName}: no records to sync`);
    return { synced: 0, failed: 0 };
  }

  const payload = {
    _secret:   webhookSecret,
    table:     supabaseTable,
    action:    'sync_batch',
    records,
    eventName: `Market Intelligence Sync - ${tableName}`,
    timestamp: new Date().toISOString(),
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.text();
  if (!res.ok) {
    console.error(`${tableName} sync failed ${res.status}: ${body}`);
    return { synced: 0, failed: records.length };
  }
  console.log(`${tableName}: synced ${records.length} records → ${body}`);
  return { synced: records.length, failed: 0 };
}

// Sync each market data table
const priceResult = await syncTable(
  'Market Prices',
  ['product_type','purity','region','price_usd','price_change_24h','market_trend','price_last_updated','source','price_note'],
  'market_prices'
);

const kpiResult = await syncTable(
  'Dashboard KPIs',
  ['metric_name','metric_value','previous_value','change_percent','trend','last_updated'],
  'market_kpis'
);

const newsResult = await syncTable(
  'Market News',
  ['title','summary','source','url','sentiment','sentiment_score','category','date_published'],
  'market_news'
);

const arbitrageResult = await syncTable(
  'Arbitrage Opportunities',
  ['product_type','buy_region','sell_region','buy_price','sell_price','profit_margin_percent','opportunity_type','last_verified','source'],
  'arbitrage_opportunities'
);

console.log('Market Intelligence Sync complete:', {
  market_prices: priceResult,
  market_kpis: kpiResult,
  market_news: newsResult,
  arbitrage_opportunities: arbitrageResult,
});
