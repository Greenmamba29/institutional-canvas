-- =============================================================
-- CLEANUP: Drop all old policies from each table
-- =============================================================

-- PRODUCTS
DROP POLICY IF EXISTS "products_select_all" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Products are insertable by authenticated users" ON public.products;
DROP POLICY IF EXISTS "Products are updatable by owners or admins" ON public.products;

-- ORDERS
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_select_supplier_org" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;

-- QUOTES
DROP POLICY IF EXISTS "Authenticated users can create quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;

-- CHATS
DROP POLICY IF EXISTS "Users can view own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can delete own chats" ON public.chats;

-- FILES
DROP POLICY IF EXISTS "files_own_data" ON public.files;
DROP POLICY IF EXISTS "files_admin_read" ON public.files;
DROP POLICY IF EXISTS "Users can view own files" ON public.files;
DROP POLICY IF EXISTS "Users can insert own files" ON public.files;
DROP POLICY IF EXISTS "Users can update own files" ON public.files;
DROP POLICY IF EXISTS "Users can delete own files" ON public.files;

-- FOLDERS
DROP POLICY IF EXISTS "folders_own_data" ON public.folders;

-- TELEBUY_SESSIONS
DROP POLICY IF EXISTS "telebuy_sessions_participant_select" ON public.telebuy_sessions;
DROP POLICY IF EXISTS "telebuy_sessions_participant_update" ON public.telebuy_sessions;
DROP POLICY IF EXISTS "telebuy_sessions_creator_insert" ON public.telebuy_sessions;
DROP POLICY IF EXISTS "telebuy_sessions_creator_delete" ON public.telebuy_sessions;
DROP POLICY IF EXISTS "Authenticated users can create TELEBUY sessions" ON public.telebuy_sessions;

-- CONVERSATIONS
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can select their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;

-- MESSAGES
DROP POLICY IF EXISTS "Users can view messages from their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their chats" ON public.messages;