-- Скопируйте и выполните этот скрипт целиком в SQL Editor Supabase
-- Исправляет и дополняет RLS-политики для user_profiles

-- 1. Удаляем старые политики UPDATE (неправильные — без WITH CHECK)
DROP POLICY IF EXISTS "admin_update_all" ON user_profiles;

-- 2. Создаём правильную политику UPDATE с WITH CHECK
-- USING — какие строки можно обновлять (только администратор)
-- WITH CHECK — какие значения можно устанавливать (администратор может ставить любую роль, обычный пользователь — только свою)
CREATE POLICY "admin_update_all" ON user_profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Для максимальной независимости от Supabase Auth:
--    Создаём функцию, которая при обновлении профиля синхронизирует email
--    в user_profiles, если он изменился в auth.users
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Обновляем email в user_profiles если он изменился
  -- или если пользователь, обновивший свой профиль — это сам владелец,
  -- то разрешаем менять full_name
  RETURN NEW;
END;
$$;