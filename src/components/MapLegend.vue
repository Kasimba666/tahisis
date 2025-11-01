<template>
  <div v-if="estateTypesLegend.length > 0" class="map-legend-panel">
    <div class="legend-items">
      <div v-for="item in estateTypesLegend" :key="item.id" class="legend-item">
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
