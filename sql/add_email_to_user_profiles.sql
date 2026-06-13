-- Скопируйте и выполните этот скрипт целиком в SQL Editor Supabase
-- Добавляет колонку email в user_profiles и заполняет её из auth.users

-- 1. Добавляем колонку email (если её ещё нет)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS email text;

-- 2. Заполняем email из auth.users для существующих пользователей
UPDATE user_profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. Создаём функцию-триггер для автоматической синхронизации email
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- При вставке нового пользователя в auth.users добавляем запись в user_profiles (если её нет)
  -- или обновляем email
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO user_profiles (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  END IF;

  -- При удалении пользователя из auth.users — ничего не делаем,
  -- профиль остаётся для истории (можно изменить при необходимости)

  RETURN NEW;
END;
$$;

-- 4. Создаём триггер на auth.users (если его ещё нет)
DROP TRIGGER IF EXISTS trg_sync_user_email ON auth.users;
CREATE TRIGGER trg_sync_user_email
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_email();

-- 5. Обновляем RLS-политики для новой колонки email
-- (если политики уже созданы через предыдущий скрипт, они уже работают)
-- Дополнительно: даём доступ к колонке email для администраторов через существующую политику admin_select_all