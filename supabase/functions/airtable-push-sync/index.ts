// airtable-push-sync
//
// Scheduled PUSH: Supabase -> Airtable. The symmetric counterpart to
// airtable-pull-sync. Pushes Supabase-sourced data into Airtable using
// idempotent upserts keyed on a stable merge field, so re-runs never duplicate.
//
// Mapping uses Airtable FIELD IDS (not names) so renames in Airtable never break
// the sync. Field IDs were captured from the live base schema.
//
// POST body (optional):
//   { "only": "orders" }   -> sync just that one table (for targeted runs/tests)
//   {}                     -> sync every configured table

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AIRTABLE_BASE_ID = Deno.env.get("AIRTABLE_BASE_ID") || "appu9fRT4qFBCf8wL";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Airtable hard limits: <=10 records/upsert request, 5 req/s per base.
const AIRTABLE_BATCH = 10;
const RATE_DELAY_MS = 250; // ~4 req/s, under the 5/s ceiling

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface PushTable {
  supabaseTable: string;
  airtableTableId: string;
  mergeFieldId: string;
  // Best-effort string coercion of select options (auto-creates exact enum
  // option names on first push). Only enable for tables with singleSelect cols.
  typecast?: boolean;
  toFields: (row: Record<string, unknown>) => Record<string, unknown>;
}

const nowIso = () => new Date().toISOString();
const numOrNull = (v: unknown) => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const strOrNull = (v: unknown) => (v === null || v === undefined ? null : String(v));
// Date-only: strip time from ISO timestamps for Airtable date fields (YYYY-MM-DD).
const dateOnly = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : null;
};
// Serialize jsonb/array values to a readable string for multilineText fields.
const jsonStr = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v;
  try { return JSON.stringify(v, null, 2); } catch { return null; }
};
// Convert training_status or similar string flags to checkbox booleans.
const boolFromStatus = (v: unknown, match: string): boolean =>
  v !== null && v !== undefined && String(v).toLowerCase() === match.toLowerCase();

// ---- Field ID maps (from live base schema) -------------------------------

const KPI_FIELDS = {
  metric_name: "fldDC40RChKKbeXWm",
  metric_value: "fldyaZCJZSx8Z1Euk",
  previous_value: "fldR0B0iWyun3YovC",
  change_percent: "fldRzNF1WzuCp8HHI", // percent (0.05 = 5%)
  last_updated: "fldBjKAL8pQM7Wyv6",
};

const ORDER_FIELDS = {
  supabase_id: "fldnIckhwvTNoJiR0",
  org_id: "fldWoKFQR6fQz5FdY",
  supplier_id: "fld0X7HSBcSHz8GhR",
  quote_id: "fldF0e2ZkdqrBrbmQ",
  status: "fldFWUTldkdQoEBdJ",
  payment_status: "fldLkzCW4Tuo62GjN",
  total_amount: "fld2x1zAP4ghZ5oCm",
  currency: "fldyzFT01JqxKZPzg",
  user_id: "fldcePELa4EKR5VDq",
  created_at: "fldT5AtAvJC6ovFda",
  updated_at: "fldlniDtncX3OsQDi",
};

// Auctions (tbl4oywNOsuRrvabQ)
const AUCTION_FIELDS = {
  auction_id: "fldmmW5JC1sbDNoTV", // merge key (= auctions.id)
  title: "fldSSKstVrNeVaJNB",
  description: "fldcrOg3dqEZXO9B4",
  product_type: "fldmINgvuGvhyqh1r", // singleSelect
  status: "flddTQi3tUt4LC6Ke", // singleSelect
  start_time: "fldoaB8QzhSjwYr6R",
  end_time: "fldDKLbFbwFKydfFy",
  reserve_price: "fldg6WA5cCEY4GWJF",
  starting_bid: "fldA3n2vT8cuQpq2d",
  current_bid: "flddG7oIiGoqvVyby",
  bid_increment: "fldxrAufrs8LY55ja",
  currency: "fld9JCujp6GXf3RbW",
  quantity: "fld6ZlOQCxgtW6YME",
  unit: "fldn83tQZC1vP72Ho",
  winner_id: "fldZ8TvqLUQ2fFA57",
  extended_count: "fldIflBH3ThhZ9RfD",
  org_id: "fldF7TtkoquuUDztk",
  created_at: "fldg178Bdb6i96gLJ",
  updated_at: "fldTD6SDkuLjTHYZ7",
};

