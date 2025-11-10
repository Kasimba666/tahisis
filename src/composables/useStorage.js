import { ref, watch, onMounted } from 'vue'
import { storageService } from '@/services/storage.js'

/**
 * Composable для работы с localStorage
 * @param {string} key - ключ для хранения
 * @param {any} defaultValue - значение по умолчанию
 * @param {boolean} immediate - сохранять сразу при изменении
 * @returns {object} - объект с reactive значением и методами
 */
export function useStorage(key, defaultValue = null, immediate = true) {
  const storedValue = ref(defaultValue)

  // Загружаем значение при монтировании
  onMounted(() => {
    const value = storageService.load(key, defaultValue)
    storedValue.value = value
  })

  // Сохраняем значение при изменении
  if (immediate) {
    watch(
      storedValue,
      (newValue) => {
        storageService.save(key, newValue)
      },
      { deep: true }
    )
  }

  const save = (value) => {
    storedValue.value = value
    if (!immediate) {
      storageService.save(key, value)
    }
  }

  const load = () => {
    const value = storageService.load(key, defaultValue)
    storedValue.value = value
    return value
  }

  const remove = () => {
    storageService.remove(key)
    storedValue.value = defaultValue
  }

  return {
    value: storedValue,
    save,
    load,
    remove
  }
}

/**
 * Composable для работы с фильтрами поселений
 * @param {object} defaultFilters - фильтры по умолчанию
 * @returns {object} - объект с фильтрами и методами управления
 */
export function useEstatesFilters(defaultFilters = {}) {
  const defaultValues = {
    revision: [],
    districts: [],
    settlementNamesOld: [],
    settlementNamesModern: [],
    typeEstates: [],
    subtypeEstates: [],
    religions: [],
    affiliations: [],
    volosts: [],
    landowners: [],
    militaryUnits: [],
    maleEnabled: false,
    femaleEnabled: false,
    populationEnabled: false,
    estatesCountEnabled: false,
    maleMin: null,
    maleMax: null,
    femaleMin: null,
    femaleMax: null,
    populationMin: null,
    populationMax: null,
    estatesCountMin: null,
    estatesCountMax: null,
    ...defaultFilters
  }

  const filters = ref({ ...defaultValues })

  // Загружаем сохраненные фильтры
  onMounted(() => {
    const savedFilters = storageService.loadEstatesFilters()
    if (savedFilters && Object.keys(savedFilters).length > 0) {
      // Объединяем сохраненные фильтры с дефолтными значениями
      filters.value = { ...defaultValues, ...savedFilters }
    }
  })

  // Сохраняем фильтры при изменении
  watch(
    filters,
    (newFilters) => {
      storageService.saveEstatesFilters(newFilters)
    },
    { deep: true }
  )

  const resetFilters = () => {
    filters.value = { ...defaultValues }
  }

  const applyFilters = () => {
    storageService.saveEstatesFilters(filters.value)
  }

  return {
    filters,
    resetFilters,
    applyFilters
  }
}

/**
 * Composable для работы с сортировкой таблицы
 * @param {string} defaultColumn - колонка по умолчанию
 * @param {string} defaultOrder - порядок по умолчанию
 * @returns {object} - объект с сортировкой и методами управления
 */
export function useTableSorting(defaultColumn = 'name', defaultOrder = 'asc') {
  const sorting = ref({
    column: defaultColumn,
    order: defaultOrder
  })

  // Загружаем сохраненную сортировку
  onMounted(() => {
    const savedSorting = storageService.loadEstatesSorting()
    if (savedSorting) {
      sorting.value = savedSorting
    }
  })

  // Сохраняем сортировку при изменении
  watch(
    sorting,
    (newSorting) => {
      storageService.saveEstatesSorting(newSorting)
    },
    { deep: true }
  )

  const setSorting = (column, order = null) => {
    if (order === null) {
      // Если кликнули по той же колонке, меняем порядок
      if (sorting.value.column === column) {
        sorting.value.order = sorting.value.order === 'asc' ? 'desc' : 'asc'
      } else {
        sorting.value.column = column
        sorting.value.order = 'asc'
      }
    } else {
      sorting.value.column = column
      sorting.value.order = order
    }
  }

  const resetSorting = () => {
    sorting.value = {
      column: defaultColumn,
      order: defaultOrder
    }
  }

  return {
    sorting,
    setSorting,
    resetSorting
  }
}

/**
 * Composable для работы с активной ревизией
 * @param {object} defaultRevision - ревизия по умолчанию
 * @returns {object} - объект с активной ревизией и методами управления
 */
export function useActiveRevision(defaultRevision = null) {
  const activeRevision = ref(defaultRevision)

  // Загружаем сохраненную активную ревизию
  onMounted(() => {
    const savedRevision = storageService.loadActiveRevision()
    if (savedRevision) {
      activeRevision.value = savedRevision
    }
  })

  // Сохраняем активную ревизию при изменении
  watch(
    activeRevision,
    (newRevision) => {
      storageService.saveActiveRevision(newRevision)
    },
    { deep: true }
  )

  const setActiveRevision = (revision) => {
    activeRevision.value = revision
  }

  const clearActiveRevision = () => {
    activeRevision.value = null
  }

  return {
    activeRevision,
    setActiveRevision,
    clearActiveRevision
  }
}

/**
 * Composable для работы с активным типом сословия
 * @param {object} defaultEstateType - тип сословия по умолчанию
 * @returns {object} - объект с активным типом сословия и методами управления
 */
export function useActiveEstateType(defaultEstateType = null) {
  const activeEstateType = ref(defaultEstateType)

  // Загружаем сохраненный активный тип сословия
  onMounted(() => {
    const savedEstateType = storageService.loadActiveEstateType()
    if (savedEstateType) {
      activeEstateType.value = savedEstateType
    }
  })

  // Сохраняем активный тип сословия при изменении
  watch(
    activeEstateType,
    (newEstateType) => {
      storageService.saveActiveEstateType(newEstateType)
    },
    { deep: true }
  )

  const setActiveEstateType = (estateType) => {
    activeEstateType.value = estateType
  }

  const clearActiveEstateType = () => {
    activeEstateType.value = null
  }

  return {
    activeEstateType,
    setActiveEstateType,
    clearActiveEstateType
  }
}

/**
 * Composable для работы с настройками таблицы
 * @param {object} defaultSettings - настройки по умолчанию
 * @returns {object} - объект с настройками таблицы и методами управления
 */
export function useTableSettings(defaultSettings = {}) {
  const defaultValues = {
    pageSize: 50,
    currentPage: 1,
    ...defaultSettings
  }

  const settings = ref({ ...defaultValues })

  // Загружаем сохраненные настройки
  onMounted(() => {
    const savedSettings = storageService.loadTableSettings()
    if (savedSettings) {
      settings.value = { ...defaultValues, ...savedSettings }
    }
  })

  // Сохраняем настройки при изменении
  watch(
    settings,
    (newSettings) => {
      storageService.saveTableSettings(newSettings)
    },
    { deep: true }
  )

  const setPageSize = (size) => {
    settings.value.pageSize = size
  }

  const setCurrentPage = (page) => {
    settings.value.currentPage = page
  }

  return {
    settings,
    setPageSize,
    setCurrentPage
  }
}
