-- =====================================================
-- ЕДИНСТВЕННЫЙ ШАГ, КОТОРЫЙ НУЖНО СДЕЛАТЬ
-- Скопируйте этот код и выполните в SQL Editor Supabase Dashboard
-- =====================================================

-- Подтверждает email пользователя delaluna@mail.ru и задаёт пароль 123456
UPDATE auth.users
SET email_confirmed_at = now(),
    encrypted_password = crypt('123456', gen_salt('bf'))
WHERE email = 'delaluna@mail.ru';

-- Проверка: посмотреть что изменилось
SELECT email, email_confirmed_at, role 
FROM auth.users 
LEFT JOIN public.user_profiles ON auth.users.id = user_profiles.id
WHERE auth.users.email = 'delaluna@mail.ru';