// Auction Bids (tbltL0vu4zomBnU3Z)
const BID_FIELDS = {
  bid_id: "fldE2PXdH48vK8nKK", // merge key (= auction_bids.id)
  bidder_id: "fld5qpGmLkx3fNh0G",
  amount: "fldxIROPR4fd9fmhD",
  status: "fld3N7PVnb4Dh9n2i", // singleSelect
  placed_at: "fldkjTQEvgFJvhxVu",
};

// RFQs (tblJn7qPgFXMVK6pb)
const RFQ_FIELDS = {
  supabase_id: "fldVoR6BCOSppDEug", // merge key (= rfqs.id)
  product: "fldFEed86BaWoA9AS",
  quantity_mt: "fldWNN0MxIritKU6o",
  deadline: "fldtD5Ly7EkltZzdW",
  status: "fldV0xCYNooSHuDYs", // singleSelect
  notes: "fld4pTEoORSmWi5cc",
};

// Deals (tblpdNWPvXJ7BmOSA)
const DEAL_FIELDS = {
  supabase_id: "fldAqdf0pOqVBDFyK", // merge key
  title: "fldYbCrBGqvUSPs5p",        // Product (singleLineText)
  status: "fldvxjfOjRqh9z4uA",       // singleSelect
  deal_stage: "fldhR4691HMQBcrUV",   // singleSelect (offer_decision)
  notes: "fld5pNXwx62IFJGTR",
  deal_date: "fld0Q3Np6Byr0EUGe",    // date
};

// Purchases (tbl2QJT5YW4026jGj)
const PURCHASE_FIELDS = {
  supabase_id: "fldXZ4XDm7z0sEg5X", // merge key
  buyer_id: "fldKbcALieStcrpsX",
  supplier_id: "fldhShggypBVAfeDV",
  deal_id: "fldUqQrtMWPwgMtdz",
  status: "fldQA8bkHyoh4jEuL",       // singleSelect
  total_value_usd: "fldAAKhjOI27s0XPh",
  currency: "fldcd7ZgLXBECV5nD",
  notes: "flduWLFTTRikYQ8zW",
  created_at: "fld2HfUl2Nsryn4BY",
};

// Custody Events (tblHPVV9zNweddZ8o)
const CUSTODY_FIELDS = {
  supabase_id: "fld3Ngtrmay1JbGBK",  // merge key
  org_id: "fldLd4x5KkfWOQgKE",
  order_id: "flds7zSF1ju7CZhKQ",
  deal_id: "fldf51Lx5D4GIZOZU",
  event_type: "fldHKtS88GEz22zKW",   // singleSelect
  title: "fldRSO9Mv7mBXm9bp",
  description: "fldz0iiI2AsWXWlhx",
  location: "fldGpGfweF7kVj8gF",
  occurred_at: "fldlj3pO7Qp50GZat",
  verified_by: "fldugyTKOkWLCisJq",
  verified_at: "fld3i3B08yy3puFXm",
  documents: "fldkcQg3Hz1PaIGy2",    // multilineText
  coordinates: "fldcWfGuUlMJN9ByZ",
  created_by: "fldszo2UDqQ7SlXYq",
  created_at: "fldgiiBGOL5lOalNj",
};

// TeleBuy Sessions (tblSeir3aG2ihTaup)
const TELEBUY_FIELDS = {
  supabase_id: "fldg7QmTWRF5MTRjT",  // merge key
  supplier_id: "fldUa5N9s1SLlEzS7",
  user_id: "fldeFq4D0J1vLPGdF",
  org_id: "fldIPCrgQa8d7g8uE",
  status: "fldaniXv58pstG8BV",        // singleSelect
  meeting_url: "fldwLt6wdqtkEPsNB",
  meeting_id: "fldA9sx5XIxFLsAf6",
  google_meet_link: "fldrwZhHM7WCUhyw6",
  video_provider: "fldq8HbV0ea60plGc",
  scheduled_at: "fldhN7saJZh6551Mf",
  started_at: "fldpzXoxY2udJtLAq",
  ended_at: "fldhiLuXqZlmChFAG",
  recording_url: "fldy9ntTbsyghiob8",
  transcript: "fldQJ64tG6veTgf3S",
  notes: "fldFsxfnpzxdq9BBE",
  created_at: "fldWYpdIM4vvtIbfn",
};

