import { supabase } from '@/services/supabase'
import { supabaseQueryWithRetry } from '@/services/supabase'

const CACHE_TTL = 3600000 // 1 hour in milliseconds
const STORAGE_PREFIX = 'tahisis_reference_'

// Все ключи справочников для автоматической инициализации из localStorage
const REFERENCE_KEYS = [
  'districts',
  'typeEstates',
  'typeReligions',
  'typeAffiliations',
  'subtypeEstates',
  'subtypeEstateSources',
  'revisions',
  'volosts',
  'settlements',
  'landowners',
  'militaryUnits'
]

/**
 * Сохраняет справочник в localStorage.
 * @param {string} key - имя справочника
 * @param {Array} data - данные
 */
function saveToStorage(key, data) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data))
  } catch (e) {
    console.warn(`[Vuex] Failed to save "${key}" to localStorage:`, e.message)
  }
}

/**
 * Загружает справочник из localStorage.
 * @param {string} key - имя справочника
 * @returns {Array|null} данные или null если нет/истекли/ошибка
 */
function loadFromStorage(key) {
  try {
    const tsRaw = localStorage.getItem(STORAGE_PREFIX + 'ts_' + key)
    const dataRaw = localStorage.getItem(STORAGE_PREFIX + key)

    if (!dataRaw) return null

    const timestamp = tsRaw ? parseInt(tsRaw, 10) : 0
    // Если TTL истёк — возвращаем данные, но помечаем их как устаревшие (stale)
    const isFresh = Date.now() - timestamp < CACHE_TTL
    const data = JSON.parse(dataRaw)

    console.log(`💾 [Vuex] "${key}" loaded from localStorage: ${data.length} records${isFresh ? '' : ' (stale)'}`)
    return { data, isFresh, timestamp }
  } catch (e) {
    console.warn(`[Vuex] Failed to load "${key}" from localStorage:`, e.message)
    return null
  }
}

/**
 * Инициализирует начальное состояние из localStorage.
 * Возвращает объект с предзаполненными массивами и lastFetch.
 */
function initStateFromStorage() {
  const initialState = {
    districts: [],
    typeEstates: [],
    typeReligions: [],
    typeAffiliations: [],
    subtypeEstates: [],
    subtypeEstateSources: [],
    revisions: [],
    volosts: [],
    settlements: [],
    landowners: [],
    militaryUnits: [],
    pendingFetches: {},
    lastFetch: {}
  }

  REFERENCE_KEYS.forEach(key => {
    const stored = loadFromStorage(key)
    if (stored) {
      initialState[key] = stored.data
      initialState.lastFetch[key] = stored.timestamp
    }
  })

  return initialState
}

