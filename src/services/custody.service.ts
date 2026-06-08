/**
 * Chain of Custody Service
 *
 * Tracks material provenance from origin (mine/recycler) to final delivery.
 * Essential for B2B lithium trading compliance and transparency.
 *
 * Backed by the org-scoped Supabase RPCs:
 *   - get_chain_of_custody(p_order_id)  -> ordered custody_events for an order
 *   - create_custody_event(...)         -> appends a custody event, returns the row
 *
 * All operations require an authenticated Supabase client (RLS / org context),
 * following the same pattern as rfqs.service.ts / purchases.service.ts.
 * After a successful write we best-effort mirror the row to Airtable.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { callAuthenticatedRpc } from '@/lib/supabase/authenticated-client';
import { syncRecordToAirtable } from '@/services/airtable-sync';
import type { Database } from '@/integrations/supabase/types';

export type CustodyEventType =
  | 'origin'
  | 'extraction'
  | 'processing'
  | 'transport'
  | 'storage'
  | 'inspection'
  | 'delivery';

export interface CustodyEvent {
  id: string;
  orderId: string;
  dealId?: string;
  eventType: CustodyEventType;
  title: string;
  description: string;
  location: string;
  timestamp: string;
  verifiedBy?: string;
  verifiedAt?: string;
  documents: CustodyDocument[];
  coordinates?: { lat: number; lng: number };
  metadata?: Record<string, unknown>;
}

export interface CustodyDocument {
  id: string;
  name: string;
  type: 'certificate' | 'bill_of_lading' | 'inspection_report' | 'customs' | 'other';
  url: string;
  uploadedAt: string;
}

export interface CustodyChain {
  id: string;
  orderId: string;
  dealId?: string;
  productType: string;
  quantity: number;
  unit: string;
  originCountry: string;
  currentStatus: CustodyEventType;
  events: CustodyEvent[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Shape of a `custody_events` row as returned by the RPCs.
 * The generated Database types do not yet include this table, so we model the
 * row locally (columns verified live: id, org_id, order_id, deal_id, event_type,
 * title, description, location, occurred_at, verified_by, verified_at, documents,
 * coordinates, metadata, created_by, created_at, updated_at).
 */
