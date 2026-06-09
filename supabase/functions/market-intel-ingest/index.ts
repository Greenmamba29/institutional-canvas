// market-intel-ingest
// Ingests lithium price indicators (via Firecrawl v2 scrape + regex parse of
// markdown) and market news (Google News RSS + Firecrawl v2 search) into
// public.price_indicators (append/time-series) and public.market_news
// (upsert on url). Single Deno file, std http serve.
//
// Env: FIRECRAWL_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, optional CRON_SECRET.
// Auth: verify_jwt FALSE. Relaxed cron gate: allow absent/empty x-cron-secret;
// reject only a provided non-empty value that mismatches CRON_SECRET.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";

const FC_SCRAPE = "https://api.firecrawl.dev/v2/scrape";
const FC_SEARCH = "https://api.firecrawl.dev/v2/search";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Connection": "keep-alive" },
  });

function hostOf(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return "unknown";
  }
}

// ---- Supabase REST helpers (service role) -------------------------------

async function sbInsert(table: string, rows: unknown[]): Promise<void> {
  if (!rows.length) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`insert ${table} ${res.status}: ${t.slice(0, 300)}`);
  }
}

async function sbUpsert(table: string, rows: unknown[], onConflict: string): Promise<void> {
  if (!rows.length) return;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal,resolution=merge-duplicates",
      },
      body: JSON.stringify(rows),
    },
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`upsert ${table} ${res.status}: ${t.slice(0, 300)}`);
  }
}

// ---- Firecrawl v2 scrape -------------------------------------------------

async function fcScrape(url: string): Promise<string> {
  const res = await fetch(FC_SCRAPE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, formats: ["markdown"] }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`firecrawl scrape ${res.status}: ${t.slice(0, 200)}`);
  }
  const body = await res.json();
  return (body?.data?.markdown as string) ?? "";
}

