// Supabase Edge Function: grant-ingest
// Polls Grants.gov v2 + USASpending.gov for battery/critical minerals federal grants,
// deduplicates by opportunity_number, upserts into Supabase `grants`, and
// mirrors to the Airtable Grant Tracker (tblKTNtuoRcTrVZ02) via idempotent
// performUpsert keyed on Grant ID (fld7EaDZv3Royi8jm = opportunity_number).
//
// Runs daily via pg_cron (cron schedule: grant-ingest-daily, 0 6 * * *).
//
// API Auth requirements:
//   - Grants.gov v2: requires GRANTS_GOV_API_KEY (free, register at grants.gov).
//     Without this key, Grants.gov ingestion is skipped (function still runs via
//     USASpending.gov). Set via: supabase secrets set GRANTS_GOV_API_KEY=<token>
//   - USASpending.gov: no auth required — genuinely public API.
//
// Auth: absent/empty x-cron-secret allowed; non-empty header must match CRON_SECRET.
//
// Env: AIRTABLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//      GRANTS_GOV_API_KEY (optional), CRON_SECRET (optional)

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AIRTABLE_BASE_ID = "appu9fRT4qFBCf8wL";
const GRANT_TRACKER_TABLE_ID = "tblKTNtuoRcTrVZ02";

// Airtable field IDs — captured from live base schema 2026-06-09
// NEVER use field names here; these survive renames.
const GT = {
  grant_id:         "fld7EaDZv3Royi8jm", // singleLineText  — MERGE KEY (= opportunity_number)
  agency:           "fld6HyH1ryzi0FOd1", // singleSelect    — DOE/NSF/ARPA-E/DOD/USDA
  program_name:     "fldCMqiyvBo2kvn7Q", // singleLineText  — title
  amount_available: "fldp09PeikZy7fUnM", // currency        — amount_max
  deadline:         "fldbATmO6TRzmWOkp", // date YYYY-MM-DD — deadline
  notes:            "fldueHhflsW2ieDyb", // multilineText   — description
};

const AIRTABLE_BATCH = 10;  // Airtable hard limit per upsert request
const RATE_DELAY_MS  = 300; // ~3 req/s, well under Airtable's 5 req/s ceiling

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- Grants.gov search config ------------------------------------------------

// Keyword batches — each is a separate POST (25 results max per call)
const KEYWORD_BATCHES = [
  "lithium battery recycling",
  "critical minerals battery supply chain",
  "battery manufacturing clean energy",
  "cobalt nickel manganese lithium",
  "EV battery second-life grid storage",
  "ARPA-E battery energy storage",
  "extended producer responsibility battery",
];

// CFDA codes most relevant to LithiumBuy customers
// Each triggers a separate CFDA-filtered search to catch grants missed by keywords
const CFDA_CODES = [
  "81.049", // DOE Office of Science
  "81.086", // DOE EERE Conservation R&D
  "81.117", // DOE Energy Efficiency and Renewable Energy
  "81.122", // DOE Grid / Electricity Delivery
  "81.135", // ARPA-E
  "81.317", // DOE OCED Clean Energy Demonstrations
  "66.926", // EPA Solid Waste Infrastructure for Recycling
  "66.802", // EPA RCRA Corrective Action
];

// ---- Normalization -----------------------------------------------------------

interface GrantsGovOpp {
  opportunityId?:                  number;
  opportunityNumber?:              string;
  opportunityTitle?:               string;
  agencyName?:                     string;
  agencyCode?:                     string;
  cfdaNumber?:                     string;
  postDate?:                       string;
  closeDate?:                      string;
  awardCeiling?:                   number;
  awardFloor?:                     number;
  estimatedTotalProgramFunding?:   number;
  synopsis?:                       string;
  opportunityStatus?:              string;
}

function mapStatus(raw: string | undefined): string {
  return ({
    posted:     "open",
    forecasted: "upcoming",
    closed:     "closed",
    archived:   "closed",
  } as Record<string, string>)[raw ?? ""] ?? "open";
}