interface CustodyEventRow {
  id: string;
  org_id: string;
  order_id: string;
  deal_id: string | null;
  event_type: CustodyEventType;
  title: string;
  description: string | null;
  location: string | null;
  occurred_at: string;
  verified_by: string | null;
  verified_at: string | null;
  documents: unknown;
  coordinates: unknown;
  metadata: unknown;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Input for appending a custody event. Mirrors create_custody_event params.
 */
export interface CreateCustodyEventParams {
  orderId: string;
  eventType: CustodyEventType;
  title: string;
  description?: string;
  location?: string;
  dealId?: string;
  occurredAt?: string;
  verifiedBy?: string;
  documents?: CustodyDocument[];
  coordinates?: { lat: number; lng: number };
  metadata?: Record<string, unknown>;
}

/** Logical order of events for deriving the current status of a chain. */
const eventOrder: CustodyEventType[] = [
  'origin',
  'extraction',
  'processing',
  'inspection',
  'transport',
  'storage',
  'delivery',
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseCoordinates(value: unknown): { lat: number; lng: number } | undefined {
  const obj = asRecord(value);
  const lat = obj.lat;
  const lng = obj.lng;
  if (typeof lat === 'number' && typeof lng === 'number') {
    return { lat, lng };
  }
  return undefined;
}

function parseDocuments(value: unknown): CustodyDocument[] {
  if (!Array.isArray(value)) return [];
  return value.filter((d): d is CustodyDocument => !!d && typeof d === 'object');
}

/** Map a raw custody_events row to the CustodyEvent TS type. */
function mapRowToEvent(row: CustodyEventRow): CustodyEvent {
  return {
    id: row.id,
    orderId: row.order_id,
    dealId: row.deal_id ?? undefined,
    eventType: row.event_type,
    title: row.title,
    description: row.description ?? '',
    location: row.location ?? '',
    timestamp: row.occurred_at,
    verifiedBy: row.verified_by ?? undefined,
    verifiedAt: row.verified_at ?? undefined,
    documents: parseDocuments(row.documents),
    coordinates: parseCoordinates(row.coordinates),
    metadata: asRecord(row.metadata),
  };
}

/**
 * Build a CustodyChain aggregate from a set of custody events for an order.
 * custody_events has no chain-level columns (productType/quantity/unit/origin),
 * so those are best-effort sourced from the originating event's metadata.
 */
function buildChainFromEvents(orderId: string, events: CustodyEvent[]): CustodyChain {
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const originMeta = asRecord(sorted.find((e) => e.eventType === 'origin')?.metadata);
  const latest = sorted[sorted.length - 1];

  // Current status = the furthest-along event type present in the chain.
  let currentStatus: CustodyEventType = latest?.eventType ?? 'origin';
  let maxIdx = -1;
  for (const e of sorted) {
    const idx = eventOrder.indexOf(e.eventType);
    if (idx > maxIdx) {
      maxIdx = idx;
      currentStatus = e.eventType;
    }
  }

  const dealId = sorted.find((e) => e.dealId)?.dealId;

  return {
    id: orderId,
    orderId,
    dealId,
    productType: typeof originMeta.productType === 'string' ? originMeta.productType : '',
    quantity: typeof originMeta.quantity === 'number' ? originMeta.quantity : 0,
    unit: typeof originMeta.unit === 'string' ? originMeta.unit : '',
    originCountry:
      typeof originMeta.originCountry === 'string' ? originMeta.originCountry : '',
    currentStatus,
    events: sorted,
    createdAt: sorted[0]?.timestamp ?? new Date().toISOString(),
    updatedAt: latest?.timestamp ?? new Date().toISOString(),
  };
}

/**
 * Get the ordered chain-of-custody events for an order (authenticated).
 */
export async function getCustodyEventsByOrder(
  client: SupabaseClient<Database>,
  orderId: string
): Promise<{ data: CustodyEvent[] | null; error: Error | null }> {
  const { data, error } = await callAuthenticatedRpc<CustodyEventRow[]>(
    client,
    'get_chain_of_custody' as keyof Database['public']['Functions'],
    { p_order_id: orderId }
  );

  if (error) return { data: null, error };
  return { data: (data ?? []).map(mapRowToEvent), error: null };
}

/**
 * Get a custody chain (aggregate) by order ID (authenticated).
 */
export async function getCustodyChainByOrderId(
  client: SupabaseClient<Database>,
  orderId: string
): Promise<{ data: CustodyChain | null; error: Error | null }> {
  const { data, error } = await getCustodyEventsByOrder(client, orderId);
  if (error) return { data: null, error };
  if (!data || data.length === 0) return { data: null, error: null };
  return { data: buildChainFromEvents(orderId, data), error: null };
}

/**
 * Get a custody chain by its id. Chains are keyed by order id (see
 * buildChainFromEvents), so this resolves through the order chain RPC.
 */
export async function getCustodyChainById(
  client: SupabaseClient<Database>,
  chainId: string
): Promise<{ data: CustodyChain | null; error: Error | null }> {
  return getCustodyChainByOrderId(client, chainId);
}

/**
 * Add a new custody event to an order's chain (authenticated).
 * On success, best-effort mirrors the row to Airtable (table 'custody_events').
 */
export async function addCustodyEvent(
  client: SupabaseClient<Database>,
  params: CreateCustodyEventParams
): Promise<{ data: CustodyEvent | null; error: Error | null }> {
  const { data, error } = await callAuthenticatedRpc<CustodyEventRow>(
    client,
    'create_custody_event' as keyof Database['public']['Functions'],
    {
      p_order_id: params.orderId,
      p_event_type: params.eventType,
      p_title: params.title,
      p_description: params.description ?? null,
      p_location: params.location ?? null,
      p_deal_id: params.dealId ?? null,
      p_occurred_at: params.occurredAt ?? null,
      p_verified_by: params.verifiedBy ?? null,
      p_documents: params.documents ?? [],
      p_coordinates: params.coordinates ?? null,
      p_metadata: params.metadata ?? null,
    }
  );

  if (error) return { data: null, error };
  if (!data) return { data: null, error: null };

  // Mirror to Airtable (best-effort; never blocks/breaks the primary mutation).
  await syncRecordToAirtable(
    'custody_events',
    data as unknown as Record<string, unknown>,
    'create'
  );

  return { data: mapRowToEvent(data), error: null };
}

// Event type labels and colors for UI
export const custodyEventConfig: Record<
  CustodyEventType,
  { label: string; color: string; bgColor: string }
> = {
  origin: { label: 'Origin', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  extraction: { label: 'Extraction', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  processing: { label: 'Processing', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  transport: { label: 'In Transit', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  storage: { label: 'Storage', color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
  inspection: { label: 'Inspection', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  delivery: { label: 'Delivered', color: 'text-green-500', bgColor: 'bg-green-500/10' },
};
