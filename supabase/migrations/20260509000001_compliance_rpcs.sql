-- Atomically transfer battery custody and update battery status
CREATE OR REPLACE FUNCTION public.transfer_battery_custody(
  p_inventory_id uuid,
  p_new_owner uuid,
  p_transport_mode text,
  p_condition text,
  p_evidence_url text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_org_id uuid;
BEGIN
  SELECT org_id INTO v_org_id FROM public.battery_inventory WHERE id = p_inventory_id;

  INSERT INTO public.chain_of_custody (
    inventory_id, new_owner, transport_mode, condition, evidence_url, org_id
  ) VALUES (
    p_inventory_id, p_new_owner, p_transport_mode, p_condition, p_evidence_url, v_org_id
  ) RETURNING id INTO v_id;

  UPDATE public.battery_inventory
  SET status = 'in_transit', updated_at = now()
  WHERE id = p_inventory_id;

  RETURN v_id;
END;
$$;

-- Create a compliance audit log entry
CREATE OR REPLACE FUNCTION public.create_compliance_audit(
  p_entity_id uuid,
  p_entity_type text,
  p_action text,
  p_regulation_refs text[],
  p_compliance_result text,
  p_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_org_id uuid;
BEGIN
  SELECT org_id INTO v_org_id
  FROM public.org_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  INSERT INTO public.compliance_audit_logs (
    entity_id, entity_type, action, performed_by,
    regulation_refs, compliance_result, notes, org_id
  ) VALUES (
    p_entity_id, p_entity_type, p_action, auth.uid(),
    p_regulation_refs, p_compliance_result, p_notes, v_org_id
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
