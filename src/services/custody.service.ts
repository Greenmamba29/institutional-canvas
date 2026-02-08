/**
 * Chain of Custody Service
 * 
 * Tracks material provenance from origin (mine/recycler) to final delivery.
 * Essential for B2B lithium trading compliance and transparency.
 */

import { supabase } from '@/lib/supabase/rpc';

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

// Mock data for MVP - will be replaced with actual DB queries
const mockCustodyChains: CustodyChain[] = [
  {
    id: 'coc-1',
    orderId: 'order-123',
    dealId: 'deal-456',
    productType: 'Lithium Carbonate',
    quantity: 50,
    unit: 'MT',
    originCountry: 'Chile',
    currentStatus: 'transport',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-01T14:30:00Z',
    events: [
      {
        id: 'evt-1',
        orderId: 'order-123',
        eventType: 'origin',
        title: 'Material Sourced',
        description: 'Lithium carbonate extracted from Atacama salt flat brine pools',
        location: 'Atacama, Chile',
        timestamp: '2024-01-15T10:00:00Z',
        verifiedBy: 'SQM Certification Authority',
        verifiedAt: '2024-01-15T12:00:00Z',
        documents: [
          { id: 'doc-1', name: 'Origin Certificate', type: 'certificate', url: '#', uploadedAt: '2024-01-15T12:00:00Z' }
        ],
        coordinates: { lat: -23.8634, lng: -68.0733 },
      },
      {
        id: 'evt-2',
        orderId: 'order-123',
        eventType: 'processing',
        title: 'Purification Complete',
        description: 'Material processed to 99.5% battery-grade purity',
        location: 'Antofagasta Processing Plant, Chile',
        timestamp: '2024-01-20T16:00:00Z',
        verifiedBy: 'SGS Chile',
        verifiedAt: '2024-01-21T09:00:00Z',
        documents: [
          { id: 'doc-2', name: 'Purity Analysis Report', type: 'inspection_report', url: '#', uploadedAt: '2024-01-21T09:00:00Z' },
          { id: 'doc-3', name: 'Processing Certificate', type: 'certificate', url: '#', uploadedAt: '2024-01-21T09:30:00Z' }
        ],
        coordinates: { lat: -23.6509, lng: -70.3975 },
      },
      {
        id: 'evt-3',
        orderId: 'order-123',
        eventType: 'inspection',
        title: 'Quality Inspection Passed',
        description: 'Third-party quality inspection completed successfully',
        location: 'Port of Antofagasta, Chile',
        timestamp: '2024-01-25T11:00:00Z',
        verifiedBy: 'Bureau Veritas',
        verifiedAt: '2024-01-25T14:00:00Z',
        documents: [
          { id: 'doc-4', name: 'Inspection Certificate', type: 'inspection_report', url: '#', uploadedAt: '2024-01-25T14:00:00Z' }
        ],
        coordinates: { lat: -23.6345, lng: -70.4012 },
      },
      {
        id: 'evt-4',
        orderId: 'order-123',
        eventType: 'transport',
        title: 'In Transit to Destination',
        description: 'Shipped via container vessel to Shanghai Port',
        location: 'Pacific Ocean (In Transit)',
        timestamp: '2024-01-28T08:00:00Z',
        documents: [
          { id: 'doc-5', name: 'Bill of Lading', type: 'bill_of_lading', url: '#', uploadedAt: '2024-01-28T08:00:00Z' },
          { id: 'doc-6', name: 'Export Customs Declaration', type: 'customs', url: '#', uploadedAt: '2024-01-27T16:00:00Z' }
        ],
        coordinates: { lat: -10.0000, lng: -120.0000 },
      },
    ],
  },
  {
    id: 'coc-2',
    orderId: 'order-789',
    productType: 'Black Mass',
    quantity: 25,
    unit: 'MT',
    originCountry: 'Germany',
    currentStatus: 'delivery',
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-10T16:00:00Z',
    events: [
      {
        id: 'evt-5',
        orderId: 'order-789',
        eventType: 'origin',
        title: 'Battery Collection',
        description: 'End-of-life EV batteries collected from German recycling network',
        location: 'Munich, Germany',
        timestamp: '2024-02-01T09:00:00Z',
        verifiedBy: 'TÜV Rheinland',
        verifiedAt: '2024-02-01T11:00:00Z',
        documents: [
          { id: 'doc-7', name: 'Collection Certificate', type: 'certificate', url: '#', uploadedAt: '2024-02-01T11:00:00Z' }
        ],
        coordinates: { lat: 48.1351, lng: 11.5820 },
      },
      {
        id: 'evt-6',
        orderId: 'order-789',
        eventType: 'processing',
        title: 'Battery Shredding Complete',
        description: 'Batteries processed into black mass concentrate',
        location: 'Duesenfeld Recycling, Germany',
        timestamp: '2024-02-05T14:00:00Z',
        verifiedBy: 'TÜV Rheinland',
        verifiedAt: '2024-02-05T17:00:00Z',
        documents: [
          { id: 'doc-8', name: 'Processing Report', type: 'inspection_report', url: '#', uploadedAt: '2024-02-05T17:00:00Z' }
        ],
        coordinates: { lat: 52.2689, lng: 10.5268 },
      },
      {
        id: 'evt-7',
        orderId: 'order-789',
        eventType: 'delivery',
        title: 'Delivered to Buyer',
        description: 'Material received and confirmed at destination facility',
        location: 'Rotterdam, Netherlands',
        timestamp: '2024-02-10T16:00:00Z',
        verifiedBy: 'Buyer QC Team',
        verifiedAt: '2024-02-10T18:00:00Z',
        documents: [
          { id: 'doc-9', name: 'Delivery Receipt', type: 'other', url: '#', uploadedAt: '2024-02-10T18:00:00Z' },
          { id: 'doc-10', name: 'Final Inspection', type: 'inspection_report', url: '#', uploadedAt: '2024-02-10T18:30:00Z' }
        ],
        coordinates: { lat: 51.9244, lng: 4.4777 },
      },
    ],
  },
];

