<template>
  <el-radio-group v-model="viewMode" size="small" @change="onModeChange">
    <el-radio-button label="list">Список</el-radio-button>
    <el-radio-button label="map">Карта</el-radio-button>
    <el-radio-button label="split">Разделить</el-radio-button>
    <el-radio-button label="geojson">GeoJSON</el-radio-button>
  </el-radio-group>
</template>

<script>
export default {
  name: 'ViewModeSelector',
  props: {
    modelValue: {
      type: String,
      default: 'list'
    }
  },
  emits: ['update:modelValue', 'change'],
  data() {
    return {
      viewMode: this.modelValue
    }
  },
  watch: {
    modelValue(newVal) {
      this.viewMode = newVal
    }
  },
  methods: {
    onModeChange() {
      this.$emit('update:modelValue', this.viewMode)
      this.$emit('change', this.viewMode)
    }
  }
}
</script>

<style scoped lang="scss">
:deep(.el-radio-group) {
  .el-radio-button {
    :deep(.el-radio-button__inner) {
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      color: var(--text-primary);
      background-color: var(--bg-secondary);
      border-color: var(--border-color);

      &:hover {
        background-color: var(--bg-hover);
      }

      &.is-active {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
        color: white;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
    }
  }
}
</style>
