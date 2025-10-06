<template>
  <div class="pg-revisions-upload">
    <h3>Ревизии</h3>
    <ExcelRevisionsUpload @dataProcessed="handleDataProcessed" />

    <div class="filters-container">
      <el-select
        v-model="selectedRevision"
        placeholder="Выберите ревизию"
        clearable
        @change="handleRevisionFilter"
        class="revision-filter"
      >
        <el-option
          v-for="revision in availableRevisions"
          :key="revision.number"
          :label="`Ревизия ${revision.number} (${revision.year})`"
          :value="revision.number"
        />
      </el-select>
      <el-button
        type="danger"
        @click="handleDeleteSelectedRevision"
        :disabled="!selectedRevision"
        class="delete-revision-button"
      >
        Удалить ревизию
      </el-button>
    </div>

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

    <el-table :data="tableData" style="width: 100%" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="revision" label="Ревизия" width="100" />
      <el-table-column prop="code" label="Код" width="100" />
      <el-table-column label="Нас.пункт старый">
        <template #default="{ row }">
          {{ row.settlement_name_old || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="Населенный пункт альт">
        <template #default="{ row }">
          {{ row.settlement_name_old_alt || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="Нас. пункт совр.">
        <template #default="{ row }">
          {{ row.settlement_name_modern || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="Район">
        <template #default="{ row }">
          {{ row.district_name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="Широта" width="100">
        <template #default="{ row }">
          {{ row.settlement_lat || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="Долгота" width="100">
        <template #default="{ row }">
          {{ row.settlement_lon || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="Сословие">
        <template #default="{ row }">
          {{ row.subtype_name }}
        </template>
      </el-table-column>
      <el-table-column prop="male" label="Муж." width="100" />
      <el-table-column prop="female" label="Жен." width="100" />
      <el-table-column prop="population_all" label="Всего" width="100" />
      <el-table-column label="Волость">
        <template #default="{ row }">
          {{ row.volost_name || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="Помещик">
        <template #default="{ row }">
          {{ row.landowner_description || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="Воинская часть">
        <template #default="{ row }">
          {{ row.military_unit_description || '-' }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { supabase } from '@/services/supabase'
import ExcelRevisionsUpload from '@/components/ExcelRevisionsUpload.vue'


export default {
  name: 'PgRevisionsUpload',
  components: { ExcelRevisionsUpload },
  data() {
    return {
      tableData: [],
      selectedRevision: null,
      availableRevisions: []
    }
  },
  computed: {
    totalRecords() {
      return this.tableData.length
    }
  },
  methods: {
    async fetchRevisions() {
      const { data, error } = await supabase
          .from('Revision_report')
          .select('id, number, year')
          .order('number')

      if (error) {
        console.error('Ошибка загрузки ревизий:', error)
        return
      }

      this.availableRevisions = data || []
    },

    async fetchData() {
      let query = supabase
          .from('Estate')
          .select(`
          id, male, female, id_volost, id_landowner, id_military_unit,
          Report_record (
            id, code, population_all,
            Revision_report ( year, number ),
            Settlement (
              name_old, name_old_alt, name_modern, lat, lon,
              District ( name )
            )
          ),
          Subtype_estate ( name ),
          Volost ( name ),
          Landowner ( description ),
          Military_unit ( description )
        `)

      // Если выбрана конкретная ревизия, фильтруем по ней
      if (this.selectedRevision) {
        query = query.eq('Report_record.Revision_report.number', this.selectedRevision)
      }

      const { data, error } = await query
      if (error) {
        console.error(error)
        return
      }

      let filteredData = data || []

      // Если выбрана ревизия, дополнительно фильтруем на клиенте
      if (this.selectedRevision) {
        filteredData = filteredData.filter(e =>
          e.Report_record?.Revision_report?.number === this.selectedRevision
        )
      }

      this.tableData = filteredData.map(e => ({
        id: e.id,
        code: e.Report_record?.code || '',
        population_all: e.Report_record?.population_all || '',
        revision: e.Report_record?.Revision_report
            ? `${e.Report_record.Revision_report.number} (${e.Report_record.Revision_report.year})`
            : '',
        settlement_name_old: e.Report_record?.Settlement?.name_old || '',
        settlement_name_old_alt: e.Report_record?.Settlement?.name_old_alt || '',
        settlement_name_modern: e.Report_record?.Settlement?.name_modern || '',
        settlement_lat: e.Report_record?.Settlement?.lat || '',
        settlement_lon: e.Report_record?.Settlement?.lon || '',
        district_name: e.Report_record?.Settlement?.District?.name || '',
        subtype_name: e.Subtype_estate?.name || '',
        male: e.male || '',
        female: e.female || '',
        volost_name: e.Volost?.name || '',
        landowner_description: e.Landowner?.description || '',
        military_unit_description: e.Military_unit?.description || ''
      }))
    },

    handleRevisionFilter() {
      this.fetchData()
    },

    async handleDataProcessed() {
      // Обновляем список ревизий после загрузки новых данных
      await this.fetchRevisions()
      // Обновляем данные таблицы
      this.fetchData()
    },

    async handleDeleteSelectedRevision() {
      if (!this.selectedRevision) return

      const confirmMessage = `Вы уверены, что хотите удалить ревизию ${this.selectedRevision}? Это действие нельзя отменить.`

      if (!confirm(confirmMessage)) return

      try {
        // 1. Найти ID ревизии по номеру
        const { data: revision, error: findError } = await supabase
            .from('Revision_report')
            .select('id')
            .eq('number', this.selectedRevision)
            .single()

        if (findError) throw findError
        if (!revision) throw new Error('Ревизия не найдена')

        // 2. Найти все Report_record связанные с этой ревизией
        const { data: reportRecords, error: reportsError } = await supabase
            .from('Report_record')
            .select('id')
            .eq('id_revision_report', revision.id)

        if (reportsError) throw reportsError

        // 3. Удалить все Estate записи связанные с этими Report_record
        if (reportRecords && reportRecords.length > 0) {
          const reportIds = reportRecords.map(r => r.id)
          await supabase
              .from('Estate')
              .delete()
              .in('id_report_record', reportIds)
        }

        // 4. Удалить Report_record записи
        await supabase
            .from('Report_record')
            .delete()
            .eq('id_revision_report', revision.id)

        // 5. Удалить саму ревизию
        await supabase
            .from('Revision_report')
            .delete()
            .eq('id', revision.id)

        // 6. Обновить данные и списки
        await this.fetchRevisions()
        this.selectedRevision = null
        this.fetchData()

        console.log(`Ревизия ${this.selectedRevision} успешно удалена`)
      } catch (error) {
        console.error('Ошибка при удалении ревизии:', error)
        alert('Ошибка при удалении ревизии: ' + error.message)
      }
    }
  },
  async mounted() {
    await this.fetchRevisions()
    this.fetchData()
  }
}
</script>

<style scoped>
.pg-revisions-upload {
  padding: 0.5rem;

  h1 {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 1.5rem 0;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-hover));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .filters-container {
    margin-bottom: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .revision-filter {
    width: 200px;
  }

  /* Кастомизация кнопки сброса внутри el-select */
  :deep(.revision-filter .el-select__suffix .el-select__suffix-inner) {
    width: 18px !important;
    height: 18px !important;
    border-radius: 50% !important;
    background-color: hsl(0, 84%, 60%) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  :deep(.revision-filter .el-select__suffix .el-select__suffix-inner:hover) {
    background-color: hsl(0, 84%, 50%) !important;
  }

  :deep(.revision-filter .el-select__suffix .el-select__suffix-inner .el-icon) {
    color: white !important;
    font-size: 12px !important;
  }

  .table-info {
    margin-bottom: 1.5rem;
  }

  :deep(.el-table td),
  :deep(.el-table th) {
    padding: 3px;
  }

  :deep(.el-table .cell) {
    padding: 3px;
  }


}
</style>
