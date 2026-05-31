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
 * Falls back gracefully if auth is not available.
 */
try {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
        state.user = session ? session.user : null
        state.session = session
    })
    // data.subscription может отсутствовать в заглушке — это нормально
} catch (e) {
    console.warn('Auth state change listener not available — guest mode only:', e.message || e)
    state.user = null
    state.session = null
}

/**
 * Signs the user out.
 * @returns {Promise<{error}>}
 */
export function signOut() {
    return supabase.auth.signOut()
}
