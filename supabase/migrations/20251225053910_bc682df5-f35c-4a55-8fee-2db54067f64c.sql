-- =============================================================
-- CREATE org-based RLS policies for all tables
-- =============================================================

-- PRODUCTS: Public read, org-based write
CREATE POLICY "products_select_all" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_insert_org" ON public.products FOR INSERT WITH CHECK (public.is_org_member(org_id));
CREATE POLICY "products_update_org" ON public.products FOR UPDATE USING (public.is_org_member(org_id));
CREATE POLICY "products_delete_org" ON public.products FOR DELETE USING (public.is_org_member(org_id));

-- ORDERS: Org-based with user fallback
CREATE POLICY "orders_select_org" ON public.orders FOR SELECT USING (public.is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "orders_insert_org" ON public.orders FOR INSERT WITH CHECK (public.is_org_member(org_id));
CREATE POLICY "orders_update_org" ON public.orders FOR UPDATE USING (public.is_org_member(org_id));

-- QUOTES: Org-based with user fallback
CREATE POLICY "quotes_select_org" ON public.quotes FOR SELECT USING (public.is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "quotes_insert_org" ON public.quotes FOR INSERT WITH CHECK (public.is_org_member(org_id));
CREATE POLICY "quotes_update_org" ON public.quotes FOR UPDATE USING (public.is_org_member(org_id) OR user_id = auth.uid());

-- CHATS: Org-based with user fallback
CREATE POLICY "chats_select_org" ON public.chats FOR SELECT USING (public.is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "chats_insert_org" ON public.chats FOR INSERT WITH CHECK (public.is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "chats_update_org" ON public.chats FOR UPDATE USING (public.is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "chats_delete_org" ON public.chats FOR DELETE USING (public.is_org_member(org_id) OR user_id = auth.uid());

-- FILES: Org-based with user fallback (personal files)
CREATE POLICY "files_select_org" ON public.files FOR SELECT USING (public.is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "files_insert_org" ON public.files FOR INSERT WITH CHECK (public.is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "files_update_org" ON public.files FOR UPDATE USING (public.is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "files_delete_org" ON public.files FOR DELETE USING (public.is_org_member(org_id) OR user_id = auth.uid());

-- FOLDERS: Org-based with user fallback
CREATE POLICY "folders_select_org" ON public.folders FOR SELECT USING (public.is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "folders_insert_org" ON public.folders FOR INSERT WITH CHECK (public.is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "folders_update_org" ON public.folders FOR UPDATE USING (public.is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "folders_delete_org" ON public.folders FOR DELETE USING (public.is_org_member(org_id) OR user_id = auth.uid());

-- TELEBUY_SESSIONS: Org-based
CREATE POLICY "telebuy_select_org" ON public.telebuy_sessions FOR SELECT USING (public.is_org_member(org_id) OR user_id = public.jwt_user_id());
CREATE POLICY "telebuy_insert_org" ON public.telebuy_sessions FOR INSERT WITH CHECK (public.is_org_member(org_id));
CREATE POLICY "telebuy_update_org" ON public.telebuy_sessions FOR UPDATE USING (public.is_org_member(org_id) OR user_id = public.jwt_user_id());
CREATE POLICY "telebuy_delete_org" ON public.telebuy_sessions FOR DELETE USING (public.is_org_member(org_id) OR user_id = public.jwt_user_id());

-- CONVERSATIONS: Org-based with user fallback
CREATE POLICY "conversations_select_org" ON public.conversations FOR SELECT USING (public.is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "conversations_insert_org" ON public.conversations FOR INSERT WITH CHECK (public.is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "conversations_update_org" ON public.conversations FOR UPDATE USING (public.is_org_member(org_id) OR user_id = auth.uid());
CREATE POLICY "conversations_delete_org" ON public.conversations FOR DELETE USING (public.is_org_member(org_id) OR user_id = auth.uid());

-- MESSAGES: Org-based with chat relationship fallback
CREATE POLICY "messages_select_org" ON public.messages FOR SELECT USING (
  public.is_org_member(org_id) OR
  EXISTS (SELECT 1 FROM public.chats c WHERE c.id = messages.chat_id AND c.user_id = auth.uid())
);
CREATE POLICY "messages_insert_org" ON public.messages FOR INSERT WITH CHECK (
  public.is_org_member(org_id) OR
  EXISTS (SELECT 1 FROM public.chats c WHERE c.id = messages.chat_id AND c.user_id = auth.uid())
);
CREATE POLICY "messages_update_org" ON public.messages FOR UPDATE USING (
  public.is_org_member(org_id) OR
  EXISTS (SELECT 1 FROM public.chats c WHERE c.id = messages.chat_id AND c.user_id = auth.uid())
);
CREATE POLICY "messages_delete_org" ON public.messages FOR DELETE USING (
  public.is_org_member(org_id) OR
  EXISTS (SELECT 1 FROM public.chats c WHERE c.id = messages.chat_id AND c.user_id = auth.uid())
);