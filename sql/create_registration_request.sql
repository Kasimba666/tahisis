-- Скопируйте этот код целиком и вставьте в SQL Editor в Supabase Dashboard, затем нажмите Run

CREATE OR REPLACE FUNCTION public.create_registration_request(
  p_user_id uuid,
  p_email text,
  p_full_name text,
  p_organization text DEFAULT NULL,
  p_requested_role text DEFAULT 'researcher',
  p_comment text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_request_id bigint;
BEGIN
  INSERT INTO user_profiles (id, email, full_name, role, is_active)
  VALUES (p_user_id, p_email, p_full_name, 'pending', false)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = 'pending',
        is_active = false
  RETURNING id INTO v_profile_id;

  INSERT INTO registration_request (
    user_id, full_name, organization, requested_role, comment, status
  ) VALUES (
    p_user_id, p_full_name, p_organization, p_requested_role, p_comment, 'pending'
  )
  RETURNING id INTO v_request_id;

  RETURN jsonb_build_object(
    'profile_id', v_profile_id,
    'request_id', v_request_id,
    'success', true
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_registration_request(uuid, text, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_registration_request(uuid, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_registration_request(uuid, text, text, text, text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.approve_registration_request(
  p_request_id bigint,
  p_reviewer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
BEGIN
  SELECT * INTO v_request FROM registration_request WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Заявка не найдена');
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Заявка уже обработана');
  END IF;

  UPDATE registration_request
  SET status = 'approved', reviewed_by = p_reviewer_id, reviewed_at = now()
  WHERE id = p_request_id;

  UPDATE user_profiles
  SET role = v_request.requested_role, is_active = true, approved_at = now()
  WHERE id = v_request.user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_request.user_id,
    'role', v_request.requested_role
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_registration_request(bigint, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_registration_request(bigint, uuid) TO service_role;