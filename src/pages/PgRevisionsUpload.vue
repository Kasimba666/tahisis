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
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="code" label="Код" width="100" />
      <el-table-column label="Нас.пункт (старый)">
        <template #default="{ row }">
          {{ row.settlement_name_old }}
        </template>
      </el-table-column>
      <el-table-column label="Нас. пункт (альт)">
        <template #default="{ row }">
          {{ row.settlement_name_old_alt }}
        </template>
      </el-table-column>
      <el-table-column label="Нас. пункт (совр)">
        <template #default="{ row }">
          {{ row.settlement_name_modern }}
        </template>
      </el-table-column>
      <el-table-column label="Район">
        <template #default="{ row }">
          {{ row.district_name }}
        </template>
      </el-table-column>
      <el-table-column label="Широта" width="90">
        <template #default="{ row }">
          {{ row.settlement_lat }}
        </template>
      </el-table-column>
      <el-table-column label="Долгота" width="90">
        <template #default="{ row }">
          {{ row.settlement_lon }}
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
      // Если ревизия не выбрана, очищаем таблицу
      if (!this.selectedRevision) {
        this.tableData = []
        return
      }

      // Получаем Report_record для выбранной ревизии
      const { data: reportRecords, error: reportError } = await supabase
          .from('Report_record')
          .select(`
            id, code, population_all,
            Revision_report!inner ( id, year, number ),
            Settlement (
              name_old, name_old_alt, name_modern, lat, lon,
              District ( name )
            )
          `)
          .eq('Revision_report.number', this.selectedRevision)

      if (reportError) {
        console.error(reportError)
        return
      }

      // Получаем все Estate записи для этих Report_record
      const reportIds = (reportRecords || []).map(r => r.id)
      
      let estatesData = []
      if (reportIds.length > 0) {
        const { data: estates, error: estatesError } = await supabase
            .from('Estate')
            .select(`
              id_report_record, male, female,
              Volost ( name ),
              Landowner ( description ),
              Military_unit ( description )
            `)
            .in('id_report_record', reportIds)

        if (estatesError) {
          console.error(estatesError)
        } else {
          estatesData = estates || []
        }
      }

      // Группируем Estate данные по id_report_record
      const estatesByReport = {}
      estatesData.forEach(estate => {
        if (!estatesByReport[estate.id_report_record]) {
          estatesByReport[estate.id_report_record] = []
        }
        estatesByReport[estate.id_report_record].push(estate)
      })

      // Формируем данные для таблицы
      this.tableData = (reportRecords || []).map(record => {
        const estates = estatesByReport[record.id] || []
        
        // Суммируем мужчин и женщин
        const totalMale = estates.reduce((sum, e) => sum + (Number(e.male) || 0), 0)
        const totalFemale = estates.reduce((sum, e) => sum + (Number(e.female) || 0), 0)
        
        // Собираем уникальные волости, помещиков и воинские части
        const volosts = [...new Set(estates.map(e => e.Volost?.name).filter(Boolean))]
        const landowners = [...new Set(estates.map(e => e.Landowner?.description).filter(Boolean))]
        const militaryUnits = [...new Set(estates.map(e => e.Military_unit?.description).filter(Boolean))]

        return {
          id: record.id,
          code: record.code || '',
          settlement_name_old: record.Settlement?.name_old || '-',
          settlement_name_old_alt: record.Settlement?.name_old_alt || '-',
          settlement_name_modern: record.Settlement?.name_modern || '-',
          district_name: record.Settlement?.District?.name || '-',
          settlement_lat: record.Settlement?.lat || '-',
          settlement_lon: record.Settlement?.lon || '-',
          male: totalMale || '-',
          female: totalFemale || '-',
          population_all: record.population_all || '-',
          volost_name: volosts.join(', ') || '-',
          landowner_description: landowners.join(', ') || '-',
          military_unit_description: militaryUnits.join(', ') || '-'
        }
      }).sort((a, b) => {
        // Сортируем по ID
        return a.id - b.id
      })
    },

    handleRevisionFilter() {
      this.fetchData()
    },

    async handleDataProcessed(payload) {
      // Обновляем список ревизий после загрузки новых данных
      await this.fetchRevisions()
      // Автоматически выбираем загруженную ревизию
      if (payload && payload.revisionNumber) {
        this.selectedRevision = payload.revisionNumber
      }
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
    // Не загружаем данные при mounted, ждём выбора ревизии
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
