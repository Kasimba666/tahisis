import { reactive, watch, nextTick } from 'vue'
import { supabase } from '@/services/supabase'

// Цвета для различных типов сословий (загружаются из базы данных) - HSL формат
let ESTATE_TYPE_COLORS = {
  'default': 'hsl(0, 0%, 50%)'         // Серый для неизвестных
}

// Режимы окраски маркеров (упрощенные - только два варианта)
const COLOR_MODES = {
  BY_ESTATE_TYPE: 'by_estate_type', // По типу сословия (основной режим)
  BY_DISTRICT: 'by_district'        // По району (альтернативный режим)
}

/**
 * Store для управления настройками карты и фильтрами
 */
export const mapSettings = reactive({
  // Режим окраски маркеров (только два варианта)
  colorMode: COLOR_MODES.BY_ESTATE_TYPE,

  // Цвета для типов сословий
  estateTypeColors: { ...ESTATE_TYPE_COLORS },

  // Цвета для районов (генерируются автоматически)
  districtColors: {},

  // Упрощенные фильтры (только основные)
  filters: {
    revision: null,
    districts: [],
    typeEstates: []
  },

  // Упрощенные настройки отображения
  display: {
    showLabels: false,
    markerSize: 'medium',
    opacity: 0.8
  }
})

// Сохранение настроек в localStorage
function saveToLocalStorage() {
  try {
    const settingsToSave = {
      colorMode: mapSettings.colorMode,
      estateTypeColors: mapSettings.estateTypeColors,
      uniformColor: mapSettings.uniformColor,
      populationColorRange: mapSettings.populationColorRange,
      display: mapSettings.display,
      // Не сохраняем фильтры, так как они специфичны для сессии
    }
    localStorage.setItem('tahisis_map_settings', JSON.stringify(settingsToSave))
  } catch (error) {
    console.error('Error saving map settings to localStorage:', error)
  }
}

// Загрузка настроек из localStorage
function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('tahisis_map_settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      Object.assign(mapSettings, parsed)
    }
  } catch (error) {
    console.error('Error loading map settings from localStorage:', error)
  }
}

// Автосохранение при изменении настроек
watch(
  () => mapSettings.colorMode,
  () => saveToLocalStorage(),
  { deep: true }
)

watch(
  () => mapSettings.estateTypeColors,
  () => saveToLocalStorage(),
  { deep: true }
)

watch(
  () => mapSettings.uniformColor,
  () => saveToLocalStorage()
)

watch(
  () => mapSettings.populationColorRange,
  () => saveToLocalStorage(),
  { deep: true }
)

watch(
  () => mapSettings.display,
  () => saveToLocalStorage(),
  { deep: true }
)

// Загружаем настройки при инициализации
loadFromLocalStorage()

/**
 * Загрузить цвета типов сословий из базы данных
 */
export async function loadEstateTypeColors() {
  try {
    const { data, error } = await supabase
      .from('Type_estate')
      .select('name, color')
      .not('color', 'is', null)

    if (error) throw error

    // Обновляем цвета из базы данных - СТРОГО проверяем HSL формат
    const colorsFromDB = { 'default': 'hsl(0, 0%, 50%)' }
    data.forEach(estate => {
      if (estate.color) {
        // Безопасно читаем цвет из базы данных с fallback на белый
        colorsFromDB[estate.name] = safeReadHslColor(estate.color)
      }
    })

    console.log('Database colors after validation:', colorsFromDB)

    ESTATE_TYPE_COLORS = colorsFromDB
    mapSettings.estateTypeColors = { ...colorsFromDB }

    console.log('Loaded estate type colors:', colorsFromDB)
    return colorsFromDB
  } catch (error) {
    console.error('Error loading estate type colors:', error)
    return ESTATE_TYPE_COLORS
  }
}

/**
 * Сохранить цвет типа сословия в базу данных (СТРОГО HSL формат)
 */
export async function saveEstateTypeColor(estateTypeName, color) {
  try {
    // Находим ID типа сословия по имени
    const { data: estateType, error: findError } = await supabase
      .from('Type_estate')
      .select('id')
      .eq('name', estateTypeName)
      .single()

    if (findError) throw findError

    // Конвертируем цвет в СТРОГИЙ HSL формат для базы данных
    const hslColorForDB = ensureHslFormatForDatabase(color)

    // Обновляем цвет в базе данных ТОЛЬКО в HSL формате
    const { error: updateError } = await supabase
      .from('Type_estate')
      .update({ color: hslColorForDB })
      .eq('id', estateType.id)

    if (updateError) throw updateError

    // Обновляем локальный store
    mapSettings.estateTypeColors[estateTypeName] = hslColorForDB

    console.log(`Saved color for ${estateTypeName}: ${hslColorForDB}`)
    return true
  } catch (error) {
    console.error('Error saving estate type color:', error)
    return false
  }
}

