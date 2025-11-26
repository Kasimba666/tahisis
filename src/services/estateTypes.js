import { supabase } from './supabase.js'

// Сервис для работы с цветами типов собственности (Subtype_estate)
// Глобальный кэш цветов для оптимизации производительности
let estateTypeColors = null
let colorsPromise = null

export const estateTypesService = {
  // Загружаем цвета типов собственности из базы данных (один раз)
  loadEstateTypeColors() {
    if (estateTypeColors !== null) {
      // Уже загружено - возвращаем промис который уже зарезолвился
      return Promise.resolve(estateTypeColors)
    }

    if (colorsPromise !== null) {
      // Уже загружаем - возвращаем текущий промис
      return colorsPromise
    }

    // Создаем новый промис для загрузки
    colorsPromise = supabase
      .from('Subtype_estate')
      .select('id, name, color')
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading estate type colors:', error)
          // Возвращаем пустой объект если ошибка
          estateTypeColors = {}
        } else {
          // Формируем карту id -> color
          estateTypeColors = {}
          if (data && Array.isArray(data)) {
            data.forEach(item => {
              if (item.id && item.color) {
                estateTypeColors[item.id] = item.color
              }
            })
          }
          console.log(`✅ Loaded ${Object.keys(estateTypeColors).length} estate type colors`)
        }

        // Убираем промис из переменной
        colorsPromise = null
        return estateTypeColors
      })
      .catch(error => {
        console.error('Exception loading estate type colors:', error)
        estateTypeColors = {}
        colorsPromise = null
        return estateTypeColors
      })

    return colorsPromise
  },

  // Получить цвета синхронно (предполагая что они уже загружены)
  getEstateTypeColors() {
    return estateTypeColors || {}
  },

  // Проверить загружены ли цвета
  isLoaded() {
    return estateTypeColors !== null
  },

  // Очистить кэш для перезагрузки
  clearCache() {
    estateTypeColors = null
    colorsPromise = null
  },

  // Получить цвет по ID подтипа собственности
  getColorById(subtypeId) {
    if (!subtypeId || !estateTypeColors) return null
    return estateTypeColors[subtypeId] || null
  },

  // Получить все цвета как массив
  getAllColors() {
    return estateTypeColors ? { ...estateTypeColors } : {}
  }
}

// Глобальная функция для быстрого доступа к цветам
window.getEstateTypeColor = (subtypeId) => estateTypesService.getColorById(subtypeId)
