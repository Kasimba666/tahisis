import { supabase, supabaseAdmin } from './supabase.js'

// Сервис для работы с векторными слоями

export class VectorLayerService {
  constructor() {
    this.bucketName = 'vector-layers'
  }

  // Создание storage bucket (если не существует)
  async createBucket() {
    try {
      const { data, error } = await supabase.storage.createBucket(this.bucketName, {
        public: true,
        allowedMimeTypes: [
          'application/geo+json',
          'application/json',
          'application/vnd.google-earth.kml+xml',
          'application/zip',
          'application/geopackage'
        ],
        fileSizeLimit: 52428800 // 50MB
      })

      if (error && error.message !== 'The resource already exists') {
        throw error
      }

      return { data, error }
    } catch (error) {
      throw error
    }
  }

  // Загрузка файла в storage
  async uploadFile(file, fileName = null) {
    try {
      // Создаем уникальное имя файла
      const fileExt = file.name.split('.').pop()
      const uniqueName = fileName || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `vector-layers/${uniqueName}`

      // Загружаем файл
      const { data: uploadData, error: uploadError } = await supabase.storage
          .from(this.bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

      if (uploadError) throw uploadError

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
          .from(this.bucketName)
          .getPublicUrl(filePath)

      return {
        filePath,
        publicUrl: urlData.publicUrl,
        fileName: uniqueName,
        originalName: file.name,
        size: file.size,
        type: file.type
      }
    } catch (error) {
      throw error
    }
  }

  // Удаление файла из storage
  async deleteFile(filePath) {
    try {
      const { data, error } = await supabase.storage
          .from(this.bucketName)
          .remove([filePath])

      if (error) throw error

      return data
    } catch (error) {
      throw error
    }
  }

  // Получение списка файлов в storage
  async listFiles() {
    try {
      const { data, error } = await supabase.storage
          .from(this.bucketName)
          .list('vector-layers')

      if (error) throw error

      return data
    } catch (error) {
      throw error
    }
  }

  // CRUD операции для Type_vector_layer
  async getLayerTypes() {
    try {
      const { data, error } = await supabaseAdmin
          .from('Type_vector_layer')
          .select('*')
          .order('name')

      if (error) throw error

      return data
    } catch (error) {
      throw error
    }
  }

  async createLayerType(name) {
    try {
      const { data, error } = await supabaseAdmin
          .from('Type_vector_layer')
          .insert([{ name }])
          .select()

      if (error) throw error

      return data[0]
    } catch (error) {
      throw error
    }
  }

  async updateLayerType(id, name) {
    try {
      const { data, error } = await supabaseAdmin
          .from('Type_vector_layer')
          .update({ name })
          .eq('id', id)
          .select()

      if (error) throw error

      return data[0]
    } catch (error) {
      throw error
    }
  }

  async deleteLayerType(id) {
    try {
      const { error } = await supabaseAdmin
          .from('Type_vector_layer')
          .delete()
          .eq('id', id)

      if (error) throw error

      return true
    } catch (error) {
      throw error
    }
  }

  // CRUD операции для Vector_layer
  async getVectorLayers() {
    try {
      const { data, error } = await supabase
          .from('Vector_layer')
          .select(`
            *,
            Type_vector_layer ( name )
          `)
          .order('id')

      if (error) throw error

      return data.map(layer => ({
        ...layer,
        type_vector_layer_name: layer.Type_vector_layer?.name || ""
      }))
    } catch (error) {
      throw error
    }
  }

  async createVectorLayer(layerData) {
    try {
      const { data, error } = await supabaseAdmin
          .from('Vector_layer')
          .insert([layerData])
          .select(`
            *,
            Type_vector_layer ( name )
          `)

      if (error) throw error

      return {
        ...data[0],
        type_vector_layer_name: data[0].Type_vector_layer?.name || ""
      }
    } catch (error) {
      throw error
    }
  }

  async updateVectorLayer(id, layerData) {
    try {
      const { data, error } = await supabaseAdmin
          .from('Vector_layer')
          .update(layerData)
          .eq('id', id)
          .select(`
            *,
            Type_vector_layer ( name )
          `)

      if (error) throw error

      return {
        ...data[0],
        type_vector_layer_name: data[0].Type_vector_layer?.name || ""
      }
    } catch (error) {
      throw error
    }
  }

  async deleteVectorLayer(id) {
    try {
      // Получаем информацию о слое для удаления файла
      const { data: layerData, error: fetchError } = await supabaseAdmin
          .from('Vector_layer')
          .select('file_path, name')
          .eq('id', id)
          .single()

      if (fetchError) throw fetchError

      // Удаляем запись из базы данных сначала
      const { error: deleteError } = await supabaseAdmin
          .from('Vector_layer')
          .delete()
          .eq('id', id)

      if (deleteError) throw deleteError

      // Удаляем файл из storage после успешного удаления записи
      if (layerData?.file_path) {
        try {
          await this.deleteFile(layerData.file_path)
        } catch (fileError) {
          // Не прерываем выполнение, если файл не удалось удалить
        }
      }

      return true
    } catch (error) {
      throw error
    }
  }

  // Получение публичного URL файла
  getPublicUrl(filePath) {
    const { data } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath)

    return data.publicUrl
  }

  // Валидация файла
  validateFile(file) {
    // Проверяем размер файла
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      throw new Error(`Файл слишком большой! Размер: ${this.formatFileSize(file.size)}, максимальный размер: 50MB`)
    }

    // Проверяем тип файла по MIME типу
    const allowedMimeTypes = [
      'application/geo+json',
      'application/json',
      'application/vnd.google-earth.kml+xml',
      'application/zip',
      'application/geopackage'
    ]

    if (!allowedMimeTypes.includes(file.type)) {
      // Дополнительная проверка по расширению файла
      const fileName = file.name.toLowerCase()
      const allowedExtensions = ['.geojson', '.json', '.kml', '.zip', '.gpkg']

      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
      if (!hasValidExtension) {
        throw new Error(`Неподдерживаемый формат файла! Поддерживаются: ${allowedExtensions.join(', ')}`)
      }
    }

    return true
  }

  // Определение типа слоя по расширению файла
  getLayerTypeByFileName(fileName) {
    const name = fileName.toLowerCase()

    if (name.includes('.geojson') || name.includes('.json')) {
      return 'GeoJSON'
    } else if (name.includes('.kml')) {
      return 'KML'
    } else if (name.includes('.zip')) {
      return 'Shapefile (ZIP)'
    } else if (name.includes('.gpkg')) {
      return 'GeoPackage'
    }

    return 'Неизвестный'
  }

  // Форматирование размера файла
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}

// Создаем экземпляр сервиса
export const vectorLayerService = new VectorLayerService()

// Инициализация сервиса (создание bucket если нужно)
export const initializeVectorLayerService = async () => {
  try {
    await vectorLayerService.createBucket()
  } catch (error) {
  }
}
