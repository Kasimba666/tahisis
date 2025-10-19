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
      />
    </div>
  </div>
</template>

<script>
import EstatesFilters from '@/components/EstatesFilters.vue'
import SettlementsTable from '@/components/SettlementsTable.vue'

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
      allRevisions: []
    }
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
          })
          .catch(error => {
            console.error('Error loading revisions:', error)
          })
      })
    },

    applyFilters(filters) {
      this.currentFilters = filters
      this.$refs.settlementsTable?.applyFilters(filters)
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
