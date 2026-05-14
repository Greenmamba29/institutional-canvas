import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const AIRTABLE_API_KEY = Deno.env.get('AIRTABLE_API_KEY');
const AIRTABLE_BASE_ID = Deno.env.get('AIRTABLE_BASE_ID') || 'appu9fRT4qFBCf8wL';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Table mappings: Supabase table -> Airtable table ID
const tableMapping: Record<string, string> = {
  // Existing mappings
  'subscriptions': 'tblCQa00kVDzzIchQ',
  'subscription_plans': 'tblyoqlubNtFyLgG3',
  'payments': 'tblQsm36zVYUo4wAA',
  // Market intelligence mappings (configurable via env or defaults)
  'market_prices': Deno.env.get('AIRTABLE_MARKET_PRICES_TABLE') || 'tblMarketPrices',
  'market_kpis': Deno.env.get('AIRTABLE_MARKET_KPIS_TABLE') || 'tblMarketKPIs',
  'market_news': Deno.env.get('AIRTABLE_MARKET_NEWS_TABLE') || 'tblMarketNews',
  'arbitrage_opportunities': Deno.env.get('AIRTABLE_ARBITRAGE_TABLE') || 'tblArbitrage',
  'market_briefings': Deno.env.get('AIRTABLE_BRIEFINGS_TABLE') || 'tblBriefings',
  // Auction mappings
  'auctions': Deno.env.get('AIRTABLE_AUCTIONS_TABLE') || 'tblAuctions',
  'auction_bids': Deno.env.get('AIRTABLE_AUCTION_BIDS_TABLE') || 'tblAuctionBids',
  // KYC mappings
  'kyb_verification_queue': Deno.env.get('AIRTABLE_KYC_SUBMISSIONS_TABLE') || 'tblKYCSubmissions',
  'kyc_documents': Deno.env.get('AIRTABLE_KYC_DOCUMENTS_TABLE') || 'tblKYCDocuments',
  // Introduction deal tracking
  'introductions': 'tbltAgLbLILYiCGWB',
};

// Field transformers: Convert Supabase column names to Airtable field names
const fieldTransformers: Record<string, Record<string, string>> = {
  'market_prices': {
    'product_type': 'Product Type',
    'purity': 'Purity',
    'region': 'Region',
    'price_usd': 'Price (USD)',
    'price_change_24h': 'Price Change 24h',
    'market_trend': 'Market Trend',
    'source': 'Source',
    'confidence_score': 'Confidence Score',
    'updated_at': 'Last Updated',
  },
  'market_kpis': {
    'metric_name': 'Metric Name',
    'metric_value': 'Metric Value',
    'previous_value': 'Previous Value',
    'change_percent': 'Change Percent',
    'updated_at': 'Last Updated',
  },
  'market_news': {
    'title': 'Title',
    'summary': 'Summary',
    'source': 'Source',
    'url': 'URL',
    'sentiment': 'Sentiment',
    'sentiment_score': 'Sentiment Score',
    'category': 'Category',
    'published_at': 'Published At',
  },
  'arbitrage_opportunities': {
    'product_type': 'Product Type',
    'purity': 'Purity',
    'buy_region': 'Buy Region',
    'sell_region': 'Sell Region',
    'buy_price': 'Buy Price',
    'sell_price': 'Sell Price',
    'profit_margin_percent': 'Profit Margin %',
    'confidence_score': 'Confidence Score',
    'status': 'Status',
    'detected_at': 'Detected At',
    'expires_at': 'Expires At',
  },
  'market_briefings': {
    'briefing_date': 'Briefing Date',
    'executive_summary': 'Executive Summary',
    'key_highlights': 'Key Highlights',
    'price_outlook': 'Price Outlook',
    'risk_factors': 'Risk Factors',
    'opportunities': 'Opportunities',
    'generated_at': 'Generated At',
  },
  'auctions': {
    'title': 'Title',
    'description': 'Description',
    'product_type': 'Product_Type',
    'status': 'Status',
    'start_time': 'Start_Time',
    'end_time': 'End_Time',
    'reserve_price': 'Reserve_Price',
    'starting_bid': 'Starting_Bid',
    'current_bid': 'Current_Bid',
    'bid_increment': 'Bid_Increment',
    'currency': 'Currency',
    'quantity': 'Quantity',
    'unit': 'Unit',
    'winner_id': 'Winner_ID',
    'extended_count': 'Extended_Count',
    'org_id': 'Org_ID',
    'created_at': 'Created_At',
    'updated_at': 'Updated_At',
    'starts_at': 'Start_Time',
    'ends_at': 'End_Time',
  },
  'auction_bids': {
    'auction_id': 'Auction_ID',
    'bidder_id': 'Bidder_ID',
    'org_id': 'Org_ID',
    'amount': 'Amount',
    'currency': 'Currency',
    'status': 'Status',
    'placed_at': 'Placed_At',
    'ip_address': 'IP_Address',
  },
  'kyb_verification_queue': {
    'org_id': 'Org_ID',
    'verification_tier': 'Verification_Tier',
    'status': 'Status',
    'submitted_at': 'Submitted_At',
    'reviewed_at': 'Reviewed_At',
    'reviewer_id': 'Reviewer_ID',
    'rejection_reason': 'Rejection_Reason',
    'notes': 'Notes',
    'risk_score': 'Risk_Score',
    'created_at': 'Created_At',
  },
  'introductions': {
    'introduction_id':  'Introduction_ID',
    'introducer_name':  'Introducer_Name',
    'introducer_email': 'Introducer_Email',
    'introducer_org':   'Introducer_Org',
    'buyer_org':        'Buyer_Org',
    'buyer_contact':    'Buyer_Contact',
    'buyer_email':      'Buyer_Email',
    'seller_org':       'Seller_Org',
    'seller_contact':   'Seller_Contact',
    'seller_email':     'Seller_Email',
    'commodity':        'Commodity',
    'intro_date':       'Intro_Date',
    'deal_value_usd':   'Deal_Value_USD',
    'intro_fee_percent':'Intro_Fee_Percent',
    'status':           'Status',
    'payout_status':    'Payout_Status',
    'payout_date':      'Payout_Date',
    'notes':            'Notes',
    'created_at':       'Created_Date',
    'updated_at':       'Last_Modified',
  },
  'kyc_documents': {
    'kyb_queue_id': 'Submission_ID',
    'org_id': 'Org_ID',
    'document_type': 'Document_Type',
    'file_name': 'File_Name',
    'file_url': 'File_URL',
    'status': 'Status',
    'rejection_reason': 'Rejection_Reason',
    'expires_at': 'Expires_At',
    'uploaded_by': 'Uploaded_By',
    'reviewed_at': 'Reviewed_At',
    'created_at': 'Uploaded_At',
  },
};

