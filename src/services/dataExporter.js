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
    const features = settlements
      .filter(settlement => settlement.lat && settlement.lon)
      .map(settlement => {
        // Подготавливаем данные о сословиях для отображения на карте
        const estateTypes = this.prepareEstateTypesForMap(settlement)

        return {
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

            // Данные о сословиях для отображения на карте
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
      })

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
  }

  // Подготовка данных о типах сословий для отображения на карте
  prepareEstateTypesForMap(settlement) {
    if (!settlement.estates || !Array.isArray(settlement.estates)) {
      return []
    }

    // Группируем сословия по типам для отображения
    const estateTypeMap = new Map()

    settlement.estates.forEach(estate => {
      const typeName = estate.type_estate_name || 'Неизвестный'
      const subtypeName = estate.subtype_estate_name || 'Неизвестный'
      const religionName = estate.type_religion_name || 'Неизвестная'

      if (!estateTypeMap.has(typeName)) {
        estateTypeMap.set(typeName, {
          type_name: typeName,
          subtypes: new Map(),
          total_male: 0,
          total_female: 0,
          total_count: 0,
          religions: new Set()
        })
      }

      const typeData = estateTypeMap.get(typeName)

      // Добавляем подтип
      if (!typeData.subtypes.has(subtypeName)) {
        typeData.subtypes.set(subtypeName, {
          subtype_name: subtypeName,
          male: 0,
          female: 0,
          count: 0,
          religions: new Set()
        })
      }

      const subtypeData = typeData.subtypes.get(subtypeName)
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
      type_name: typeData.type_name,
      total_male: typeData.total_male,
      total_female: typeData.total_female,
      total_count: typeData.total_count,
      religions: Array.from(typeData.religions),
      subtypes: Array.from(typeData.subtypes.values()).map(subtypeData => ({
        subtype_name: subtypeData.subtype_name,
        male: subtypeData.male,
        female: subtypeData.female,
        count: subtypeData.count,
        religions: Array.from(subtypeData.religions)
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
      console.log(`Exporting settlements to GeoJSON (${settlementsData.length} records)...`)

      const geoJson = this.convertSettlementsToGeoJSON(settlementsData)

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
