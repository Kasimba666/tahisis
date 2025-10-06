<template>
  <div class="pg-vector-layer-types">
    <h3>Типы векторных слоев</h3>

    <div class="table-info">
      <el-alert
          type="info"
          :closable="false"
          show-icon
      >
        <template #title>
          Всего записей: {{ totalRecords }}
        </template>
      </el-alert>
    </div>

    <div class="table-header">
      <el-button type="success" size="small" @click="addRow">Добавить</el-button>
    </div>

    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />

      <el-table-column label="Название">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-input v-model="editRow.name" placeholder="Название типа слоя" />
          </div>
          <div v-else>
            {{ row.name }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Действия" width="200">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-button type="success" size="small" @click="updateRow(row.id)">Сохранить</el-button>
            <el-button type="warning" size="small" @click="cancelEdit">Отменить</el-button>
          </div>
          <div v-else>
            <el-button type="primary" size="small" @click="startEdit(row)">Редактировать</el-button>
            <el-button type="danger" size="small" @click="deleteRow(row.id)">Удалить</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { vectorLayerService } from "@/services/vectorLayers"

export default {
  name: "PgVectorLayerTypes",
  data() {
    return {
      tableData: [],
      editRowId: null,
      editRow: {}
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
        this.tableData = await vectorLayerService.getLayerTypes()
      } catch (error) {
        console.error("Error fetching vector layer types:", error)
        this.$message.error("Ошибка загрузки типов векторных слоев")
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
        await vectorLayerService.updateLayerType(id, this.editRow.name)
        this.cancelEdit()
      } catch (error) {
        console.error("Error updating vector layer type:", error)
        this.$message.error("Ошибка обновления типа слоя")
      }
    },

    async deleteRow(id) {
      try {
        await vectorLayerService.deleteLayerType(id)
        this.$message.success("Тип слоя удален")
        this.fetchData()
      } catch (error) {
        console.error("Error deleting vector layer type:", error)
        this.$message.error("Ошибка удаления типа слоя")
      }
    },

    async addRow() {
      try {
        const data = await vectorLayerService.createLayerType("Новый тип слоя")
        this.tableData.push(data)
        this.startEdit(data)
      } catch (error) {
        console.error("Error adding vector layer type:", error)
        this.$message.error("Ошибка добавления типа слоя")
      }
    }
  },

  mounted() {
    this.fetchData()
  }
}
</script>

<style scoped>
.pg-vector-layer-types {
  padding: 1rem;

  h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 1.5rem 0;
  }

  .table-info {
    margin-bottom: 1rem;
  }

  .table-header {
    margin-bottom: 1rem;
  }
}
</style>
