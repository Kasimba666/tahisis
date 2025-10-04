
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rqairzjmldhczzxbmbse.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY  // ключ лучше хранить в .env
export const supabase = createClient(supabaseUrl, supabaseKey)
