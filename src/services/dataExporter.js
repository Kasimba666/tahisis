import { supabase } from './supabase.js'

// Сервис для экспорта данных в различные форматы
export class DataExporter {
  constructor() {
    this.tableNames = [
      'District',
      'Estate',
      'Landowner',
      'Military_unit',
      'Report_record',
      'Revision_report',
      'Settlement',
      'Subtype_estate',
      'Type_affiliation',
      'Type_estate',
      'Type_religion',
      'Type_vector_layer',
      'Vector_layer',
      'Volost'
    ]
  }

  // Получение списка непустых таблиц
  async getNonEmptyTables() {
    const nonEmptyTables = []

    for (const tableName of this.tableNames) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.warn(`Error checking table ${tableName}:`, error)
          continue
        }

        if (count && count > 0) {
          nonEmptyTables.push({
            name: tableName,
            count: count,
            hasGeometry: this.hasGeometryFields(tableName)
          })
        }
      } catch (error) {
        console.warn(`Error checking table ${tableName}:`, error)
      }
    }

    return nonEmptyTables.sort((a, b) => b.count - a.count)
  }

  // Проверка наличия геометрических полей в таблице
  hasGeometryFields(tableName) {
    const geometryTables = ['Settlement', 'Vector_layer']
    return geometryTables.includes(tableName)
  }

  // Получение данных из конкретной таблицы
  async getTableData(tableName, options = {}) {
    const { limit = 1000, offset = 0 } = options

    try {
      let query = supabase
        .from(tableName)
        .select('*')
        .range(offset, offset + limit - 1)

      // Специальные обработки для некоторых таблиц
      if (tableName === 'Settlement') {
        query = query
          .not('name_old', 'is', null)
          .not('lat', 'is', null)
          .not('lon', 'is', null)
      }

      const { data, error, count } = await query

      if (error) throw error

      return {
        tableName,
        data: data || [],
        totalCount: count,
        hasMore: count ? (offset + limit) < count : false
      }
    } catch (error) {
      console.error(`Error loading data from ${tableName}:`, error)
      throw error
    }
  }

  // Получение всех данных из таблицы с пагинацией
  async getAllTableData(tableName, batchSize = 1000) {
    const allData = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const result = await this.getTableData(tableName, { limit: batchSize, offset })

      if (result.data.length > 0) {
        allData.push(...result.data)
      }

      hasMore = result.hasMore
      offset += batchSize
    }

    return {
      tableName,
      data: allData,
      totalCount: allData.length
    }
  }

  // Конвертация данных в GeoJSON формат
  convertToGeoJSON(tableName, data) {
    if (!this.hasGeometryFields(tableName)) {
      return this.convertToSimpleGeoJSON(data)
    }

    switch (tableName) {
      case 'Settlement':
        return this.convertSettlementsToGeoJSON(data)
      case 'Vector_layer':
        return this.convertVectorLayersToGeoJSON(data)
      default:
        return this.convertToSimpleGeoJSON(data)
    }
  }

  // Конвертация населенных пунктов в GeoJSON
  convertSettlementsToGeoJSON(settlements) {
    console.log('=== CONVERT SETTLEMENTS DEBUG ===')
    console.log('Input settlements count:', settlements?.length || 0)

    // Фильтруем поселения с координатами
    const validSettlements = settlements.filter(settlement => {
      const hasCoords = settlement.lat && settlement.lon
      if (!hasCoords) {
        console.log('Settlement without coordinates:', settlement.settlement_name_old)
      }
      return hasCoords
    })

    console.log('Valid settlements with coordinates:', validSettlements.length)

    const features = validSettlements.map((settlement, index) => {
      console.log(`Processing settlement ${index + 1}/${validSettlements.length}:`, settlement.settlement_name_old)

      // Подготавливаем данные о сословиях с ID для отображения на карте
      const estateTypes = this.prepareEstateTypesForMap(settlement)

      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [settlement.lon, settlement.lat]
        },
        properties: {
          // Базовая информация о населенном пункте
          id: settlement.settlement_id || settlement.id,
          name_old: settlement.settlement_name_old || settlement.name_old,
          name_modern: settlement.settlement_name_modern || settlement.name_modern,
          district_name: settlement.district_name,
          district_id: settlement.district_id,

          // Статистика населения
          population: {
            male: settlement.male || 0,
            female: settlement.female || 0,
            total: settlement.total || 0
          },

          // Количества для отображения
          counts: {
            revision_count: settlement.revision_count || 0,
            estates_count: settlement.estates_count || 0,
            religions_count: settlement.religions_count || 0
          },

          // Данные о сословиях для отображения на карте (с ID)
          estate_types: estateTypes,

          // Полные данные для фильтрации
          filter_data: {
            type_estate_ids: settlement.type_estate_ids || [],
            subtype_estate_ids: settlement.subtype_estate_ids || [],
            religion_ids: settlement.religion_ids || [],
            affiliation_ids: settlement.affiliation_ids || [],
            volost_ids: settlement.volost_ids || [],
            landowner_ids: settlement.landowner_ids || [],
            military_unit_ids: settlement.military_unit_ids || []
          },

          // Детальная информация о сословиях (если нужна)
          estates_detail: settlement.estates || [],

          // Метаданные
          created_at: settlement.created_at,
          updated_at: settlement.updated_at
        }
      }

      console.log(`Feature ${index + 1} created:`, {
        name: feature.properties.name_old,
        total: feature.properties.population.total,
        estate_types_count: feature.properties.estate_types.length
      })

      return feature
    })

    const result = {
      type: 'FeatureCollection',
      features: features,
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
        }
      },
      metadata: {
        tableName: 'Settlement',
        totalCount: settlements.length,
        exportedCount: features.length,
        exportedAt: new Date().toISOString(),
        summary: {
          totalPopulation: settlements.reduce((sum, s) => sum + (s.total || 0), 0),
          totalMale: settlements.reduce((sum, s) => sum + (s.male || 0), 0),
          totalFemale: settlements.reduce((sum, s) => sum + (s.female || 0), 0),
          uniqueEstateTypes: this.getUniqueEstateTypesCount(settlements),
          uniqueReligions: this.getUniqueReligionsCount(settlements)
        }
      }
    }

    console.log('=== CONVERT RESULT ===')
    console.log('Final features count:', result.features.length)
    console.log('Metadata totalCount:', result.metadata.totalCount)
    console.log('Metadata exportedCount:', result.metadata.exportedCount)

    return result
  }

  // Подготовка данных о типах сословий для отображения на карте
  prepareEstateTypesForMap(settlement) {
    if (!settlement.estates || !Array.isArray(settlement.estates)) {
      return []
    }

    // Группируем сословия по типам для отображения
    const estateTypeMap = new Map()

    settlement.estates.forEach(estate => {
      // Используем ID для группировки, но если ID нет, используем название как fallback
      const typeId = estate.Subtype_estate?.id_type_estate
      const subtypeId = estate.id_subtype_estate
      const religionId = estate.Subtype_estate?.id_type_religion

      // Если ID отсутствуют, пытаемся найти их по названиям или используем названия как ключи
      const fallbackTypeKey = estate.type_estate_name || 'Неизвестный тип'
      const fallbackSubtypeKey = estate.subtype_estate_name || 'Неизвестный подтип'

      // Определяем ключи для группировки
      const finalTypeId = typeId || fallbackTypeKey
      const finalSubtypeId = subtypeId || fallbackSubtypeKey

      // Получаем название типа сословия
      const typeName = estate.type_estate_name || fallbackTypeKey
      const subtypeName = estate.subtype_estate_name || fallbackSubtypeKey
      const religionName = estate.type_religion_name || 'Неизвестная религия'

      if (!estateTypeMap.has(finalTypeId)) {
        estateTypeMap.set(finalTypeId, {
          type_id: typeId, // Сохраняем оригинальный ID если он есть
          type_name: typeName,
          type_color: estate.Subtype_estate?.Type_estate?.color || null, // Цвет из базы данных
          subtypes: new Map(),
          total_male: 0,
          total_female: 0,
          total_count: 0,
          religions: new Set(),
          // Помечаем, если используются fallback ключи
          uses_fallback_keys: !typeId || !subtypeId
        })
      }

      const typeData = estateTypeMap.get(finalTypeId)

      // Добавляем подтип
      if (!typeData.subtypes.has(finalSubtypeId)) {
        typeData.subtypes.set(finalSubtypeId, {
          subtype_id: subtypeId, // Сохраняем оригинальный ID если он есть
          subtype_name: subtypeName,
          male: 0,
          female: 0,
          count: 0,
          religions: new Set(),
          uses_fallback_key: !subtypeId
        })
      }

      const subtypeData = typeData.subtypes.get(finalSubtypeId)
      subtypeData.male += estate.male || 0
      subtypeData.female += estate.female || 0
      subtypeData.count += 1
      subtypeData.religions.add(religionName)

      // Обновляем данные типа
      typeData.total_male += estate.male || 0
      typeData.total_female += estate.female || 0
      typeData.total_count += 1
      typeData.religions.add(religionName)
    })

    // Конвертируем в массив и сортируем по количеству
    return Array.from(estateTypeMap.values()).map(typeData => ({
      type_id: typeData.type_id, // Оригинальный ID или null
      type_name: typeData.type_name,
      type_color: typeData.type_color, // Цвет из базы данных
      total_male: typeData.total_male,
      total_female: typeData.total_female,
      total_count: typeData.total_count,
      religions: Array.from(typeData.religions),
      // Помечаем, что используются fallback данные
      uses_fallback_keys: typeData.uses_fallback_keys,
      subtypes: Array.from(typeData.subtypes.values()).map(subtypeData => ({
        subtype_id: subtypeData.subtype_id, // Оригинальный ID или null
        subtype_name: subtypeData.subtype_name,
        male: subtypeData.male,
        female: subtypeData.female,
        count: subtypeData.count,
        religions: Array.from(subtypeData.religions),
        uses_fallback_key: subtypeData.uses_fallback_key
      })).sort((a, b) => b.count - a.count)
    })).sort((a, b) => b.total_count - a.total_count)
  }

  // Получение количества уникальных типов сословий
  getUniqueEstateTypesCount(settlements) {
    const uniqueTypes = new Set()
    settlements.forEach(settlement => {
      if (settlement.type_estate_ids) {
        settlement.type_estate_ids.forEach(id => uniqueTypes.add(id))
      }
    })
    return uniqueTypes.size
  }

  // Получение количества уникальных религий
  getUniqueReligionsCount(settlements) {
    const uniqueReligions = new Set()
    settlements.forEach(settlement => {
      if (settlement.religion_ids) {
        settlement.religion_ids.forEach(id => uniqueReligions.add(id))
      }
    })
    return uniqueReligions.size
  }

  // Конвертация векторных слоев в GeoJSON
  convertVectorLayersToGeoJSON(vectorLayers) {
    const features = vectorLayers
      .filter(layer => layer.bbox)
      .map(layer => {
        try {
          const bbox = typeof layer.bbox === 'string' ? JSON.parse(layer.bbox) : layer.bbox

          return {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: this.bboxToPolygon(bbox)
            },
            properties: {
              id: layer.id,
              name: layer.name,
              file_path: layer.file_path,
              file_url: layer.file_url,
              mime_type: layer.mime_type,
              size: layer.size,
              feature_count: layer.feature_count,
              crs: layer.crs,
              tags: layer.tags,
              type_id: layer.id_type_vector_layer,
              created_at: layer.created_at,
              updated_at: layer.updated_at
            }
          }
        } catch (error) {
          console.warn(`Error converting vector layer ${layer.id}:`, error)
          return null
        }
      })
      .filter(feature => feature !== null)

    return {
      type: 'FeatureCollection',
      features: features,
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
        }
      },
      metadata: {
        tableName: 'Vector_layer',
        totalCount: vectorLayers.length,
        exportedCount: features.length,
        exportedAt: new Date().toISOString()
      }
    }
  }

  // Конвертация bbox в полигон
  bboxToPolygon(bbox) {
    if (!bbox || !Array.isArray(bbox) || bbox.length < 4) {
      return []
    }

    const [minLon, minLat, maxLon, maxLat] = bbox
    return [[
      [minLon, minLat],
      [maxLon, minLat],
      [maxLon, maxLat],
      [minLon, maxLat],
      [minLon, minLat] // Closing the polygon
    ]]
  }

  // Простая конвертация в GeoJSON (без геометрии)
  convertToSimpleGeoJSON(data) {
    return {
      type: 'FeatureCollection',
      features: data.map((item, index) => ({
        type: 'Feature',
        geometry: null,
        properties: {
          id: item.id,
          index: index,
          ...item
        }
      })),
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
        }
      },
      metadata: {
        tableName: 'Unknown',
        totalCount: data.length,
        exportedCount: data.length,
        exportedAt: new Date().toISOString()
      }
    }
  }

  // Экспорт населенных пунктов в GeoJSON с учетом фильтров
  async exportSettlementsToGeoJSON(settlementsData) {
    try {
      console.log('=== EXPORT DEBUG ===')
      console.log('Input settlements count:', settlementsData?.length || 0)
      console.log('Sample input settlement:', settlementsData?.[0] ? {
        name: settlementsData[0].settlement_name_old,
        total: settlementsData[0].total,
        estates_count: settlementsData[0].estates_count,
        has_estates: !!(settlementsData[0].estates && settlementsData[0].estates.length > 0)
      } : 'No data')

      if (!settlementsData || settlementsData.length === 0) {
        throw new Error('Нет данных для экспорта')
      }

      const geoJson = this.convertSettlementsToGeoJSON(settlementsData)

      console.log('=== EXPORT RESULT DEBUG ===')
      console.log('GeoJSON features count:', geoJson.features?.length || 0)
      console.log('Sample feature properties:', geoJson.features?.[0]?.properties ? {
        name: geoJson.features[0].properties.name_old,
        total: geoJson.features[0].properties.population.total,
        estates_count: geoJson.features[0].properties.counts.estates_count,
        estate_types_count: geoJson.features[0].properties.estate_types?.length || 0
      } : 'No features')

      console.log(`✓ Exported settlements: ${settlementsData.length} records`)

      return {
        success: true,
        data: geoJson,
        count: settlementsData.length,
        exportedAt: new Date().toISOString()
      }
    } catch (error) {
        console.error(`✗ Error exporting settlements:`, error)
        return {
          success: false,
          error: error.message,
          count: 0
        }
    }
  }

  // Экспорт всех непустых таблиц в GeoJSON
  async exportAllTablesToGeoJSON() {
    const nonEmptyTables = await this.getNonEmptyTables()
    const exportResults = {}

    for (const tableInfo of nonEmptyTables) {
      try {
        console.log(`Exporting ${tableInfo.name} (${tableInfo.count} records)...`)

        const result = await this.getAllTableData(tableInfo.name)
        const geoJson = this.convertToGeoJSON(tableInfo.name, result.data)

        exportResults[tableInfo.name] = {
          success: true,
          data: geoJson,
          count: result.totalCount
        }

        console.log(`✓ Exported ${tableInfo.name}: ${result.totalCount} records`)
      } catch (error) {
        console.error(`✗ Error exporting ${tableInfo.name}:`, error)
        exportResults[tableInfo.name] = {
          success: false,
          error: error.message,
          count: 0
        }
      }
    }

    return {
      results: exportResults,
      summary: {
        totalTables: nonEmptyTables.length,
        successfulExports: Object.values(exportResults).filter(r => r.success).length,
        totalRecords: Object.values(exportResults).reduce((sum, r) => sum + (r.count || 0), 0),
        exportedAt: new Date().toISOString()
      }
    }
  }

  // Получение статистики по всем таблицам
  async getDatabaseStatistics() {
    const nonEmptyTables = await this.getNonEmptyTables()
    const stats = {
      tables: nonEmptyTables,
      totalTables: nonEmptyTables.length,
      totalRecords: nonEmptyTables.reduce((sum, table) => sum + table.count, 0),
      geometryTables: nonEmptyTables.filter(table => table.hasGeometry).length,
      generatedAt: new Date().toISOString()
    }

    return stats
  }
}

// Создаем экземпляр для экспорта
export const dataExporter = new DataExporter()
