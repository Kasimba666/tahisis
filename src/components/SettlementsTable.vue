<template>
  <div class="settlements-table">
    <!-- Панель управления -->
    <div class="table-controls">
      <div class="table-info">
        <el-tag size="large" type="info">Всего населённых пунктов: {{ settlementsData.length }}</el-tag>
        <el-tag size="large" type="success">Общее население: {{ formatNumber(totalPopulation) }}</el-tag>
      </div>

      <div class="table-actions">
        <el-button size="large" type="primary" @click="exportToExcel" :disabled="loading || settlementsData.length === 0">
          <el-icon><Download /></el-icon>
          Экспорт в Excel
        </el-button>
      </div>
    </div>

    <!-- Таблица -->
    <el-table
      :data="settlementsData"
      v-loading="loading"
      style="width: 100%"
      border
      stripe
      size="small"
      height="calc(100vh - 200px)"
      @row-dblclick="viewSettlementDetails"
      :show-summary="true"
      sum-text="Итого"
      :summary-method="getSummary"
    >
      <el-table-column prop="settlement_name_old" label="Нас. пункт (старое)" min-width="150" sortable>
        <template #default="scope">
          <div class="settlement-name">
            <strong>{{ scope.row.settlement_name_old }}</strong>
            <span v-if="scope.row.settlement_name_modern && scope.row.settlement_name_modern !== scope.row.settlement_name_old" class="modern-name">
              ({{ scope.row.settlement_name_modern }})
            </span>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="settlement_name_modern" label="Нас. пункт (совр.)" min-width="150" sortable />

      <el-table-column prop="district_name" label="Район" width="120" sortable />

      <el-table-column prop="revision_count" label="Кол. ревизий" width="100" align="right" sortable>
        <template #default="scope">
          <el-tag size="small" type="info">{{ scope.row.revision_count }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="estates_count" label="Кол. сословий" width="100" align="right" sortable>
        <template #default="scope">
          <el-tag size="small" type="warning">{{ scope.row.estates_count }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="religions_count" label="Кол. религий" width="100" align="right" sortable>
        <template #default="scope">
          <el-tag size="small" type="success">{{ scope.row.religions_count }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="male" label="Мужчины" width="80" align="right" sortable>
        <template #default="scope">
          <span class="number-cell">{{ formatNumber(scope.row.male) }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="female" label="Женщины" width="80" align="right" sortable>
        <template #default="scope">
          <span class="number-cell">{{ formatNumber(scope.row.female) }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="total" label="Всего" width="80" align="right" sortable>
        <template #default="scope">
          <el-tag type="primary" size="small">{{ formatNumber(scope.row.total) }}</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <!-- Drawer для деталей населённого пункта -->
    <el-drawer
      v-model="detailsDrawerVisible"
      title="Детали населённого пункта"
      direction="rtl"
      size="600px"
      :before-close="closeDetailsDrawer"
    >
      <div v-if="selectedSettlement" class="settlement-details">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="Населенный пункт (старое)">
            <strong>{{ selectedSettlement.settlement_name_old }}</strong>
          </el-descriptions-item>

          <el-descriptions-item label="Населенный пункт (современное)">
            {{ selectedSettlement.settlement_name_modern || '—' }}
          </el-descriptions-item>

          <el-descriptions-item label="Район">
            {{ selectedSettlement.district_name }}
          </el-descriptions-item>

          <el-descriptions-item label="Количество ревизий">
            <el-tag type="info">{{ selectedSettlement.revision_count }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Количество сословий">
            <el-tag type="warning">{{ selectedSettlement.estates_count }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Количество религий">
            <el-tag type="success">{{ selectedSettlement.religions_count }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Мужчины">
            <el-tag type="danger">{{ formatNumber(selectedSettlement.male) }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Женщины">
            <el-tag type="danger">{{ formatNumber(selectedSettlement.female) }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Общее население">
            <el-tag type="primary" size="large">{{ formatNumber(selectedSettlement.total) }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- Список ревизий для этого населённого пункта -->
        <div class="revisions-section">
          <el-divider content-position="left">
            <h4 style="margin: 0;">Ревизии</h4>
          </el-divider>

          <div v-if="selectedSettlement.revisions && selectedSettlement.revisions.length > 0">
            <el-table
              :data="selectedSettlement.revisions"
              size="small"
              border
              stripe
            >
              <el-table-column prop="year" label="Год" width="80" />
              <el-table-column prop="number" label="Рев." width="60" />
              <el-table-column prop="male" label="М" width="60" align="right" />
              <el-table-column prop="female" label="Ж" width="60" align="right" />
              <el-table-column prop="total" label="Всего" width="80" align="right">
                <template #default="scope">
                  <el-tag size="mini" type="primary">{{ formatNumber(scope.row.total) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <el-empty v-else description="Нет данных о ревизиях" :image-size="60" />
        </div>

        <!-- Список сословий для этого населённого пункта -->
        <div class="estates-section">
          <el-divider content-position="left">
            <h4 style="margin: 0;">Сословия</h4>
          </el-divider>

          <div v-if="selectedSettlement.estates && selectedSettlement.estates.length > 0">
            <el-table
              :data="selectedSettlement.estates"
              size="small"
              border
              stripe
            >
              <el-table-column prop="subtype_estate_name" label="Подтип сословия" min-width="150" />
              <el-table-column prop="type_estate_name" label="Тип сословия" width="120" />
              <el-table-column prop="type_religion_name" label="Религия" width="100" />
              <el-table-column prop="male" label="М" width="60" align="right" />
              <el-table-column prop="female" label="Ж" width="60" align="right" />
              <el-table-column prop="total" label="Всего" width="80" align="right">
                <template #default="scope">
                  <el-tag size="mini" type="success">{{ formatNumber(scope.row.total) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <el-empty v-else description="Нет данных о сословиях" :image-size="60" />
        </div>
      </div>

      <template #footer>
        <el-button @click="closeDetailsDrawer">Закрыть</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script>
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { supabase } from '@/services/supabase'
import * as XLSX from 'xlsx'

export default {
  name: 'SettlementsTable',
  components: {
    Download
  },
  props: {
    filters: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      settlementsData: [],
      allSettlements: [],
      allRevisions: [],
      detailsDrawerVisible: false,
      selectedSettlement: null,
      internalLoading: false
    }
  },
  computed: {
    totalPopulation() {
      return this.settlementsData.reduce((sum, settlement) => sum + (settlement.total || 0), 0)
    }
  },
  async mounted() {
    await this.loadSettlementsReference()
    await this.loadRevisions()
    if (this.filters) {
      this.applyFilters(this.filters)
    } else {
      this.loadData()
    }
  },
  methods: {
    async loadSettlementsReference() {
      try {
        const { data, error } = await supabase
          .from('Settlement')
          .select('id, name_modern, name_old, lat, lon, id_district')

        if (error) throw error
        this.allSettlements = data || []
      } catch (error) {
        console.error('Error loading settlements reference:', error)
      }
    },

    async loadRevisions() {
      try {
        const { data, error } = await supabase
          .from('Revision_report')
          .select('id, year, number')
          .order('year', { ascending: true })

        if (error) throw error
        this.allRevisions = data || []
      } catch (error) {
        console.error('Error loading revisions:', error)
      }
    },

    async loadData() {
      this.internalLoading = true

      try {
        await this.loadSettlementsData()
      } catch (error) {
        console.error('Error loading settlements data:', error)
        ElMessage.error('Ошибка загрузки данных о населённых пунктах')
      } finally {
        this.internalLoading = false
      }
    },

    async loadSettlementsData() {
      try {
        // Загружаем все населённые пункты с их данными
        const { data, error } = await supabase
          .from('Settlement')
          .select(`
            id,
            name_old,
            name_modern,
            lat,
            lon,
            District(name)
          `)
          .not('name_old', 'is', null)
          .order('name_old', { ascending: true })

        if (error) throw error

        // Для каждого населённого пункта рассчитываем агрегированные данные
        const settlementsWithData = await Promise.all(
          (data || []).map(async (settlement) => {
            return await this.calculateSettlementData(settlement)
          })
        )

        this.settlementsData = settlementsWithData.filter(s => s !== null)
      } catch (error) {
        console.error('Error loading settlements data:', error)
        throw error
      }
    },

    async calculateSettlementData(settlement) {
      try {
        // Получаем все записи ревизий для этого населённого пункта
        const { data: reportRecords, error: reportError } = await supabase
          .from('Report_record')
          .select(`
            id,
            code,
            population_all,
            Revision_report!Report_record_id_revision_report_fkey(
              id,
              year,
              number
            )
          `)
          .eq('id_settlment', settlement.id)

        if (reportError) throw reportError

        if (!reportRecords || reportRecords.length === 0) {
          return null // Пропускаем населённые пункты без данных
        }

        // Получаем все сословия для этого населённого пункта
        const { data: estates, error: estatesError } = await supabase
          .from('Estate')
          .select(`
            id,
            male,
            female,
            Subtype_estate!Estate_id_subtype_estate_fkey(
              name,
              id_type_religion,
              Type_estate(name),
              Type_religion(name)
            )
          `)
          .in('id_report_record', reportRecords.map(rr => rr.id))

        if (estatesError) throw estatesError

        // Рассчитываем агрегированные данные
        const totalMale = estates?.reduce((sum, estate) => sum + (estate.male || 0), 0) || 0
        const totalFemale = estates?.reduce((sum, estate) => sum + (estate.female || 0), 0) || 0
        const totalPopulation = totalMale + totalFemale

        // Получаем уникальные религии
        const uniqueReligions = new Set()
        estates?.forEach(estate => {
          if (estate.Subtype_estate?.id_type_religion) {
            uniqueReligions.add(estate.Subtype_estate.id_type_religion)
          }
        })

        // Получаем уникальные ревизии
        const uniqueRevisions = new Set()
        reportRecords?.forEach(record => {
          if (record.Revision_report?.id) {
            uniqueRevisions.add(record.Revision_report.id)
          }
        })

        return {
          settlement_id: settlement.id,
          settlement_name_old: settlement.name_old,
          settlement_name_modern: settlement.name_modern,
          district_name: settlement.District?.name || '—',
          lat: settlement.lat,
          lon: settlement.lon,
          revision_count: uniqueRevisions.size,
          estates_count: estates?.length || 0,
          religions_count: uniqueReligions.size,
          male: totalMale,
          female: totalFemale,
          total: totalPopulation,
          // Дополнительные данные для детального просмотра
          revisions: reportRecords.map(rr => ({
            id: rr.id,
            year: rr.Revision_report?.year || '—',
            number: rr.Revision_report?.number || '—',
            male: 0, // Будет рассчитано ниже
            female: 0,
            total: rr.population_all || 0
          })),
          estates: estates?.map(estate => ({
            id: estate.id,
            subtype_estate_name: estate.Subtype_estate?.name || '—',
            type_estate_name: estate.Subtype_estate?.Type_estate?.name || '—',
            type_religion_name: estate.Subtype_estate?.Type_religion?.name || '—',
            male: estate.male || 0,
            female: estate.female || 0,
            total: (estate.male || 0) + (estate.female || 0)
          })) || []
        }
      } catch (error) {
        console.error('Error calculating settlement data:', error)
        return null
      }
    },

    applyFilters(filters) {
      this.currentFilters = filters
      this.loadData()
    },

    viewSettlementDetails(row) {
      this.selectedSettlement = row
      this.detailsDrawerVisible = true
    },

    closeDetailsDrawer() {
      this.detailsDrawerVisible = false
      this.selectedSettlement = null
    },

    formatNumber(num) {
      return new Intl.NumberFormat('ru-RU').format(num || 0)
    },

    // Метод для расчёта итоговой строки
    getSummary() {
      const sums = {
        revision_count: 0,
        estates_count: 0,
        religions_count: 0,
        male: 0,
        female: 0,
        total: this.totalPopulation
      }

      this.settlementsData.forEach(settlement => {
        sums.revision_count += settlement.revision_count || 0
        sums.estates_count += settlement.estates_count || 0
        sums.religions_count += settlement.religions_count || 0
        sums.male += settlement.male || 0
        sums.female += settlement.female || 0
      })

      return [
        'Итого:',
        '',
        '',
        sums.revision_count.toLocaleString(),
        sums.estates_count.toLocaleString(),
        sums.religions_count.toLocaleString(),
        sums.male.toLocaleString(),
        sums.female.toLocaleString(),
        sums.total.toLocaleString()
      ]
    },

    // Экспорт в Excel
    exportToExcel() {
      try {
        if (!this.settlementsData || this.settlementsData.length === 0) {
          ElMessage.warning('Нет данных для экспорта')
          return
        }

        // Создаем книгу Excel
        const workbook = XLSX.utils.book_new()

        // Подготавливаем данные для экспорта
        const exportData = this.prepareExportData()

        // Создаем лист с данными
        const worksheet = XLSX.utils.aoa_to_sheet(exportData)

        // Устанавливаем ширину колонок
        worksheet['!cols'] = [
          { wch: 20 }, // Нас. пункт (старое)
          { wch: 20 }, // Нас. пункт (совр.)
          { wch: 15 }, // Район
          { wch: 12 }, // Кол. ревизий
          { wch: 12 }, // Кол. сословий
          { wch: 12 }, // Кол. религий
          { wch: 10 }, // Мужчины
          { wch: 10 }, // Женщины
          { wch: 10 }  // Всего
        ]

        // Добавляем стили форматирования
        this.applyExcelStyles(worksheet, exportData.length)

        // Добавляем лист в книгу
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Населённые пункты')

        // Генерируем имя файла с текущей датой и временем
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
        const fileName = `населенные_пункты_${timestamp}.xlsx`

        // Сохраняем файл
        XLSX.writeFile(workbook, fileName)

        ElMessage.success(`Данные экспортированы в файл ${fileName}`)
      } catch (error) {
        console.error('Ошибка экспорта в Excel:', error)
        ElMessage.error('Ошибка при экспорте данных в Excel')
      }
    },

    // Подготовка данных для экспорта
    prepareExportData() {
      const data = []

      // Добавляем информацию о фильтрах
      const filterInfo = this.getFilterInfo()
      if (filterInfo) {
        data.push([filterInfo, '', '', '', '', '', '', '', ''])
        data.push(['', '', '', '', '', '', '', '', '']) // Пустая строка
      }

      // Добавляем заголовки
      data.push([
        'Нас. пункт (старое)',
        'Нас. пункт (совр.)',
        'Район',
        'Кол. ревизий',
        'Кол. сословий',
        'Кол. религий',
        'Мужчины',
        'Женщины',
        'Всего'
      ])

      // Добавляем данные
      this.settlementsData.forEach(settlement => {
        data.push([
          settlement.settlement_name_old || '',
          settlement.settlement_name_modern || '',
          settlement.district_name || '',
          settlement.revision_count || 0,
          settlement.estates_count || 0,
          settlement.religions_count || 0,
          settlement.male || 0,
          settlement.female || 0,
          settlement.total || 0
        ])
      })

      // Добавляем итоговую строку
      const sums = this.getSummary()
      data.push(['', '', '', '', '', '', '', '', '']) // Пустая строка перед итогами
      data.push(sums)

      return data
    },

    // Получение информации о фильтрах
    getFilterInfo() {
      if (!this.currentFilters) return null

      const activeFilters = []

      // Ревизии
      if (this.currentFilters.revision && this.currentFilters.revision.length > 0) {
        const count = this.currentFilters.revision.length
        activeFilters.push(`Ревизий: ${count}`)
      }

      // Районы
      if (this.currentFilters.districts?.length > 0) {
        const count = this.currentFilters.districts.length
        activeFilters.push(`Районов: ${count}`)
      }

      // Типы сословий
      if (this.currentFilters.typeEstates?.length > 0) {
        const count = this.currentFilters.typeEstates.length
        activeFilters.push(`Типов сословий: ${count}`)
      }

      // Диапазоны населения
      if (this.currentFilters.maleEnabled) {
        const min = this.currentFilters.maleMin || 0
        const max = this.currentFilters.maleMax || '∞'
        activeFilters.push(`М: ${min}-${max}`)
      }

      if (this.currentFilters.femaleEnabled) {
        const min = this.currentFilters.femaleMin || 0
        const max = this.currentFilters.femaleMax || '∞'
        activeFilters.push(`Ж: ${min}-${max}`)
      }

      if (activeFilters.length === 0) return null

      return `Фильтры: ${activeFilters.join(' | ')} | Населённых пунктов: ${this.settlementsData.length}`
    },

    // Применение стилей к Excel файлу
    applyExcelStyles(worksheet, dataLength) {
      // Определяем диапазоны
      const filterRowIndex = 1
      const headerRowIndex = filterRowIndex + 2
      const summaryRowIndex = dataLength

      // Стили
      const styles = {
        filterInfo: {
          font: { bold: true, color: { rgb: '2E75B6' }, sz: 12 },
          fill: { fgColor: { rgb: 'E7F3FF' } },
          alignment: { horizontal: 'left', vertical: 'center' }
        },
        headers: {
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
          fill: { fgColor: { rgb: '4472C4' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        },
        summary: {
          font: { bold: true, color: { rgb: '000000' }, sz: 11 },
          fill: { fgColor: { rgb: 'FFF2CC' } },
          alignment: { horizontal: 'left', vertical: 'center' }
        }
      }

      // Применяем стили к строке с фильтрами
      if (worksheet['A' + filterRowIndex]) {
        worksheet['A' + filterRowIndex].s = styles.filterInfo
      }

      // Применяем стили к заголовкам
      for (let col = 1; col <= 9; col++) {
        const cellRef = this.getColumnLetter(col) + headerRowIndex
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = styles.headers
        }
      }

      // Применяем стили к итоговой строке
      if (worksheet['A' + summaryRowIndex]) {
        worksheet['A' + summaryRowIndex].s = styles.summary
      }

      // Применяем стили к числовым колонкам в итоговой строке
      for (let col = 4; col <= 9; col++) {
        const cellRef = this.getColumnLetter(col) + summaryRowIndex
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            ...styles.summary,
            alignment: { horizontal: 'right', vertical: 'center' }
          }
        }
      }
    },

    // Получение буквы колонки по номеру
    getColumnLetter(colNum) {
      let result = ''
      while (colNum > 0) {
        colNum--
        result = String.fromCharCode(65 + (colNum % 26)) + result
        colNum = Math.floor(colNum / 26)
      }
      return result
    }
  }
}
</script>

<style scoped lang="scss">
.settlements-table {
  height: 100%;
  display: flex;
  flex-direction: column;

  .table-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    gap: 1rem;

    .table-info {
      display: flex;
      gap: 0.5rem;
    }

    .table-actions {
      display: flex;
      gap: 0.5rem;
    }
  }

  .settlement-name {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .modern-name {
      font-size: 0.85em;
      color: var(--text-muted);
      font-style: italic;
    }
  }

  .number-cell {
    font-family: 'Courier New', monospace;
  }

  .settlement-details {
    :deep(.el-descriptions) {
      .el-descriptions__label {
        background-color: var(--bg-secondary) !important;
        color: var(--text-primary) !important;
        font-weight: 500;
      }

      .el-descriptions__content {
        background-color: var(--bg-primary) !important;
        color: var(--text-secondary) !important;
      }
    }

    .revisions-section,
    .estates-section {
      margin-top: 1.5rem;

      h4 {
        color: var(--text-primary);
        font-weight: 600;
      }
    }
  }
}

@media (max-width: 768px) {
  .settlements-table {
    .table-controls {
      flex-direction: column;
      align-items: stretch;

      .table-info {
        justify-content: center;
      }

      .table-actions {
        justify-content: center;
      }
    }
  }
}
</style>
