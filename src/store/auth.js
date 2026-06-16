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
    isEditor: false,
    isResearcher: false,
    isGuest: false,
    isAuthenticated: false
})

/**
 * Returns the user's role string, or 'guest' if not authenticated.
 * @returns {string}
 */
export function getUserRole() {
    if (!state.profile || !state.profile.role) return 'guest'
    return state.profile.role
}

/**
 * Checks if the user has at least the specified role level.
 * Hierarchy: admin > editor > researcher > guest/pending
 * @param {string} requiredRole
 * @returns {boolean}
 */
export function hasRole(requiredRole) {
    const roleHierarchy = ['guest', 'pending', 'researcher', 'editor', 'admin']
    const userRole = getUserRole()
    const userLevel = roleHierarchy.indexOf(userRole)
    const requiredLevel = roleHierarchy.indexOf(requiredRole)
    if (userLevel === -1 || requiredLevel === -1) return false
    return userLevel >= requiredLevel
}

/**
 * Checks if user can access data management features.
 * @returns {boolean}
 */
export function canManageData() {
    return state.isAdmin || state.isEditor
}

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
            .maybeSingle(),
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
    state.isEditor = false
    state.isResearcher = false
    state.isGuest = false
    state.isAuthenticated = false

    if (session?.user) {
        state.isAuthenticated = true
        fetchProfile(session.user.id)
            .then(profile => {
                state.profile = profile
                const role = profile?.role || 'guest'
                state.isAdmin = role === 'admin'
                state.isEditor = role === 'editor'
                state.isResearcher = role === 'researcher'
                state.isGuest = role === 'guest' || role === 'pending'
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