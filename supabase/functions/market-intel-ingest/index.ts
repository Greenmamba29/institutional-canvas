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
type PriceSourceKind =
  | "tradingeconomics"
  | "businessanalytiq-carbonate"
  | "businessanalytiq-hydroxide";

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
      "https://businessanalytiq.com/procurementanalytics/index/lithium-hydroxide-price-index/",
    kind: "businessanalytiq-hydroxide",
  },
];

async function ingestPriceSource(src: PriceSource, now: string): Promise<PriceRow[]> {
  const { url, kind } = src;
  const host = hostOf(url);
  const md = await fcScrape(url);
  if (!md) throw new Error(`no markdown from ${host}`);

  const rows: PriceRow[] = [];
  const seen = new Set<string>();

  const push = (symbol: string, region: string, p: ParsedPrice) => {
    const key = `${symbol}|${region}|${p.currency}|${p.price}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({
      symbol,
      region,
      price: p.price,
      currency: p.currency,
      unit: p.unit,
      observed_at: now,
      source: `firecrawl:${host}`,
      metadata: { url, snippet: p.snippet },
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
  const settled = await Promise.allSettled(
    PRICE_SOURCES.map((s) => ingestPriceSource(s, now)),
  );
  for (const s of settled) {
    if (s.status === "fulfilled") rows.push(...s.value);
    else errors.push(String(s.reason?.message ?? s.reason));
  }
  return { rows, errors };
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