// Transform record fields for Airtable
function transformFields(table: string, record: Record<string, any>): Record<string, any> {
  const transformer = fieldTransformers[table];
  if (!transformer) return record;

  const transformed: Record<string, any> = {};
  for (const [key, value] of Object.entries(record)) {
    // For auctions/auction_bids, map 'id' to Auction_ID/Bid_ID
    if (key === 'id') {
      if (table === 'auctions') {
        transformed['Auction_ID'] = value;
      } else if (table === 'auction_bids') {
        transformed['Bid_ID'] = value;
      }
      continue;
    }
    // Map created_at if transformer has it
    if (key === 'created_at' && transformer[key]) {
      transformed[transformer[key]] = value;
      continue;
    } else if (key === 'created_at') {
      continue;
    }
    const airtableField = transformer[key];
    if (!airtableField) continue; // skip unmapped fields
    if (value === null || value === undefined) continue; // skip nulls
    if (typeof value === 'object') {
      transformed[airtableField] = JSON.stringify(value);
    } else {
      transformed[airtableField] = value;
    }
  }
  return transformed;
}

interface SyncRequest {
  table: string;
  record: Record<string, any>;
  action?: 'create' | 'update' | 'delete';
  recordId?: string;
  records?: Record<string, any>[];
}

serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
        },
      });
    }

    const { table, record, action = 'create', recordId, records }: SyncRequest = await req.json();

    if (!table || (!record && !records)) {
      throw new Error('Missing required fields: table and (record or records)');
    }

    const airtableTableId = tableMapping[table];
    if (!airtableTableId) {
      throw new Error(`Unknown table: ${table}`);
    }

    if (!AIRTABLE_API_KEY) {
      throw new Error('AIRTABLE_API_KEY environment variable is not set');
    }

    // Handle batch operations
    if (records && records.length > 0) {
      const batchRecords = records.map(r => ({ fields: transformFields(table, r) }));
      const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${airtableTableId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: batchRecords, typecast: true }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Airtable batch API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(`Batch synced ${records.length} records to ${table}`);
      
      return new Response(
        JSON.stringify({
          success: true,
          action: 'batch_create',
          count: records.length,
          data,
          message: `Successfully created ${records.length} records in Airtable table ${table}`,
        }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          status: 200,
        }
      );
    }

    // Single record operations
    const transformedRecord = transformFields(table, record);
    const airtableRecord = { fields: transformedRecord };
    let response: Response;
    let url: string;

    if (action === 'update' && recordId) {
      url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${airtableTableId}/${recordId}`;
      response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(airtableRecord),
      });
    } else if (action === 'delete' && recordId) {
      url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${airtableTableId}/${recordId}`;
      response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        },
      });
    } else {
      url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${airtableTableId}`;
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...airtableRecord, typecast: true }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Airtable API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase.from('webhook_events').insert({
          event_type: `airtable_sync_${action}`,
          source: 'sync-to-airtable',
          table_name: table,
          payload: { table, record: transformedRecord, action, airtable_response: data },
          status: 'success',
        });
      } catch (logError) {
        console.error('Failed to log webhook event:', logError);
      }
    }

    console.log(`Successfully synced ${table} record to Airtable:`, { action, recordId: data.id });

    return new Response(
      JSON.stringify({
        success: true,
        action,
        data,
        message: `Successfully ${action}d record to Airtable table ${table}`,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error('Sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase.from('webhook_events').insert({
          event_type: 'airtable_sync_error',
          source: 'sync-to-airtable',
          payload: { error: errorMessage },
          status: 'error',
        });
      } catch (logError) {
        console.error('Failed to log error:', logError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 400,
      }
    );
  }
});
