<template>
  <div class="pg-estates-by-type">
    <!-- Фильтры -->
    <EstatesFilters
      ref="estatesFilters"
      :data-mode="'estate'"
      @filter-change="handleFilterChange"
      @apply-filters-and-load="handleApplyFiltersAndLoad"
      @options-loaded="setFilterOptions"
    />

    <div v-if="loading" class="loading">
      <el-icon class="is-loading"><loading /></el-icon>
      <span>Загрузка данных...</span>
    </div>

    <div v-else class="content">

     <!-- Единая таблица -->
      <el-table
        :data="tableData"
        style="width: 100%"
        stripe
        border
        show-summary
        :summary-method="getSummaries"
        @row-click="handleRowClick"
        highlight-current-row
        :default-sort="{ prop: 'subtypeId', order: 'ascending' }"
      >
        <el-table-column label="ID" width="80" sortable prop="subtypeId">
          <template #default="{ row }">
            {{ row.subtypeId }}
          </template>
        </el-table-column>

        <el-table-column label="Тип сословия" min-width="200" sortable prop="typeName">
          <template #default="{ row }">
            {{ row.typeName }}
          </template>
        </el-table-column>

        <el-table-column label="Подтип сословия" min-width="250" sortable prop="subtypeName">
          <template #default="{ row }">
            <div class="type-cell">
              <div class="type-badge" :style="{ backgroundColor: row.subtypeColor }"></div>
              <strong>{{ row.subtypeName }}</strong>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Религия" min-width="150" sortable prop="religion">
          <template #default="{ row }">
            {{ row.religion || '—' }}
          </template>
        </el-table-column>

        <el-table-column label="Принадлежность" min-width="150" sortable prop="affiliation">
          <template #default="{ row }">
            {{ row.affiliation || '—' }}
          </template>
        </el-table-column>

        <el-table-column label="Населённые пункты" min-width="150" align="right" sortable prop="estateCount">
          <template #default="{ row }">
            {{ row.estateCount }}
          </template>
        </el-table-column>

        <el-table-column label="Мужчин" min-width="120" align="right" sortable prop="maleCount">
          <template #default="{ row }">
            {{ row.maleCount }}
          </template>
        </el-table-column>

        <el-table-column label="Женщин" min-width="120" align="right" sortable prop="femaleCount">
          <template #default="{ row }">
            {{ row.femaleCount }}
          </template>
        </el-table-column>

        <el-table-column label="Всего" min-width="120" align="right" sortable prop="totalCount">
          <template #default="{ row }">
            <strong>{{ row.totalCount }}</strong>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Детали подтипа сословия -->
    <SubtypeEstateDetails
      v-model="detailsVisible"
      :subtype-id="selectedSubtypeId"
    />
  </div>
</template>

<script>
import { supabase } from '@/services/supabase.js'
import EstatesFilters from '@/components/EstatesFilters.vue'
import SubtypeEstateDetails from '@/components/SubtypeEstateDetails.vue'
import {
  getFiltersFromURL,
  setFiltersInURL,
  getAllParamsFromURL
} from '@/router'

