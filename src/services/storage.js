/**
 * Сервис для работы с localStorage
 * Сохраняет и восстанавливает состояние фильтров, сортировки и активных элементов
 */

const STORAGE_KEYS = {
  ESTATES_FILTERS: 'tahisis_estates_filters',
  ESTATES_SORTING: 'tahisis_estates_sorting',
  ACTIVE_REVISION: 'tahisis_active_revision',
  ACTIVE_ESTATE_TYPE: 'tahisis_active_estate_type',
  MAP_SETTINGS: 'tahisis_map_settings',
  TABLE_SETTINGS: 'tahisis_table_settings',
  HEATMAP_SETTINGS: 'tahisis_heatmap_settings'
}

class StorageService {
  /**
   * Сохранить данные в localStorage
   * @param {string} key - ключ для хранения
   * @param {any} data - данные для сохранения
   */
  save(key, data) {
    try {
      const serializedData = JSON.stringify(data)
      localStorage.setItem(key, serializedData)
      return true
    } catch (error) {
      console.error('Error saving to localStorage:', error)
      return false
    }
  }

  /**
   * Получить данные из localStorage
   * @param {string} key - ключ для получения
   * @param {any} defaultValue - значение по умолчанию
   * @returns {any} - сохраненные данные или значение по умолчанию
   */
  load(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(key)
      if (stored === null) {
        return defaultValue
      }
      return JSON.parse(stored)
    } catch (error) {
      console.error('Error loading from localStorage:', error)
      return defaultValue
    }
  }

  /**
   * Удалить данные из localStorage
   * @param {string} key - ключ для удаления
   */
  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Error removing from localStorage:', error)
      return false
    }
  }

  /**
   * Очистить все данные приложения из localStorage
   */
  clear() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
      return true
    } catch (error) {
      console.error('Error clearing localStorage:', error)
      return false
    }
  }

  // Методы для работы с фильтрами поселений
  saveEstatesFilters(filters) {
    return this.save(STORAGE_KEYS.ESTATES_FILTERS, filters)
  }

  loadEstatesFilters() {
    return this.load(STORAGE_KEYS.ESTATES_FILTERS, {})
  }

  // Методы для работы с сортировкой поселений
  saveEstatesSorting(sorting) {
    return this.save(STORAGE_KEYS.ESTATES_SORTING, sorting)
  }

  loadEstatesSorting() {
    return this.load(STORAGE_KEYS.ESTATES_SORTING, {
      column: 'name',
      order: 'asc'
    })
  }

  // Методы для работы с активной ревизией
  saveActiveRevision(revision) {
    return this.save(STORAGE_KEYS.ACTIVE_REVISION, revision)
  }

  loadActiveRevision() {
    return this.load(STORAGE_KEYS.ACTIVE_REVISION, null)
  }

  // Методы для работы с активным типом сословия
  saveActiveEstateType(estateType) {
    return this.save(STORAGE_KEYS.ACTIVE_ESTATE_TYPE, estateType)
  }

  loadActiveEstateType() {
    return this.load(STORAGE_KEYS.ACTIVE_ESTATE_TYPE, null)
  }

  // Методы для работы с настройками карты
  saveMapSettings(settings) {
    return this.save(STORAGE_KEYS.MAP_SETTINGS, settings)
  }

  loadMapSettings() {
    return this.load(STORAGE_KEYS.MAP_SETTINGS, {})
  }

  // Методы для работы с настройками таблицы
  saveTableSettings(settings) {
    return this.save(STORAGE_KEYS.TABLE_SETTINGS, settings)
  }

  loadTableSettings() {
    return this.load(STORAGE_KEYS.TABLE_SETTINGS, {
      pageSize: 50,
      currentPage: 1
    })
  }

  // Методы для работы с настройками тепловой карты
  saveHeatmapSettings(settings) {
    return this.save(STORAGE_KEYS.HEATMAP_SETTINGS, settings)
  }

  loadHeatmapSettings() {
    return this.load(STORAGE_KEYS.HEATMAP_SETTINGS, {
      radius: 36,
      blur: 75,
      intensity: 1.5,
      colorPalette: 'red-yellow'
    })
  }

  /**
   * Получить все ключи приложения
   */
  getAppKeys() {
    return Object.values(STORAGE_KEYS)
  }

  /**
   * Экспортировать все настройки приложения
   */
  exportSettings() {
    const settings = {}
    Object.values(STORAGE_KEYS).forEach(key => {
      const value = this.load(key)
      if (value !== null) {
        settings[key] = value
      }
    })
    return settings
  }

  /**
   * Импортировать настройки приложения
   * @param {object} settings - настройки для импорта
   */
  importSettings(settings) {
    try {
      Object.entries(settings).forEach(([key, value]) => {
        if (Object.values(STORAGE_KEYS).includes(key)) {
          this.save(key, value)
        }
      })
      return true
    } catch (error) {
      console.error('Error importing settings:', error)
      return false
    }
  }
}

// Экспортируем singleton экземпляр
export const storageService = new StorageService()
