import { reactive } from 'vue'
import { supabase, supabaseQueryWithRetry } from '@/services/supabase'

/**
 * A simple reactive store for authentication state.
 */
export const state = reactive({
    user: null,
    session: null,
    profile: null,
    isAdmin: false,
    isAuthenticated: false
})

/**
 * Fetches the user profile from the user_profiles table.
 * @returns {Promise<object|null>}
 */
function fetchProfile(userId) {
    return supabaseQueryWithRetry(
        () => supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single(),
        { operationName: 'Fetch user profile' }
    )
        .then(({ data, error }) => {
            if (error) {
                console.warn('Failed to fetch user profile:', error.message)
                return null
            }
            return data
        })
}

/**
 * Updates the auth state with the given session.
 */
function updateState(session) {
    state.user = session ? session.user : null
    state.session = session
    state.profile = null
    state.isAdmin = false
    state.isAuthenticated = false

    if (session?.user) {
        fetchProfile(session.user.id)
            .then(profile => {
                state.profile = profile
                state.isAdmin = profile?.role === 'admin'
                state.isAuthenticated = !!profile && profile.is_active !== false
            })
    }
}

/**
 * Listens for changes in the authentication state and updates the store.
 * Falls back gracefully if auth is not available.
 */
try {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
        updateState(session)
    })
    supabase.auth.getSession()
        .then(({ data: { session } }) => {
            updateState(session)
        })
        .catch(() => {
            state.user = null
            state.session = null
            state.profile = null
            state.isAdmin = false
            state.isAuthenticated = false
        })
} catch (e) {
    console.warn('Auth state change listener not available — guest mode only:', e.message || e)
    state.user = null
    state.session = null
    state.profile = null
    state.isAdmin = false
    state.isAuthenticated = false
}

/**
 * Signs the user out.
 * @returns {Promise<{error}>}
 */
export function signOut() {
    return supabase.auth.signOut()
}