export default {
  name: 'PgEstatesByType',
  components: {
    EstatesFilters,
    SubtypeEstateDetails
  },
  data() {
    return {
      loading: false,
      currentFilters: null,
      filtersApplied: false, // Флаг, показывающий применены ли фильтры
      estateTypes: [],
      subtypeEstates: [],
      estates: [],
      religions: [],
      affiliations: [],
      allRevisions: [],
      allDistricts: [], // Районы для отображения названий
      reportRecords: [],
      revisions: [], // Полная информация о ревизиях для сопоставления
      settlements: [], // Населённые пункты для фильтрации
      detailsVisible: false,
      selectedSubtypeId: null,
      selectedReportRecordId: null
    }
  },
  computed: {
    filteredEstates() {
      // Если фильтры не применены, возвращаем все данные
      if (!this.filtersApplied || !this.currentFilters) return this.estates

      return this.estates.filter(estate => {
        const subtype = this.subtypeEstates.find(s => s.id === estate.id_subtype_estate)
        if (!subtype) return false

        // Получаем связанную запись ревизии
        const reportRecord = this.reportRecords.find(r => r.id === estate.id_report_record)
        if (!reportRecord) return false

        // Фильтр по ревизиям (сопоставляем number из фильтра с id через revisions)
        if (this.currentFilters.revision && this.currentFilters.revision.length > 0) {
          const revision = this.revisions.find(r => r.id === reportRecord.id_revision_report)
          if (!revision || !this.currentFilters.revision.includes(revision.number)) {
            return false
          }
        }

        // Фильтр по районам и населённым пунктам
        if (reportRecord.id_settlment) {
          const settlement = this.settlements.find(s => s.id === reportRecord.id_settlment)
          
          // Фильтр по районам
          if (this.currentFilters.districts && this.currentFilters.districts.length > 0) {
            if (!settlement || !this.currentFilters.districts.includes(settlement.id_district)) {
              return false
            }
          }

          // Фильтр по старым названиям населённых пунктов
          if (this.currentFilters.settlementNamesOld && this.currentFilters.settlementNamesOld.length > 0) {
            if (!settlement || !this.currentFilters.settlementNamesOld.includes(settlement.name_old)) {
              return false
            }
          }

          // Фильтр по современным названиям населённых пунктов
          if (this.currentFilters.settlementNamesModern && this.currentFilters.settlementNamesModern.length > 0) {
            if (!settlement || !settlement.name_modern || !this.currentFilters.settlementNamesModern.includes(settlement.name_modern)) {
              return false
            }
          }
        }

        // Фильтр по типам сословий
        if (this.currentFilters.typeEstates && this.currentFilters.typeEstates.length > 0) {
          if (!this.currentFilters.typeEstates.includes(subtype.id_type_estate)) {
            return false
          }
        }

        // Фильтр по подтипам сословий
        if (this.currentFilters.subtypeEstates && this.currentFilters.subtypeEstates.length > 0) {
          if (!this.currentFilters.subtypeEstates.includes(estate.id_subtype_estate)) {
            return false
          }
        }

        // Фильтр по религиям
        if (this.currentFilters.religions && this.currentFilters.religions.length > 0) {
          if (!this.currentFilters.religions.includes(subtype.id_type_religion)) {
            return false
          }
        }

        // Фильтр по принадлежностям
        if (this.currentFilters.affiliations && this.currentFilters.affiliations.length > 0) {
          if (!this.currentFilters.affiliations.includes(subtype.id_type_affiliation)) {
            return false
          }
        }

        // Фильтр по мужчинам
        if (this.currentFilters.maleEnabled) {
          const maleCount = estate.male || 0
          const maleMin = this.currentFilters.maleMin || 0
          const maleMax = this.currentFilters.maleMax
          
          if (maleCount < maleMin) return false
          if (maleMax !== null && maleMax !== undefined && maleCount > maleMax) return false
        }

        // Фильтр по женщинам
        if (this.currentFilters.femaleEnabled) {
          const femaleCount = estate.female || 0
          const femaleMin = this.currentFilters.femaleMin || 0
          const femaleMax = this.currentFilters.femaleMax
          
          if (femaleCount < femaleMin) return false
          if (femaleMax !== null && femaleMax !== undefined && femaleCount > femaleMax) return false
        }

        // Фильтр по общей численности
        if (this.currentFilters.populationEnabled) {
          const totalCount = (estate.male || 0) + (estate.female || 0)
          const popMin = this.currentFilters.populationMin || 0
          const popMax = this.currentFilters.populationMax
          
          if (totalCount < popMin) return false
          if (popMax !== null && popMax !== undefined && totalCount > popMax) return false
        }

        return true
      })
    },

    tableData() {
      const rows = []

      this.subtypeEstates.forEach(subtype => {
        const estatesForSubtype = this.filteredEstates.filter(
          estate => estate.id_subtype_estate === subtype.id
        )

        const maleCount = estatesForSubtype.reduce((sum, e) => sum + (e.male || 0), 0)
        const femaleCount = estatesForSubtype.reduce((sum, e) => sum + (e.female || 0), 0)
        const totalCount = maleCount + femaleCount

        // Пропускаем строки с нулевым населением
        if (totalCount === 0) return

        const type = this.estateTypes.find(t => t.id === subtype.id_type_estate)
        const religion = this.religions.find(r => r.id === subtype.id_type_religion)
        const affiliation = this.affiliations.find(a => a.id === subtype.id_type_affiliation)

        rows.push({
          subtypeId: subtype.id,
          typeId: type?.id,
          typeName: type?.name || '—',
          typeColor: type?.color || 'hsl(0, 0%, 50%)',
          subtypeName: subtype.name,
          subtypeColor: subtype.color || 'hsl(0, 0%, 50%)',
          religion: religion?.name || '—',
          affiliation: affiliation?.name || '—',
          estateCount: estatesForSubtype.length,
          maleCount,
          femaleCount,
          totalCount
        })
      })

      // Возвращаем данные без дополнительной сортировки - используем default-sort таблицы
      return rows
    },

    grandTotal() {
      return this.tableData.reduce(
        (acc, row) => ({
          estates: acc.estates + row.estateCount,
          male: acc.male + row.maleCount,
          female: acc.female + row.femaleCount,
          total: acc.total + row.totalCount
        }),
        { estates: 0, male: 0, female: 0, total: 0 }
      )
    }
  },
  mounted() {
    this.loadFiltersFromURL()

    // НЕ загружаем данные автоматически даже если есть фильтры в localStorage
    // Данные будут загружены только при нажатии кнопки "Применить"
  },
  methods: {
    setFilterOptions(options) {
      // Опции уже загружены в EstatesFilters, нам остается только загрузить ревизии
      this.loadRevisions()
    },

    loadRevisions() {
      supabase
        .from('Revision_report')
        .select('id, year, number')
        .order('year', { ascending: true })
        .then(({ data, error }) => {
          if (error) throw error
          this.allRevisions = data || []
        })
        .catch(error => {
          console.error('Error loading revisions:', error)
        })
    },

    handleFilterChange(filters) {
      // При изменении фильтров только сохраняем их, но не применяем
      this.currentFilters = filters
      this.filtersApplied = false
    },

    handleApplyFiltersAndLoad(filters) {
      // При нажатии "Применить" сохраняем фильтры и применяем их
      this.currentFilters = filters
      this.filtersApplied = true
      setFiltersInURL(filters)
    },

    applyFilters(filters) {
      this.currentFilters = filters
      setFiltersInURL(filters)
    },

    loadFiltersFromURL() {
      try {
        const urlParams = getAllParamsFromURL()

        if (urlParams.filters) {
          if (urlParams.filters && typeof urlParams.filters === 'object') {
            const allowedFields = [
              'revision', 'districts', 'settlementNamesOld', 'settlementNamesModern',
              'typeEstates', 'subtypeEstates', 'religions', 'affiliations',
              'maleEnabled', 'femaleEnabled', 'populationEnabled',
              'maleMin', 'maleMax', 'femaleMin', 'femaleMax',
              'populationMin', 'populationMax'
            ]

            const cleanedFilters = {}
            allowedFields.forEach(field => {
              if (urlParams.filters.hasOwnProperty(field)) {
                cleanedFilters[field] = urlParams.filters[field]
              }
            })

            this.currentFilters = cleanedFilters

            // Если есть активные фильтры, применяем их
            const hasActiveFilters = Object.values(cleanedFilters).some(value =>
              Array.isArray(value) ? value.length > 0 : value === true || (typeof value === 'number' && value !== null)
            )
            if (hasActiveFilters) {
              this.filtersApplied = true
            }
          }
        }
      } catch (error) {
        console.error('Error loading filters from URL:', error)
      }
    },
    getSummaries(param) {
      const { columns, data } = param
      const sums = []

      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = 'Итого:'
          return
        }
        if (index === 1) {
          sums[index] = ''
          return
        }
        if (index === 2) {
          sums[index] = ''
          return
        }
        if (index === 3) {
          sums[index] = ''
          return
        }
        if (index === 4) {
          sums[index] = ''
          return
        }

        const values = data.map(item => {
          switch(index) {
            case 5: return Number(item.estateCount)
            case 6: return Number(item.maleCount)
            case 7: return Number(item.femaleCount)
            case 8: return Number(item.totalCount)
            default: return 0
          }
        })

        sums[index] = values.reduce((prev, curr) => prev + curr, 0)
      })

      return sums
    },

    handleRowClick(row) {
      // Открываем drawer с деталями подтипа сословия
      this.selectedSubtypeId = row.subtypeId
      this.detailsVisible = true
    },

    async loadData() {
      this.loading = true

      try {
        // Загружаем районы для отображения названий
        const { data: districts, error: districtsError } = await supabase
          .from('District')
          .select('id, name')
          .order('name')

        if (districtsError) throw districtsError
        this.allDistricts = districts || []

        // Загружаем ревизии для сопоставления id и number
        const { data: revisions, error: revisionsError } = await supabase
          .from('Revision_report')
          .select('id, year, number')
          .order('year')

        if (revisionsError) throw revisionsError
        this.revisions = revisions || []

        // Загружаем типы сословий
        const { data: types, error: typesError } = await supabase
          .from('Type_estate')
          .select('*')
          .order('name')

        if (typesError) throw typesError
        this.estateTypes = types || []

        // Загружаем подтипы сословий
        const { data: subtypes, error: subtypesError } = await supabase
          .from('Subtype_estate')
          .select('*')
          .order('name')

        if (subtypesError) throw subtypesError
        this.subtypeEstates = subtypes || []

        // Загружаем сословия (хозяйства) со связью к Report_record
        const { data: estates, error: estatesError } = await supabase
          .from('Estate')
          .select('id, id_subtype_estate, male, female, id_report_record')

        if (estatesError) throw estatesError
        this.estates = estates || []

        // Загружаем записи ревизий для фильтра
        const { data: reportRecords, error: reportError } = await supabase
          .from('Report_record')
          .select('id, id_revision_report, id_settlment')

        if (reportError) throw reportError
        this.reportRecords = reportRecords || []

        // Загружаем населённые пункты для фильтрации
        const { data: settlements, error: settlementsError } = await supabase
          .from('Settlement')
          .select('id, name_old, name_modern, id_district')

        if (settlementsError) throw settlementsError
        this.settlements = settlements || []

        // Загружаем религии
        const { data: religions, error: religionsError } = await supabase
          .from('Type_religion')
          .select('*')

        if (religionsError) throw religionsError
        this.religions = religions || []

        // Загружаем принадлежности
        const { data: affiliations, error: affiliationsError } = await supabase
          .from('Type_affiliation')
          .select('*')

        if (affiliationsError) throw affiliationsError
        this.affiliations = affiliations || []

      } catch (error) {
        console.error('Error loading data:', error)
        this.$message.error('Ошибка загрузки данных')
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped lang="scss">
.pg-estates-by-type {
  padding: 1rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .content {
    flex: 1;
    min-height: 0;
    overflow: auto;

    h3 {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 1rem 0;
    }
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    gap: 12px;
  }

  .type-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .type-badge {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }
  }

  :deep(.el-table__body tr) {
    cursor: pointer;
  }
}
</style>
