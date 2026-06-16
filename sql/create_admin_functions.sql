-- =====================================================
-- Добавляем недостающие функции для администрирования
-- Выполните в SQL Editor
-- =====================================================

-- Функция удаления пользователя (деактивация + удаление из auth)
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Деактивируем профиль
  UPDATE user_profiles SET is_active = false WHERE id = p_user_id;
  
  -- Удаляем из auth.users (полное удаление)
  DELETE FROM auth.users WHERE id = p_user_id;
  
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO service_role;

-- Подтверждаем email для ВСЕХ существующих пользователей
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, now());