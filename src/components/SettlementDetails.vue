<template>
  <el-drawer
    v-model="visible"
    title="Детали населённого пункта"
    direction="rtl"
    size="600px"
    :before-close="handleClose"
  >
    <div v-if="settlement" class="settlement-details">
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="Населенный пункт (старое)">
          <strong>{{ settlement.settlement_name_old }}</strong>
        </el-descriptions-item>

        <el-descriptions-item label="Населенный пункт (современное)">
          {{ settlement.settlement_name_modern || '—' }}
        </el-descriptions-item>

        <el-descriptions-item label="Район">
          {{ settlement.district_name }}
        </el-descriptions-item>

        <el-descriptions-item label="Количество ревизий">
          <el-tag type="info">{{ settlement.revision_count }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="Количество сословий">
          <el-tag type="warning">{{ settlement.estates_count }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="Количество религий">
          <el-tag type="success">{{ settlement.religions_count }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="Мужчины">
          <el-tag type="danger">{{ formatNumber(settlement.male) }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="Женщины">
          <el-tag type="danger">{{ formatNumber(settlement.female) }}</el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="Общее население">
          <el-tag type="primary" size="large">{{ formatNumber(settlement.total) }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <!-- Список ревизий -->
      <div class="revisions-section">
        <el-divider content-position="left">
          <h4 style="margin: 0;">Ревизии</h4>
        </el-divider>

        <div v-if="settlement.revisions && settlement.revisions.length > 0">
          <el-table
            :data="settlement.revisions"
            size="small"
            border
            stripe
          >
            <el-table-column prop="year" label="Год" width="80" />
            <el-table-column prop="number" label="Рев." width="60" />
            <el-table-column prop="male" label="М" width="60" align="right" />
            <el-table-column prop="female" label="Ж" width="60" align="right" />
            <el-table-column prop="total" label="Всего" width="80" align="right">
              <template #default="scope">
                <el-tag size="small" type="primary">{{ formatNumber(scope.row.total) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-empty v-else description="Нет данных о ревизиях" :image-size="60" />
      </div>

      <!-- Список сословий -->
      <div class="estates-section">
        <el-divider content-position="left">
          <h4 style="margin: 0;">Сословия</h4>
        </el-divider>

        <div v-if="settlement.estates && settlement.estates.length > 0">
          <el-table
            :data="settlement.estates"
            size="small"
            border
            stripe
          >
            <el-table-column prop="subtype_estate_name" label="Подтип сословия" min-width="150" />
            <el-table-column prop="type_estate_name" label="Тип сословия" width="110" />
            <el-table-column prop="type_religion_name" label="Религия" width="100" />
            <el-table-column prop="male" label="М" width="55" align="right" />
            <el-table-column prop="female" label="Ж" width="55" align="right" />
            <el-table-column prop="total" label="Всего" width="80" align="right">
              <template #default="scope">
                <el-tag size="small" type="success">{{ formatNumber(scope.row.total) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-empty v-else description="Нет данных о сословиях" :image-size="60" />
      </div>
    </div>

    <template #footer>
      <div style="display: flex; gap: 8px;">
        <el-button type="primary" size="small" @click="handleShowOnMap" v-if="hasCoordinates">
          <el-icon><Location /></el-icon>
          Карта
        </el-button>
        <el-button size="small" @click="handleClose">Закрыть</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script>
import { Location } from '@element-plus/icons-vue'

export default {
  name: 'SettlementDetails',
  components: {
    Location
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    settlement: {
      type: Object,
      default: null
    }
  },
  emits: ['update:modelValue', 'show-on-map'],
  computed: {
    visible: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    hasCoordinates() {
      return this.settlement && this.settlement.lat && this.settlement.lon
    }
  },
  methods: {
    formatNumber(num) {
      return new Intl.NumberFormat('ru-RU').format(num || 0)
    },
    handleClose() {
      this.visible = false
    },
    handleShowOnMap() {
      if (this.hasCoordinates) {
        this.$emit('show-on-map', {
          lat: this.settlement.lat,
          lon: this.settlement.lon,
          name: this.settlement.settlement_name_modern || this.settlement.settlement_name_old
        })
      }
    }
  }
}
</script>

<style scoped lang="scss">
.settlement-details {
  :deep(.el-descriptions) {
    .el-descriptions__label {
      background-color: var(--bg-secondary) !important;
      color: var(--text-primary) !important;
      font-weight: 500;
    }

    .el-descriptions__content {
      background-color: var(--bg-primary) !important;
      color: var(--text-secondary) !important;
    }
  }

  .revisions-section,
  .estates-section {
    margin-top: 1.5rem;

    h4 {
      color: var(--text-primary);
      font-weight: 600;
    }
  }
}
</style>
