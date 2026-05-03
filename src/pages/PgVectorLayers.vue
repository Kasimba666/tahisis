<template>
  <div class="pg-vector-layers">
    <h3>Векторные слои</h3>

    <div class="upload-section">
      <VectorLayerUpload
        :layer-types="layerTypeOptions"
        @upload-complete="handleUploadComplete"
      />
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

      <el-table-column label="Видимость по умолчанию" width="160">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-switch v-model="editRow.visible" />
          </div>
          <div v-else>
            <el-tag :type="row.visible ? 'success' : 'info'" size="small">
              {{ row.visible ? 'Видимый' : 'Скрытый' }}
            </el-tag>
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
          crs: this.editRow.crs,
          visible: this.editRow.visible
        })
        this.cancelEdit()
        this.refreshMapLayers()
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
          crs: "EPSG:4326",
          visible: true, // По умолчанию видимый
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

    editStyle(row) {
      // Создаём копию объекта чтобы избежать мутаций
      this.currentEditingLayer = { ...row }
      this.styleEditorVisible = true
    },

    async handleStyleSave(styleJSON) {
      if (!this.currentEditingLayer || !this.currentEditingLayer.id) {
        console.error('No layer selected for style save')
        this.$message.error('Ошибка: не выбран слой для сохранения стиля')
        return
      }

      const layerId = this.currentEditingLayer.id
      const layerName = this.currentEditingLayer.name


      try {
        const updateData = {
          style: styleJSON
        }

        const result = await vectorLayerService.updateVectorLayer(layerId, updateData)

        this.$message.success(`Стиль слоя "${layerName}" сохранён`)
        this.currentEditingLayer = null
        this.fetchData()
        this.refreshMapLayers()
      } catch (error) {
        console.error('Error saving style for layer', layerId, error)
        console.error('Error details:', error.message, error.details)
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

  .table-info {
    margin-bottom: 1rem;
  }

  .table-header {
    margin-bottom: 1rem;
  }
}
</style>
