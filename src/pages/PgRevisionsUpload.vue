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
      <el-table-column prop="code" label="Код" width="100">
        <template #default="{ row }">
          <div v-if="editRecordId === row.id">
            <el-input-number v-model="editRecord.code" :min="0" size="small" />
          </div>
          <div v-else>{{ row.code || '' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Нас.пункт (старый)">
        <template #default="{ row }">
          <div v-if="editRecordId === row.id">
        <el-select
          v-model="editRecord.id_settlment"
          placeholder="Выберите населённый пункт"
          filterable
          size="small"
          style="width: 100%"
          @change="onSettlementChange"
        >
          <el-option
            v-for="settlement in filteredSettlementsForEdit"
            :key="settlement.id"
            :label="settlement.name_old || settlement.name_modern"
            :value="settlement.id"
          />
        </el-select>
          </div>
          <div v-else>{{ row.settlement_name_old }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Нас. пункт (альт)" width="180">
        <template #default="{ row }">
          <div v-if="editRecordId === row.id">
            <el-input v-model="editRecord.settlement_name_old_alt" size="small" />
          </div>
          <div v-else>{{ row.settlement_name_old_alt }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Нас. пункт (совр)" width="180">
        <template #default="{ row }">
          <div v-if="editRecordId === row.id">
            <el-input v-model="editRecord.settlement_name_modern" size="small" />
          </div>
          <div v-else>{{ row.settlement_name_modern }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Район" width="140">
        <template #default="{ row }">
          <div v-if="editRecordId === row.id">
            <el-select
              v-model="editRecord.id_district"
              placeholder="Выберите район"
              filterable
              size="small"
              style="width: 100%"
            >
              <el-option
                v-for="district in availableDistricts"
                :key="district.id"
                :label="district.name"
                :value="district.id"
              />
            </el-select>
          </div>
          <div v-else>{{ row.district_name }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Население всего" width="140">
        <template #default="{ row }">
          <div v-if="editRecordId === row.id">
            <el-input-number v-model="editRecord.population_all" :min="0" size="small" />
          </div>
          <div v-else>{{ row.population_all || '' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Мужчины" width="100">
        <template #default="{ row }">
          <div v-if="editRecordId === row.id">
            <el-input-number v-model="editRecord.male" :min="0" size="small" disabled title="Вычисляется автоматически на основе связанных сословий" />
          </div>
          <div v-else>{{ row.male }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Женщины" width="100">
        <template #default="{ row }">
          <div v-if="editRecordId === row.id">
            <el-input-number v-model="editRecord.female" :min="0" size="small" disabled title="Вычисляется автоматически на основе связанных сословий" />
          </div>
          <div v-else>{{ row.female }}</div>
        </template>
      </el-table-column>
      <el-table-column label="Действия" width="300" fixed="right">
        <template #default="{ row }">
          <div v-if="editRecordId === row.id">
            <el-button type="success" size="small" @click="updateRecord">Сохранить</el-button>
            <el-button type="warning" size="small" @click="cancelEdit">Отменить</el-button>
          </div>
          <div v-else>
            <el-button size="small" type="primary" @click="startEdit(row)">Редактировать</el-button>
            <el-button size="small" type="danger" @click="deleteRecord(row.id)">Удалить</el-button>
          </div>
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
      availableRevisions: [],
      editRecordId: null,
      editRecord: {},
      loading: false,
      availableSettlements: [],
      availableDistricts: []
    }
  },
  computed: {
    totalRecords() {
      return this.tableData.length
    },

    // Всегда показываем все поселения для выбора
    filteredSettlementsForEdit() {
      return this.availableSettlements
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
          military_unit_description: militaryUnits.join(', ') || '-',
          id_settlment: record.id_settlment
        }
      }).sort((a, b) => {
        // Сортируем по ID
        return a.id - b.id
      })
    },

    async handleRevisionFilter() {
      // Загружаем settlements для редактирования
      if (this.selectedRevision) {
        await this.fetchSettlements()
      }
      // Затем загружаем данные ревизии
      this.fetchData()
    },

    async fetchSettlements() {
      const { data, error } = await supabase
        .from('Settlement')
        .select(`
          id,
          name_modern,
          name_old,
          name_old_alt,
          id_district,
          District(id, name)
        `)
        .order('name_old')

      if (error) {
        console.error('Error fetching settlements:', error)
        this.availableSettlements = []
        this.availableDistricts = []
        return
      }

      this.availableSettlements = data || []

      // Извлекаем уникальные районы из послений
      this.availableDistricts = [...new Set(data.filter(s => s.District).map(s => s.District))]
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
    },

    // Методы редактирования записей
    async startEdit(row) {
      this.editRecordId = row.id

      // Находим район текущего поселения для инициализации
      let districtId = null
      if (row.id_settlment) {
        const settlement = this.availableSettlements.find(s => s.id === row.id_settlment)
        districtId = settlement?.id_district || null
      }

      this.editRecord = {
        code: row.code,
        population_all: row.population_all,
        id_settlment: row.id_settlment,
        id_district: districtId,
        settlement_name_old_alt: row.settlement_name_old_alt,
        settlement_name_modern: row.settlement_name_modern,
        male: row.male === '-' ? 0 : row.male,
        female: row.female === '-' ? 0 : row.female
      }
    },

    // Обработчики изменения района и поселения
    async onSettlementChange(newSettlementId) {
      // При выборе поселка загружаем его данные
      if (newSettlementId) {
        const settlement = this.availableSettlements.find(s => s.id === newSettlementId)
        if (settlement) {
          this.editRecord.settlement_name_old_alt = settlement.name_old_alt || ''
          this.editRecord.settlement_name_modern = settlement.name_modern || ''
          this.editRecord.id_district = settlement.id_district
        }
      }
    },

    cancelEdit() {
      this.editRecordId = null
      this.editRecord = {}
    },

    async updateRecord() {
      try {
        // Сначала обновляем Report_record
        const { error: reportError } = await supabase
            .from('Report_record')
            .update({
              code: this.editRecord.code,
              population_all: this.editRecord.population_all,
              id_settlment: this.editRecord.id_settlment
            })
            .eq('id', this.editRecordId)

        if (reportError) throw reportError

        // Затем обновляем Settlement (имена и район)
        if (this.editRecord.id_settlment) {
          const { error: settlementError } = await supabase
              .from('Settlement')
              .update({
                name_old_alt: this.editRecord.settlement_name_old_alt,
                name_modern: this.editRecord.settlement_name_modern,
                id_district: this.editRecord.id_district
              })
              .eq('id', this.editRecord.id_settlment)

          if (settlementError) throw settlementError
        }

        // Обновляем данные
        await this.fetchData()
        this.cancelEdit()

        this.$message.success('Запись обновлена')
      } catch (error) {
        console.error('Ошибка обновления записи:', error)
        this.$message.error('Ошибка при обновлении записи')
      }
    },

    async deleteRecord(recordId) {
      if (!confirm('Удалить эту ревизскую запись?')) return

      try {
        // Удаляем запись
        const { error } = await supabase
            .from('Report_record')
            .delete()
            .eq('id', recordId)

        if (error) throw error

        // Обновляем данные
        await this.fetchData()

        this.$message.success('Запись удалена')
      } catch (error) {
        console.error('Ошибка удаления записи:', error)
        this.$message.error('Ошибка при удалении записи')
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
