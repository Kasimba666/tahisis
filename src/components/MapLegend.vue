<template>
  <div v-if="estateTypesLegend.length > 0" class="map-legend-panel">
    <div class="legend-header" v-if="showToggleButton">
      <span class="legend-title">Легенда ({{ estateTypesLegend.length }})</span>
      <button class="toggle-button" @click="toggleExpanded">
        {{ isExpanded ? 'Скрыть' : 'Показать все' }}
      </button>
    </div>
    <div class="legend-items">
      <div v-for="item in visibleItems" :key="item.id" class="legend-item">
        <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
        <div class="legend-label">{{ item.name }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MapLegend',
  props: {
    estateTypesLegend: {
      type: Array,
      default: () => []
    },
    forceExpanded: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      isExpanded: false
    }
  },
  computed: {
    showToggleButton() {
      return this.estateTypesLegend.length > 5
    },
    visibleItems() {
      if (!this.showToggleButton || this.isExpanded || this.forceExpanded) {
        return this.estateTypesLegend
      }
      return this.estateTypesLegend.slice(0, 5)
    }
  },
  methods: {
    toggleExpanded() {
      this.isExpanded = !this.isExpanded
    }
  }
}
</script>

<style scoped lang="scss">
.map-legend-panel {
  position: absolute;
  bottom: 15px;
  right: 10px;
  z-index: 1000;
  background: var(--bg-secondary);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 8px 12px;
  min-width: 150px;
  opacity: 0.9;
  transition: background-color 0.3s ease, border-color 0.3s ease, opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }

  .legend-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border-color);

    .legend-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .toggle-button {
      background: transparent;
      border: none;
      color: var(--accent-primary);
      font-size: 10px;
      font-weight: 500;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: var(--bg-tertiary);
      }

      &:active {
        transform: scale(0.95);
      }
    }
  }

  .legend-items {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid var(--bg-primary);
        flex-shrink: 0;
      }

      .legend-label {
        font-size: 11px;
        color: var(--text-secondary);
        line-height: 1.2;
      }
    }
  }
}
</style>