// Compliance Audit Logs (tbleMaZ3mET6J8iaC)
const AUDIT_FIELDS = {
  supabase_id: "fldgBsmi7Ydhnj9pd",  // merge key
  audit_type: "fldRhlRIhtnM2xDbI",   // singleSelect (action)
  entity_type: "fld7fWsoO6R3sCled",  // singleSelect
  entity_id: "fld1BsQs1MhflNvH1",
  auditor_name: "fldSNLJmqO2c0gOHZ",
  audit_date: "flda8ijZ6sr8uAxqq",
  findings: "fld8Pyd0N4JvTn6zc",
  status: "fldPBvYSHln8n1KeO",       // singleSelect
  notes: "flds1uFLUu7s6K2V0",
  created_date: "fldeTtMlhn61JN7Bj", // date
};

// Collection Sites (tbl228fEQlU1ZHsIx)
const SITE_FIELDS = {
  supabase_id: "fldbcVX1LpKtMkN9F",  // merge key
  site_name: "fldPNFETekQuu158M",
  location: "fldW58OiY62FBPTBT",
  country: "fldP7ZuBjksPwPxUo",
  region: "flda0ic5kxxbAK5z9",
  site_type: "fldnbZ4FOonUqHCZI",    // singleSelect
  capacity_mt: "fldCjLyvao2647hRt",
  status: "fldRh8F5Iu5eiWd2Q",       // singleSelect
  manager_name: "fldW1WwgmLyQbHZuu",
  contact_email: "flduB19Pf6ne7mehh",
  contact_phone: "fldzLf1XbKV9388rq",
  last_inspection: "fldSVxH4cO3nwx33i",
  next_inspection: "fldTmjv3KsvdsM3hl",
  compliance_status: "fldyI83344Aa190r5", // singleSelect
  notes: "fldOzQMQet86aH1K0",
  created_date: "fldspkHxXqfPQXOht", // date
};

// Collection Workers (tbl2VuKwDi14PhzCB)
const WORKER_FIELDS = {
  supabase_id: "fldHZ4AwvV7Na5GVu",  // merge key
  full_name: "fldH4FXS8hm2HpJjL",
  certification_status: "fldxUNF9K6iyok43u", // singleSelect (kyc_status)
  training_completed: "fldsfXOR3ApCiZVYV",   // checkbox
  status: "fld9OhzJWHK26aPSc",       // singleSelect (training_status)
  notes: "fldk7pUiJxVDXrK7B",
  created_date: "fldZt8rDASDTbkzhN", // date
};

// Battery Inventory (tblx3jKD6gnPVoyAO)
const BATTERY_FIELDS = {
  supabase_id: "fld4DaO4xn76uHR7t",  // merge key
  battery_type: "fld7zJzEZ1TpOikJW", // singleSelect
  weight_kg: "fldEyap7SkuD4xY5H",
  current_status: "fldlCHcjfZ5C7UnVZ", // singleSelect
  received_date: "fld4kGYOuxHVz1h72", // date
  notes: "fldtyR1k8GN3fYnMi",
  created_date: "fldqoeB6ABc7ZqZbL", // date
};

// Chain of Custody (tbliy0LeAz5qpFPJ8)
const COC_FIELDS = {
  supabase_id: "fldrNexz6Z4Uvv6LL",  // merge key
  custody_id: "fldia44lDt2Irjacr",
  transfer_date: "fldVKKeo69D7OFxDb",
  transferred_by: "fldUh9ir3Z7SYUSxW",
  received_by: "fld0EOmkj631FGk1R",
  transport_method: "fldnIRNZV3en1lqEq", // singleSelect
  condition_on_transfer: "fldnAkdJuqM1wOXg7", // singleSelect
  notes: "fldFqo28wfh3MEtny",
  created_date: "fldrbNueliZcdpDDq", // date
};

