-- Скопируйте и выполните этот скрипт целиком в SQL Editor Supabase
-- Создаёт функцию admin_get_users_with_email, которая возвращает всех пользователей с email'ами

-- 1. Удаляем старые политики и функцию, если есть
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON user_profiles;
DROP POLICY IF EXISTS "admin_select_all" ON user_profiles;
DROP POLICY IF EXISTS "admin_update_all" ON user_profiles;
DROP POLICY IF EXISTS "admin_delete_all" ON user_profiles;
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.admin_get_users_with_email();

-- 2. Создаём функцию проверки администратора (обходит RLS через SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- 3. Политика SELECT: администратор видит всех, обычный пользователь — только себя
CREATE POLICY "admin_select_all" ON user_profiles
  FOR SELECT
  USING (
    public.is_admin() OR id = auth.uid()
  );

-- 4. Политика UPDATE: администратор может редактировать любого
CREATE POLICY "admin_update_all" ON user_profiles
  FOR UPDATE
  USING (public.is_admin());

-- 5. Политика DELETE: только администратор может удалять
CREATE POLICY "admin_delete_all" ON user_profiles
  FOR DELETE
  USING (public.is_admin());

-- 6. Единая функция для получения всех пользователей с email
-- Обращается напрямую к auth.users для получения email (обходит RLS через SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.admin_get_users_with_email()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  is_active boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Проверяем, что вызывающий — администратор
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Только администратор может просматривать всех пользователей';
  END IF;

  -- Возвращаем профили пользователей с email из auth.users
  RETURN QUERY
  SELECT
    p.id,
    u.email::text,
    p.full_name,
    p.role,
    p.is_active,
    p.created_at
  FROM user_profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$$;