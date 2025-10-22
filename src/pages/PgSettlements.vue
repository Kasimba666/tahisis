<template>
  <div class="settlements-page">
    <div class="page-header">
      <h1>Населённые пункты</h1>
      <p class="page-description">
        Сводная таблица по населённым пунктам с агрегированными данными
      </p>
    </div>

    <!-- Фильтры -->
    <EstatesFilters
      ref="estatesFilters"
      :data-mode="'settlement'"
      @filter-change="applyFilters"
      @options-loaded="setFilterOptions"
    />

    <!-- Таблица населённых пунктов -->
    <div class="settlements-content">
      <SettlementsTable
        ref="settlementsTable"
        :filters="currentFilters"
        :loading="loading"
        :districts="allDistricts"
        :type-estates="allTypeEstates"
        :subtype-estates="allSubtypeEstates"
        :religions="allReligions"
        :affiliations="allAffiliations"
        :volosts="allVolosts"
        :landowners="allLandowners"
        :military-units="allMilitaryUnits"
        :revisions="allRevisions"
      />
    </div>
  </div>
</template>

<script>
import EstatesFilters from '@/components/EstatesFilters.vue'
import SettlementsTable from '@/components/SettlementsTable.vue'
import {
  getFiltersFromURL,
  setFiltersInURL,
  getAllParamsFromURL
} from '@/router'

export default {
  name: 'PgSettlements',
  components: {
    EstatesFilters,
    SettlementsTable
  },
  data() {
    return {
      currentFilters: null,
      loading: false,
      allDistricts: [],
      allSettlements: [],
      allTypeEstates: [],
      allSubtypeEstates: [],
      allReligions: [],
      allAffiliations: [],
      allVolosts: [],
      allLandowners: [],
      allMilitaryUnits: [],
      allRevisions: []
    }
  },
  mounted() {
    // Загружаем фильтры из URL при инициализации
    this.loadFiltersFromURL()
  },
  methods: {
    setFilterOptions(options) {
      this.allDistricts = options.districts || []
      this.allSettlements = options.settlements || []
      this.allTypeEstates = options.typeEstates || []
      this.allSubtypeEstates = options.subtypeEstates || []
      this.allReligions = options.religions || []
      this.allAffiliations = options.affiliations || []
      this.allVolosts = options.volosts || []

      // Загружаем ревизии отдельно
      this.loadRevisions()
    },

    loadRevisions() {
      // Импортируем supabase динамически чтобы избежать проблем с SSR
      import('@/services/supabase').then(({ supabase }) => {
        supabase
          .from('Revision_report')
          .select('id, year, number')
          .order('year', { ascending: true })
          .then(({ data, error }) => {
            if (error) throw error
            this.allRevisions = data || []
            // console.log('=== SETTLEMENTS PAGE DEBUG ===')
            // console.log('Loaded revisions:', this.allRevisions.length)
            // console.log('Sample revisions:', this.allRevisions.slice(0, 3))

            // Обновляем дочерний компонент после загрузки справочников
            this.$nextTick(() => {
              this.updateSettlementsTable()
            })
          })
          .catch(error => {
            console.error('Error loading revisions:', error)
          })
      })
    },

    applyFilters(filters) {
      this.currentFilters = filters

      // Сохраняем фильтры в URL
      setFiltersInURL(filters)

      this.$refs.settlementsTable?.applyFilters(filters)
    },

    // Метод для передачи справочников в дочерний компонент
    updateSettlementsTable() {
      if (this.$refs.settlementsTable) {
        // Используем $nextTick чтобы убедиться что компонент полностью инициализирован
        this.$nextTick(() => {
          if (this.$refs.settlementsTable && this.$refs.settlementsTable.syncWithProps) {
            this.$refs.settlementsTable.syncWithProps()
          }
        })
      }
    },

    // Загрузка фильтров из URL
    loadFiltersFromURL() {
      try {
        const urlParams = getAllParamsFromURL()

        if (urlParams.filters) {
          // Валидация URL фильтров
          if (urlParams.filters && typeof urlParams.filters === 'object') {
            // Импортируем фильтры из URL, сохраняя только нужные поля
            const allowedFields = [
              'revision', 'districts', 'settlementNamesOld', 'settlementNamesModern',
              'typeEstates', 'subtypeEstates', 'religions', 'affiliations',
              'volosts', 'landowners', 'militaryUnits',
              'maleEnabled', 'femaleEnabled', 'populationEnabled', 'estatesCountEnabled',
              'maleMin', 'maleMax', 'femaleMin', 'femaleMax',
              'populationMin', 'populationMax', 'estatesCountMin', 'estatesCountMax'
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
    }
  }
}
</script>

<style scoped lang="scss">
.settlements-page {
  padding: 1rem;
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .page-header {
    text-align: center;
    margin-bottom: 1rem;

    h1 {
      color: var(--text-primary);
      margin: 0 0 0.5rem 0;
      font-size: 2rem;
      font-weight: 600;
    }

    .page-description {
      color: var(--text-secondary);
      margin: 0;
      font-size: 1rem;
    }
  }

  .settlements-content {
    flex: 1;
    min-height: 0;
    background-color: var(--bg-secondary);
    border-radius: 8px;
    padding: 1rem;
    overflow: hidden;
  }
}

@media (max-width: 768px) {
  .settlements-page {
    padding: 0.5rem;

    .page-header {
      h1 {
        font-size: 1.5rem;
      }

      .page-description {
        font-size: 0.9rem;
      }
    }

    .settlements-content {
      padding: 0.5rem;
    }
  }
}
</style>
