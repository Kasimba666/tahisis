<template>
  <div class="pg-estates-by-type">
    <!-- Фильтры -->
    <EstatesFilters
      ref="estatesFilters"
      :data-mode="'estate'"
      @filter-change="applyFilters"
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
        :default-sort="{ prop: 'subtypeName', order: 'ascending' }"
      >
        <el-table-column label="Тип сословия" min-width="200" sortable prop="typeName">
          <template #default="{ row }">
            <div class="type-cell">
              <div class="type-badge" :style="{ backgroundColor: row.typeColor }"></div>
              <span>{{ row.typeName }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="Подтип сословия" min-width="250" sortable prop="subtypeName">
          <template #default="{ row }">
            <strong>{{ row.subtypeName }}</strong>
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

    <!-- Детали подтипа -->
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
      loading: true,
      currentFilters: null,
      estateTypes: [],
      subtypeEstates: [],
      estates: [],
      religions: [],
      affiliations: [],
      allRevisions: [],
      reportRecords: [],
      revisions: [], // Полная информация о ревизиях для сопоставления
      detailsVisible: false,
      selectedSubtypeId: null
    }
  },
  computed: {
    filteredEstates() {
      if (!this.currentFilters) return this.estates

      return this.estates.filter(estate => {
        const subtype = this.subtypeEstates.find(s => s.id === estate.id_subtype_estate)
        if (!subtype) return false

        // Фильтр по ревизиям (сопоставляем number из фильтра с id через revisions)
        if (this.currentFilters.revision && this.currentFilters.revision.length > 0) {
          const reportRecord = this.reportRecords.find(r => r.id === estate.id_report_record)
          if (!reportRecord) return false
          
          // Находим ревизию по id и проверяем её номер
          const revision = this.revisions.find(r => r.id === reportRecord.id_revision_report)
          if (!revision || !this.currentFilters.revision.includes(revision.number)) {
            return false
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
          religion: religion?.name || '—',
          affiliation: affiliation?.name || '—',
          estateCount: estatesForSubtype.length,
          maleCount,
          femaleCount,
          totalCount
        })
      })

      // Сортируем по типу, затем по подтипу
      return rows.sort((a, b) => {
        const typeCompare = a.typeName.localeCompare(b.typeName)
        if (typeCompare !== 0) return typeCompare
        return a.subtypeName.localeCompare(b.subtypeName)
      })
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
    this.loadData()
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
              'revision', 'typeEstates', 'subtypeEstates', 'religions', 'affiliations'
            ]

            const cleanedFilters = {}
            allowedFields.forEach(field => {
              if (urlParams.filters.hasOwnProperty(field)) {
                cleanedFilters[field] = urlParams.filters[field]
              }
            })

            this.currentFilters = cleanedFilters
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
        
        const values = data.map(item => {
          switch(index) {
            case 4: return Number(item.estateCount)
            case 5: return Number(item.maleCount)
            case 6: return Number(item.femaleCount)
            case 7: return Number(item.totalCount)
            default: return 0
          }
        })
        
        sums[index] = values.reduce((prev, curr) => prev + curr, 0)
      })
      
      return sums
    },

    handleRowClick(row) {
      // Открываем drawer с деталями подтипа
      this.selectedSubtypeId = row.subtypeId
      this.detailsVisible = true
    },

    async loadData() {
      this.loading = true

      try {
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
          .select('id, id_revision_report')

        if (reportError) throw reportError
        this.reportRecords = reportRecords || []

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
