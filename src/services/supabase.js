
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rqairzjmldhczzxbmbse.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY  // ключ лучше хранить в .env
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY  // сервисный ключ для административных операций

// Создаем обычный клиент для аутентификации пользователей
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Создаем административный клиент для операций с данными (обходит RLS)
export const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : supabase