function normalizeGrantsGov(opp: GrantsGovOpp): Record<string, unknown> {
  return {
    title:              (opp.opportunityTitle ?? "").slice(0, 500) || null,
    funding_source:     opp.agencyName ?? null,
    amount_max:         opp.awardCeiling ?? opp.estimatedTotalProgramFunding ?? null,
    amount_min:         opp.awardFloor ?? null,
    deadline:           opp.closeDate ?? null,
    application_status: mapStatus(opp.opportunityStatus),
    opportunity_number: opp.opportunityNumber ?? null,
    cfda_number:        opp.cfdaNumber ?? null,
    grants_gov_id:      opp.opportunityId ?? null,
    description:        (opp.synopsis ?? "").slice(0, 5000) || null,
    posted_date:        opp.postDate ?? null,
    source:             "grants.gov",
    source_url:         `https://www.grants.gov/search-grants?cfda=${opp.cfdaNumber ?? ""}`,
  };
}

// Map a free-text agency name to one of the Airtable singleSelect options.
// typecast: true on the Airtable upsert will auto-create any unrecognized value,
// but we normalise the common ones first to avoid junk options proliferating.
function agencyToSelect(name: string | null): string | null {
  if (!name) return null;
  const u = name.toUpperCase();
  if (u.includes("ARPA-E") || u.includes("ARPAE"))                          return "ARPA-E";
  if (u.includes("ENERGY") || u.includes(" DOE") || u.includes("EERE") ||
      u.startsWith("DOE"))                                                    return "DOE";
  if (u.includes("DEFENSE") || u.includes(" DOD") || u.includes("DARPA") ||
      u.includes("ARMY")    || u.includes("NAVY") || u.includes("AIR FORCE") ||
      u.startsWith("DOD"))                                                    return "DOD";
  if (u.includes("NSF") || u.includes("NATIONAL SCIENCE"))                   return "NSF";
  if (u.includes("USDA") || u.includes("AGRICULTURE"))                       return "USDA";
  return name.slice(0, 100); // typecast will create this as a new option
}

// ---- API fetch helpers -------------------------------------------------------

