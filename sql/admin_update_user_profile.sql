-- Скопируйте и выполните этот скрипт целиком в SQL Editor Supabase
-- Создаёт RPC-функцию для обновления профиля пользователя администратором

-- 1. Создаём функцию для обновления профиля пользователя
-- Администратор может менять: full_name, role, is_active
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(
  p_user_id uuid,
  p_full_name text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Проверяем, что вызывающий — администратор
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Только администратор может редактировать пользователей';
  END IF;

  -- Обновляем профиль
  UPDATE user_profiles
  SET
    full_name = COALESCE(p_full_name, full_name),
    role = COALESCE(p_role, role),
    is_active = COALESCE(p_is_active, is_active)
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;

-- 2. Создаём функцию для обновления ИМЕНИ пользователя (самый частый случай)
CREATE OR REPLACE FUNCTION public.admin_set_user_name(
  p_user_id uuid,
  p_full_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Только администратор может редактировать пользователей';
  END IF;

  UPDATE user_profiles
  SET full_name = p_full_name
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$;