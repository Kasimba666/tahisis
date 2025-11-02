<template>
  <div class="pg-vector-layers">
    <h3>Векторные слои</h3>

    <div class="upload-section">
      <el-tabs v-model="activeTab" type="card">
        <el-tab-pane label="Загрузить новые файлы" name="upload">
          <VectorLayerUpload
            :layer-types="layerTypeOptions"
            @upload-complete="handleUploadComplete"
          />
        </el-tab-pane>
        <el-tab-pane label="Привязать файлы к записям" name="link">
          <div class="link-files-section">
            <p>Выберите файлы и укажите ID записи, к которой их нужно привязать:</p>

            <el-upload
              ref="linkUpload"
              class="upload-demo"
              drag
              :action="uploadUrl"
              :headers="uploadHeaders"
              :on-success="handleLinkUploadSuccess"
              :on-error="handleLinkUploadError"
              :before-upload="beforeLinkUpload"
              :file-list="linkFileList"
              :auto-upload="false"
              multiple
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                Перетащите файлы сюда или <em>нажмите для выбора</em>
              </div>
            </el-upload>

            <div class="link-controls">
              <el-input-number
                v-model="targetRecordId"
                :min="1"
                placeholder="ID записи"
                style="width: 150px; margin-right: 1rem;"
              />
              <el-button type="primary" @click="linkFilesToRecord" :loading="linking">
                Привязать к записи
              </el-button>
              <el-button @click="clearLinkFiles">Очистить</el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <div class="table-info">
      <el-alert
          type="info"
          :closable="false"
          show-icon
      >
        <template #title>
          Всего слоев: {{ totalRecords }}
        </template>
      </el-alert>
    </div>

    <div class="table-header">
      <el-button type="success" size="small" @click="addRow">Добавить слой</el-button>
    </div>

    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />

      <el-table-column label="Название">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-input v-model="editRow.name" placeholder="Название слоя" />
          </div>
          <div v-else>
            {{ row.name }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Файл">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-input v-model="editRow.file_path" placeholder="Путь к файлу" />
          </div>
          <div v-else>
            <a v-if="row.file_url" :href="row.file_url" target="_blank">{{ row.file_path }}</a>
            <span v-else>{{ row.file_path }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Тип слоя">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-select v-model="editRow.id_type_vector_layer" placeholder="Выбрать тип">
              <el-option
                  v-for="item in layerTypeOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
              />
            </el-select>
          </div>
          <div v-else>
            {{ row.type_vector_layer_name }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Размер (байт)">
        <template #default="{ row }">
          {{ formatFileSize(row.size) }}
        </template>
      </el-table-column>

      <el-table-column label="Объектов">
        <template #default="{ row }">
          {{ row.feature_count || 0 }}
        </template>
      </el-table-column>

      <el-table-column label="Система координат">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-input v-model="editRow.crs" placeholder="EPSG:4326" />
          </div>
          <div v-else>
            {{ row.crs }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Действия" width="320">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-button type="success" size="small" @click="updateRow(row.id)">Сохранить</el-button>
            <el-button type="warning" size="small" @click="cancelEdit">Отменить</el-button>
          </div>
          <div v-else>
            <el-button type="primary" size="small" @click="startEdit(row)">Редактировать</el-button>
            <el-button type="danger" size="small" @click="deleteRow(row.id)">Удалить</el-button>
            <el-button type="info" size="small" @click="downloadLayer(row)">Скачать</el-button>
            <el-button v-if="row.file_url" size="small" @click="editStyle(row)">🎨 Стиль</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <VectorLayerStyleEditor
      v-model="styleEditorVisible"
      :layer="currentEditingLayer"
      @save="handleStyleSave"
    />
  </div>
</template>

<script>
import { vectorLayerService } from "@/services/vectorLayers"
import { supabaseAdmin } from "@/services/supabase"
import VectorLayerUpload from '@/components/VectorLayerUpload.vue'
import VectorLayerStyleEditor from '@/components/VectorLayerStyleEditor.vue'

export default {
  name: "PgVectorLayers",
  components: {
    VectorLayerUpload,
    VectorLayerStyleEditor
  },
  data() {
    return {
      tableData: [],
      layerTypeOptions: [],
      editRowId: null,
      editRow: {},
      activeTab: 'upload',
      linkFileList: [],
      targetRecordId: null,
      linking: false,
      styleEditorVisible: false,
      currentEditingLayer: null
    }
  },
  computed: {
    totalRecords() {
      return this.tableData.length
    }
  },
  methods: {
    async fetchData() {
      try {
        this.tableData = await vectorLayerService.getVectorLayers()
        this.layerTypeOptions = await vectorLayerService.getLayerTypes()
      } catch (error) {
        // console.error("Error fetching data:", error)
        this.$message.error("Ошибка загрузки данных")
      }
    },

    handleUploadComplete(result) {
      // console.log('Upload completed:', result)
      if (result.success) {
        this.fetchData() // Обновляем таблицу после успешной загрузки
        // Обновляем векторные слои на картах
        this.refreshMapLayers()
      }
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },

    startEdit(row) {
      this.editRowId = row.id
      this.editRow = { ...row }
    },

    cancelEdit() {
      this.editRowId = null
      this.editRow = {}
      this.fetchData()
    },

    async updateRow(id) {
      try {
        await vectorLayerService.updateVectorLayer(id, {
          name: this.editRow.name,
          file_path: this.editRow.file_path,
          id_type_vector_layer: this.editRow.id_type_vector_layer,
          crs: this.editRow.crs
        })
        this.cancelEdit()
      } catch (error) {
        // console.error("Error updating vector layer:", error)
        this.$message.error("Ошибка обновления слоя")
      }
    },

    async deleteRow(id) {
      try {
        await vectorLayerService.deleteVectorLayer(id)
        this.$message.success("Слой удален")
        this.fetchData()
      } catch (error) {
        // console.error("Error deleting vector layer:", error)
        this.$message.error("Ошибка удаления слоя")
      }
    },

    downloadLayer(row) {
      if (row.file_url) {
        window.open(row.file_url, '_blank')
      }
    },

    async addRow() {
      try {
        // Проверяем наличие типов слоев
        if (this.layerTypeOptions.length === 0) {
          this.$message.warning("Сначала создайте типы векторных слоев")
          return
        }

        // Создаем новую запись с минимальными обязательными данными
        const layerData = await vectorLayerService.createVectorLayer({
          name: "Новый слой",
          file_path: "",
          mime_type: "",
          size: 0,
          feature_count: 0,
          crs: "EPSG:4326",
          id_type_vector_layer: this.layerTypeOptions[0].id // Используем первый доступный тип
        })

        this.tableData.push(layerData)
        this.startEdit(layerData)
        this.$message.success("Новый слой создан, заполните необходимые поля")
      } catch (error) {
        // console.error("Error adding vector layer:", error)
        this.$message.error(`Ошибка добавления слоя: ${error.message}`)
      }
    },

    beforeLinkUpload(file) {
      try {
        vectorLayerService.validateFile(file)
        return true
      } catch (error) {
        this.$message.error(error.message)
        return false
      }
    },

    async linkFilesToRecord() {
      if (!this.targetRecordId) {
        this.$message.warning('Укажите ID записи')
        return
      }

      if (this.linkFileList.length === 0) {
        this.$message.warning('Выберите файлы для загрузки')
        return
      }

      this.linking = true

      try {
        // Проверяем существование записи
        const { data: existingRecord, error: fetchError } = await supabaseAdmin
          .from('Vector_layer')
          .select('id, name')
          .eq('id', this.targetRecordId)
          .single()

        if (fetchError || !existingRecord) {
          this.$message.error(`Запись с ID ${this.targetRecordId} не найдена`)
          return
        }

        const results = []

        for (const file of this.linkFileList) {
          try {
            // Валидируем файл
            vectorLayerService.validateFile(file)

            // Загружаем файл в storage
            const uploadResult = await vectorLayerService.uploadFile(file)

            // Определяем тип слоя
            const layerTypeName = vectorLayerService.getLayerTypeByFileName(file.name)
            const layerType = this.layerTypeOptions.find(t =>
              t.name.toLowerCase().includes(layerTypeName.toLowerCase())
            )
            const layerTypeId = layerType?.id || this.layerTypeOptions[0]?.id

            // Создаем новую запись вместо обновления существующей
            const newLayerData = {
              name: file.name.replace(/\.[^/.]+$/, ""),
              file_path: uploadResult.filePath,
              file_url: uploadResult.publicUrl,
              mime_type: file.type,
              size: file.size,
              feature_count: 0,
              crs: 'EPSG:4326',
              id_type_vector_layer: layerTypeId
            }

            const createdLayer = await vectorLayerService.createVectorLayer(newLayerData)
            results.push({ success: true, fileName: file.name, layerId: createdLayer.id })

          } catch (fileError) {
            // console.error(`Error processing ${file.name}:`, fileError)
            results.push({ success: false, fileName: file.name, error: fileError.message })
          }
        }

        // Показываем результаты
        const successCount = results.filter(r => r.success).length
        const errorCount = results.filter(r => !r.success).length

        if (errorCount === 0) {
          this.$message.success(`Все файлы (${successCount}) успешно привязаны к записи`)
        } else if (successCount > 0) {
          this.$message.warning(`${successCount} файлов загружено, ${errorCount} ошибок`)
        } else {
          this.$message.error(`Не удалось загрузить файлы (${errorCount} ошибок)`)
        }

        // Показываем детальную информацию об ошибках
        results.filter(r => !r.success).forEach(result => {
          this.$message.error(`Ошибка с файлом ${result.fileName}: ${result.error}`)
        })

        this.clearLinkFiles()
        this.fetchData()

      } catch (error) {
        // console.error('Error linking files:', error)
        this.$message.error('Ошибка привязки файлов')
      } finally {
        this.linking = false
      }
    },

    handleLinkUploadSuccess(response, file, fileList) {
      // console.log('Link upload success:', response)
    },

    handleLinkUploadError(error, file, fileList) {
      // console.error('Link upload error:', error)
      this.$message.error(`Ошибка загрузки файла ${file.name}`)
    },

    clearLinkFiles() {
      this.linkFileList = []
      if (this.$refs.linkUpload) {
        this.$refs.linkUpload.clearFiles()
      }
    },

    editStyle(row) {
      // Создаём копию объекта чтобы избежать мутаций
      this.currentEditingLayer = { ...row }
      this.styleEditorVisible = true
      console.log('Editing style for layer:', this.currentEditingLayer.id, this.currentEditingLayer.name)
    },

    async handleStyleSave(styleJSON) {
      if (!this.currentEditingLayer || !this.currentEditingLayer.id) {
        console.error('No layer selected for style save')
        this.$message.error('Ошибка: не выбран слой для сохранения стиля')
        return
      }

      const layerId = this.currentEditingLayer.id
      const layerName = this.currentEditingLayer.name

      console.log('Saving style for layer ID:', layerId, 'Name:', layerName)
      console.log('Style JSON:', styleJSON)

      try {
        await vectorLayerService.updateVectorLayer(layerId, {
          style: styleJSON
        })
        this.$message.success(`Стиль слоя "${layerName}" сохранён`)
        this.currentEditingLayer = null
        this.fetchData()
        this.refreshMapLayers()
      } catch (error) {
        console.error('Error saving style for layer', layerId, error)
        this.$message.error(`Ошибка сохранения стиля: ${error.message}`)
      }
    },

    // Обновляем векторные слои на картах
    refreshMapLayers() {
      // Находим компонент MapView в приложении и обновляем его
      const mapViewComponent = this.$parent?.$refs?.mapView || this.$root?.$refs?.mapView
      if (mapViewComponent && typeof mapViewComponent.refreshVectorLayers === 'function') {
        mapViewComponent.refreshVectorLayers()
      }
    }
  },

  mounted() {
    this.fetchData()
  }
}
</script>

<style scoped>
.pg-vector-layers {
  padding: 1rem;

  h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 1.5rem 0;
  }

  .upload-section {
    margin-bottom: 2rem;
    padding: 1rem;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    background-color: var(--bg-secondary);
  }

  .upload-controls {
    margin-top: 1rem;
    display: flex;
    gap: 1rem;
  }

  .link-controls {
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .table-info {
    margin-bottom: 1rem;
  }

  .table-header {
    margin-bottom: 1rem;
  }
}
</style>
