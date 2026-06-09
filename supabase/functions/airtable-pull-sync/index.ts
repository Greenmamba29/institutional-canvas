// Supabase Edge Function: airtable-pull-sync
// Pulls all records from the configured Airtable tables and upserts them into
// their Supabase target tables using the service-role client.
//
// Env vars required:
//   AIRTABLE_API_KEY          - Airtable personal access token (Bearer)
//   SUPABASE_URL              - Supabase project URL (auto-provided)
//   SUPABASE_SERVICE_ROLE_KEY - Service role key (auto-provided)
//   CRON_SECRET (optional)    - if set, requests must send matching x-cron-secret header
//
// Auth: verify_jwt is FALSE. Custom auth via x-cron-secret header.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AIRTABLE_BASE_ID = "appu9fRT4qFBCf8wL";

type FieldType = "text" | "number" | "date" | "jsonb" | "select";

interface FieldMap {
  airtableField: string;
  supabaseColumn: string;
  type: FieldType;
}

interface Mapping {
  airtableTable: string;
  airtableTableId: string;
  supabaseTable: string;
  upsertKey: string;
  fieldMap: FieldMap[];
}

const MAPPINGS: Mapping[] = [
  {
    airtableTable: "Grant Tracker",
    airtableTableId: "tblKTNtuoRcTrVZ02",
    supabaseTable: "grants",
    upsertKey: "airtable_id",
    fieldMap: [
      { airtableField: "__record_id__", supabaseColumn: "airtable_id", type: "text" },
      { airtableField: "Program Name", supabaseColumn: "title", type: "text" },
      { airtableField: "Agency", supabaseColumn: "funding_source", type: "select" },
      { airtableField: "Amount Available", supabaseColumn: "amount_max", type: "number" },
      { airtableField: "Deadline", supabaseColumn: "deadline", type: "date" },
      { airtableField: "Status", supabaseColumn: "application_status", type: "select" },
    ],
  },
  {
    airtableTable: "Flash Alerts",
    airtableTableId: "tblDoYMSCO4wgtf67",
    supabaseTable: "flash_alerts",
    upsertKey: "airtable_id",
    fieldMap: [
      { airtableField: "__record_id__", supabaseColumn: "airtable_id", type: "text" },
      { airtableField: "Headline", supabaseColumn: "title", type: "text" },
      { airtableField: "Description", supabaseColumn: "message", type: "text" },
      { airtableField: "Trigger Type", supabaseColumn: "type", type: "select" },
    ],
  },
  {
    airtableTable: "Market Prices",
    airtableTableId: "tblqDj6GHnkIS5T0K",
    supabaseTable: "price_indicators",
    upsertKey: "airtable_id",
    fieldMap: [
      { airtableField: "__record_id__", supabaseColumn: "airtable_id", type: "text" },
      { airtableField: "product_type", supabaseColumn: "symbol", type: "text" },
      { airtableField: "region", supabaseColumn: "region", type: "text" },
      { airtableField: "price_usd", supabaseColumn: "price", type: "number" },
      { airtableField: "price_last_updated", supabaseColumn: "observed_at", type: "date" },
      { airtableField: "source", supabaseColumn: "source", type: "text" },
    ],
  },
  {
    airtableTable: "Dashboard KPIs",
    airtableTableId: "tbl07o9w6Pvmw1H7b",
    supabaseTable: "market_kpis",
    upsertKey: "airtable_id",
    fieldMap: [
      { airtableField: "__record_id__", supabaseColumn: "airtable_id", type: "text" },
      { airtableField: "metric_name", supabaseColumn: "metric_name", type: "text" },
      { airtableField: "metric_value", supabaseColumn: "metric_value", type: "number" },
      { airtableField: "previous_value", supabaseColumn: "previous_value", type: "number" },
      { airtableField: "change_percent", supabaseColumn: "change_percent", type: "number" },
      { airtableField: "trend", supabaseColumn: "trend", type: "select" },
      { airtableField: "last_updated", supabaseColumn: "updated_at", type: "date" },
    ],
  },
  {
    airtableTable: "Market News",
    airtableTableId: "tblnC9QGonS7bL5p5",
    supabaseTable: "market_news",
    upsertKey: "airtable_id",
    fieldMap: [
      { airtableField: "__record_id__", supabaseColumn: "airtable_id", type: "text" },
      { airtableField: "title", supabaseColumn: "title", type: "text" },
      { airtableField: "summary", supabaseColumn: "summary", type: "text" },
      { airtableField: "source", supabaseColumn: "source", type: "text" },
      { airtableField: "url", supabaseColumn: "url", type: "text" },
      { airtableField: "sentiment", supabaseColumn: "sentiment", type: "select" },
      { airtableField: "sentiment_score", supabaseColumn: "sentiment_score", type: "number" },
      { airtableField: "category", supabaseColumn: "category", type: "select" },
      { airtableField: "date_published", supabaseColumn: "published_at", type: "date" },
    ],
  },
  {
    airtableTable: "Arbitrage Opportunities",
    airtableTableId: "tbluQ7vKribFYHUY7",
    supabaseTable: "arbitrage_opportunities",
    upsertKey: "airtable_id",
    fieldMap: [
      { airtableField: "__record_id__", supabaseColumn: "airtable_id", type: "text" },
      { airtableField: "product_type", supabaseColumn: "product_type", type: "text" },
      { airtableField: "buy_region", supabaseColumn: "buy_region", type: "text" },
      { airtableField: "sell_region", supabaseColumn: "sell_region", type: "text" },
      { airtableField: "buy_price", supabaseColumn: "buy_price", type: "number" },
      { airtableField: "sell_price", supabaseColumn: "sell_price", type: "number" },
      { airtableField: "profit_margin_percent", supabaseColumn: "profit_margin_percent", type: "number" },
      { airtableField: "opportunity_type", supabaseColumn: "status", type: "select" },
      { airtableField: "last_verified", supabaseColumn: "detected_at", type: "date" },
    ],
  },
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

async function fetchAllAirtableRecords(
  tableId: string,
  apiKey: string,
): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;
  do {
    const url = new URL(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}`,
    );
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`Airtable ${resp.status}: ${body}`);
    }
    const data = await resp.json();
    for (const rec of data.records ?? []) {
      records.push({ id: rec.id, fields: rec.fields ?? {} });
    }
    offset = data.offset;
  } while (offset);
  return records;
}

function coerceValue(raw: unknown, type: FieldType): unknown {
  if (raw === undefined || raw === null) return null;

  // Airtable singleSelect can come back as an object {name} or a plain string.
  if (raw && typeof raw === "object" && !Array.isArray(raw) && "name" in (raw as Record<string, unknown>)) {
    raw = (raw as Record<string, unknown>).name;
  }

  switch (type) {
    case "number": {
      if (typeof raw === "number") return raw;
      const n = Number(raw);
      return Number.isNaN(n) ? null : n;
    }
    case "select":
    case "text":
    case "date":
    default: {
      if (Array.isArray(raw)) {
        // Flatten select-like array values (e.g. {name} objects or strings).
        return raw
          .map((v) =>
            v && typeof v === "object" && "name" in v
              ? (v as Record<string, unknown>).name
              : v,
          )
          .join(", ");
      }
      return raw;
    }
  }
}

function transformRecord(rec: AirtableRecord, mapping: Mapping): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  for (const fm of mapping.fieldMap) {
    if (fm.airtableField === "__record_id__") {
      row[fm.supabaseColumn] = rec.id;
      continue;
    }
    row[fm.supabaseColumn] = coerceValue(rec.fields[fm.airtableField], fm.type);
  }
  return row;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret) {
    const provided = req.headers.get("x-cron-secret");
    if (provided !== cronSecret) {
      return new Response(
        JSON.stringify({ ok: false, error: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  const apiKey = Deno.env.get("AIRTABLE_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!apiKey || !supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "missing required env vars (AIRTABLE_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const perTable: Record<string, { upserted: number; errors: string[] }> = {};
  let ok = true;

  for (const mapping of MAPPINGS) {
    const entry = { upserted: 0, errors: [] as string[] };
    perTable[mapping.supabaseTable] = entry;
    try {
      const records = await fetchAllAirtableRecords(mapping.airtableTableId, apiKey);
      const rows = records.map((r) => transformRecord(r, mapping));

      if (rows.length === 0) continue;

      // Upsert in batches to stay within request limits.
      const batchSize = 500;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase
          .from(mapping.supabaseTable)
          .upsert(batch, { onConflict: mapping.upsertKey });
        if (error) {
          ok = false;
          entry.errors.push(error.message);
        } else {
          entry.upserted += batch.length;
        }
      }
    } catch (err) {
      ok = false;
      entry.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return new Response(JSON.stringify({ ok, perTable }), {
    status: ok ? 200 : 207,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
