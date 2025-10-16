<template>
  <div class="pg-estate-types-upload">
    <div class="page-header">
      <h3>Подтипы сословий</h3>
      <div class="header-info">
        <el-alert
            type="info"
            :closable="false"
            show-icon
        >
          <template #title>
            Всего подтипов: {{ totalRecords }}
          </template>
        </el-alert>
      </div>
    </div>

    <div class="controls-section">
      <ExcelUpload @dataProcessed="fetchData" />
      <el-button type="success" size="small" @click="addRow">Добавить подтип</el-button>
    </div>

    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />

      <el-table-column label="Название подтипа">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-input v-model="editRow.name" />
          </div>
          <div v-else>
            {{ row.name }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Тип сословия">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-select v-model="editRow.id_type_estate" placeholder="Выбрать">
              <el-option
                  v-for="item in typeEstateOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
              />
            </el-select>
          </div>
          <div v-else>
            {{ row.type_estate_name }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Цвет типа" width="120">
        <template #default="{ row }">
          <div class="color-display">
            <div
              class="color-preview"
              :style="{ backgroundColor: row.color || '#808080' }"
            ></div>
            <span class="color-value">{{ row.color || '#808080' }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Религия">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-select v-model="editRow.id_type_religion" placeholder="Выбрать">
              <el-option
                  v-for="item in typeReligionOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
              />
            </el-select>
          </div>
          <div v-else>
            {{ row.type_religion_name }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Принадлежность">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-select v-model="editRow.id_type_affiliation" placeholder="Выбрать">
              <el-option
                  v-for="item in typeAffiliationOptions"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
              />
            </el-select>
          </div>
          <div v-else>
            {{ row.type_affiliation_name }}
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
import { supabase } from "@/services/supabase"
import ExcelEstateTypesUpload from '@/components/ExcelEstateTypesUpload.vue'

export default {
  name: "PgEstateTypesUpload",
  components: {
    ExcelUpload: ExcelEstateTypesUpload
  },
  data() {
    return {
      tableData: [],
      typeEstateOptions: [],
      typeReligionOptions: [],
      typeAffiliationOptions: [],
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
      // Основная таблица
      const { data: estates } = await supabase
          .from("Subtype_estate")
          .select(`
          id, name, id_type_estate, id_type_religion, id_type_affiliation,
          Type_estate ( name, color ),
          Type_religion ( name ),
          Type_affiliation ( name )
        `)

      this.tableData = estates.map(e => ({
        ...e,
        type_estate_name: e.Type_estate?.name || "",
        type_religion_name: e.Type_religion?.name || "",
        type_affiliation_name: e.Type_affiliation?.name || "",
        color: e.Type_estate?.color || "#808080"
      }))

      // Справочники
      const { data: estateOptions } = await supabase.from("Type_estate").select("*")
      const { data: religionOptions } = await supabase.from("Type_religion").select("*")
      const { data: affiliationOptions } = await supabase.from("Type_affiliation").select("*")

      this.typeEstateOptions = estateOptions || []
      this.typeReligionOptions = religionOptions || []
      this.typeAffiliationOptions = affiliationOptions || []
    },
    startEdit(row) {
      this.editRowId = row.id
      this.editRow = {
        ...row,
        color: row.color || "#808080"
      }
    },
    cancelEdit() {
      this.editRowId = null
      this.editRow = {}
      this.fetchData() // Обновляем данные для корректного отображения цветов
    },
    async updateRow(id) {
      // Обновляем остальные поля в Subtype_estate
      const { error } = await supabase
          .from("Subtype_estate")
          .update({
            name: this.editRow.name,
            id_type_estate: this.editRow.id_type_estate,
            id_type_religion: this.editRow.id_type_religion,
            id_type_affiliation: this.editRow.id_type_affiliation
          })
          .eq("id", id)

      if (!error) {
        this.cancelEdit()
      } else {
        console.error(error)
      }
    },
    async deleteRow(id) {
      const { error } = await supabase.from("Subtype_estate").delete().eq("id", id)
      if (!error) {
        this.fetchData()
      } else {
        console.error(error)
      }
    },
    async addRow() {
      const { data, error } = await supabase
          .from("Subtype_estate")
          .insert([
            {
              name: "",
              id_type_estate: this.typeEstateOptions[0]?.id || null,
              id_type_religion: this.typeReligionOptions[0]?.id || null,
              id_type_affiliation: this.typeAffiliationOptions[0]?.id || null
            }
          ])
          .select()

      if (!error && data?.length) {
        // Получаем информацию о связанном типе сословия для цвета
        const selectedEstateType = this.typeEstateOptions.find(estate => estate.id === data[0].id_type_estate)

        this.tableData.push({
          ...data[0],
          type_estate_name: selectedEstateType?.name || "",
          type_religion_name: "",
          type_affiliation_name: "",
          color: selectedEstateType?.color || "#808080"
        })
        this.startEdit(data[0])
      }
    }
  },
  mounted() {
    this.fetchData()
  }
}
</script>

<style scoped>
.pg-estate-types-upload {
  padding: 1rem;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;

    h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-hover));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-info {
      flex-shrink: 0;
    }
  }

  .controls-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    gap: 1rem;
  }

  .color-display {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .color-preview {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1px solid var(--border-color);
    }

    .color-value {
      font-family: monospace;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
  }
}

</style>