function toNum(s: string | undefined | null): number | null {
  if (!s) return null;
  const n = Number(String(s).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ---- FX rates (keyless) --------------------------------------------------

// Verified keyless source (2026-06): open.er-api.com returns
// { result:'success', base_code:'USD', rates:{ USD:1, CNY:..., EUR:..., ... } }.
// rates[CCY] = units of CCY per 1 USD, so USD = amount / rates[CCY].
const FX_URL = "https://open.er-api.com/v6/latest/USD";

interface FxMap {
  rates: Record<string, number>; // CCY per USD (base USD)
  error?: string;
}

async function fetchFxRates(): Promise<FxMap> {
  try {
    const res = await fetch(FX_URL);
    if (!res.ok) return { rates: {}, error: `fx ${res.status}` };
    const body = await res.json();
    const rates = body?.rates;
    if (body?.result !== "success" || !rates || typeof rates !== "object") {
      return { rates: {}, error: "fx bad shape" };
    }
    return { rates: rates as Record<string, number> };
  } catch (e) {
    return { rates: {}, error: String((e as Error).message) };
  }
}

// Convert a native amount in `currency` to USD using the FX map. Returns the
// USD amount plus the fx_rate used (CCY-per-USD). If conversion isn't possible
// (USD already, missing rate, FX failed), returns the native value with no rate.
function toUsd(
  amount: number,
  currency: string,
  fx: FxMap,
): { usd: number; fxRate: number | null } {
  const c = (currency ?? "USD").toUpperCase();
  if (c === "USD") return { usd: amount, fxRate: 1 };
  const rate = fx.rates[c];
  if (typeof rate === "number" && rate > 0) {
    return { usd: amount / rate, fxRate: rate };
  }
  return { usd: amount, fxRate: null }; // defensive: keep native if no rate
}

// ---- Price ingestion -----------------------------------------------------

// Canonical symbols the Analytics frontend queries via get_price_indicators.
// These MUST match src/pages/Analytics.tsx exactly or the chart filters rows out.
const SYM_CARBONATE = "LITHIUM_CARBONATE_BATTERY_GRADE";
const SYM_HYDROXIDE = "LITHIUM_HYDROXIDE";

// Map a businessanalytiq regional bullet line to its region name. Returns null
// if the line carries no recognised region label.
function regionFromLine(line: string): string | null {
  if (/north\s+america/i.test(line)) return "North America";
  if (/south\s+america/i.test(line)) return "South America";
  if (/northeast\s+asia/i.test(line)) return "Northeast Asia";
  if (/\beurope\b/i.test(line)) return "Europe";
  return null;
}

interface PriceRow {
  symbol: string;
  region: string;
  price: number;
  currency: string;
  unit: string;
  observed_at: string;
  source: string;
  metadata: Record<string, unknown>;
}

interface ParsedPrice {
  price: number;
  currency: string; // 'USD' | 'CNY'
  unit: string; // 'USD/tonne' | 'CNY/tonne'
  snippet: string;
}

// Normalise a raw value + currency token + unit token into USD/tonne or CNY/tonne.
function normalizePrice(
  raw: number,
  curTok: string | undefined,
  unitTok: string | undefined,
): { price: number; currency: string; unit: string } | null {
  const c = (curTok ?? "").toUpperCase();
  let currency: string;
  if (c.includes("CNY") || c.includes("RMB") || c === "¥") currency = "CNY";
  else currency = "USD"; // default & for $/US$

  const u = (unitTok ?? "").toLowerCase();
  let price = raw;
  // per-kg -> per-tonne
  if (u === "kg") price = raw * 1000;
  // t / mt / tonne already per tonne

  // Plausibility guard: lithium chemicals are roughly 5k-200k per tonne.
  if (price < 1000 || price > 1_000_000) return null;

  return { price, currency, unit: `${currency}/tonne` };
}

// Detect currency from a token that may appear immediately before OR after the
// number. Matches a window of the line around the price.
function currencyFromWindow(window: string): string | undefined {
  if (/CNY|RMB|¥|元|yuan/i.test(window)) return "CNY";
  if (/US\$|USD|\$/i.test(window)) return "USD";
  return undefined;
}

// Parse all prices on a line, scanning a small window before each match so a
// leading currency token (e.g. "CNY 163,000 per tonne") is detected too.
function parsePriceLine(line: string): ParsedPrice[] {
  const out: ParsedPrice[] = [];
  // number, optional adjacent currency, separator, unit.
  const re =
    /([\d,]+(?:\.\d+)?)\s*(USD|US\$|RMB|CNY|\$|¥)?\s*(?:\/|per\s+)\s*(t|mt|tonne|kg)\b/gi;
  // currency-prefixed variant: US$10.33/KG or ¥75,000/t
  const prefixRe =
    /(USD|US\$|RMB|CNY|\$|¥)\s*([\d,]+(?:\.\d+)?)\s*(?:\/|per\s+)\s*(t|mt|tonne|kg)\b/gi;

  let m: RegExpExecArray | null;
  re.lastIndex = 0;
  while ((m = re.exec(line)) !== null) {
    const raw = toNum(m[1]);
    if (raw == null) continue;
    // currency token from match, or from the 12 chars preceding the number.
    const before = line.slice(Math.max(0, m.index - 12), m.index);
    const cur = m[2] ?? currencyFromWindow(before);
    const norm = normalizePrice(raw, cur, m[3]);
    if (norm) out.push({ ...norm, snippet: line.trim().slice(0, 300) });
  }
  prefixRe.lastIndex = 0;
  while ((m = prefixRe.exec(line)) !== null) {
    const raw = toNum(m[2]);
    if (raw == null) continue;
    const norm = normalizePrice(raw, m[1], m[3]);
    if (norm) out.push({ ...norm, snippet: line.trim().slice(0, 300) });
  }
  return out;
}

// Find prices near a keyword (carbonate/hydroxide). If requireKeyword is false,
// parse every line (used for dedicated per-symbol pages where the price bullets
// don't repeat the chemical name).
function parsePricesNear(md: string, keyword: RegExp, requireKeyword = true): ParsedPrice[] {
  const out: ParsedPrice[] = [];
  const lines = md.split(/\n+/);
  for (const line of lines) {
    if (requireKeyword) {
      keyword.lastIndex = 0;
      if (!keyword.test(line)) continue;
      keyword.lastIndex = 0;
    }
    out.push(...parsePriceLine(line));
  }
  return out;
}

// A price source. `kind` selects the parser:
//  - "tradingeconomics": China battery-grade carbonate spot (CNY). One CN row.
//  - "businessanalytiq-carbonate": per-region carbonate bullets (USD/KG). Keeps
//    real region names so the regional-comparison panel (region null) shows them.
//  - "businessanalytiq-hydroxide": hydroxide index page (price lives in a JS
//    chart, not the markdown, so usually yields no parseable price).
//  - "intratec-hydroxide": intratec Lithium Hydroxide price outlook page. The
//    prose contains explicit "N,NNN USD per metric ton" strings (battery grade
//    Global preferred), updated monthly. Parsed -> one LITHIUM_HYDROXIDE CN row
//    (region CN so the Analytics LiOH CN card fills).
type PriceSourceKind =
  | "tradingeconomics"
  | "businessanalytiq-carbonate"
  | "businessanalytiq-hydroxide"
  | "intratec-hydroxide";

interface PriceSource {
  url: string;
  kind: PriceSourceKind;
}

const PRICE_SOURCES: PriceSource[] = [
  {
    url: "https://tradingeconomics.com/commodity/lithium",
    kind: "tradingeconomics",
  },
  {
    url:
      "https://businessanalytiq.com/procurementanalytics/index/lithium-carbonate-price-index/",
    kind: "businessanalytiq-carbonate",
  },
  {
    url:
      "https://www.intratec.us/solutions/primary-commodity-prices/commodity/lithium-hydroxide-prices",
    kind: "intratec-hydroxide",
  },
];

// Parse the intratec hydroxide page. The Price Outlook prose carries explicit
// "N,NNN USD per metric ton" strings; we prefer the battery grade figure but
// fall back to the first plausible one. Already USD/tonne.
function parseIntratecHydroxide(md: string): ParsedPrice[] {
  const out: ParsedPrice[] = [];
  const re = /([\d.,]+)\s*USD\s+per\s+metric\s+ton/gi;
  let m: RegExpExecArray | null;
  let battery: ParsedPrice | null = null;
  let first: ParsedPrice | null = null;
  while ((m = re.exec(md)) !== null) {
    const raw = toNum(m[1]);
    if (raw == null || raw < 1000 || raw > 1_000_000) continue;
    const ctx = md.slice(Math.max(0, m.index - 80), m.index).toLowerCase();
    const p: ParsedPrice = {
      price: raw,
      currency: "USD",
      unit: "USD/tonne",
      snippet: md.slice(Math.max(0, m.index - 60), m.index + 40).replace(/\s+/g, " ").trim(),
    };
    if (!first) first = p;
    if (/battery/.test(ctx) && !battery) battery = p;
  }
  const chosen = battery ?? first;
  if (chosen) out.push(chosen);
  return out;
}

async function ingestPriceSource(
  src: PriceSource,
  now: string,
  fx: FxMap,
): Promise<PriceRow[]> {
  const { url, kind } = src;
  const host = hostOf(url);
  const md = await fcScrape(url);
  if (!md) throw new Error(`no markdown from ${host}`);

  const rows: PriceRow[] = [];
  const seen = new Set<string>();

  // Canonicalize every price to USD/tonne. Native value+currency preserved in
  // metadata so the original (e.g. CNY 163,000) is never lost. This fixes the
  // "CNY shown as $" bug — stored price is always USD.
  const push = (symbol: string, region: string, p: ParsedPrice) => {
    const { usd, fxRate } = toUsd(p.price, p.currency, fx);
    const usdPrice = Math.round(usd * 100) / 100;
    const key = `${symbol}|${region}|${usdPrice}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      symbol,
      region,
      price: usdPrice,
      currency: "USD",
      unit: "USD/tonne",
      observed_at: now,
      source: `firecrawl:${host}`,
      metadata: {
        url,
        snippet: p.snippet,
        native_price: p.price,
        native_currency: p.currency,
        fx_rate: fxRate,
      },
    });
  };

  if (kind === "tradingeconomics") {
    // Trading Economics tracks battery-grade Li2CO3 spot traded in China (CNY).
    // Keep the first plausible carbonate price and tag it region 'CN' so the
    // frontend China carbonate chart and regional panel both pick it up.
    const carbonate = parsePricesNear(md, /carbonate|lithium/i).slice(0, 1);
    for (const p of carbonate) push(SYM_CARBONATE, "CN", p);
  } else if (kind === "businessanalytiq-carbonate") {
    // Per-region carbonate bullets, e.g. "North America:US$10.33/KG, 1.6% up".
    // Emit one carbonate row per recognised region, preserving the region name.
    for (const line of md.split(/\n+/)) {
      const region = regionFromLine(line);
      if (!region) continue;
      const parsed = parsePriceLine(line);
      if (parsed.length) push(SYM_CARBONATE, region, parsed[0]);
    }
  } else if (kind === "intratec-hydroxide") {
    // Explicit "N,NNN USD per metric ton" in prose. Region 'CN' so the
    // Analytics LiOH CN card fills. Already USD -> push canonicalizes (no-op).
    for (const p of parseIntratecHydroxide(md).slice(0, 1)) {
      push(SYM_HYDROXIDE, "CN", p);
    }
  } else {
    // businessanalytiq-hydroxide: price is rendered in a JS chart, not markdown.
    // Parse any hydroxide line if present; usually none -> this source errors.
    for (const p of parsePricesNear(md, /hydroxide/i).slice(0, 1)) {
      push(SYM_HYDROXIDE, "Global", p);
    }
  }

  if (rows.length === 0) {
    throw new Error(`no parseable price on ${host}`);
  }
  return rows;
}

async function ingestPrices(now: string): Promise<{ rows: PriceRow[]; errors: string[] }> {
  const rows: PriceRow[] = [];
  const errors: string[] = [];
  // Fetch FX up front; failure is non-fatal (toUsd keeps native defensively).
  const fx = await fetchFxRates();
  if (fx.error) errors.push(`fx: ${fx.error}`);
  const settled = await Promise.allSettled(
    PRICE_SOURCES.map((s) => ingestPriceSource(s, now, fx)),
  );
  for (const s of settled) {
    if (s.status === "fulfilled") rows.push(...s.value);
    else errors.push(String(s.reason?.message ?? s.reason));
  }
  return { rows, errors };
}

// ---- Arbitrage (derived from latest regional carbonate prices) -----------

// Run a read-only SQL query via PostgREST is awkward; use a Postgres RPC-free
// approach: query price_indicators through the REST API with filters and sort,
// then reduce to one latest row per region in JS.
interface LatestPrice {
  region: string;
  price: number;
  observed_at: string;
}

async function fetchLatestCarbonateByRegion(): Promise<LatestPrice[]> {
  // Pull recent non-seed USD carbonate rows, newest first, then keep the first
  // (most recent) per region. Limit generously; regions are few.
  const params = new URLSearchParams({
    select: "region,price,observed_at,source,currency",
    symbol: `eq.${SYM_CARBONATE}`,
    currency: "eq.USD",
    source: "not.like.seed%",
    order: "observed_at.desc",
    limit: "500",
  });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/price_indicators?${params}`, {
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`fetch latest prices ${res.status}: ${t.slice(0, 200)}`);
  }
  const rows = (await res.json()) as Array<
    { region: string | null; price: number; observed_at: string }
  >;
  const byRegion = new Map<string, LatestPrice>();
  for (const r of rows) {
    if (!r.region || typeof r.price !== "number" || r.price <= 0) continue;
    // rows are ordered observed_at desc, so first seen per region is the latest
    if (!byRegion.has(r.region)) {
      byRegion.set(r.region, {
        region: r.region,
        price: r.price,
        observed_at: r.observed_at,
      });
    }
  }
  return [...byRegion.values()];
}

interface ArbRow {
  product_type: string;
  buy_region: string;
  sell_region: string;
  buy_price: number;
  sell_price: number;
  profit_margin_percent: number;
  status: string;
  detected_at: string;
  confidence_score: number;
}

function computeArbitrage(latest: LatestPrice[], now: string): ArbRow[] {
  if (latest.length < 2) return [];
  // Cheapest region is the buy side.
  const sorted = [...latest].sort((a, b) => a.price - b.price);
  const buy = sorted[0];
  const rows: ArbRow[] = [];
  for (const sell of sorted.slice(1)) {
    if (sell.price <= buy.price) continue;
    const margin = Math.round(((sell.price - buy.price) / buy.price) * 100 * 100) / 100;
    rows.push({
      product_type: "Lithium Carbonate",
      buy_region: buy.region,
      sell_region: sell.region,
      buy_price: buy.price,
      sell_price: sell.price,
      profit_margin_percent: margin,
      status: "active",
      detected_at: now,
      confidence_score: 0.7,
    });
  }
  rows.sort((a, b) => b.profit_margin_percent - a.profit_margin_percent);
  return rows.slice(0, 5);
}

async function ingestArbitrage(
  now: string,
): Promise<{ upserted: number; errors: string[] }> {
  const errors: string[] = [];
  try {
    const latest = await fetchLatestCarbonateByRegion();
    if (latest.length < 2) {
      return { upserted: 0, errors: [`only ${latest.length} region(s) with price`] };
    }
    const rows = computeArbitrage(latest, now);
    if (!rows.length) return { upserted: 0, errors };
    // Unique index on (product_type,buy_region,sell_region) exists -> upsert.
    await sbUpsert(
      "arbitrage_opportunities",
      rows,
      "product_type,buy_region,sell_region",
    );
    return { upserted: rows.length, errors };
  } catch (e) {
    errors.push(String((e as Error).message));
    return { upserted: 0, errors };
  }
}

// ---- News ingestion ------------------------------------------------------

interface NewsRow {
  title: string;
  summary: string | null;
  source: string | null;
  url: string;
  category: string;
  published_at: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function parseRss(xml: string): NewsRow[] {
  const out: NewsRow[] = [];
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  for (const it of items) {
    const grab = (tag: string): string | null => {
      const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
      const m = it.match(re);
      if (!m) return null;
      let v = m[1].trim();
      v = v.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
      return decodeEntities(v);
    };
    const title = grab("title");
    const link = grab("link");
    if (!title || !link) continue;
    const pub = grab("pubDate");
    const src = grab("source");
    let publishedAt = new Date().toISOString();
    if (pub) {
      const d = new Date(pub);
      if (!isNaN(d.getTime())) publishedAt = d.toISOString();
    }
    // strip HTML tags from description for a cleaner summary
    let summary = grab("description");
    if (summary) summary = decodeEntities(summary.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    out.push({
      title,
      summary: summary || null,
      source: src ?? "Google News",
      url: link,
      category: "market",
      published_at: publishedAt,
    });
  }
  return out;
}

async function ingestNewsRss(): Promise<{ rows: NewsRow[]; error?: string }> {
  const url =
    "https://news.google.com/rss/search?q=lithium+carbonate+price&hl=en-US&gl=US&ceid=US:en";
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (market-intel-ingest)" } });
    if (!res.ok) return { rows: [], error: `rss ${res.status}` };
    const xml = await res.text();
    return { rows: parseRss(xml).slice(0, 15) };
  } catch (e) {
    return { rows: [], error: String((e as Error).message) };
  }
}

async function ingestNewsFirecrawl(): Promise<{ rows: NewsRow[]; error?: string }> {
  try {
    const res = await fetch(FC_SEARCH, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: "lithium carbonate price news",
        limit: 8,
        sources: ["news"],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { rows: [], error: `fc search ${res.status}: ${t.slice(0, 150)}` };
    }
    const body = await res.json();
    const news = body?.data?.news ?? body?.data?.web ?? [];
    const arr = Array.isArray(news) ? news : [];
    const rows: NewsRow[] = [];
    for (const n of arr) {
      const title = n.title ?? n.name;
      const link = n.url ?? n.link;
      if (!title || !link) continue;
      let publishedAt = new Date().toISOString();
      if (n.date || n.publishedDate) {
        const d = new Date(n.date ?? n.publishedDate);
        if (!isNaN(d.getTime())) publishedAt = d.toISOString();
      }
      rows.push({
        title,
        summary: n.description ?? n.snippet ?? null,
        source: n.source ?? hostOf(link),
        url: link,
        category: "market",
        published_at: publishedAt,
      });
    }
    return { rows };
  } catch (e) {
    return { rows: [], error: String((e as Error).message) };
  }
}

// ---- Handler -------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return json({ ok: false, error: "method not allowed" }, 405);
  }

  // Relaxed cron gate.
  const provided = req.headers.get("x-cron-secret");
  if (provided && provided.length > 0 && CRON_SECRET && provided !== CRON_SECRET) {
    return json({ ok: false, error: "forbidden" }, 403);
  }

  if (!FIRECRAWL_API_KEY) {
    return json({ ok: false, error: "missing FIRECRAWL_API_KEY" }, 500);
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ ok: false, error: "missing supabase env" }, 500);
  }

  const now = new Date().toISOString();
  const result = {
    ok: true,
    prices: { inserted: 0, errors: [] as string[] },
    arbitrage: { upserted: 0, errors: [] as string[] },
    news: { upserted: 0, errors: [] as string[] },
  };

  // Prices
  try {
    const { rows, errors } = await ingestPrices(now);
    result.prices.errors.push(...errors);
    if (rows.length) {
      await sbInsert("price_indicators", rows);
      result.prices.inserted = rows.length;
    }
  } catch (e) {
    result.prices.errors.push(String((e as Error).message));
  }

  // Arbitrage: derived from latest regional carbonate prices. Best-effort.
  try {
    const arb = await ingestArbitrage(now);
    result.arbitrage.upserted = arb.upserted;
    result.arbitrage.errors.push(...arb.errors);
  } catch (e) {
    result.arbitrage.errors.push(String((e as Error).message));
  }

  // News: RSS primary + Firecrawl search backup, dedupe by url.
  try {
    const rss = await ingestNewsRss();
    if (rss.error) result.news.errors.push(`rss: ${rss.error}`);
    const fc = await ingestNewsFirecrawl();
    if (fc.error) result.news.errors.push(`fc: ${fc.error}`);

    const seen = new Set<string>();
    const merged: NewsRow[] = [];
    for (const r of [...rss.rows, ...fc.rows]) {
      if (!r.title || !r.url || seen.has(r.url)) continue;
      seen.add(r.url);
      merged.push(r);
    }
    if (merged.length) {
      await sbUpsert("market_news", merged, "url");
      result.news.upserted = merged.length;
    }
  } catch (e) {
    result.news.errors.push(String((e as Error).message));
  }

  return json(result);
});
