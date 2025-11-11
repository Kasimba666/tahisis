<template>
  <el-drawer
    v-model="visible"
    title="Детали записи"
    direction="rtl"
    size="500px"
    :before-close="handleClose"
  >
    <div v-if="record" class="details-content">
      <el-descriptions :column="1" border size="small">
        <el-descriptions-item label="ID">
          {{ record.id }}
        </el-descriptions-item>
        
        <template v-if="dataMode === 'estate'">
          <el-descriptions-item label="Год ревизии">
            {{ record.revision_year || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Номер ревизии">
            {{ record.revision_number || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Населенный пункт (старый)">
            {{ record.settlement_name_old || '—' }}
            <span v-if="record.settlement_name_modern && record.settlement_name_modern !== record.settlement_name_old" class="alt-name">
              ({{ record.settlement_name_modern }})
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="Населенный пункт (современный)">
            {{ record.settlement_name_modern || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Район">
            {{ record.district_name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Подтип сословия">
            {{ record.subtype_estate_name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Тип сословия">
            {{ record.type_estate_name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Религия">
            {{ record.type_religion_name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Принадлежность">
            {{ record.type_affiliation_name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Мужчины">
            {{ record.male || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="Женщины">
            {{ record.female || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="Всего">
            <el-tag type="success">{{ record.total || 0 }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Волость">
            {{ record.volost_name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Помещик">
            {{ record.landowner_description || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Воинская часть">
            {{ record.military_unit_description || '—' }}
          </el-descriptions-item>
        </template>

        <template v-else>
          <el-descriptions-item label="Код">
            {{ record.code }}
          </el-descriptions-item>
          <el-descriptions-item label="Год ревизии">
            {{ record.revision_year || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Номер ревизии">
            {{ record.revision_number || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Населенный пункт (старое)">
            {{ record.settlement_name_old || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Населенный пункт (современное)">
            {{ record.settlement_name_modern || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Район">
            {{ record.district_name || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Широта">
            {{ record.lat || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Долгота">
            {{ record.lon || '—' }}
          </el-descriptions-item>
          <el-descriptions-item label="Общее население">
            <el-tag type="success">{{ record.population_all || 0 }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Количество сословий">
            {{ record.estates_count || '—' }}
          </el-descriptions-item>
        </template>
      </el-descriptions>

      <!-- Кнопка показа карты -->
      <div style="margin-top: 12px;">
        <el-button 
          type="primary" 
          size="small" 
          @click="toggleMap"
          :disabled="!hasCoordinates"
        >
          <el-icon><Location /></el-icon>
          {{ showMap ? 'Скрыть карту' : 'Показать на карте' }}
        </el-button>
        <span v-if="!hasCoordinates" style="margin-left: 8px; color: var(--text-muted); font-size: 12px;">
          (координаты отсутствуют)
        </span>
      </div>

      <!-- Карта -->
      <div v-if="showMap && hasCoordinates" class="map-section">
        <div class="map-container">
          <MapView
            :center="mapCenter"
            :zoom="13"
            :markers="mapMarkers"
            :height="'300px'"
            :show-controls="false"
            :show-layers="false"
          />
        </div>
      </div>

      <!-- Связанные сословия для режима Report_record -->
      <div v-if="dataMode === 'report'" class="related-estates-section">
        <el-divider content-position="left">
          <h4 style="margin: 0;">Связанные сословия</h4>
        </el-divider>

        <div v-if="record.loadingEstates" class="loading-estates">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>Загрузка сословий...</span>
        </div>

        <div v-else-if="record.relatedEstates && record.relatedEstates.length > 0">
          <el-collapse accordion>
            <el-collapse-item
              v-for="(estate, index) in record.relatedEstates"
              :key="estate.id"
              :title="`${index + 1}. ${estate.subtype_estate_name} (${estate.total} чел.)`"
              :name="estate.id"
            >
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item label="ID">
                  {{ estate.id }}
                </el-descriptions-item>
                <el-descriptions-item label="Подтип сословия">
                  {{ estate.subtype_estate_name }}
                </el-descriptions-item>
                <el-descriptions-item label="Тип сословия">
                  {{ estate.type_estate_name }}
                </el-descriptions-item>
                <el-descriptions-item label="Религия">
                  {{ estate.type_religion_name }}
                </el-descriptions-item>
                <el-descriptions-item label="Принадлежность">
                  {{ estate.type_affiliation_name }}
                </el-descriptions-item>
                <el-descriptions-item label="Мужчины">
                  {{ estate.male }}
                </el-descriptions-item>
                <el-descriptions-item label="Женщины">
                  {{ estate.female }}
                </el-descriptions-item>
                <el-descriptions-item label="Всего">
                  <el-tag type="success">{{ estate.total }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="Волость">
                  {{ estate.volost_name }}
                </el-descriptions-item>
                <el-descriptions-item label="Помещик">
                  {{ estate.landowner_description }}
                </el-descriptions-item>
                <el-descriptions-item label="Воинская часть">
                  {{ estate.military_unit_description }}
                </el-descriptions-item>
              </el-descriptions>
            </el-collapse-item>
          </el-collapse>
        </div>

        <el-empty
          v-else
          description="Нет связанных сословий"
          :image-size="80"
        />
      </div>
    </div>
    
    <template #footer>
      <div style="display: flex; gap: 8px;">
        <el-button @click="handleClose">Закрыть</el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script>
import { Location, Loading } from '@element-plus/icons-vue'
import MapView from '@/components/MapView.vue'

export default {
  name: 'EstateRecordDetails',
  components: {
    Location,
    Loading,
    MapView
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    record: {
      type: Object,
      default: null
    },
    dataMode: {
      type: String,
      default: 'estate',
      validator: (value) => ['estate', 'report'].includes(value)
    },
    allSettlements: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue', 'show-on-map'],
  data() {
    return {
      showMap: false
    }
  },
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
      if (!this.record) return false

      if (this.dataMode === 'report') {
        return this.record.lat && this.record.lon
      } else {
        const settlement = this.allSettlements?.find(s =>
          s.name_modern === this.record.settlement_name_modern ||
          s.name_old === this.record.settlement_name_old
        )
        return settlement && settlement.lat && settlement.lon
      }
    },
    mapCenter() {
      if (!this.hasCoordinates) return [55.7558, 37.6176] // Москва по умолчанию

      if (this.dataMode === 'report') {
        return [parseFloat(this.record.lat), parseFloat(this.record.lon)]
      } else {
        const settlement = this.allSettlements?.find(s =>
          s.name_modern === this.record.settlement_name_modern ||
          s.name_old === this.record.settlement_name_old
        )
        return [parseFloat(settlement.lat), parseFloat(settlement.lon)]
      }
    },
    mapMarkers() {
      if (!this.hasCoordinates) return []

      let lat, lon, name, popupContent

      if (this.dataMode === 'report') {
        lat = this.record.lat
        lon = this.record.lon
        name = this.record.settlement_name_modern || this.record.settlement_name_old
        popupContent = `
          <div style="font-family: Arial, sans-serif; max-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #409eff;">${name}</h4>
            <p style="margin: 4px 0;"><strong>Население:</strong> ${this.record.population_all || 0}</p>
            <p style="margin: 4px 0;"><strong>Сословий:</strong> ${this.record.estates_count || 0}</p>
            <p style="margin: 4px 0;"><strong>Район:</strong> ${this.record.district_name || '—'}</p>
          </div>
        `
      } else {
        const settlement = this.allSettlements?.find(s =>
          s.name_modern === this.record.settlement_name_modern ||
          s.name_old === this.record.settlement_name_old
        )
        lat = settlement.lat
        lon = settlement.lon
        name = this.record.settlement_name_modern || this.record.settlement_name_old
        popupContent = `
          <div style="font-family: Arial, sans-serif; max-width: 200px;">
            <h4 style="margin: 0 0 8px 0; color: #409eff;">${name}</h4>
            <p style="margin: 4px 0;"><strong>Подтип сословия:</strong> ${this.record.subtype_estate_name || '—'}</p>
            <p style="margin: 4px 0;"><strong>Мужчин:</strong> ${this.record.male || 0}</p>
            <p style="margin: 4px 0;"><strong>Женщин:</strong> ${this.record.female || 0}</p>
            <p style="margin: 4px 0;"><strong>Всего:</strong> ${this.record.total || 0}</p>
            <p style="margin: 4px 0;"><strong>Район:</strong> ${this.record.district_name || '—'}</p>
          </div>
        `
      }

      return [{
        lat: parseFloat(lat),
        lng: parseFloat(lon),
        popup: popupContent,
        icon: {
          iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#409eff"/>
            </svg>
          `),
          iconSize: [24, 24],
          iconAnchor: [12, 24],
          popupAnchor: [0, -24]
        }
      }]
    }
  },
  methods: {
    toggleMap() {
      this.showMap = !this.showMap
    },
    handleClose() {
      this.visible = false
      this.showMap = false
    }
  }
}
</script>

<style scoped lang="scss">
.details-content {
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
  
  .map-section {
    margin-top: 1.5rem;

    .map-container {
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border-color);
      background-color: var(--bg-primary);
    }
  }

  .related-estates-section {
    margin-top: 1.5rem;

    .loading-estates {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 2rem;
      color: var(--text-muted);
    }

    :deep(.el-collapse) {
      border-top: none;

      .el-collapse-item__header {
        background-color: var(--bg-secondary);
        color: var(--text-primary);
        font-weight: 500;
        padding: 0 1rem;

        &:hover {
          background-color: var(--bg-tertiary);
        }
      }

      .el-collapse-item__content {
        padding: 1rem;
        background-color: var(--bg-primary);
      }
    }
  }
}

.alt-name {
  font-size: 0.85em;
  color: var(--text-muted);
  font-style: italic;
  margin-left: 0.25rem;
}
</style>