// Processing Orders (tblt8P0Lu7VVG0CG4)
const PROC_FIELDS = {
  supabase_id: "fldOyT03GIUP0ZXlG",  // merge key
  order_id: "fldOCGavsVAs7bmZP",
  order_date: "fldaqfi8RK4h24Wm6",         // date
  actual_processing_date: "fldOzw4Rom0H9Hizo", // date
  processing_method: "fldaG1Nrfpp04x2wf",  // singleSelect
  output_materials: "fldpJL2SkS0l9kOe6",
  notes: "fldak1q73S95X5yiJ",
  created_date: "fldKsAOpcVMePtTvM", // date
};

const PUSH_TABLES: PushTable[] = [
  // ---- Market KPIs (push-only; computed in Supabase) ----
  {
    supabaseTable: "market_kpis",
    airtableTableId: "tbl07o9w6Pvmw1H7b",
    mergeFieldId: KPI_FIELDS.metric_name,
    toFields: (row) => {
      const cp = numOrNull(row.change_percent);
      return {
        [KPI_FIELDS.metric_name]: strOrNull(row.metric_name),
        [KPI_FIELDS.metric_value]: numOrNull(row.metric_value),
        [KPI_FIELDS.previous_value]: numOrNull(row.previous_value),
        [KPI_FIELDS.change_percent]: cp === null ? null : cp / 100,
        [KPI_FIELDS.last_updated]: strOrNull(row.updated_at) ?? nowIso(),
      };
    },
  },
  // ---- Orders ----
  {
    supabaseTable: "orders",
    airtableTableId: "tblORTy0VQLiUXyEq",
    mergeFieldId: ORDER_FIELDS.supabase_id,
    toFields: (row) => ({
      [ORDER_FIELDS.supabase_id]: strOrNull(row.id),
      [ORDER_FIELDS.org_id]: strOrNull(row.org_id),
      [ORDER_FIELDS.supplier_id]: strOrNull(row.supplier_id),
      [ORDER_FIELDS.quote_id]: strOrNull(row.quote_id),
      [ORDER_FIELDS.status]: strOrNull(row.status),
      [ORDER_FIELDS.payment_status]: strOrNull(row.payment_status),
      [ORDER_FIELDS.total_amount]: numOrNull(row.total_amount),
      [ORDER_FIELDS.currency]: strOrNull(row.currency),
      [ORDER_FIELDS.user_id]: strOrNull(row.user_id),
      [ORDER_FIELDS.created_at]: strOrNull(row.created_at),
      [ORDER_FIELDS.updated_at]: strOrNull(row.updated_at),
    }),
  },
  // ---- Auctions ----
  {
    supabaseTable: "auctions",
    airtableTableId: "tbl4oywNOsuRrvabQ",
    mergeFieldId: AUCTION_FIELDS.auction_id,
    typecast: true,
    toFields: (row) => ({
      [AUCTION_FIELDS.auction_id]: strOrNull(row.id),
      [AUCTION_FIELDS.title]: strOrNull(row.title),
      [AUCTION_FIELDS.description]: strOrNull(row.description),
      [AUCTION_FIELDS.product_type]: strOrNull(row.product_type),
      [AUCTION_FIELDS.status]: strOrNull(row.status),
      [AUCTION_FIELDS.start_time]: strOrNull(row.start_time ?? row.starts_at),
      [AUCTION_FIELDS.end_time]: strOrNull(row.end_time ?? row.ends_at),
      [AUCTION_FIELDS.reserve_price]: numOrNull(row.reserve_price),
      [AUCTION_FIELDS.starting_bid]: numOrNull(row.starting_bid),
      [AUCTION_FIELDS.current_bid]: numOrNull(row.current_bid),
      [AUCTION_FIELDS.bid_increment]: numOrNull(row.bid_increment),
      [AUCTION_FIELDS.currency]: strOrNull(row.currency),
      [AUCTION_FIELDS.quantity]: numOrNull(row.quantity),
      [AUCTION_FIELDS.unit]: strOrNull(row.unit),
      [AUCTION_FIELDS.winner_id]: strOrNull(row.winner_id),
      [AUCTION_FIELDS.extended_count]: numOrNull(row.extended_count),
      [AUCTION_FIELDS.org_id]: strOrNull(row.org_id),
      [AUCTION_FIELDS.created_at]: strOrNull(row.created_at),
      [AUCTION_FIELDS.updated_at]: strOrNull(row.updated_at),
    }),
  },
  // ---- Auction Bids ----
  {
    supabaseTable: "auction_bids",
    airtableTableId: "tbltL0vu4zomBnU3Z",
    mergeFieldId: BID_FIELDS.bid_id,
    typecast: true,
    toFields: (row) => ({
      [BID_FIELDS.bid_id]: strOrNull(row.id),
      [BID_FIELDS.bidder_id]: strOrNull(row.bidder_id),
      [BID_FIELDS.amount]: numOrNull(row.amount),
      [BID_FIELDS.status]: strOrNull(row.status),
      [BID_FIELDS.placed_at]: strOrNull(row.placed_at ?? row.created_at),
    }),
  },
  // ---- RFQs ----
  {
    supabaseTable: "rfqs",
    airtableTableId: "tblJn7qPgFXMVK6pb",
    mergeFieldId: RFQ_FIELDS.supabase_id,
    typecast: true,
    toFields: (row) => ({
      [RFQ_FIELDS.supabase_id]: strOrNull(row.id),
      [RFQ_FIELDS.product]: strOrNull(row.product_type),
      [RFQ_FIELDS.quantity_mt]: numOrNull(row.target_quantity),
      [RFQ_FIELDS.deadline]: strOrNull(row.submission_deadline),
      [RFQ_FIELDS.status]: strOrNull(row.status),
      [RFQ_FIELDS.notes]: strOrNull(row.description),
    }),
  },
  // ---- Deals ----
  {
    supabaseTable: "deals",
    airtableTableId: "tblpdNWPvXJ7BmOSA",
    mergeFieldId: DEAL_FIELDS.supabase_id,
    typecast: true,
    toFields: (row) => ({
      [DEAL_FIELDS.supabase_id]: strOrNull(row.id),
      [DEAL_FIELDS.title]: strOrNull(row.title),
      [DEAL_FIELDS.status]: strOrNull(row.status),
      [DEAL_FIELDS.deal_stage]: strOrNull(row.offer_decision),
      [DEAL_FIELDS.notes]: strOrNull(row.offer_note),
      [DEAL_FIELDS.deal_date]: dateOnly(row.created_at),
    }),
  },
  // ---- Purchases ----
  {
    supabaseTable: "purchases",
    airtableTableId: "tbl2QJT5YW4026jGj",
    mergeFieldId: PURCHASE_FIELDS.supabase_id,
    typecast: true,
    toFields: (row) => ({
      [PURCHASE_FIELDS.supabase_id]: strOrNull(row.id),
      [PURCHASE_FIELDS.buyer_id]: strOrNull(row.buyer_org_id),
      [PURCHASE_FIELDS.supplier_id]: strOrNull(row.supplier_org_id),
      [PURCHASE_FIELDS.deal_id]: strOrNull(row.deal_id),
      [PURCHASE_FIELDS.status]: strOrNull(row.status),
      [PURCHASE_FIELDS.total_value_usd]: numOrNull(row.total_amount),
      [PURCHASE_FIELDS.currency]: strOrNull(row.currency),
      [PURCHASE_FIELDS.notes]: strOrNull(row.notes),
      [PURCHASE_FIELDS.created_at]: strOrNull(row.created_at),
    }),
  },
  // ---- Custody Events ----
  {
    supabaseTable: "custody_events",
    airtableTableId: "tblHPVV9zNweddZ8o",
    mergeFieldId: CUSTODY_FIELDS.supabase_id,
    typecast: true,
    toFields: (row) => ({
      [CUSTODY_FIELDS.supabase_id]: strOrNull(row.id),
      [CUSTODY_FIELDS.org_id]: strOrNull(row.org_id),
      [CUSTODY_FIELDS.order_id]: strOrNull(row.order_id),
      [CUSTODY_FIELDS.deal_id]: strOrNull(row.deal_id),
      [CUSTODY_FIELDS.event_type]: strOrNull(row.event_type),
      [CUSTODY_FIELDS.title]: strOrNull(row.title),
      [CUSTODY_FIELDS.description]: strOrNull(row.description),
      [CUSTODY_FIELDS.location]: strOrNull(row.location),
      [CUSTODY_FIELDS.occurred_at]: strOrNull(row.occurred_at),
      [CUSTODY_FIELDS.verified_by]: strOrNull(row.verified_by),
      [CUSTODY_FIELDS.verified_at]: strOrNull(row.verified_at),
      [CUSTODY_FIELDS.documents]: jsonStr(row.documents),
      [CUSTODY_FIELDS.coordinates]: jsonStr(row.coordinates),
      [CUSTODY_FIELDS.created_by]: strOrNull(row.created_by),
      [CUSTODY_FIELDS.created_at]: strOrNull(row.created_at),
    }),
  },
  // ---- TeleBuy Sessions ----
  {
    supabaseTable: "telebuy_sessions",
    airtableTableId: "tblSeir3aG2ihTaup",
    mergeFieldId: TELEBUY_FIELDS.supabase_id,
    typecast: true,
    toFields: (row) => ({
      [TELEBUY_FIELDS.supabase_id]: strOrNull(row.id),
      [TELEBUY_FIELDS.supplier_id]: strOrNull(row.supplier_id),
      [TELEBUY_FIELDS.user_id]: strOrNull(row.user_id),
      [TELEBUY_FIELDS.org_id]: strOrNull(row.org_id),
      [TELEBUY_FIELDS.status]: strOrNull(row.status),
      [TELEBUY_FIELDS.meeting_url]: strOrNull(row.meeting_url),
      [TELEBUY_FIELDS.meeting_id]: strOrNull(row.meeting_id),
      [TELEBUY_FIELDS.google_meet_link]: strOrNull(row.google_meet_link),
      [TELEBUY_FIELDS.video_provider]: strOrNull(row.video_provider),
      [TELEBUY_FIELDS.scheduled_at]: strOrNull(row.scheduled_at),
      [TELEBUY_FIELDS.started_at]: strOrNull(row.started_at),
      [TELEBUY_FIELDS.ended_at]: strOrNull(row.ended_at),
      [TELEBUY_FIELDS.recording_url]: strOrNull(row.recording_url),
      [TELEBUY_FIELDS.transcript]: strOrNull(row.transcript),
      [TELEBUY_FIELDS.notes]: strOrNull(row.notes),
      [TELEBUY_FIELDS.created_at]: strOrNull(row.created_at),
    }),
  },
  // ---- Compliance Audit Logs ----
  {
    supabaseTable: "compliance_audit_logs",
    airtableTableId: "tbleMaZ3mET6J8iaC",
    mergeFieldId: AUDIT_FIELDS.supabase_id,
    typecast: true,
    toFields: (row) => ({
      [AUDIT_FIELDS.supabase_id]: strOrNull(row.id),
      [AUDIT_FIELDS.audit_type]: strOrNull(row.action),
      [AUDIT_FIELDS.entity_type]: strOrNull(row.entity_type),
      [AUDIT_FIELDS.entity_id]: strOrNull(row.entity_id),
      [AUDIT_FIELDS.auditor_name]: strOrNull(row.performed_by),
      [AUDIT_FIELDS.audit_date]: strOrNull(row.created_at),
      [AUDIT_FIELDS.findings]: strOrNull(row.notes),
      [AUDIT_FIELDS.status]: strOrNull(row.compliance_result),
      [AUDIT_FIELDS.notes]: jsonStr(row.regulation_refs),
      [AUDIT_FIELDS.created_date]: dateOnly(row.created_at),
    }),
  },
  // ---- Collection Sites ----
  {
    supabaseTable: "collection_sites",
    airtableTableId: "tbl228fEQlU1ZHsIx",
    mergeFieldId: SITE_FIELDS.supabase_id,
    typecast: true,
    toFields: (row) => ({
      [SITE_FIELDS.supabase_id]: strOrNull(row.id),
      [SITE_FIELDS.site_name]: strOrNull(row.site_name ?? row.name),
      [SITE_FIELDS.location]: strOrNull(row.location ?? row.address),
      [SITE_FIELDS.country]: strOrNull(row.country),
      [SITE_FIELDS.region]: strOrNull(row.region),
      [SITE_FIELDS.site_type]: strOrNull(row.site_type ?? row.partner_type),
      [SITE_FIELDS.capacity_mt]: numOrNull(row.capacity_mt),
      [SITE_FIELDS.status]: strOrNull(row.status),
      [SITE_FIELDS.manager_name]: strOrNull(row.manager_name),
      [SITE_FIELDS.contact_email]: strOrNull(row.contact_email),
      [SITE_FIELDS.contact_phone]: strOrNull(row.contact_phone),
      [SITE_FIELDS.last_inspection]: strOrNull(row.last_inspection),
      [SITE_FIELDS.next_inspection]: strOrNull(row.next_inspection),
      [SITE_FIELDS.compliance_status]: strOrNull(row.compliance_status),
      [SITE_FIELDS.notes]: strOrNull(row.notes),
      [SITE_FIELDS.created_date]: dateOnly(row.created_at),
    }),
  },
  // ---- Collection Workers ----
  {
    supabaseTable: "collection_workers",
    airtableTableId: "tbl2VuKwDi14PhzCB",
    mergeFieldId: WORKER_FIELDS.supabase_id,
    typecast: true,
    toFields: (row) => ({
      [WORKER_FIELDS.supabase_id]: strOrNull(row.id),
      [WORKER_FIELDS.full_name]: strOrNull(row.name),
      [WORKER_FIELDS.certification_status]: strOrNull(row.kyc_status),
      [WORKER_FIELDS.training_completed]: boolFromStatus(row.training_status, "completed"),
      [WORKER_FIELDS.status]: strOrNull(row.training_status),
      [WORKER_FIELDS.notes]: strOrNull(row.partner_id),
      [WORKER_FIELDS.created_date]: dateOnly(row.created_at),
    }),
  },
  // ---- Battery Inventory ----
  {
    supabaseTable: "battery_inventory",
    airtableTableId: "tblx3jKD6gnPVoyAO",
    mergeFieldId: BATTERY_FIELDS.supabase_id,
    typecast: true,
    toFields: (row) => ({
      [BATTERY_FIELDS.supabase_id]: strOrNull(row.id),
      [BATTERY_FIELDS.battery_type]: strOrNull(row.battery_type),
      [BATTERY_FIELDS.weight_kg]: numOrNull(row.weight_kg),
      [BATTERY_FIELDS.current_status]: strOrNull(row.status),
      [BATTERY_FIELDS.received_date]: dateOnly(row.collected_at),
      [BATTERY_FIELDS.notes]: strOrNull(row.chemistry),
      [BATTERY_FIELDS.created_date]: dateOnly(row.created_at),
    }),
  },
  // ---- Chain of Custody ----
  {
    supabaseTable: "chain_of_custody",
    airtableTableId: "tbliy0LeAz5qpFPJ8",
    mergeFieldId: COC_FIELDS.supabase_id,
    typecast: true,
    toFields: (row) => ({
      [COC_FIELDS.supabase_id]: strOrNull(row.id),
      [COC_FIELDS.custody_id]: strOrNull(row.id),
      [COC_FIELDS.transfer_date]: strOrNull(row.transfer_time),
      [COC_FIELDS.transferred_by]: strOrNull(row.previous_owner),
      [COC_FIELDS.received_by]: strOrNull(row.new_owner),
      [COC_FIELDS.transport_method]: strOrNull(row.transport_mode),
      [COC_FIELDS.condition_on_transfer]: strOrNull(row.condition),
      [COC_FIELDS.notes]: strOrNull(row.evidence_url),
      [COC_FIELDS.created_date]: dateOnly(row.created_at),
    }),
  },
  // ---- Processing Orders ----
  {
    supabaseTable: "processing_orders",
    airtableTableId: "tblt8P0Lu7VVG0CG4",
    mergeFieldId: PROC_FIELDS.supabase_id,
    typecast: true,
    toFields: (row) => ({
      [PROC_FIELDS.supabase_id]: strOrNull(row.id),
      [PROC_FIELDS.order_id]: strOrNull(row.id),
      [PROC_FIELDS.order_date]: dateOnly(row.processing_date ?? row.created_at),
      [PROC_FIELDS.actual_processing_date]: dateOnly(row.processing_date),
      [PROC_FIELDS.processing_method]: strOrNull(row.processing_method),
      [PROC_FIELDS.output_materials]: strOrNull(row.processed_output),
      [PROC_FIELDS.notes]: row.output_value_usd != null
        ? `Value: $${row.output_value_usd} | Weight: ${row.output_weight_kg}kg`
        : strOrNull(row.processed_output),
      [PROC_FIELDS.created_date]: dateOnly(row.created_at),
    }),
  },
];