/**
 * Получить цвет для маркера в зависимости от режима окраски
 */
export function getMarkerColor(settlement, estateType = null, population = null, district = null) {
  switch (mapSettings.colorMode) {
    case COLOR_MODES.UNIFORM:
      return mapSettings.uniformColor

    case COLOR_MODES.BY_ESTATE_TYPE:
      return estateType ? mapSettings.estateTypeColors[estateType] || mapSettings.estateTypeColors.default : mapSettings.estateTypeColors.default

    case COLOR_MODES.BY_DISTRICT:
      if (district && !mapSettings.districtColors[district]) {
        // Генерируем цвет для района
        mapSettings.districtColors[district] = generateDistrictColor(district)
      }
      return district ? mapSettings.districtColors[district] : mapSettings.estateTypeColors.default

    case COLOR_MODES.BY_POPULATION:
      return getPopulationColor(population)

    default:
      return mapSettings.estateTypeColors.default
  }
}

/**
 * Генерировать цвет для района
 */
function generateDistrictColor(districtName) {
  // Простая хэш-функция для генерации цвета на основе названия
  let hash = 0
  for (let i = 0; i < districtName.length; i++) {
    hash = districtName.charCodeAt(i) + ((hash << 5) - hash)
  }

  const hue = hash % 360
  return `hsl(${hue}, 70%, 50%)`
}

/**
 * Получить цвет в зависимости от населения
 */
function getPopulationColor(population) {
  if (!population || population <= 0) {
    return mapSettings.estateTypeColors.default
  }

  const { min, max, minColor, maxColor } = mapSettings.populationColorRange

  // Нормализуем значение населения
  const normalized = Math.min(Math.max((population - min) / (max - min), 0), 1)

  // Интерполируем между HSL цветами
  const color1 = hslToComponents(minColor)
  const color2 = hslToComponents(maxColor)

  const h = color1.h + (color2.h - color1.h) * normalized
  const s = color1.s + (color2.s - color1.s) * normalized
  const l = color1.l + (color2.l - color1.l) * normalized

  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
}

/**
 * Конвертировать HSL цвет в компоненты
 */
function hslToComponents(hslColor) {
  const hslMatch = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (hslMatch) {
    return {
      h: parseInt(hslMatch[1]),
      s: parseInt(hslMatch[2]),
      l: parseInt(hslMatch[3])
    }
  }

  // Fallback для hex цветов
  const rgb = hexToRgb(hslColor)
  return rgbToHsl(rgb.r, rgb.g, rgb.b)
}

/**
 * Конвертировать RGB в HSL
 */
function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
      default: h = 0
    }
    h /= 6
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

/**
 * Конвертировать hex цвет в RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 128, g: 128, b: 128 }
}

/**
 * Валидация HSL формата цвета
 */
function isValidHslColor(color) {
  if (typeof color !== 'string') return false
  const hslMatch = color.match(/^hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)$/)
  if (!hslMatch) return false

  const h = parseInt(hslMatch[1])
  const s = parseInt(hslMatch[2])
  const l = parseInt(hslMatch[3])

  // Проверяем диапазоны HSL
  return h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100
}

/**
 * Обеспечить СТРОГИЙ HSL формат цвета для базы данных
 */
function ensureHslFormatForDatabase(color) {
  // Если цвет уже в правильном HSL формате, возвращаем как есть
  if (isValidHslColor(color)) {
    return color
  }

  // Если цвет в hex формате, конвертируем в HSL
  if (color.startsWith('#')) {
    const rgb = hexToRgb(color)
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
  }

  // Если цвет в rgb/rgba формате, конвертируем в HSL
  if (color.startsWith('rgb')) {
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1])
      const g = parseInt(rgbMatch[2])
      const b = parseInt(rgbMatch[3])
      const hsl = rgbToHsl(r, g, b)
      return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
    }
  }

  // Для всех неправильных форматов возвращаем белый цвет
  return 'hsl(180, 0%, 100%)'
}

/**
 * Безопасное чтение цвета из базы данных с fallback
 */
