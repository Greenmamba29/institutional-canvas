-- Fix create_rfq function to use organization_id instead of org_id
CREATE OR REPLACE FUNCTION public.create_rfq(p_title text, p_description text, p_product_id uuid, p_target_quantity numeric, p_target_unit text, p_incoterms text, p_delivery_location text)
 RETURNS rfqs
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_org uuid := public.jwt_org_id();
  v_user uuid := public.jwt_user_id();
  v_row public.rfqs;
begin
  if v_org is null then raise exception 'Missing org_id in JWT'; end if;
  insert into public.rfqs(organization_id, created_by, title, description, product_id, target_quantity, target_unit, incoterms, delivery_location, status)
  values (v_org, v_user, p_title, p_description, p_product_id, p_target_quantity, p_target_unit, p_incoterms, p_delivery_location, 'submitted')
  returning * into v_row;
  insert into public.notifications(org_id, user_id, type, title, body, entity_type, entity_id)
  values (v_org, v_user, 'rfq_submitted', 'RFQ submitted', p_title, 'rfq', v_row.id);
  return v_row;
end;
$function$;

-- Fix list_rfqs function to use organization_id instead of org_id
CREATE OR REPLACE FUNCTION public.list_rfqs()
 RETURNS SETOF rfqs
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select * from public.rfqs where organization_id = public.jwt_org_id() order by created_at desc;
$function$;