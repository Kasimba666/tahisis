<template>
  <div class="pg-estates-list">
    <h3>Список сословий</h3>
    
    <div class="content-layout">
      <div class="filters-panel">
        <EstatesFilters 
          :data-mode="dataMode"
          @filter-change="handleFilterChange"
          @options-loaded="handleOptionsLoaded"
        />
      </div>
      
      <div class="main-panel">
        <EstatesListAndMap 
          ref="listAndMap"
          @data-mode-change="handleDataModeChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import EstatesFilters from '@/components/EstatesFilters.vue'
import EstatesListAndMap from '@/components/EstatesListAndMap.vue'

export default {
  name: 'PgEstatesList',
  components: {
    EstatesFilters,
    EstatesListAndMap
  },
  data() {
    return {
      dataMode: 'estate',
      currentFilters: null,
      filterOptions: null
    }
  },
  methods: {
    handleFilterChange(filters) {
      console.log('Filters changed:', filters)
      this.currentFilters = filters
      if (this.$refs.listAndMap) {
        this.$refs.listAndMap.applyFilters(filters)
      }
    },
    
    handleDataModeChange(mode) {
      this.dataMode = mode
    },
    
    handleOptionsLoaded(options) {
      console.log('Filter options loaded:', options)
      this.filterOptions = options
      if (this.$refs.listAndMap) {
        this.$refs.listAndMap.setFilterOptions(options)
      }
    }
  }
}
</script>

<style scoped lang="scss">
.pg-estates-list {
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 1rem 0;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-hover));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .content-layout {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    flex: 1;
    min-height: 0;

    .filters-panel {
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;
    }

    .main-panel {
      flex: 1;
      min-height: 0;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 1rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  }
}
</style>
