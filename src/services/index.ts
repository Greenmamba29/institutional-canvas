/**
 * Services Index - Lithium & Lux RPC-Only Architecture
 */

// Core RPC wrapper
export { callRpc, supabase } from '@/lib/supabase/rpc';

// Lithium & Lux Domain Services
export * from './rfqs.service';
export * from './bids.service';
export * from './deals.service';
export * from './auctions.service';
export * from './notifications.service';
export * from './market.service';
export { listListings, getListing } from './listings.service';
export * from './suppliers.service';
export * from './orders.service';
