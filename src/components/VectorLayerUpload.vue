<template>
  <div class="vector-layer-upload">
    <el-upload
      ref="upload"
      class="upload-demo"
      drag
      :action="uploadUrl"
      :headers="uploadHeaders"
      :on-success="handleUploadSuccess"
      :on-error="handleUploadError"
      :on-change="handleFileChange"
      :before-upload="beforeUpload"
      :file-list="fileList"
      :auto-upload="false"
      :multiple="false"
      :limit="1"
      :accept="acceptedTypes"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        Перетащите файлы сюда или <em>нажмите для выбора</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          {{ tipText }}
        </div>
      </template>
    </el-upload>

    <div class="upload-controls">
      <el-button type="primary" @click="submitUpload" :loading="uploading">
        {{ uploadButtonText }}
      </el-button>
      <el-button @click="clearFiles">Очистить</el-button>
    </div>

    <!-- Прогресс загрузки -->
    <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
      <el-progress :percentage="uploadProgress" :status="progressStatus" />
    </div>

    <!-- Результаты загрузки -->
    <div v-if="uploadResults.length > 0" class="upload-results">
      <h4>Результаты загрузки:</h4>
      <el-alert
        v-for="(result, index) in uploadResults"
        :key="index"
        :type="result.success ? 'success' : 'error'"
        :title="result.success ? 'Успешно' : 'Ошибка'"
        :description="result.message"
        :closable="false"
        show-icon
      />
    </div>
  </div>
</template>

<script>
import { vectorLayerService } from "@/services/vectorLayers"
import { UploadFilled } from '@element-plus/icons-vue'

export default {
  name: "VectorLayerUpload",
  components: {
    UploadFilled
  },
  props: {
    // Разрешить множественную загрузку
    multiple: {
      type: Boolean,
      default: true
    },
    // Автоматически создавать записи в базе данных
    autoCreateRecords: {
      type: Boolean,
      default: true
    },
    // Типы файлов для загрузки
    layerTypes: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      fileList: [],
      uploading: false,
      uploadProgress: 0,
      uploadResults: [],
      uploadUrl: '',
      uploadHeaders: {}
    }
  },
  computed: {
    acceptedTypes() {
      return '.geojson,.json,.kml,.zip,.gpkg'
    },

    tipText() {
      return 'Поддерживаются форматы: GeoJSON, KML, SHP (ZIP), GeoPackage. Максимальный размер: 50MB'
    },

    uploadButtonText() {
      return this.uploading ? 'Загрузка...' : 'Загрузить файлы'
    },

    progressStatus() {
      return this.uploadProgress === 100 ? 'success' : null
    }
  },
  methods: {
    beforeUpload(file) {
      try {
        // Валидируем файл через сервис
        vectorLayerService.validateFile(file)
        return true
      } catch (error) {
        this.$message.error(error.message)
        return false
      }
    },

    async submitUpload() {
      // Проверяем файлы в локальном состоянии или компоненте el-upload
      const uploadComponent = this.$refs.upload

      console.log('Upload component:', uploadComponent)
      console.log('Upload files:', uploadComponent?.uploadFiles)
      console.log('Local file list:', this.fileList)

      let file = null

      // Сначала пытаемся получить файл из локального списка
      if (this.fileList.length > 0) {
        file = this.fileList[0].raw
      }
      // Если не нашли, пробуем получить из компонента
      else if (uploadComponent?.uploadFiles?.length > 0) {
        file = uploadComponent.uploadFiles[0].raw
      }

      if (!file) {
        this.$message.warning('Выберите файл для загрузки')
        return
      }

      console.log('Selected file:', file)

      this.uploading = true
      this.uploadProgress = 10
      this.uploadResults = []

      try {
        // Шаг 1: Загружаем файл в Supabase Storage
        this.uploadProgress = 30
        const uploadResult = await vectorLayerService.uploadFile(file)

        // Шаг 2: Определяем тип слоя по расширению файла
        this.uploadProgress = 50
        const layerTypeName = vectorLayerService.getLayerTypeByFileName(file.name)
        let layerTypeId = this.layerTypes[0]?.id // По умолчанию первый тип

        // Ищем соответствующий тип слоя
        if (layerTypeName !== 'Неизвестный') {
          const foundType = this.layerTypes.find(t =>
            t.name.toLowerCase().includes(layerTypeName.toLowerCase())
          )
          if (foundType) {
            layerTypeId = foundType.id
          }
        }

        // Шаг 3: Создаем запись в базе данных если включено
        this.uploadProgress = 70
        if (this.autoCreateRecords) {
          await vectorLayerService.createVectorLayer({
            name: file.name.replace(/\.[^/.]+$/, ""), // Удаляем расширение
            file_path: uploadResult.filePath,
            file_url: uploadResult.publicUrl,
            crs: 'EPSG:4326',
            visible: true, // По умолчанию видимый
            id_type_vector_layer: layerTypeId
          })
        }

        this.uploadProgress = 100

        // Показываем успешный результат
        this.uploadResults.push({
          success: true,
          message: `Файл ${file.name} успешно загружен в storage и добавлен в базу данных`
        })

        this.$message.success(`Файл ${file.name} успешно загружен`)

        // Очищаем файлы после успешной загрузки
        this.clearFiles()

        // Уведомляем родительский компонент
        this.$emit('uploadComplete', {
          success: true,
          results: this.uploadResults,
          fileName: file.name,
          uploadResult
        })

      } catch (error) {
        console.error('Upload error:', error)
        this.uploadResults.push({
          success: false,
          message: `Ошибка загрузки файла: ${error.message}`
        })
        this.$message.error(`Ошибка загрузки файла: ${error.message}`)
      } finally {
        this.uploading = false
        this.uploadProgress = 0
      }
    },

    handleUploadSuccess(response, file, fileList) {
      console.log('Upload success:', response)
    },

    handleUploadError(error, file, fileList) {
      console.error('Upload error:', error)
      this.$message.error(`Ошибка загрузки файла ${file.name}`)
    },

    handleFileChange(file, fileList) {
      console.log('File changed:', file)
      console.log('File list:', fileList)
      this.fileList = fileList
    },

    clearFiles() {
      this.fileList = []
      this.uploadResults = []
      if (this.$refs.upload) {
        this.$refs.upload.clearFiles()
      }
    },

    // Метод для программного добавления файлов
    addFiles(files) {
      this.fileList = [...this.fileList, ...files]
    },

    // Метод для получения списка загруженных файлов
    getUploadedFiles() {
      return this.fileList
    }
  },

  emits: ['uploadComplete']
}
</script>

<style scoped>
.vector-layer-upload {
  .upload-controls {
    margin-top: 1rem;
    display: flex;
    gap: 1rem;
  }

  .upload-progress {
    margin-top: 1rem;
  }

  .upload-results {
    margin-top: 1rem;

    h4 {
      margin: 0 0 1rem 0;
      font-size: 1rem;
      color: var(--text-primary);
    }
  }
}
</style>
