 import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
 import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
 
 const AIRTABLE_WEBHOOK_SECRET = Deno.env.get('AIRTABLE_WEBHOOK_SECRET');
 const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
 const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-airtable-signature',
 };
 
 // Map Airtable table names to Supabase tables
 const tableMapping: Record<string, string> = {
   'Market Prices': 'market_prices',
   'Dashboard KPIs': 'market_kpis',
   'Market News': 'market_news',
   'Arbitrage Opportunities': 'arbitrage_opportunities',
   'Market Briefings': 'market_briefings',
 };
 
 // Field transformers: Airtable field names -> Supabase column names
 const fieldTransformers: Record<string, Record<string, string>> = {
   'market_prices': {
     'Product Type': 'product_type',
     'Purity': 'purity',
     'Region': 'region',
     'Price (USD)': 'price_usd',
     'Price Change 24h': 'price_change_24h',
     'Market Trend': 'market_trend',
     'Source': 'source',
     'Confidence Score': 'confidence_score',
     'Last Updated': 'updated_at',
   },
   'market_kpis': {
     'Metric Name': 'metric_name',
     'Metric Value': 'metric_value',
     'Previous Value': 'previous_value',
     'Change Percent': 'change_percent',
     'Last Updated': 'updated_at',
   },
   'market_news': {
     'Title': 'title',
     'Summary': 'summary',
     'Source': 'source',
     'URL': 'url',
     'Sentiment': 'sentiment',
     'Sentiment Score': 'sentiment_score',
     'Category': 'category',
     'Published At': 'published_at',
   },
   'arbitrage_opportunities': {
     'Product Type': 'product_type',
     'Purity': 'purity',
     'Buy Region': 'buy_region',
     'Sell Region': 'sell_region',
     'Buy Price': 'buy_price',
     'Sell Price': 'sell_price',
     'Profit Margin %': 'profit_margin_percent',
     'Confidence Score': 'confidence_score',
     'Status': 'status',
     'Detected At': 'detected_at',
     'Expires At': 'expires_at',
   },
   'market_briefings': {
     'Briefing Date': 'briefing_date',
     'Executive Summary': 'executive_summary',
     'Key Highlights': 'key_highlights',
     'Price Outlook': 'price_outlook',
     'Risk Factors': 'risk_factors',
     'Opportunities': 'opportunities',
     'Generated At': 'generated_at',
   },
 };
 
 function transformAirtableFields(tableName: string, fields: Record<string, any>): Record<string, any> {
   const transformer = fieldTransformers[tableName];
   if (!transformer) return fields;
 
   const transformed: Record<string, any> = {};
   for (const [airtableField, value] of Object.entries(fields)) {
     const supabaseColumn = transformer[airtableField];
     if (supabaseColumn) {
       // Parse JSON strings back to objects
       if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
         try {
           transformed[supabaseColumn] = JSON.parse(value);
         } catch {
           transformed[supabaseColumn] = value;
         }
       } else {
         transformed[supabaseColumn] = value;
       }
     }
   }
   return transformed;
 }
 
 async function verifySignature(body: string, signature: string | null): Promise<boolean> {
   if (!AIRTABLE_WEBHOOK_SECRET || !signature) {
     console.warn('Webhook signature verification skipped: missing secret or signature');
     return true; // Allow if not configured (development mode)
   }
 
   try {
     const encoder = new TextEncoder();
     const key = await crypto.subtle.importKey(
       'raw',
       encoder.encode(AIRTABLE_WEBHOOK_SECRET),
       { name: 'HMAC', hash: 'SHA-256' },
       false,
       ['sign']
     );
     
     const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
     const computedSignature = Array.from(new Uint8Array(signatureBytes))
       .map(b => b.toString(16).padStart(2, '0'))
       .join('');
     
     return computedSignature === signature;
   } catch (error) {
     console.error('Signature verification error:', error);
     return false;
   }
 }
 
 interface AirtableWebhookPayload {
   base: { id: string };
   webhook: { id: string };
   timestamp: string;
   payloads?: Array<{
     changedTablesById?: Record<string, {
       changedRecordsById?: Record<string, {
         current?: { cellValuesByFieldId: Record<string, any> };
         previous?: { cellValuesByFieldId: Record<string, any> };
       }>;
       createdRecordsById?: Record<string, {
         cellValuesByFieldId: Record<string, any>;
       }>;
       destroyedRecordIds?: string[];
     }>;
   }>;
   // Simple automation payload format
   table?: string;
   record?: Record<string, any>;
   action?: 'create' | 'update' | 'delete';
   recordId?: string;
 }
 
 serve(async (req) => {
   // Handle CORS preflight
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders });
   }
 
   try {
     const bodyText = await req.text();
     const signature = req.headers.get('x-airtable-signature');
 
     // Verify webhook signature
     const isValid = await verifySignature(bodyText, signature);
     if (!isValid) {
       console.error('Invalid webhook signature');
       return new Response(
         JSON.stringify({ error: 'Invalid signature' }),
         { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
       );
     }
 
     const payload: AirtableWebhookPayload = JSON.parse(bodyText);
     console.log('Received Airtable webhook:', JSON.stringify(payload, null, 2));
 
     if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
       throw new Error('Supabase configuration missing');
     }
 
     const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
     const results: Array<{ table: string; action: string; success: boolean; error?: string }> = [];
 
     // Handle simple automation format (from Airtable Automations)
     if (payload.table && payload.record) {
       const supabaseTable = tableMapping[payload.table] || payload.table;
       const transformedRecord = transformAirtableFields(supabaseTable, payload.record);
       
       let error;
       if (payload.action === 'create') {
         const result = await supabase.from(supabaseTable).insert(transformedRecord);
         error = result.error;
       } else if (payload.action === 'update' && payload.recordId) {
         const result = await supabase.from(supabaseTable).update(transformedRecord).eq('id', payload.recordId);
         error = result.error;
       } else if (payload.action === 'delete' && payload.recordId) {
         const result = await supabase.from(supabaseTable).delete().eq('id', payload.recordId);
         error = result.error;
       }
 
       results.push({
         table: supabaseTable,
         action: payload.action || 'unknown',
         success: !error,
         error: error?.message,
       });
 
       console.log(`Processed ${payload.action} for ${supabaseTable}:`, results[0]);
     }
 
     // Handle complex webhook format (from Airtable Webhooks API)
     if (payload.payloads) {
       for (const p of payload.payloads) {
         if (!p.changedTablesById) continue;
 
         for (const [tableId, tableChanges] of Object.entries(p.changedTablesById)) {
           // Handle created records
           if (tableChanges.createdRecordsById) {
             for (const [recordId, recordData] of Object.entries(tableChanges.createdRecordsById)) {
               // Note: We'd need table name from metadata, using tableId for now
               console.log(`Created record ${recordId} in table ${tableId}`);
             }
           }
 
           // Handle changed records
           if (tableChanges.changedRecordsById) {
             for (const [recordId, recordData] of Object.entries(tableChanges.changedRecordsById)) {
               if (recordData.current) {
                 console.log(`Updated record ${recordId} in table ${tableId}`);
               }
             }
           }
 
           // Handle deleted records
           if (tableChanges.destroyedRecordIds) {
             for (const recordId of tableChanges.destroyedRecordIds) {
               console.log(`Deleted record ${recordId} from table ${tableId}`);
             }
           }
         }
       }
     }
 
     // Log the webhook event
     await supabase.from('webhook_events').insert({
       event_type: 'airtable_market_webhook',
       source: 'airtable-market-webhook',
       payload: { ...payload, results },
       status: results.every(r => r.success) ? 'success' : 'partial',
     });
 
     return new Response(
       JSON.stringify({
         success: true,
         message: 'Airtable webhook processed',
         results,
       }),
       {
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         status: 200,
       }
     );
   } catch (error: unknown) {
     console.error('Airtable webhook error:', error);
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