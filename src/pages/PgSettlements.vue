<template>
  <div class="settlements-page">
    <!-- Фильтры -->
    <EstatesFilters
      ref="estatesFilters"
      :data-mode="'settlement'"
      @filter-change="applyFilters"
      @apply-filters-and-load="applyFiltersAndLoad"
      @options-loaded="setFilterOptions"
    />

    <!-- Таблица и карты населённых пунктов -->
    <div class="settlements-content">
      <SettlementsListAndMap
        ref="settlementsListAndMap"
        :filters="currentFilters"
        v-model:loading="loading"
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
import SettlementsListAndMap from '@/components/SettlementsListAndMap.vue'
import {
  getFiltersFromURL,
  setFiltersInURL,
  getAllParamsFromURL
} from '@/router'

export default {
  name: 'PgSettlements',
  components: {
    EstatesFilters,
    SettlementsListAndMap
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

    // НЕ применяем фильтры автоматически даже если они есть в URL
    // Данные будут загружены только при нажатии "Применить"
  },
  methods: {
    setFilterOptions(options) {
      console.log('=== PGSETTLEMENTS SET FILTER OPTIONS ===')
      console.log('Options received:', options)
      this.allDistricts = options.districts || []
      this.allSettlements = options.settlements || []
      this.allTypeEstates = options.typeEstates || []
      this.allSubtypeEstates = options.subtypeEstates || []
      this.allReligions = options.religions || []
      this.allAffiliations = options.affiliations || []
      this.allVolosts = options.volosts || []

      console.log('Loaded data counts:', {
        districts: this.allDistricts.length,
        typeEstates: this.allTypeEstates.length,
        subtypeEstates: this.allSubtypeEstates.length
      })

      // Загружаем ревизии отдельно
      this.loadRevisions()
      
      // Передаём options в дочерний компонент
      if (this.$refs.settlementsListAndMap) {
        this.$refs.settlementsListAndMap.setFilterOptions(options)
      }
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
          })
          .catch(error => {
            console.error('Error loading revisions:', error)
          })
      })
    },

    // При изменении фильтров сбрасываем данные (не загружаем новые)
    applyFilters(filters) {
      console.log('=== PgSettlements applyFilters ===', filters)
      this.currentFilters = filters
      
      // Сохраняем фильтры в URL
      setFiltersInURL(filters)

      if (this.$refs.settlementsListAndMap) {
        this.$refs.settlementsListAndMap.applyFilters(filters)
      }
    },

    // При нажатии "Применить" загружаем данные с новыми фильтрами
    applyFiltersAndLoad(filters) {
      console.log('=== PgSettlements applyFiltersAndLoad ===', filters)
      this.currentFilters = filters

      // Сохраняем фильтры в URL
      setFiltersInURL(filters)

      // Применяем фильтры и загружаем данные
      if (this.$refs.settlementsListAndMap) {
        this.$refs.settlementsListAndMap.applyFiltersAndLoad(filters)
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
            
            // Передаём восстановленные фильтры в компонент EstatesFilters для отображения в UI
            this.$nextTick(() => {
              if (this.$refs.estatesFilters && this.$refs.estatesFilters.restoreFilters) {
                this.$refs.estatesFilters.restoreFilters(cleanedFilters)
              }
            })
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