async function upsertBatch(
  tableId: string,
  mergeFieldId: string,
  records: { fields: Record<string, unknown> }[],
  apiKey: string,
  typecast: boolean,
): Promise<{ created: number; updated: number }> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}`;
  let attempt = 0;
  while (true) {
    const resp = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        performUpsert: { fieldsToMergeOn: [mergeFieldId] },
        records,
        typecast,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      return {
        created: (data.createdRecords ?? []).length,
        updated: (data.updatedRecords ?? []).length,
      };
    }
    if ((resp.status === 429 || resp.status === 503) && attempt < 2) {
      attempt++;
      await sleep(resp.status === 429 ? 30_000 : 1000 * attempt);
      continue;
    }
    const body = await resp.text();
    throw new Error(`Airtable ${resp.status} on ${tableId}: ${body}`);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided = req.headers.get("x-cron-secret");
  if (cronSecret && provided && provided !== cronSecret) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("AIRTABLE_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ ok: false, error: "missing required env vars" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Optional { only: "table" } to target a single table.
  let only: string | null = null;
  try {
    const body = await req.json();
    if (body && typeof body.only === "string") only = body.only;
  } catch (_e) { /* no body */ }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Refresh Supabase-computed KPIs before pushing (only when KPIs are in scope).
  if (!only || only === "market_kpis") {
    try {
      await supabase.rpc("refresh_platform_kpis");
    } catch (_e) { /* non-fatal */ }
  }

  const tables = only ? PUSH_TABLES.filter((t) => t.supabaseTable === only) : PUSH_TABLES;
  if (only && tables.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: `unknown table: ${only}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const perTable: Record<string, { created: number; updated: number; errors: string[] }> = {};
  let ok = true;

  for (const t of tables) {
    const entry = { created: 0, updated: 0, errors: [] as string[] };
    perTable[t.supabaseTable] = entry;
    const started = Date.now();
    try {
      const { data: rows, error } = await supabase.from(t.supabaseTable).select("*");
      if (error) throw new Error(error.message);

      const records = (rows ?? [])
        .map((row) => ({ fields: t.toFields(row as Record<string, unknown>) }))
        .filter((r) => r.fields[t.mergeFieldId] != null);

      for (let i = 0; i < records.length; i += AIRTABLE_BATCH) {
        const batch = records.slice(i, i + AIRTABLE_BATCH);
        const res = await upsertBatch(t.airtableTableId, t.mergeFieldId, batch, apiKey, !!t.typecast);
        entry.created += res.created;
        entry.updated += res.updated;
        if (i + AIRTABLE_BATCH < records.length) await sleep(RATE_DELAY_MS);
      }

      await supabase.from("airtable_sync_log").insert({
        table_name: t.supabaseTable,
        action: "push",
        status: "success",
        record_count: entry.created + entry.updated,
        direction: "to_airtable",
        duration_ms: Date.now() - started,
        synced_at: nowIso(),
      });
    } catch (err) {
      ok = false;
      const msg = err instanceof Error ? err.message : String(err);
      entry.errors.push(msg);
      await supabase.from("airtable_sync_log").insert({
        table_name: t.supabaseTable,
        action: "push",
        status: "error",
        record_count: entry.created + entry.updated,
        direction: "to_airtable",
        duration_ms: Date.now() - started,
        synced_at: nowIso(),
      }).then(() => {}, () => {});
    }
  }

  return new Response(JSON.stringify({ ok, perTable }), {
    status: ok ? 200 : 207,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