function safeReadHslColor(color) {
  // Если цвет валидный HSL, возвращаем как есть
  if (isValidHslColor(color)) {
    return color
  }

  // Для всех неправильных форматов возвращаем белый цвет
  return 'hsl(180, 0%, 100%)'
}

/**
 * Обеспечить HSL формат цвета (для обратной совместимости)
 */
function ensureHslFormat(color) {
  // Если цвет уже в HSL формате, возвращаем как есть
  if (color.startsWith('hsl(')) {
    return color
  }

  // Если цвет в hex формате, конвертируем в HSL
  if (color.startsWith('#')) {
    const rgb = hexToRgb(color)
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
  }

  // Fallback для других форматов
  return 'hsl(180, 0%, 100%)'
}

/**
 * Сбросить фильтры к значениям по умолчанию (упрощенные)
 */
export function resetFilters() {
  mapSettings.filters = {
    revision: null,
    districts: [],
    typeEstates: []
  }
}

/**
 * Установить цвет для типа сословия
 */
export function setEstateTypeColor(estateType, color) {
  mapSettings.estateTypeColors[estateType] = color
}

/**
 * Получить все доступные режимы окраски (только два варианта)
 */
export function getAvailableColorModes() {
  return [
    { value: COLOR_MODES.BY_ESTATE_TYPE, label: 'По типу сословия' },
    { value: COLOR_MODES.BY_DISTRICT, label: 'По району' }
  ]
}

/**
 * Экспорт констант для использования в других компонентах
 */
export { COLOR_MODES, ESTATE_TYPE_COLORS }

/**
 * СКРИПТ ДЛЯ МИГРАЦИИ СУЩЕСТВУЮЩИХ ДАННЫХ В БАЗЕ ДАННЫХ
 *
 * Выполните этот SQL в Supabase SQL Editor для конвертации всех цветов в HSL формат:
 *
 * -- ШАГ 1: Обновляем цвета в правильном HSL формате (оставляем как есть)
 * UPDATE "Type_estate"
 * SET color = color
 * WHERE color ~ '^hsl\([0-9]+,\s*[0-9]+%,\s*[0-9]+%\)$'
 *   AND CAST(split_part(color, '(', 2) AS INTEGER) BETWEEN 0 AND 360
 *   AND CAST(split_part(split_part(color, ',', 2), '%', 1) AS INTEGER) BETWEEN 0 AND 100
 *   AND CAST(split_part(split_part(color, ',', 3), '%', 1) AS INTEGER) BETWEEN 0 AND 100;
 *
 * -- ШАГ 2: Конвертируем hex цвета в HSL формат
 * UPDATE "Type_estate"
 * SET color = CASE
 *   WHEN color = '#FF6B6B' THEN 'hsl(0, 85%, 55%)'
 *   WHEN color = '#4ECDC4' THEN 'hsl(178, 63%, 52%)'
 *   WHEN color = '#45B7D1' THEN 'hsl(197, 65%, 55%)'
 *   WHEN color = '#96CEB4' THEN 'hsl(136, 33%, 65%)'
 *   WHEN color = '#FFEAA7' THEN 'hsl(48, 100%, 67%)'
 *   WHEN color = '#DDA0DD' THEN 'hsl(282, 44%, 70%)'
 *   WHEN color = '#98D8C8' THEN 'hsl(174, 38%, 70%)'
 *   WHEN color = '#F7DC6F' THEN 'hsl(48, 100%, 67%)'
 *   WHEN color = '#BB8FCE' THEN 'hsl(262, 41%, 68%)'
 *   WHEN color = '#85C1E9' THEN 'hsl(204, 70%, 67%)'
 *   WHEN color = '#808080' THEN 'hsl(0, 0%, 50%)'
 *   WHEN color = '#00FF00' THEN 'hsl(120, 100%, 50%)'
 *   WHEN color = '#FF0000' THEN 'hsl(0, 100%, 50%)'
 *   ELSE 'hsl(180, 0%, 100%)'  -- Белый для неизвестных цветов
 * END
 * WHERE color ~ '^#[0-9A-Fa-f]{6}$';
 *
 * -- ШАГ 3: Устанавливаем белый цвет для всех остальных неправильных форматов
 * UPDATE "Type_estate"
 * SET color = 'hsl(180, 0%, 100%)'
 * WHERE color IS NULL
 *   OR color NOT LIKE 'hsl(%, %, %%)'
 *   OR color = '';
 */