export default {
  namespaced: true,

  state: () => (initStateFromStorage()),

  getters: {
    districts: state => state.districts,
    typeEstates: state => state.typeEstates,
    typeReligions: state => state.typeReligions,
    typeAffiliations: state => state.typeAffiliations,
    subtypeEstates: state => state.subtypeEstates,
    subtypeEstateSources: state => state.subtypeEstateSources,
    revisions: state => state.revisions,
    volosts: state => state.volosts,
    settlements: state => state.settlements,
    landowners: state => state.landowners,
    militaryUnits: state => state.militaryUnits,

    isCached: state => key => {
      return state.lastFetch[key] && (Date.now() - state.lastFetch[key] < CACHE_TTL)
    }
  },

  mutations: {
    setData(state, { key, data }) {
      state[key] = data
      state.lastFetch[key] = Date.now()
      // Сохраняем в localStorage
      saveToStorage(key, data)
      saveToStorage('ts_' + key, String(state.lastFetch[key]))
    },
    setPendingFetch(state, { key, promise }) {
      state.pendingFetches[key] = promise
    },
    removePendingFetch(state, key) {
      delete state.pendingFetches[key]
    },
    clearCache(state) {
      state.districts = []
      state.typeEstates = []
      state.typeReligions = []
      state.typeAffiliations = []
      state.subtypeEstates = []
      state.subtypeEstateSources = []
      state.revisions = []
      state.volosts = []
      state.settlements = []
      state.landowners = []
      state.militaryUnits = []
      state.lastFetch = {}
      // Очищаем localStorage
      REFERENCE_KEYS.forEach(key => {
        try {
          localStorage.removeItem(STORAGE_PREFIX + key)
          localStorage.removeItem(STORAGE_PREFIX + 'ts_' + key)
        } catch (e) {
          // ignore
        }
      })
    }
  },

  actions: {
    /**
     * Generic action to fetch a reference table with caching and deduplication.
     * Сначала проверяет state (in-memory cache), затем localStorage.
     * @param {string} key - state property name
     * @param {Function} queryFn - function returning supabase query
     */
    loadReference({ commit, state, getters }, { key, queryFn }) {
      // Return cached data if fresh (in-memory)
      if (getters.isCached(key)) {
        console.log(`📦 [Vuex] Using in-memory cached "${key}"`)
        return Promise.resolve(state[key])
      }

      // Если в state есть данные из localStorage (но TTL истёк) — возвращаем их сразу,
      // а в фоне обновляем из Supabase
      const hasStaleData = state[key] && state[key].length > 0

      // Deduplicate concurrent requests
      if (state.pendingFetches[key]) {
        console.log(`⏳ [Vuex] Awaiting in-flight "${key}"`)
        return state.pendingFetches[key]
      }

      console.log(`🔄 [Vuex] Fetching "${key}"...`)
      const promise = supabaseQueryWithRetry(queryFn, { operationName: `load-${key}` })
        .then(({ data, error }) => {
          if (error) throw error
          const result = data || []
          commit('setData', { key, data: result })
          console.log(`✅ [Vuex] "${key}" loaded: ${result.length} records`)
          return result
        })
        .catch(error => {
          console.error(`❌ [Vuex] Failed to load "${key}":`, error)
          // Если есть устаревшие данные в state — возвращаем их при ошибке
          if (hasStaleData) {
            console.warn(`⚠️ [Vuex] Returning stale "${key}" (${state[key].length} records) due to fetch error`)
            return state[key]
          }
          throw error
        })
        .finally(() => {
          // Remove pending fetch reference after completion
          commit('removePendingFetch', key)
        })

      // Store pending promise for deduplication
      commit('setPendingFetch', { key, promise })

      // Если есть устаревшие данные в state — возвращаем их немедленно
      if (hasStaleData) {
        console.log(`💾 [Vuex] Returning stale "${key}" (${state[key].length} records), refreshing in background`)
        return Promise.resolve(state[key])
      }

      return promise
    },

    loadDistricts({ dispatch }) {
      return dispatch('loadReference', {
        key: 'districts',
        queryFn: () => supabase.from('District').select('id, name').order('name')
      })
    },

    loadTypeEstates({ dispatch }) {
      return dispatch('loadReference', {
        key: 'typeEstates',
        queryFn: () => supabase.from('Type_estate').select('id, name, color').order('name')
      })
    },

    loadTypeReligions({ dispatch }) {
      return dispatch('loadReference', {
        key: 'typeReligions',
        queryFn: () => supabase.from('Type_religion').select('id, name').order('name')
      })
    },

    loadTypeAffiliations({ dispatch }) {
      return dispatch('loadReference', {
        key: 'typeAffiliations',
        queryFn: () => supabase.from('Type_affiliation').select('id, name').order('name')
      })
    },

    loadSubtypeEstates({ dispatch }) {
      return dispatch('loadReference', {
        key: 'subtypeEstates',
        queryFn: () => supabase.from('Subtype_estate').select('id, name, id_type_estate, id_type_religion, id_type_affiliation, color').order('name')
      })
    },

    loadSubtypeEstateSources({ dispatch }) {
      return dispatch('loadReference', {
        key: 'subtypeEstateSources',
        queryFn: () => supabase.from('Subtype_estate_source').select('id, name, id_subtype_estate').order('name')
      })
    },

    loadRevisions({ dispatch }) {
      return dispatch('loadReference', {
        key: 'revisions',
        queryFn: () => supabase.from('Revision_report').select('id, year, number').order('year', { ascending: false })
      })
    },

    loadVolosts({ dispatch }) {
      return dispatch('loadReference', {
        key: 'volosts',
        queryFn: () => supabase.from('Volost').select('id, name').order('name')
      })
    },

    loadSettlements({ dispatch }) {
      return dispatch('loadReference', {
        key: 'settlements',
        queryFn: () => supabase.from('Settlement').select('id, name_modern, name_old, name_old_alt, lat, lon, id_district, vanished').order('name_old')
      })
    },

    loadLandowners({ dispatch }) {
      return dispatch('loadReference', {
        key: 'landowners',
        queryFn: () => supabase.from('Landowner').select('id, description, person').order('description')
      })
    },

    loadMilitaryUnits({ dispatch }) {
      return dispatch('loadReference', {
        key: 'militaryUnits',
        queryFn: () => supabase.from('Military_unit').select('id, description, person').order('description')
      })
    }
  }
}