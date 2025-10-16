import { reactive } from 'vue'
import { supabase } from '@/services/supabase'

/**
 * A simple reactive store for authentication state.
 */
export const state = reactive({
    user: null,
    session: null
})

/**
 * Listens for changes in the authentication state and updates the store.
 */
supabase.auth.onAuthStateChange((event, session) => {
    state.user = session ? session.user : null
    state.session = session
})

/**
 * Signs the user out.
 * @returns {Promise<{error}>}
 */
export function signOut() {
    return supabase.auth.signOut()
}