/**
 * Get all custody chains for the current organization
 */
export async function getCustodyChains(): Promise<{ data: CustodyChain[] | null; error: Error | null }> {
  // TODO: Replace with actual Supabase query when table is available
  // const { data, error } = await supabase
  //   .from('custody_chains')
  //   .select('*, custody_events(*)')
  //   .order('created_at', { ascending: false });
  
  // For MVP, return mock data
  return { data: mockCustodyChains, error: null };
}

/**
 * Get a specific custody chain by ID
 */
export async function getCustodyChainById(chainId: string): Promise<{ data: CustodyChain | null; error: Error | null }> {
  const chain = mockCustodyChains.find(c => c.id === chainId);
  return { data: chain || null, error: chain ? null : new Error('Chain not found') };
}

/**
 * Get custody chain by order ID
 */
export async function getCustodyChainByOrderId(orderId: string): Promise<{ data: CustodyChain | null; error: Error | null }> {
  const chain = mockCustodyChains.find(c => c.orderId === orderId);
  return { data: chain || null, error: null };
}

/**
 * Get custody chain by deal ID
 */
export async function getCustodyChainByDealId(dealId: string): Promise<{ data: CustodyChain | null; error: Error | null }> {
  const chain = mockCustodyChains.find(c => c.dealId === dealId);
  return { data: chain || null, error: null };
}

/**
 * Add a new custody event to a chain
 * @note Uses RPC for mutation when implemented
 */
export async function addCustodyEvent(
  chainId: string,
  event: Omit<CustodyEvent, 'id'>
): Promise<{ data: CustodyEvent | null; error: Error | null }> {
  // TODO: Implement via RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // const { data, error } = await (supabase.rpc as any)('add_custody_event', {
  //   p_chain_id: chainId,
  //   p_event_type: event.eventType,
  //   p_title: event.title,
  //   p_description: event.description,
  //   p_location: event.location,
  // });
  
  const newEvent: CustodyEvent = {
    ...event,
    id: `evt-${Date.now()}`,
  };
  
  return { data: newEvent, error: null };
}

/**
 * Verify a custody event (marks it as verified by current user)
 */
export async function verifyCustodyEvent(
  eventId: string
): Promise<{ data: CustodyEvent | null; error: Error | null }> {
  // TODO: Implement via RPC
  return { data: null, error: new Error('Not implemented') };
}

// Event type labels and colors for UI
export const custodyEventConfig: Record<CustodyEventType, { label: string; color: string; bgColor: string }> = {
  origin: { label: 'Origin', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  extraction: { label: 'Extraction', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  processing: { label: 'Processing', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  transport: { label: 'In Transit', color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  storage: { label: 'Storage', color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
  inspection: { label: 'Inspection', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  delivery: { label: 'Delivered', color: 'text-green-500', bgColor: 'bg-green-500/10' },
};
