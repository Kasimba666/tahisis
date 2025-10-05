<template>
  <div class="estates-filters">
    <div class="filters-grid">
      <div class="filter-item">
        <label>Ревизия</label>
        <el-select v-model="filters.revision" placeholder="Все" clearable size="small">
          <el-option label="1 ревизия" value="1" />
          <el-option label="2 ревизия" value="2" />
          <el-option label="3 ревизия" value="3" />
          <el-option label="4 ревизия" value="4" />
          <el-option label="5 ревизия" value="5" />
        </el-select>
      </div>

      <div class="filter-item">
        <label>Населенный пункт</label>
        <el-input 
          v-model="filters.settlement" 
          placeholder="Поиск..." 
          clearable 
          size="small"
        />
      </div>

      <div class="filter-item">
        <label>Район</label>
        <el-select v-model="filters.district" placeholder="Все" clearable size="small">
          <el-option label="Район 1" value="1" />
          <el-option label="Район 2" value="2" />
        </el-select>
      </div>

      <div class="filter-item">
        <label>Сословие</label>
        <el-select v-model="filters.estate" placeholder="Все" clearable size="small">
          <el-option label="Дворяне" value="nobles" />
          <el-option label="Крестьяне" value="peasants" />
          <el-option label="Мещане" value="townspeople" />
        </el-select>
      </div>

      <div class="filter-item">
        <label>Религия</label>
        <el-select v-model="filters.religion" placeholder="Все" clearable size="small">
          <el-option label="Православные" value="orthodox" />
          <el-option label="Католики" value="catholic" />
          <el-option label="Иудеи" value="jewish" />
        </el-select>
      </div>

      <div class="filter-item">
        <label>Волость</label>
        <el-input 
          v-model="filters.volost" 
          placeholder="Поиск..." 
          clearable 
          size="small"
        />
      </div>

      <div class="filter-item filter-item-wide">
        <label>Население</label>
        <div class="range-inputs">
          <el-input-number 
            v-model="filters.populationMin" 
            :min="0" 
            placeholder="От" 
            size="small"
            controls-position="right"
          />
          <el-input-number 
            v-model="filters.populationMax" 
            :min="0" 
            placeholder="До" 
            size="small"
            controls-position="right"
          />
        </div>
      </div>

      <div class="filter-item filter-actions">
        <el-button type="primary" size="small" @click="applyFilters">
          Применить
        </el-button>
        <el-button size="small" @click="resetFilters">
          Сбросить
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'EstatesFilters',
  data() {
    return {
      filters: {
        revision: '',
        settlement: '',
        district: '',
        estate: '',
        religion: '',
        volost: '',
        populationMin: null,
        populationMax: null
      }
    }
  },
  methods: {
    applyFilters() {
      this.$emit('filter-change', this.filters)
    },
    resetFilters() {
      this.filters = {
        revision: '',
        settlement: '',
        district: '',
        estate: '',
        religion: '',
        volost: '',
        populationMin: null,
        populationMax: null
      }
      this.$emit('filter-change', this.filters)
    }
  }
}
</script>

<style scoped lang="scss">
.estates-filters {
  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1rem;
    align-items: end;

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;

      label {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-secondary);
      }

      .el-select,
      .el-input {
        width: 100%;
      }

      &.filter-item-wide {
        grid-column: span 2;

        .range-inputs {
          display: flex;
          gap: 0.5rem;

          .el-input-number {
            flex: 1;
            width: 100%;
          }
        }
      }

      &.filter-actions {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;

        .el-button {
          flex: 1;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .estates-filters {
    .filters-grid {
      grid-template-columns: 1fr;

      .filter-item {
        &.filter-item-wide {
          grid-column: span 1;
        }
      }
    }
  }
}
</style>