async function searchGrantsGov(
  keyword: string | null,
  cfdaNumber: string | null,
  apiKey: string,
): Promise<GrantsGovOpp[]> {
  const body: Record<string, unknown> = {
    oppStatuses: ["posted", "forecasted"],
    rows: 25,
    startRecordNum: 0,
    sortBy: "openDate|desc",
  };
  if (keyword)    body.keyword     = keyword;
  if (cfdaNumber) body.cfdaNumbers = [cfdaNumber];

  const resp = await fetch("https://api.grants.gov/v2/opportunities/search", {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Grants.gov ${resp.status}: ${err.slice(0, 300)}`);
  }
  const data = await resp.json();
  return (data.opportunities ?? data.data ?? []) as GrantsGovOpp[];
}

// USASpending.gov — genuinely public, no auth required.
// Returns RECENTLY AWARDED grants for battery/minerals (last 2 years).
// These are closed-loop intelligence: companies that WON similar grants are
// LithiumBuy's warmest prospective customers; awarded grants also populate
// the "Awarded" pipeline view in the Grant Tracker.
async function searchUsaSpending(): Promise<Record<string, unknown>[]> {
  const body = {
    filters: {
      keywords: [
        "lithium battery", "battery recycling", "critical minerals",
        "cobalt nickel manganese", "battery manufacturing",
      ],
      award_type_codes: ["02", "03", "04"], // block / formula / project grants
      agencies: [
        { type: "funding", tier: "toptier", name: "Department of Energy" },
        { type: "funding", tier: "toptier", name: "Environmental Protection Agency" },
      ],
      time_period: [{ start_date: "2024-01-01", end_date: "2026-12-31" }],
    },
    fields: [
      "Award ID", "Recipient Name", "Award Amount", "Awarding Agency",
      "CFDA Number", "Description", "Period of Performance Start Date",
      "Period of Performance Current End Date",
    ],
    sort:  "Award Amount",
    order: "desc",
    limit: 50,
    page:  1,
  };

  const resp = await fetch("https://api.usaspending.gov/api/v2/search/spending_by_award/", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`USASpending.gov ${resp.status}: ${err.slice(0, 300)}`);
  }
  const data = await resp.json();
  return ((data.results ?? []) as Record<string, unknown>[]).map((a) => ({
    title:              String(a["Description"] ?? a["Award ID"] ?? "").slice(0, 500) || null,
    funding_source:     String(a["Awarding Agency"] ?? "").slice(0, 200) || null,
    amount_max:         a["Award Amount"] != null ? Number(a["Award Amount"]) : null,
    amount_min:         null,
    deadline:           a["Period of Performance Current End Date"] ?? null,
    application_status: "closed", // awarded grants are closed for new applications
    opportunity_number: String(a["Award ID"] ?? "").slice(0, 200) || null,
    cfda_number:        a["CFDA Number"] != null ? String(a["CFDA Number"]) : null,
    grants_gov_id:      null,
    description:        String(a["Description"] ?? "").slice(0, 5000) || null,
    posted_date:        a["Period of Performance Start Date"] ?? null,
    source:             "usaspending.gov",
    source_url:         "https://www.usaspending.gov/search",
  }));
}

// ---- CORS / main serve -------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Auth: only reject if CRON_SECRET is set AND a wrong non-empty header was provided.
  // pg_cron calls arrive with no x-cron-secret header — that is always allowed.
  const cronSecret = Deno.env.get("CRON_SECRET");
  const provided   = req.headers.get("x-cron-secret");
  if (cronSecret && provided && provided !== cronSecret) {
    return new Response(
      JSON.stringify({ ok: false, error: "unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const airtableKey  = Deno.env.get("AIRTABLE_API_KEY");
  const supabaseUrl  = Deno.env.get("SUPABASE_URL");
  const serviceKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const grantsGovKey = Deno.env.get("GRANTS_GOV_API_KEY"); // optional; register at grants.gov
  if (!airtableKey || !supabaseUrl || !serviceKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "missing env vars (AIRTABLE_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const errors: string[] = [];
  const warnings: string[] = [];
  let found = 0, upserted = 0, airtableSynced = 0;

  // ── 1. Fetch from Grants.gov (requires API key — free registration at grants.gov) ─
  const rawGrants: Record<string, unknown>[] = [];

  if (grantsGovKey) {
    for (const keyword of KEYWORD_BATCHES) {
      try {
        const opps = await searchGrantsGov(keyword, null, grantsGovKey);
        rawGrants.push(...opps.map(normalizeGrantsGov));
      } catch (e) {
        errors.push(`grants.gov keyword "${keyword}": ${e instanceof Error ? e.message : String(e)}`);
      }
      await sleep(RATE_DELAY_MS);
    }

    for (const cfda of CFDA_CODES) {
      try {
        const opps = await searchGrantsGov(null, cfda, grantsGovKey);
        rawGrants.push(...opps.map(normalizeGrantsGov));
      } catch (e) {
        errors.push(`grants.gov cfda ${cfda}: ${e instanceof Error ? e.message : String(e)}`);
      }
      await sleep(RATE_DELAY_MS);
    }
  } else {
    warnings.push(
      "GRANTS_GOV_API_KEY not set — Grants.gov ingestion skipped. " +
      "Register at https://grants.gov to get a free API key, then: " +
      "supabase secrets set GRANTS_GOV_API_KEY=<your_token>"
    );
  }

  // ── 2. Fetch from USASpending.gov (no auth required) ──────────────────────
  // Returns recently AWARDED grants — useful for CRM prospecting and pipeline view.
  try {
    const usaGrants = await searchUsaSpending();
    rawGrants.push(...usaGrants);
  } catch (e) {
    errors.push(`usaspending.gov: ${e instanceof Error ? e.message : String(e)}`);
  }

  found = rawGrants.length;

  // ── 3. Deduplicate in memory by opportunity_number ─────────────────────────
  // Grants without opportunity_number can't be idempotently merged — skip them.
  const seen = new Set<string>();
  const uniqueGrants = rawGrants.filter((g) => {
    const key = g.opportunity_number as string | null;
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // ── 4. Upsert into Supabase on conflict(opportunity_number) ───────────────
  const SB_BATCH = 100;
  for (let i = 0; i < uniqueGrants.length; i += SB_BATCH) {
    const batch = uniqueGrants.slice(i, i + SB_BATCH);
    const { error } = await supabase
      .from("grants")
      .upsert(batch, { onConflict: "opportunity_number", ignoreDuplicates: false });
    if (error) {
      errors.push(`supabase upsert batch ${i}: ${error.message}`);
    } else {
      upserted += batch.length;
    }
  }

  // ── 5. Push all API-sourced grants to Airtable ────────────────────────────
  // Fetch from Supabase (post-upsert) to get up-to-date values + airtable_id.
  const { data: sbGrants, error: fetchErr } = await supabase
    .from("grants")
    .select("id, opportunity_number, airtable_id, title, funding_source, amount_max, deadline, description")
    .not("opportunity_number", "is", null);

  if (fetchErr) {
    errors.push(`supabase fetch for airtable push: ${fetchErr.message}`);
  }

  const airtableRows = (sbGrants ?? []).map((g: Record<string, unknown>) => ({
    supabase_id:        g.id        as string,
    opportunity_number: g.opportunity_number as string,
    fields: {
      [GT.grant_id]:         g.opportunity_number,
      [GT.program_name]:     (g.title as string | null)?.slice(0, 500) ?? null,
      [GT.agency]:           agencyToSelect(g.funding_source as string | null),
      [GT.amount_available]: g.amount_max != null ? Number(g.amount_max) : null,
      [GT.deadline]:         g.deadline as string | null,
      [GT.notes]:            (g.description as string | null)?.slice(0, 5000) ?? null,
    },
  })).filter((r) => r.fields[GT.grant_id] != null);

  const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${GRANT_TRACKER_TABLE_ID}`;

  for (let i = 0; i < airtableRows.length; i += AIRTABLE_BATCH) {
    const batch = airtableRows.slice(i, i + AIRTABLE_BATCH);
    try {
      const resp = await fetch(airtableUrl, {
        method: "PATCH",
        headers: {
          Authorization:  `Bearer ${airtableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          performUpsert: { fieldsToMergeOn: [GT.grant_id] },
          records:  batch.map((r) => ({ fields: r.fields })),
          typecast: true,
        }),
      });

      if (!resp.ok) {
        const body = await resp.text();
        errors.push(`airtable batch ${i}: ${resp.status} ${body.slice(0, 300)}`);
        await sleep(resp.status === 429 ? 30_000 : RATE_DELAY_MS);
        continue;
      }

      const data = await resp.json();
      airtableSynced += (data.records ?? []).length;
    } catch (e) {
      errors.push(`airtable batch ${i}: ${e instanceof Error ? e.message : String(e)}`);
    }
    await sleep(RATE_DELAY_MS);
  }

  // ── 5b. Back-fill airtable_id in Supabase ────────────────────────────────
  // The performUpsert response may return field names or IDs as keys — brittle to
  // parse inline. Instead, do a single paginated GET of the Grant Tracker requesting
  // only the Grant ID field, build a complete grantId→recId map, and update any
  // Supabase grant rows that still have airtable_id = NULL.
  try {
    const grantIdToRecId = new Map<string, string>();
    let atOffset: string | undefined;
    do {
      const params = new URLSearchParams({ "fields[]": GT.grant_id, pageSize: "100" });
      if (atOffset) params.set("offset", atOffset);
      const listResp = await fetch(`${airtableUrl}?${params}`, {
        headers: { Authorization: `Bearer ${airtableKey}` },
      });
      if (!listResp.ok) break;
      const listData = await listResp.json();
      for (const rec of listData.records ?? []) {
        // Response may key fields by ID (fld...) or name ("Grant ID") — handle both.
        const gid: unknown = rec.fields?.[GT.grant_id] ?? rec.fields?.["Grant ID"];
        if (gid && rec.id) grantIdToRecId.set(String(gid), rec.id as string);
      }
      atOffset = listData.offset;
    } while (atOffset);

    // Find Supabase grants with opportunity_number set but airtable_id missing.
    const { data: nullRows } = await supabase
      .from("grants")
      .select("id, opportunity_number")
      .not("opportunity_number", "is", null)
      .is("airtable_id", null);

    await Promise.all(
      (nullRows ?? [])
        .filter((r: Record<string, unknown>) => grantIdToRecId.has(r.opportunity_number as string))
        .map((r: Record<string, unknown>) =>
          supabase
            .from("grants")
            .update({ airtable_id: grantIdToRecId.get(r.opportunity_number as string) })
            .eq("id", r.id),
        ),
    );
  } catch (e) {
    errors.push(`airtable_id back-fill: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── 6. Log run ────────────────────────────────────────────────────────────
  const sources = [grantsGovKey ? "grants.gov" : null, "usaspending.gov"].filter(Boolean).join("+");
  await supabase.from("grant_ingest_log").insert({
    source:          sources,
    found,
    upserted,
    airtable_synced: airtableSynced,
    errors:          errors.length > 0 ? errors : null,
  });

  const ok = errors.length === 0;
  return new Response(
    JSON.stringify({ ok, found, upserted, airtable_synced: airtableSynced, errors, warnings }),
    { status: ok ? 200 : 207, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
