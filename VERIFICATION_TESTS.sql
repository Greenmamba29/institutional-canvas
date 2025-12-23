-- =========================================
-- Lithium Buy Schema Verification Tests
-- Run this in Supabase SQL Editor to verify your implementation
-- =========================================

-- TEST 1: Verify all tables exist
SELECT 
  'Tables Check' as test_name,
  COUNT(*) as found_count,
  8 as expected_count,
  CASE WHEN COUNT(*) = 8 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('rfqs', 'deals', 'bids', 'auctions', 'auction_bids', 'notifications', 'price_indicators', 'purchases');

-- TEST 2: Verify all enums exist
SELECT 
  'Enums Check' as test_name,
  COUNT(*) as found_count,
  5 as expected_count,
  CASE WHEN COUNT(*) = 5 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_type 
WHERE typname IN ('rfq_status', 'deal_status', 'offer_decision', 'auction_status', 'notification_type');

-- TEST 3: Verify RLS is enabled on all tables
SELECT 
  'RLS Enabled Check' as test_name,
  COUNT(*) as enabled_count,
  8 as expected_count,
  CASE WHEN COUNT(*) = 8 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('rfqs', 'deals', 'bids', 'auctions', 'auction_bids', 'notifications', 'price_indicators', 'purchases')
AND rowsecurity = true;

-- TEST 4: Verify RLS policies exist
SELECT 
  'RLS Policies Check' as test_name,
  COUNT(*) as policy_count,
  '>=10' as expected_minimum,
  CASE WHEN COUNT(*) >= 10 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('rfqs', 'deals', 'bids', 'auctions', 'auction_bids', 'notifications', 'price_indicators', 'purchases');

-- TEST 5: Verify indexes exist
SELECT 
  'Indexes Check' as test_name,
  COUNT(*) as index_count,
  '>=15' as expected_minimum,
  CASE WHEN COUNT(*) >= 15 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('rfqs', 'deals', 'bids', 'auctions', 'auction_bids', 'notifications', 'price_indicators', 'purchases');

-- TEST 6: Verify JWT helper functions exist
SELECT 
  'JWT Functions Check' as test_name,
  COUNT(*) as function_count,
  3 as expected_count,
  CASE WHEN COUNT(*) = 3 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('jwt_claim', 'jwt_org_id', 'jwt_user_id');

-- TEST 7: Verify RPC functions exist
SELECT 
  'RPC Functions Check' as test_name,
  COUNT(*) as function_count,
  '>=15' as expected_minimum,
  CASE WHEN COUNT(*) >= 15 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
  'create_rfq', 'list_rfqs', 'submit_bid', 'withdraw_bid',
  'create_deal', 'update_deal_status', 'respond_to_offer',
  'list_auctions', 'place_auction_bid',
  'get_notifications', 'mark_notification_read',
  'get_price_indicators', 'list_listings', 'get_listing',
  'create_purchase', 'update_purchase_status', 'list_purchases', 'get_purchase_by_id'
);

-- TEST 8: Verify triggers exist
SELECT 
  'Triggers Check' as test_name,
  COUNT(*) as trigger_count,
  4 as expected_count,
  CASE WHEN COUNT(*) = 4 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
AND c.relname IN ('rfqs', 'deals', 'bids', 'auctions')
AND t.tgname LIKE 'trg_%_updated_at';

-- =========================================
-- DETAILED TABLE INSPECTION
-- =========================================

-- Show all columns for each table
SELECT 
  'Table Structure: ' || table_name as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('rfqs', 'deals', 'bids', 'auctions', 'auction_bids', 'notifications', 'price_indicators', 'purchases')
ORDER BY table_name, ordinal_position;

-- Show all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('rfqs', 'deals', 'bids', 'auctions', 'auction_bids', 'notifications', 'price_indicators', 'purchases')
ORDER BY tablename, policyname;

-- Show all indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('rfqs', 'deals', 'bids', 'auctions', 'auction_bids', 'notifications', 'price_indicators', 'purchases')
ORDER BY tablename, indexname;

-- Show all RPC functions with their parameters
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as parameters,
  pg_get_function_result(p.oid) as return_type,
  CASE WHEN p.prosecdef THEN 'SECURITY DEFINER' ELSE 'SECURITY INVOKER' END as security
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
  'create_rfq', 'list_rfqs', 'submit_bid', 'withdraw_bid',
  'create_deal', 'update_deal_status', 'respond_to_offer',
  'list_auctions', 'place_auction_bid',
  'get_notifications', 'mark_notification_read',
  'get_price_indicators', 'list_listings', 'get_listing',
  'create_purchase', 'update_purchase_status', 'list_purchases', 'get_purchase_by_id'
)
ORDER BY function_name;

-- =========================================
-- SECURITY AUDIT
-- =========================================

-- Check for tables without RLS
SELECT 
  'Security Issue: Tables without RLS' as issue,
  tablename
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('rfqs', 'deals', 'bids', 'auctions', 'auction_bids', 'notifications', 'price_indicators', 'purchases')
AND rowsecurity = false;

-- Check for missing indexes on foreign keys
SELECT 
  'Performance Issue: Missing index on FK' as issue,
  tc.table_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN pg_indexes idx 
  ON idx.tablename = tc.table_name 
  AND idx.indexdef LIKE '%' || kcu.column_name || '%'
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('rfqs', 'deals', 'bids', 'auctions', 'auction_bids', 'notifications', 'price_indicators', 'purchases')
AND idx.indexname IS NULL;

-- =========================================
-- FUNCTIONAL TESTS (requires test data)
-- =========================================

-- NOTE: These tests will fail if you don't have test data
-- Run these manually with real org_id values

-- Test JWT helper functions (should return null without JWT)
SELECT 
  'JWT Helper Test' as test,
  public.jwt_org_id() as org_id_result,
  public.jwt_user_id() as user_id_result,
  CASE 
    WHEN public.jwt_org_id() IS NULL AND public.jwt_user_id() IS NULL 
    THEN '✅ PASS (no JWT context)' 
    ELSE '⚠️ CHECK' 
  END as status;

-- =========================================
-- SUMMARY
-- =========================================

SELECT 
  'VERIFICATION SUMMARY' as section,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('rfqs', 'deals', 'bids', 'auctions', 'auction_bids', 'notifications', 'price_indicators', 'purchases')) as tables_found,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('rfqs', 'deals', 'bids', 'auctions', 'auction_bids', 'notifications', 'price_indicators', 'purchases')) as policies_found,
  (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname IN ('create_rfq', 'list_rfqs', 'submit_bid', 'withdraw_bid', 'create_deal', 'update_deal_status', 'respond_to_offer', 'list_auctions', 'place_auction_bid', 'get_notifications', 'mark_notification_read', 'get_price_indicators', 'list_listings', 'get_listing', 'create_purchase', 'update_purchase_status', 'list_purchases', 'get_purchase_by_id')) as rpc_functions_found;
