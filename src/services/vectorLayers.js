import { supabase, supabaseAdmin } from './supabase.js'

// Сервис для работы с векторными слоями

export class VectorLayerService {
  constructor() {
    this.bucketName = 'vector-layers'
  }

  // Создание storage bucket (если не существует)
  createBucket() {
    // Проверяем, существует ли bucket
    return supabase.storage.listBuckets()
      .then(({ data: buckets, error: listError }) => {
        if (listError) {
          console.error('Error listing buckets:', listError)
          // Если ошибка связана с RLS или разрешениями, пропускаем создание bucket
          if (listError.message?.includes('row-level security') || listError.message?.includes('permission')) {
            console.warn('Insufficient permissions to list buckets. Assuming bucket exists and skipping creation.')
            return { data: { name: this.bucketName }, error: null }
          }
          throw listError
        }

        // Проверяем, существует ли наш bucket
        const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName)

        if (bucketExists) {
          // console.log(`Bucket '${this.bucketName}' already exists`)
          return { data: { name: this.bucketName }, error: null }
        }

        // Создаем bucket если он не существует
        return supabase.storage.createBucket(this.bucketName, {
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
          .then(({ data, error }) => {
            if (error) {
              // Обрабатываем ошибку когда bucket уже существует
              if (error.message?.includes('already exists') || error.message?.includes('already been registered')) {
                console.warn(`Bucket '${this.bucketName}' already exists. Skipping creation.`)
                return { data: { name: this.bucketName }, error: null }
              }
              // Обрабатываем ошибку RLS (Row Level Security)
              if (error.message?.includes('row-level security') || error.message?.includes('permission')) {
                console.warn(`Insufficient permissions to create bucket '${this.bucketName}'. This is normal if bucket should be created manually in Supabase dashboard.`)
                return { data: null, error: null }
              }
              console.error('Error creating bucket:', error)
              throw error
            }

            // console.log(`Bucket '${this.bucketName}' created successfully`)
            return { data, error }
          })
      })
      .catch((error) => {
        // Обрабатываем ошибку когда bucket уже существует
        if (error.message?.includes('already exists') || error.message?.includes('already been registered')) {
          console.warn(`Bucket '${this.bucketName}' already exists. Skipping creation.`)
          return { data: { name: this.bucketName }, error: null }
        }
        // Обрабатываем ошибку RLS в catch блоке тоже
        if (error.message?.includes('row-level security') || error.message?.includes('permission')) {
          console.warn(`Insufficient permissions to create bucket '${this.bucketName}'. This is normal if bucket should be created manually in Supabase dashboard.`)
          return { data: null, error: null }
        }
        console.error('Error in createBucket:', error)
        throw error
      })
  }

  // Загрузка файла в storage
  uploadFile(file, fileName = null) {
    // Создаем уникальное имя файла
    const fileExt = file.name.split('.').pop()
    const uniqueName = fileName || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `vector-layers/${uniqueName}`

    // Загружаем файл
    return supabase.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })
      .then(({ data: uploadData, error: uploadError }) => {
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
      })
      .catch((error) => {
        throw error
      })
  }

  // Удаление файла из storage
  deleteFile(filePath) {
    return supabase.storage
      .from(this.bucketName)
      .remove([filePath])
      .then(({ data, error }) => {
        if (error) throw error
        return data
      })
      .catch((error) => {
        throw error
      })
  }

  // Получение списка файлов в storage
  listFiles() {
    return supabase.storage
      .from(this.bucketName)
      .list('vector-layers')
      .then(({ data, error }) => {
        if (error) throw error
        return data
      })
      .catch((error) => {
        throw error
      })
  }

  // CRUD операции для Type_vector_layer
  getLayerTypes() {
    return supabaseAdmin
      .from('Type_vector_layer')
      .select('*')
      .order('name')
      .then(({ data, error }) => {
        if (error) throw error
        return data
      })
      .catch((error) => {
        throw error
      })
  }

  createLayerType(name) {
    return supabaseAdmin
      .from('Type_vector_layer')
      .insert([{ name }])
      .select()
      .then(({ data, error }) => {
        if (error) throw error
        return data[0]
      })
      .catch((error) => {
        throw error
      })
  }

  updateLayerType(id, name) {
    return supabaseAdmin
      .from('Type_vector_layer')
      .update({ name })
      .eq('id', id)
      .select()
      .then(({ data, error }) => {
        if (error) throw error
        return data[0]
      })
      .catch((error) => {
        throw error
      })
  }

  deleteLayerType(id) {
    return supabaseAdmin
      .from('Type_vector_layer')
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) throw error
        return true
      })
      .catch((error) => {
        throw error
      })
  }

  // CRUD операции для Vector_layer
  getVectorLayers() {
    return supabase
      .from('Vector_layer')
      .select(`
        *,
        Type_vector_layer ( name )
      `)
      .order('id')
      .then(({ data, error }) => {
        if (error) throw error

        return data.map(layer => ({
          ...layer,
          type_vector_layer_name: layer.Type_vector_layer?.name || ""
        }))
      })
      .catch((error) => {
        throw error
      })
  }

  createVectorLayer(layerData) {
    return supabaseAdmin
      .from('Vector_layer')
      .insert([layerData])
      .select(`
        *,
        Type_vector_layer ( name )
      `)
      .then(({ data, error }) => {
        if (error) throw error

        return {
          ...data[0],
          type_vector_layer_name: data[0].Type_vector_layer?.name || ""
        }
      })
      .catch((error) => {
        throw error
      })
  }

  updateVectorLayer(id, layerData) {
    return supabaseAdmin
      .from('Vector_layer')
      .update(layerData)
      .eq('id', id)
      .select(`
        *,
        Type_vector_layer ( name )
      `)
      .then(({ data, error }) => {
        if (error) throw error

        return {
          ...data[0],
          type_vector_layer_name: data[0].Type_vector_layer?.name || ""
        }
      })
      .catch((error) => {
        throw error
      })
  }

  deleteVectorLayer(id) {
    // Получаем информацию о слое для удаления файла
    return supabaseAdmin
      .from('Vector_layer')
      .select('file_path, name')
      .eq('id', id)
      .single()
      .then(({ data: layerData, error: fetchError }) => {
        if (fetchError) throw fetchError

        // Удаляем запись из базы данных сначала
        return supabaseAdmin
          .from('Vector_layer')
          .delete()
          .eq('id', id)
          .then(({ error: deleteError }) => {
            if (deleteError) throw deleteError

            // Удаляем файл из storage после успешного удаления записи
            if (layerData?.file_path) {
              return this.deleteFile(layerData.file_path)
                .then(() => true)
                .catch((fileError) => {
                  // Не прерываем выполнение, если файл не удалось удалить
                  return true
                })
            }

            return true
          })
      })
      .catch((error) => {
        throw error
      })
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

// Инициализация сервиса (проверка bucket)
export const initializeVectorLayerService = () => {
  // Пытаемся проверить существование bucket
  return supabase.storage.listBuckets()
    .then(({ data: buckets, error: listError }) => {
      if (listError) {
        // Если не можем проверить список buckets из-за RLS, пытаемся создать bucket
        if (listError.message?.includes('row-level security') || listError.message?.includes('permission')) {
          console.warn('Cannot verify bucket existence due to permissions. Attempting to create vector-layers bucket...')
          return vectorLayerService.createBucket()
            .then(() => {
              console.log('Vector-layers bucket created successfully')
            })
            .catch((createError) => {
              console.warn('Could not create vector-layers bucket automatically. Please create it manually in Supabase dashboard.')
            })
        } else {
          console.warn('Cannot verify bucket existence due to permissions. Assuming vector-layers bucket exists.')
        }
        return
      }

      const bucketExists = buckets?.some(bucket => bucket.name === 'vector-layers')

      if (bucketExists) {
        console.log('Vector-layers bucket already exists in Supabase.')
      } else {
        console.warn('Vector-layers bucket not found. Attempting to create it...')
        return vectorLayerService.createBucket()
          .then(() => {
            console.log('Vector-layers bucket created successfully')
          })
          .catch((createError) => {
            console.warn('Could not create vector-layers bucket automatically. Please create it manually in Supabase dashboard.')
          })
      }
    })
    .catch((error) => {
      console.warn('Error during vector layer service initialization:', error.message)
    })
}
