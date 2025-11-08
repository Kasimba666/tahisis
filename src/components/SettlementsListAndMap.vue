<template>
  <div class="settlements-list-and-map">
    <div class="view-controls">
      <div class="mode-selector">
        <el-radio-group v-model="dataMode" size="small" disabled>
          <el-radio-button label="settlement">Населённые пункты</el-radio-button>
        </el-radio-group>
      </div>

      <ViewModeSelector v-model="viewMode" />

      <div class="stats">
        <el-button size="large" type="primary" @click="exportToExcel" :disabled="loading || settlementsData.length === 0">
          <el-icon><Download /></el-icon>
          Экспорт в Excel
        </el-button>

        <el-tag size="large" type="info">Всего населённых пунктов: {{ settlementsData.length }}</el-tag>
        <el-tag size="large" type="success">Общее население: {{ formatNumber(totalPopulation) }}</el-tag>
      </div>
    </div>

    <div class="content-area" :class="viewMode">
      <div v-if="viewMode === 'list' || viewMode === 'split'" class="list-section" :class="{ 'split-mode': viewMode === 'split' }">
        <!-- Таблица населённых пунктов -->
        <el-table
          :data="settlementsData"
          v-loading="loading"
          style="width: 100%"
          border
          stripe
          size="small"
          @row-dblclick="viewSettlementDetails"
          :show-summary="true"
          sum-text="Итого"
          :summary-method="getSummary"
          :row-class-name="getRowClassName"
        >
          <el-table-column prop="settlement_name_old" label="Нас. пункт (старое)" min-width="150" sortable>
            <template #default="scope">
              <div class="settlement-name">
                <strong>{{ scope.row.settlement_name_old }}</strong>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="settlement_name_modern" label="Нас. пункт (совр.)" min-width="150" sortable />

          <el-table-column prop="district_name" label="Район" width="120" sortable />

          <el-table-column prop="revision_count" label="Кол. ревизий" width="100" align="right" sortable>
            <template #default="scope">
              <el-tag size="small" type="info">{{ scope.row.revision_count }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="estates_count" label="Кол. сословий" width="100" align="right" sortable>
            <template #default="scope">
              <el-tag size="small" type="warning">{{ scope.row.estates_count }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="religions_count" label="Кол. религий" width="100" align="right" sortable>
            <template #default="scope">
              <el-tag size="small" type="success">{{ scope.row.religions_count }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="male" label="Мужчины" width="80" align="right" sortable>
            <template #default="scope">
              <span class="number-cell">{{ formatNumber(scope.row.male) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="female" label="Женщины" width="80" align="right" sortable>
            <template #default="scope">
              <span class="number-cell">{{ formatNumber(scope.row.female) }}</span>
            </template>
          </el-table-column>

          <el-table-column prop="total" label="Всего" width="80" align="right" sortable>
            <template #default="scope">
              <el-tag type="primary" size="small">{{ formatNumber(scope.row.total) }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="viewMode === 'map' || viewMode === 'split'" class="map-section">
        <MapView ref="mapView" :settlements="syncedSettlementsForMap" :geoJsonData="syncedSettlementsGeoJson" />
      </div>

      <div v-if="viewMode === 'geojson'" class="geojson-section">
        <GeoJsonViewer :geoJsonData="settlementsGeoJson" />
      </div>
    </div>

    <!-- Drawer для деталей населённого пункта -->
    <el-drawer
      v-model="detailsDrawerVisible"
      title="Детали населённого пункта"
      direction="rtl"
      size="600px"
      :before-close="closeDetailsDrawer"
    >
      <div v-if="selectedSettlement" class="settlement-details">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="Населенный пункт (старое)">
            <strong>{{ selectedSettlement.settlement_name_old }}</strong>
          </el-descriptions-item>

          <el-descriptions-item label="Населенный пункт (современное)">
            {{ selectedSettlement.settlement_name_modern || '—' }}
          </el-descriptions-item>

          <el-descriptions-item label="Район">
            {{ selectedSettlement.district_name }}
          </el-descriptions-item>

          <el-descriptions-item label="Количество ревизий">
            <el-tag type="info">{{ selectedSettlement.revision_count }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Количество сословий">
            <el-tag type="warning">{{ selectedSettlement.estates_count }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Количество религий">
            <el-tag type="success">{{ selectedSettlement.religions_count }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Мужчины">
            <el-tag type="danger">{{ formatNumber(selectedSettlement.male) }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Женщины">
            <el-tag type="danger">{{ formatNumber(selectedSettlement.female) }}</el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Общее население">
            <el-tag type="primary" size="large">{{ formatNumber(selectedSettlement.total) }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- Список ревизий для этого населённого пункта -->
        <div class="revisions-section">
          <el-divider content-position="left">
            <h4 style="margin: 0;">Ревизии</h4>
          </el-divider>

          <div v-if="selectedSettlement.revisions && selectedSettlement.revisions.length > 0">
            <el-table
              :data="selectedSettlement.revisions"
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

        <!-- Список сословий для этого населённого пункта -->
        <div class="estates-section">
          <el-divider content-position="left">
            <h4 style="margin: 0;">Сословия</h4>
          </el-divider>

          <div v-if="selectedSettlement.estates && selectedSettlement.estates.length > 0">
            <el-table
              :data="selectedSettlement.estates"
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
          <el-button type="primary" size="small" @click="showOnMap" v-if="selectedSettlement && hasCoordinates">
            <el-icon><Location /></el-icon>
            Карта
          </el-button>
          <el-button size="small" @click="closeDetailsDrawer">Закрыть</el-button>
        </div>
      </template>
    </el-drawer>

  </div>
</template>

<script>
import { Download, DataBoard, Location } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { supabase } from '@/services/supabase'
import * as XLSX from 'xlsx'
import MapView from './MapView.vue'
import ViewModeSelector from './ViewModeSelector.vue'
import GeoJsonViewer from './GeoJsonViewer.vue'
import { useTableSorting } from '@/composables/useStorage.js'
import {
  getModeFromURL,
  setModeInURL,
  getSortingFromURL,
  setSortingInURL,
  getFiltersFromURL,
  setFiltersInURL,
  getAllParamsFromURL,
  setAllParamsInURL
} from '@/router'

export default {
  name: 'SettlementsListAndMap',
  components: {
    Download,
    Location,
    MapView,
    ViewModeSelector,
    GeoJsonViewer
  },
  props: {
    filters: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    districts: {
      type: Array,
      default: () => []
    },
    typeEstates: {
      type: Array,
      default: () => []
    },
    subtypeEstates: {
      type: Array,
      default: () => []
    },
    religions: {
      type: Array,
      default: () => []
    },
    affiliations: {
      type: Array,
      default: () => []
    },
    volosts: {
      type: Array,
      default: () => []
    },
    landowners: {
      type: Array,
      default: () => []
    },
    militaryUnits: {
      type: Array,
      default: () => []
    },
    revisions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      dataMode: 'settlement',
      viewMode: 'list',
      settlementsData: [],
      allSettlements: [],
      allRevisions: [],
      allDistricts: [],
      allTypeEstates: [],
      allSubtypeEstates: [],
      allReligions: [],
      allAffiliations: [],
      allVolosts: [],
      allLandowners: [],
      allMilitaryUnits: [],
      detailsDrawerVisible: false,
      selectedSettlement: null,
      internalLoading: false,
      currentFilters: null,
      estateTypeColors: {}
    }
  },
  setup() {
    // Используем composable для управления сортировкой с сохранением в localStorage
    const { sorting, setSorting, resetSorting } = useTableSorting('settlement_name_modern', 'asc')
    return {
      sorting,
      setSorting,
      resetSorting
    }
  },
  computed: {
    hasCoordinates() {
      if (!this.selectedSettlement) return false
      return this.selectedSettlement.lat && this.selectedSettlement.lon
    },

    totalPopulation() {
      return this.settlementsData.reduce((sum, settlement) => sum + (settlement.total || 0), 0)
    },

    // Преобразование данных для MapView компонента
    settlementsForMap() {
      console.log('=== settlementsForMap computed ===')
      console.log('settlementsData.length:', this.settlementsData.length)
      const mapped = this.settlementsData.map(settlement => {
        // Получаем все типы сословий с населением
        const estateTypes = this.getEstateTypesByPopulation(settlement)
        
        // Собираем уникальные религии из estates
        const religions = this.getUniqueReligions(settlement)
        
        return {
          lat: settlement.lat,
          lon: settlement.lon,
          name: settlement.settlement_name_old || settlement.settlement_name_modern,
          nameModern: settlement.settlement_name_modern,
          district: settlement.district_name,
          male: settlement.male || 0,
          female: settlement.female || 0,
          population: settlement.total,
          estateTypes: estateTypes, // массив типов сословий с цветами
          religions: religions, // массив названий религий
          estates: settlement.estates || [] // детальные данные по сословиям
        }
      })
      console.log('mapped settlements:', mapped.slice(0, 2))
      const filtered = mapped.filter(s => s.lat && s.lon) // Только с координатами
      console.log('filtered settlements (with coordinates):', filtered.length)
      return filtered
    },

    settlementsGeoJson() {
      // Всегда конвертировать settlementsData в GeoJSON
      console.log('=== Settlements GeoJSON Debug ===')
      console.log('settlementsData length:', this.settlementsData?.length || 0)
      console.log('settlementsData sample:', this.settlementsData?.slice(0, 2))

      const result = this.convertToGeoJsonForMap(this.settlementsData)
      console.log('converted GeoJSON features:', result?.features?.length || 0)
      console.log('converted GeoJSON:', result)

      return result
    },

    // Синхронизированные computed properties для MapView (только когда данные загружены)
    syncedSettlementsForMap() {
      return this.settlementsData && this.settlementsData.length > 0 ? this.settlementsForMap : []
    },

    syncedSettlementsGeoJson() {
      return this.settlementsData && this.settlementsData.length > 0 ? this.settlementsGeoJson : null
    }
  },
  async mounted() {
    console.log('=== SettlementsListAndMap MOUNTED ===')
    console.log('this.filters:', this.filters)

    // Добавляем обработчик события из popup карты
    window.addEventListener('show-settlement-details', this.handleShowDetailsFromMap)

    // Восстанавливаем параметры из URL
    this.restoreParamsFromURL()

    try {
      // Загружаем все необходимые справочники
      console.log('=== LOADING REFERENCE DATA ===')

      // Загружаем справочник населенных пунктов
      await this.loadSettlementsReference()
      console.log('Settlements reference loaded')

      // Загружаем ревизии
      await this.loadRevisions()
      console.log('Revisions loaded')

      // Загружаем остальные справочники если не переданы через пропсы
      await this.loadAdditionalReferenceData()

      console.log('=== REFERENCE DATA LOADED ===')
      console.log('allSettlements:', this.allSettlements?.length || 0)
      console.log('allRevisions:', this.allRevisions?.length || 0)

      // Синхронизируем локальные данные с props (для совместимости)
      this.syncWithProps()

      // Проверяем наличие фильтров перед загрузкой данных
      const hasFilters = this.filters && Object.keys(this.filters).length > 0
      console.log('hasFilters check:', hasFilters, 'filters object:', this.filters)

      if (hasFilters) {
        console.log('=== APPLYING FILTERS ===')
        this.applyFilters(this.filters)
      } else {
        console.log('=== CALLING LOAD DATA (no filters) ===')
        this.loadData()
      }
    } catch (error) {
      console.error('Error in mounted:', error)
    }
  },
  beforeUnmount() {
    // Удаляем обработчик события
    window.removeEventListener('show-settlement-details', this.handleShowDetailsFromMap)
  },
  methods: {
    // Обработчик события из popup карты
    handleShowDetailsFromMap(event) {
      console.log('=== SettlementsListAndMap: handleShowDetailsFromMap ===')
      console.log('Event:', event)
      console.log('Event detail:', event.detail)
      
      const settlement = event.detail?.settlement
      console.log('Settlement from event:', settlement)
      
      if (settlement) {
        // Находим полную запись settlement in settlementsData по имени
        const fullSettlement = this.settlementsData.find(s => 
          s.settlement_name_old === settlement.name || 
          s.settlement_name_modern === settlement.nameModern
        )
        console.log('Full settlement found:', fullSettlement)
        
        if (fullSettlement) {
          this.viewSettlementDetails(fullSettlement)
        } else {
          console.warn('Settlement not found in settlementsData:', settlement.name, settlement.nameModern)
        }
      } else {
        console.warn('No settlement in event.detail')
      }
    },

    // Определение класса для строки таблицы
    getRowClassName({ row }) {
      if (this.selectedSettlement && row.settlement_id === this.selectedSettlement.settlement_id) {
        return 'highlighted-row'
      }
      return ''
    },
    syncWithProps() {
      // Если props не пустые, используем их вместо локальных данных
      if (this.districts && this.districts.length > 0) {
        this.allDistricts = this.districts
      }
      if (this.typeEstates && this.typeEstates.length > 0) {
        this.allTypeEstates = this.typeEstates
      }
      if (this.subtypeEstates && this.subtypeEstates.length > 0) {
        this.allSubtypeEstates = this.subtypeEstates
      }
      if (this.religions && this.religions.length > 0) {
        this.allReligions = this.religions
      }
      if (this.affiliations && this.affiliations.length > 0) {
        this.allAffiliations = this.affiliations
      }
      if (this.volosts && this.volosts.length > 0) {
        this.allVolosts = this.volosts
      }
      if (this.landowners && this.landowners.length > 0) {
        this.allLandowners = this.landowners
      }
      if (this.militaryUnits && this.militaryUnits.length > 0) {
        this.allMilitaryUnits = this.militaryUnits
      }
      if (this.revisions && this.revisions.length > 0) {
        this.allRevisions = this.revisions
      }
    },

    loadSettlementsReference() {
      return supabase
        .from('Settlement')
        .select('id, name_modern, name_old, lat, lon, id_district')
        .then(({ data, error }) => {
          if (error) throw error
          this.allSettlements = data || []
        })
        .catch(error => {
          console.error('Error loading settlements reference:', error)
        })
    },

    loadRevisions() {
      return supabase
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
    },

    // Загружаем дополнительные справочники для фильтров
    loadAdditionalReferenceData() {
      console.log('=== Loading additional reference data ===')
      const promises = [
        // Districts
        supabase
          .from('District')
          .select('id, name')
          .then(({ data, error }) => {
            if (error) throw error
            this.allDistricts = data || []
            console.log('Districts loaded:', this.allDistricts.length)
          }),

        // TypeEstates (без цветов, только для фильтров)
        supabase
          .from('Type_estate')
          .select('id, name')
          .then(({ data, error }) => {
            if (error) throw error
            this.allTypeEstates = data || []
            console.log('TypeEstates loaded:', this.allTypeEstates.length)
          }),

        // SubtypeEstates (с цветами для маркеров карты)
        supabase
          .from('Subtype_estate')
          .select('id, name, id_type_estate, id_type_religion, id_type_affiliation, color')
          .then(({ data, error }) => {
            if (error) throw error
            this.allSubtypeEstates = data || []
            
            // Сохраняем цвета подтипов в отдельный объект для быстрого доступа
            this.estateTypeColors = {}
            this.allSubtypeEstates.forEach(subtype => {
              if (subtype.color) {
                this.estateTypeColors[subtype.id] = subtype.color
              }
            })
            
            console.log('SubtypeEstates loaded:', this.allSubtypeEstates.length)
            console.log('Subtype estate colors:', this.estateTypeColors)
          }),

        // Religions
        supabase
          .from('Type_religion')
          .select('id, name')
          .then(({ data, error }) => {
            if (error) throw error
            this.allReligions = data || []
            console.log('Religions loaded:', this.allReligions.length)
          }),

        // Affiliations
        supabase
          .from('Type_affiliation')
          .select('id, name')
          .then(({ data, error }) => {
            if (error) throw error
            this.allAffiliations = data || []
            console.log('Affiliations loaded:', this.allAffiliations.length)
          }),

        // Volosts
        supabase
          .from('Volost')
          .select('id, name')
          .then(({ data, error }) => {
            if (error) throw error
            this.allVolosts = data || []
            console.log('Volosts loaded:', this.allVolosts.length)
          }),

        // Landowners
        supabase
          .from('Landowner')
          .select('id, description, person')
          .then(({ data, error }) => {
            if (error) throw error
            this.allLandowners = data || []
            console.log('Landowners loaded:', this.allLandowners.length)
          }),

        // MilitaryUnits
        supabase
          .from('Military_unit')
          .select('id, description, person')
          .then(({ data, error }) => {
            if (error) throw error
            this.allMilitaryUnits = data || []
            console.log('MilitaryUnits loaded:', this.allMilitaryUnits.length)
          })
      ]

      return Promise.all(promises)
        .then(() => {
          console.log('=== All additional reference data loaded ===')
          console.log('Reference data summary:', {
            districts: this.allDistricts.length,
            typeEstates: this.allTypeEstates.length,
            subtypeEstates: this.allSubtypeEstates.length,
            religions: this.allReligions.length,
            affiliations: this.allAffiliations.length,
            volosts: this.allVolosts.length,
            landowners: this.allLandowners.length,
            militaryUnits: this.allMilitaryUnits.length
          })
        })
        .catch(error => {
          console.error('Error loading additional reference data:', error)
          // Не будем выбрасывать ошибку - пусть работает без справочников если нужно
        })
    },

    loadData() {
      this.internalLoading = true

      try {
        this.loadSettlementsDataNew()
          .then(() => {
            this.internalLoading = false
          })
          .catch(err => {
            console.error('Error loading settlements data:', err)
            this.internalLoading = false
          })
      } catch (error) {
        console.error('Error loading settlements data:', error)
        this.internalLoading = false
      }
    },

    // Надёжная серверная выборка и агрегация по фильтрам (.then/.catch)
    loadSettlementsDataNew() {
      const filters = this.currentFilters || {}

      const hasEstateFilters =
        (filters.typeEstates && filters.typeEstates.length > 0) ||
        (filters.subtypeEstates && filters.subtypeEstates.length > 0) ||
        (filters.religions && filters.religions.length > 0) ||
        (filters.affiliations && filters.affiliations.length > 0) ||
        (filters.volosts && filters.volosts.length > 0) ||
        (filters.landowners && filters.landowners.length > 0) ||
        (filters.militaryUnits && filters.militaryUnits.length > 0)

      const getEstateIdsPromise = () => {
        if (!hasEstateFilters) return Promise.resolve({ ids: null })

        let estateQuery = supabase
          .from('Estate')
          .select('id_report_record, id_subtype_estate, id_volost, id_landowner, id_military_unit')

        if (filters.typeEstates && filters.typeEstates.length > 0 && this.allSubtypeEstates && this.allSubtypeEstates.length > 0) {
          const subtypeIds = this.allSubtypeEstates
            .filter(s => filters.typeEstates.includes(s.id_type_estate))
            .map(s => s.id)
          if (subtypeIds.length > 0) estateQuery = estateQuery.in('id_subtype_estate', subtypeIds)
          else return Promise.resolve({ ids: [] })
        }

        if (filters.subtypeEstates && filters.subtypeEstates.length > 0) {
          estateQuery = estateQuery.in('id_subtype_estate', filters.subtypeEstates)
        }

        if (filters.religions && filters.religions.length > 0 && this.allSubtypeEstates && this.allSubtypeEstates.length > 0) {
          const subtypeIds = this.allSubtypeEstates
            .filter(s => filters.religions.includes(s.id_type_religion))
            .map(s => s.id)
          if (subtypeIds.length > 0) estateQuery = estateQuery.in('id_subtype_estate', subtypeIds)
          else return Promise.resolve({ ids: [] })
        }

        if (filters.affiliations && filters.affiliations.length > 0 && this.allSubtypeEstates && this.allSubtypeEstates.length > 0) {
          const subtypeIds = this.allSubtypeEstates
            .filter(s => filters.affiliations.includes(s.id_type_affiliation))
            .map(s => s.id)
          if (subtypeIds.length > 0) estateQuery = estateQuery.in('id_subtype_estate', subtypeIds)
          else return Promise.resolve({ ids: [] })
        }

        if (filters.volosts && filters.volosts.length > 0) estateQuery = estateQuery.in('id_volost', filters.volosts)
        if (filters.landowners && filters.landowners.length > 0) estateQuery = estateQuery.in('id_landowner', filters.landowners)
        if (filters.militaryUnits && filters.militaryUnits.length > 0) estateQuery = estateQuery.in('id_military_unit', filters.militaryUnits)

        return estateQuery.then(({ data, error }) => {
          if (error) throw error
          const ids = (data || []).map(e => e.id_report_record)
          return { ids: Array.from(new Set(ids)) }
        })
      }

      const settlementIds = (() => {
        if (filters.districts && filters.districts.length > 0 && this.allSettlements && this.allSettlements.length > 0) {
          return this.allSettlements
            .filter(s => filters.districts.includes(s.id_district))
            .map(s => s.id)
        }
        return []
      })()

      const oldNames = (filters.settlementNamesOld && filters.settlementNamesOld.length > 0) ? filters.settlementNamesOld : []
      const modernNames = (filters.settlementNamesModern && filters.settlementNamesModern.length > 0) ? filters.settlementNamesModern : []

      return getEstateIdsPromise()
        .then(({ ids: rrIdsFromEstate }) => {
          let reportQuery = supabase
            .from('Report_record')
            .select(`
              id,
              code,
              population_all,
              id_settlment,
              Revision_report!Report_record_id_revision_report_fkey(id, year, number),
              Settlement!Report_record_id_settlment_fkey(name_old, name_modern, lat, lon, id_district, District(name))
            `)
            .not('id_settlment', 'is', null)

          if (filters.revision && filters.revision.length > 0) {
            reportQuery = reportQuery.in('Revision_report.number', filters.revision)
          }
          if (rrIdsFromEstate !== null) {
            if (rrIdsFromEstate.length === 0) {
              this.settlementsData = []
              return { reportRecords: [], estates: [] }
            }
            reportQuery = reportQuery.in('id', rrIdsFromEstate)
          }
          if (settlementIds.length > 0) reportQuery = reportQuery.in('id_settlment', settlementIds)
          if (oldNames.length > 0) reportQuery = reportQuery.in('Settlement.name_old', oldNames)
          if (modernNames.length > 0) reportQuery = reportQuery.in('Settlement.name_modern', modernNames)

          return reportQuery.order('id', { ascending: false }).then(({ data, error }) => {
            if (error) throw error
            return { reportRecords: data || [], rrIdsFromEstate }
          })
        })
        .then(({ reportRecords, rrIdsFromEstate }) => {
          if (!reportRecords || reportRecords.length === 0) {
            this.settlementsData = []
            return { estates: [], reportRecords }
          }
          const rrIds = reportRecords.map(r => r.id)
          let estatesQuery = supabase
            .from('Estate')
            .select(`
              id,
              male,
              female,
              id_report_record,
              id_subtype_estate,
              id_volost,
              id_landowner,
              id_military_unit,
              Subtype_estate!Estate_id_subtype_estate_fkey(
                id,
                name,
                id_type_estate,
                id_type_religion,
                id_type_affiliation,
                Type_estate!Subtype_estate_id_type_estate_fkey(id, name),
                Type_religion!Subtype_estate_id_type_religion_fkey(id, name)
              )
            `)
            .in('id_report_record', rrIds)

          if (filters.typeEstates && filters.typeEstates.length > 0 && this.allSubtypeEstates && this.allSubtypeEstates.length > 0) {
            const subtypeIds = this.allSubtypeEstates
              .filter(s => filters.typeEstates.includes(s.id_type_estate))
              .map(s => s.id)
            if (subtypeIds.length > 0) estatesQuery = estatesQuery.in('id_subtype_estate', subtypeIds)
          }
          if (filters.subtypeEstates && filters.subtypeEstates.length > 0) estatesQuery = estatesQuery.in('id_subtype_estate', filters.subtypeEstates)
          if (filters.religions && filters.religions.length > 0 && this.allSubtypeEstates && this.allSubtypeEstates.length > 0) {
            const subtypeIds = this.allSubtypeEstates
              .filter(s => filters.religions.includes(s.id_type_religion))
              .map(s => s.id)
            if (subtypeIds.length > 0) estatesQuery = estatesQuery.in('id_subtype_estate', subtypeIds)
          }
          if (filters.affiliations && filters.affiliations.length > 0 && this.allSubtypeEstates && this.allSubtypeEstates.length > 0) {
            const subtypeIds = this.allSubtypeEstates
              .filter(s => filters.affiliations.includes(s.id_type_affiliation))
              .map(s => s.id)
            if (subtypeIds.length > 0) estatesQuery = estatesQuery.in('id_subtype_estate', subtypeIds)
          }
          if (filters.volosts && filters.volosts.length > 0) estatesQuery = estatesQuery.in('id_volost', filters.volosts)
          if (filters.landowners && filters.landowners.length > 0) estatesQuery = estatesQuery.in('id_landowner', filters.landowners)
          if (filters.militaryUnits && filters.militaryUnits.length > 0) estatesQuery = estatesQuery.in('id_military_unit', filters.militaryUnits)

          return estatesQuery.then(({ data, error }) => {
            if (error) throw error
            return { reportRecords, estates: data || [] }
          })
        })
        .then(({ reportRecords, estates }) => {
          const rrToSettlement = new Map()
          reportRecords.forEach(r => rrToSettlement.set(r.id, r.id_settlment))

          const settlementsMap = new Map()
          reportRecords.forEach(r => {
            const s = r.Settlement || {}
            const sid = r.id_settlment
            if (!sid) return
            if (!settlementsMap.has(sid)) {
              settlementsMap.set(sid, {
                settlement_id: sid,
                settlement_name_old: s.name_old || '',
                settlement_name_modern: s.name_modern || '',
                district_name: s.District?.name || '',
                district_id: s.id_district || null,
                lat: s.lat || null,
                lon: s.lon || null,
                revision_count: 0,
                estates_count: 0,
                religions_count: 0,
                male: 0,
                female: 0,
                total: 0,
                type_estate_ids: [],
                subtype_estate_ids: [],
                religion_ids: [],
                affiliation_ids: [],
                volost_ids: [],
                landowner_ids: [],
                military_unit_ids: [],
                revisions: []
              })
            }
          })

          const bySettlement = new Map()
          estates.forEach(e => {
            const sid = rrToSettlement.get(e.id_report_record)
            if (!sid) return
            if (!bySettlement.has(sid)) bySettlement.set(sid, [])
            bySettlement.get(sid).push(e)
          })

          settlementsMap.forEach((value, sid) => {
            const rrForSettlement = reportRecords.filter(r => r.id_settlment === sid)
            const eForSettlement = bySettlement.get(sid) || []

            const totalMale = eForSettlement.reduce((s, e) => s + (e.male || 0), 0)
            const totalFemale = eForSettlement.reduce((s, e) => s + (e.female || 0), 0)
            const total = totalMale + totalFemale

            const revs = new Set(rrForSettlement.map(r => r.Revision_report?.id).filter(Boolean))
            const rels = new Set(eForSettlement.map(e => e.Subtype_estate?.id_type_religion).filter(Boolean))
            const tTypes = new Set(eForSettlement.map(e => e.Subtype_estate?.id_type_estate).filter(Boolean))
            const sTypes = new Set(eForSettlement.map(e => e.id_subtype_estate).filter(Boolean))
            const affs = new Set(eForSettlement.map(e => e.Subtype_estate?.id_type_affiliation).filter(Boolean))
            const vols = new Set(eForSettlement.map(e => e.id_volost).filter(Boolean))
            const lnds = new Set(eForSettlement.map(e => e.id_landowner).filter(Boolean))
            const mils = new Set(eForSettlement.map(e => e.id_military_unit).filter(Boolean))

            value.revision_count = revs.size
            value.estates_count = eForSettlement.length
            value.religions_count = rels.size
            value.male = totalMale
            value.female = totalFemale
            value.total = total
            value.type_estate_ids = Array.from(tTypes)
            value.subtype_estate_ids = Array.from(sTypes)
            value.religion_ids = Array.from(rels)
            value.affiliation_ids = Array.from(affs)
            value.volost_ids = Array.from(vols)
            value.landowner_ids = Array.from(lnds)
            value.military_unit_ids = Array.from(mils)

            // Подсчитываем мужчин и женщин для каждой ревизии из estates
            value.revisions = rrForSettlement.map(rr => {
              const estatesForRevision = eForSettlement.filter(e => e.id_report_record === rr.id)
              const maleCount = estatesForRevision.reduce((sum, e) => sum + (e.male || 0), 0)
              const femaleCount = estatesForRevision.reduce((sum, e) => sum + (e.female || 0), 0)
              
              return {
                id: rr.id,
                year: rr.Revision_report?.year || '',
                number: rr.Revision_report?.number || '',
                male: maleCount,
                female: femaleCount,
                total: rr.population_all || (maleCount + femaleCount)
              }
            })

            // Детальный список сословий для этого населённого пункта
            value.estates = eForSettlement.map(estate => ({
              id: estate.id,
              subtype_estate_name: estate.Subtype_estate?.name || '',
              type_estate_name: estate.Subtype_estate?.Type_estate?.name || '',
              type_religion_name: estate.Subtype_estate?.Type_religion?.name || '',
              male: estate.male || 0,
              female: estate.female || 0,
              total: (estate.male || 0) + (estate.female || 0)
            }))

            // Удобный список номеров ревизий
            value.revision_numbers = value.revisions.map(r => r.number).filter(n => n !== '' && n !== null && n !== undefined)
          })

          // Исключаем строки без ревизий (revision_count === 0) на всякий случай
          const allData = Array.from(settlementsMap.values()).filter(item => (item.revision_count || 0) > 0)
          const filtered = this.applyFiltersToData(allData)
          this.settlementsData = filtered
        })
        .catch(error => {
          console.error('Error loading settlements data:', error)
          throw error
        })
    },

    applyFiltersToData(data) {
      if (!this.currentFilters) return data

      let filtered = [...data]

      // Фильтр по районам
      if (this.currentFilters.districts?.length > 0) {
        filtered = filtered.filter(item => {
          if (!item.district_id) return false
          return this.currentFilters.districts.includes(item.district_id)
        })
      }

      // Фильтр по старым названиям населенных пунктов
      if (this.currentFilters.settlementNamesOld?.length > 0) {
        filtered = filtered.filter(item =>
          item.settlement_name_old && this.currentFilters.settlementNamesOld.includes(item.settlement_name_old)
        )
      }

      // Фильтр по современным названиям населенных пунктов
      if (this.currentFilters.settlementNamesModern?.length > 0) {
        filtered = filtered.filter(item =>
          item.settlement_name_modern && this.currentFilters.settlementNamesModern.includes(item.settlement_name_modern)
        )
      }

      // Фильтр по типам сословий
      if (this.currentFilters.typeEstates?.length > 0) {
        filtered = filtered.filter(item => {
          if (!item.type_estate_ids || item.type_estate_ids.length === 0) return false
          return this.currentFilters.typeEstates.some(typeId => item.type_estate_ids.includes(typeId))
        })
      }

      // Фильтр по подтипам сословий
      if (this.currentFilters.subtypeEstates?.length > 0) {
        filtered = filtered.filter(item => {
          if (!item.subtype_estate_ids || item.subtype_estate_ids.length === 0) return false
          return this.currentFilters.subtypeEstates.some(subtypeId => item.subtype_estate_ids.includes(subtypeId))
        })
      }

      // Фильтр по религиям
      if (this.currentFilters.religions?.length > 0) {
        filtered = filtered.filter(item => {
          if (!item.religion_ids || item.religion_ids.length === 0) return false
          return this.currentFilters.religions.some(religionId => item.religion_ids.includes(religionId))
        })
      }

      // Фильтр по принадлежностям
      if (this.currentFilters.affiliations?.length > 0) {
        filtered = filtered.filter(item => {
          if (!item.affiliation_ids || item.affiliation_ids.length === 0) return false
          return this.currentFilters.affiliations.some(affiliationId => item.affiliation_ids.includes(affiliationId))
        })
      }

      // Фильтр по волостям
      if (this.currentFilters.volosts?.length > 0) {
        filtered = filtered.filter(item => {
          if (!item.volost_ids || item.volost_ids.length === 0) return false
          return this.currentFilters.volosts.some(volostId => item.volost_ids.includes(volostId))
        })
      }

      // Фильтр по помещикам
      if (this.currentFilters.landowners?.length > 0) {
        filtered = filtered.filter(item => {
          if (!item.landowner_ids || item.landowner_ids.length === 0) return false
          return this.currentFilters.landowners.some(landownerId => item.landowner_ids.includes(landownerId))
        })
      }

      // Фильтр по войсковым организациям
      if (this.currentFilters.militaryUnits?.length > 0) {
        filtered = filtered.filter(item => {
          if (!item.military_unit_ids || item.military_unit_ids.length === 0) return false
          return this.currentFilters.militaryUnits.some(unitId => item.military_unit_ids.includes(unitId))
        })
      }

      // Фильтр по количеству мужчин
      if (this.currentFilters.maleEnabled) {
        if (this.currentFilters.maleMin !== null && this.currentFilters.maleMin !== undefined) {
          filtered = filtered.filter(item => item.male >= this.currentFilters.maleMin)
        }
        if (this.currentFilters.maleMax !== null && this.currentFilters.maleMax !== undefined) {
          filtered = filtered.filter(item => item.male <= this.currentFilters.maleMax)
        }
      }

      // Фильтр по количеству женщин
      if (this.currentFilters.femaleEnabled) {
        if (this.currentFilters.femaleMin !== null && this.currentFilters.femaleMin !== undefined) {
          filtered = filtered.filter(item => item.female >= this.currentFilters.femaleMin)
        }
        if (this.currentFilters.femaleMax !== null && this.currentFilters.femaleMax !== undefined) {
          filtered = filtered.filter(item => item.female <= this.currentFilters.femaleMax)
        }
      }

      // Фильтр по общему населению
      if (this.currentFilters.populationEnabled) {
        if (this.currentFilters.populationMin !== null && this.currentFilters.populationMin !== undefined) {
          filtered = filtered.filter(item => item.total >= this.currentFilters.populationMin)
        }
        if (this.currentFilters.populationMax !== null && this.currentFilters.populationMax !== undefined) {
          filtered = filtered.filter(item => item.total <= this.currentFilters.populationMax)
        }
      }

      return filtered
    },

    applyFilters(filters) {
      this.currentFilters = filters
      this.loadData()
    },

    viewSettlementDetails(row) {
      this.selectedSettlement = row
      this.detailsDrawerVisible = true
      
      // Автоматически выделяем объект на карте при открытии деталей
      if (row.lat && row.lon && (this.viewMode === 'map' || this.viewMode === 'split')) {
        this.$nextTick(() => {
          window.dispatchEvent(new CustomEvent('show-settlement-on-map', {
            detail: { 
              lat: parseFloat(row.lat), 
              lon: parseFloat(row.lon), 
              name: row.settlement_name_modern || row.settlement_name_old 
            }
          }))
        })
      }
    },

    closeDetailsDrawer() {
      this.detailsDrawerVisible = false
      this.selectedSettlement = null
      
      // Убираем обводку на карте
      window.dispatchEvent(new CustomEvent('clear-settlement-highlight'))
    },

    showOnMap() {
      if (!this.selectedSettlement || !this.hasCoordinates) return
      
      const lat = this.selectedSettlement.lat
      const lon = this.selectedSettlement.lon
      const name = this.selectedSettlement.settlement_name_modern || this.selectedSettlement.settlement_name_old
      
      if (lat && lon) {
        // Закрываем drawer деталей
        this.detailsDrawerVisible = false
        
        // Переключаемся на режим карты если нужно
        if (this.viewMode === 'list' || this.viewMode === 'geojson') {
          this.viewMode = 'split'
        }
        
        // Вызываем метод выделения на карте
        this.$nextTick(() => {
          window.dispatchEvent(new CustomEvent('show-settlement-on-map', {
            detail: { lat: parseFloat(lat), lon: parseFloat(lon), name }
          }))
        })
      }
    },

    formatNumber(num) {
      return new Intl.NumberFormat('ru-RU').format(num || 0)
    },

    // Метод для расчёта итоговой строки
    getSummary() {
      const sums = {
        male: 0,
        female: 0,
        total: this.totalPopulation
      }

      this.settlementsData.forEach(settlement => {
        sums.male += settlement.male || 0
        sums.female += settlement.female || 0
      })

      return [
        'Итого:',
        '',
        '',
        '',
        '',
        '',
        sums.male.toLocaleString(),
        sums.female.toLocaleString(),
        sums.total.toLocaleString()
      ]
    },

    // Экспорт в Excel
    exportToExcel() {
      try {
        if (!this.settlementsData || this.settlementsData.length === 0) {
          ElMessage.warning('Нет данных для экспорта')
          return
        }

        // Создаем книгу Excel
        const workbook = XLSX.utils.book_new()

        // Подготавливаем данные для экспорта
        const exportData = this.prepareExportData()

        // Создаем лист с данными
        const worksheet = XLSX.utils.aoa_to_sheet(exportData)

        // Устанавливаем ширину колонок
        worksheet['!cols'] = [
          { wch: 20 }, // Нас. пункт (старое)
          { wch: 20 }, // Нас. пункт (совр.)
          { wch: 15 }, // Район
          { wch: 12 }, // Кол. ревизий
          { wch: 12 }, // Кол. сословий
          { wch: 12 }, // Кол. религий
          { wch: 10 }, // Мужчины
          { wch: 10 }, // Женщины
          { wch: 10 }  // Всего
        ]

        // Добавляем стили форматирования
        this.applyExcelStyles(worksheet, exportData.length)

        // Добавляем лист в книгу
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Населённые пункты')

        // Генерируем имя файла с текущей датой и временем
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
        const fileName = `населенные_пункты_${timestamp}.xlsx`

        // Сохраняем файл
        XLSX.writeFile(workbook, fileName)

        ElMessage.success(`Данные экспортированы в файл ${fileName}`)
      } catch (error) {
        console.error('Ошибка экспорта в Excel:', error)
        ElMessage.error('Ошибка при экспорте данных в Excel')
      }
    },

    // Подготовка данных для экспорта
    prepareExportData() {
      const data = []

      // Добавляем информацию о фильтрах
      const filterInfo = this.getFilterInfo()
      if (filterInfo) {
        data.push([filterInfo, '', '', '', '', '', '', '', ''])
        data.push(['', '', '', '', '', '', '', '', '']) // Пустая строка
      }

      // Добавляем заголовки
      data.push([
        'Нас. пункт (старое)',
        'Нас. пункт (совр.)',
        'Район',
        'Кол. ревизий',
        'Кол. сословий',
        'Кол. религий',
        'Мужчины',
        'Женщины',
        'Всего'
      ])

      // Добавляем данные
      this.settlementsData.forEach(settlement => {
        data.push([
          settlement.settlement_name_old || '',
          settlement.settlement_name_modern || '',
          settlement.district_name || '',
          settlement.revision_count || 0,
          settlement.estates_count || 0,
          settlement.religions_count || 0,
          settlement.male || 0,
          settlement.female || 0,
          settlement.total || 0
        ])
      })

      // Добавляем итоговую строку
      const sums = this.getSummary()
      data.push(['', '', '', '', '', '', '', '', '']) // Пустая строка перед итогами
      data.push(sums)

      return data
    },

    // Получение информации о фильтрах
    getFilterInfo() {
      if (!this.currentFilters) return null

      const activeFilters = []

      // Ревизии
      if (this.currentFilters.revision && this.currentFilters.revision.length > 0) {
        const revisionNames = this.currentFilters.revision.map(num => {
          const revision = this.revisions?.find(r => r.number === num)
          return revision ? `${revision.number} ревизия (${revision.year})` : `№:${num}`
        })
        activeFilters.push(`Ревизии: ${revisionNames.join(', ')}`)
      }

      // Районы
      if (this.currentFilters.districts?.length > 0) {
        const districtNames = this.currentFilters.districts.map(id => {
          const district = this.districts?.find(d => d.id === id)
          return district ? district.name : `ID:${id}`
        })
        activeFilters.push(`Районы: ${districtNames.join(', ')}`)
      }

      // Типы сословий
      if (this.currentFilters.typeEstates?.length > 0) {
        const typeNames = this.currentFilters.typeEstates.map(id => {
          const type = this.typeEstates?.find(t => t.id === id)
          return type ? type.name : `ID:${id}`
        })
        activeFilters.push(`Типы сословий: ${typeNames.join(', ')}`)
      }

      // Диапазоны населения
      if (this.currentFilters.maleEnabled) {
        const min = this.currentFilters.maleMin || 0
        const max = this.currentFilters.maleMax || '∞'
        activeFilters.push(`Мужчины: ${min}-${max}`)
      }

      if (this.currentFilters.femaleEnabled) {
        const min = this.currentFilters.femaleMin || 0
        const max = this.currentFilters.femaleMax || '∞'
        activeFilters.push(`Женщины: ${min}-${max}`)
      }

      if (this.currentFilters.populationEnabled) {
        const min = this.currentFilters.populationMin || 0
        const max = this.currentFilters.populationMax || '∞'
        activeFilters.push(`Население: ${min}-${max}`)
      }

      if (activeFilters.length === 0) return null

      return `Фильтры: ${activeFilters.join(' | ')} | Населённых пунктов: ${this.settlementsData.length}`
    },

    // Применение стилей к Excel файлу
    applyExcelStyles(worksheet, dataLength) {
      // Определяем диапазоны
      const filterRowIndex = 1
      const headerRowIndex = filterRowIndex + 2
      const summaryRowIndex = dataLength

      // Стили
      const styles = {
        filterInfo: {
          font: { bold: true, color: { rgb: '2E75B6' }, sz: 12 },
          fill: { fgColor: { rgb: 'E7F3FF' } },
          alignment: { horizontal: 'left', vertical: 'center' }
        },
        headers: {
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
          fill: { fgColor: { rgb: '4472C4' } },
          alignment: { horizontal: 'center', vertical: 'center' }
        },
        summary: {
          font: { bold: true, color: { rgb: '000000' }, sz: 11 },
          fill: { fgColor: { rgb: 'FFF2CC' } },
          alignment: { horizontal: 'left', vertical: 'center' }
        }
      }

      // Применяем стили к строке с фильтрами
      if (worksheet['A' + filterRowIndex]) {
        worksheet['A' + filterRowIndex].s = styles.filterInfo
      }

      // Применяем стили к заголовкам
      for (let col = 1; col <= 9; col++) {
        const cellRef = this.getColumnLetter(col) + headerRowIndex
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = styles.headers
        }
      }

      // Применяем стили к итоговой строке
      if (worksheet['A' + summaryRowIndex]) {
        worksheet['A' + summaryRowIndex].s = styles.summary
      }

      // Применяем стили к числовым колонкам в итоговой строке
      for (let col = 4; col <= 9; col++) {
        const cellRef = this.getColumnLetter(col) + summaryRowIndex
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            ...styles.summary,
            alignment: { horizontal: 'right', vertical: 'center' }
          }
        }
      }
    },

    // Получение буквы колонки по номеру
    getColumnLetter(colNum) {
      let result = ''
      while (colNum > 0) {
        colNum--
        result = String.fromCharCode(65 + (colNum % 26)) + result
        colNum = Math.floor(colNum / 26)
      }
      return result
    },

    // Обновляем маркеры на картах при изменении данных
    updateMapMarkers() {
      // Проверяем что данные загружены и карта существует
      if (!this.settlementsData || this.settlementsData.length === 0) {
        console.log('No settlements data to update markers')
        return
      }

      if (this.$refs.mapView && this.$refs.mapView.$el && this.$refs.mapView.$el.parentNode) {
        // Обновляем маркеры на обеих картах
        this.$nextTick(() => {
          try {
            if (this.$refs.mapView.updateLeafletMarkers && typeof this.$refs.mapView.updateLeafletMarkers === 'function') {
              this.$refs.mapView.updateLeafletMarkers()
            }
            if (this.$refs.mapView.updateOpenLayersMarkers && typeof this.$refs.mapView.updateOpenLayersMarkers === 'function') {
              this.$refs.mapView.updateOpenLayersMarkers()
            }

            // Обновляем размер карт после добавления маркеров
            setTimeout(() => {
              try {
                if (this.$refs.mapView.leafletMapInstance && this.$refs.mapView.$refs.leafletMap && this.$refs.mapView.$refs.leafletMap.parentNode) {
                  const rect = this.$refs.mapView.$refs.leafletMap.getBoundingClientRect()
                  if (rect.width > 0 && rect.height > 0) {
                    this.$refs.mapView.leafletMapInstance.invalidateSize()
                  }
                }
                if (this.$refs.mapView.olMapInstance && this.$refs.mapView.$refs.olMap && this.$refs.mapView.$refs.olMap.parentNode) {
                  const rect = this.$refs.mapView.$refs.olMap.getBoundingClientRect()
                  if (rect.width > 0 && rect.height > 0) {
                    this.$refs.mapView.olMapInstance.updateSize()
                  }
                }
              } catch (error) {
                console.warn('Error updating map size:', error)
              }
            }, 200)
          } catch (error) {
            console.warn('Error updating map markers:', error)
          }
        })
      }
    },

    // Конвертация settlements в GeoJSON для карты
    convertToGeoJsonForMap(settlementsData) {
      const validSettlements = settlementsData.filter(s => s.lat && s.lon)

      const features = validSettlements.map(settlement => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [settlement.lon, settlement.lat]
        },
        properties: {
          id: settlement.settlement_id || settlement.id,
          name_old: settlement.settlement_name_old || settlement.name_old,
          name_modern: settlement.settlement_name_modern || settlement.name_modern,
          district_name: settlement.district_name,
          population: {
            male: settlement.male || 0,
            female: settlement.female || 0,
            total: settlement.total || 0
          },
          // Дополнительная информация для карты
          revision_count: settlement.revision_count,
          estates_count: settlement.estates_count,
          religions_count: settlement.religions_count,
          // Полные данные ревизий
          revisions: (settlement.revisions || []).map(rev => ({
            number: rev.number,
            year: rev.year,
            male: rev.male || 0,
            female: rev.female || 0,
            total: rev.total || 0
          })),
          // Агрегированные данные по сословиям
          estates: (settlement.estates || []).map(estate => ({
            subtype_name: estate.subtype_estate_name,
            type_name: estate.type_estate_name,
            religion_name: estate.type_religion_name,
            male: estate.male || 0,
            female: estate.female || 0,
            total: estate.total || 0
          })),
          // Группировка по типам сословий
          estate_types: this.groupEstatesByType(settlement.estates || []),
          // Флаг что это отфильтрованные данные
          filtered: true
        }
      }))

      return {
        type: 'FeatureCollection',
        features: features,
        crs: {
          type: 'name',
          properties: {
            name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
          }
        },
        metadata: {
          filtered: true,
          totalCount: settlementsData.length,
          exportedCount: features.length,
          exportedAt: new Date().toISOString()
        }
      }
    },

    // Группировка сословий по типам для карты
    groupEstatesByType(estates) {
      const groups = {}
      
      estates.forEach(estate => {
        const typeName = estate.type_estate_name || 'Прочие'
        if (!groups[typeName]) {
          groups[typeName] = {
            type_name: typeName,
            male: 0,
            female: 0,
            total: 0,
            count: 0
          }
        }
        groups[typeName].male += estate.male || 0
        groups[typeName].female += estate.female || 0
        groups[typeName].total += estate.total || 0
        groups[typeName].count++
      })

      return Object.values(groups)
    },

    // Восстанавливаем параметры из URL
    restoreParamsFromURL() {
      const urlParams = getAllParamsFromURL()

      // Восстанавливаем режим данных
      if (urlParams.mode) {
        this.dataMode = urlParams.mode
      }

      // Восстанавливаем фильтры
      if (urlParams.filters) {
        this.currentFilters = urlParams.filters
      }

      // Восстанавливаем сортировку
      if (urlParams.sorting) {
        this.sorting.column = urlParams.sorting.column
        this.sorting.order = urlParams.sorting.order
      }
    },

    // Получение уникальных религий для населённого пункта
    getUniqueReligions(settlement) {
      if (!settlement.estates || settlement.estates.length === 0) {
        return []
      }

      // Собираем уникальные названия религий
      const religionSet = new Set()
      settlement.estates.forEach(estate => {
        if (estate.type_religion_name) {
          religionSet.add(estate.type_religion_name)
        }
      })

      return Array.from(religionSet)
    },

    // Получение всех подтипов сословий с населением для населённого пункта
    getEstateTypesByPopulation(settlement) {
      if (!settlement.subtype_estate_ids || settlement.subtype_estate_ids.length === 0) {
        return []
      }

      // Подсчитываем население по каждому подтипу из детальных данных
      const subtypePopulation = {}
      
      if (settlement.estates && settlement.estates.length > 0) {
        settlement.estates.forEach(estate => {
          const subtypeId = this.allSubtypeEstates.find(st => st.name === estate.subtype_estate_name)?.id
          if (subtypeId) {
            if (!subtypePopulation[subtypeId]) {
              subtypePopulation[subtypeId] = {
                id: subtypeId,
                population: 0
              }
            }
            subtypePopulation[subtypeId].population += (estate.total || 0)
          }
        })
      } else {
        // Если нет детальных данных, просто добавляем подтипы без населения
        settlement.subtype_estate_ids.forEach(subtypeId => {
          subtypePopulation[subtypeId] = {
            id: subtypeId,
            population: 0
          }
        })
      }

      // Преобразуем в массив и сортируем по населению (от большего к меньшему)
      const subtypes = Object.values(subtypePopulation)
        .map(subtype => {
          const subtypeInfo = this.allSubtypeEstates.find(st => st.id === subtype.id)
          return {
            id: subtype.id,
            name: subtypeInfo?.name || 'Неизвестно',
            population: subtype.population,
            color: this.estateTypeColors[subtype.id] || 'hsl(0, 0%, 60%)'
          }
        })
        .sort((a, b) => b.population - a.population)

      return subtypes
    }
  },

  updated() {
    // Обновляем маркеры на карте при изменении данных или GeoJSON
    if (this.viewMode === 'map' || this.viewMode === 'split') {
      this.updateMapMarkers()
    }
  },

  watch: {
    viewMode() {
      this.$nextTick(() => {
        // Триггерим обновление размера карт через изменение ключа
        this.$forceUpdate()
      })
      // Даем время на отрисовку, затем обновляем карты
      setTimeout(() => {
        this.$forceUpdate()
        // Обновляем маркеры при переключении режимов карты
        if (this.viewMode === 'map' || this.viewMode === 'split') {
          this.updateMapMarkers()
        }
      }, 100)
    },

    settlementsData: {
      handler() {
        if (this.viewMode === 'map' || this.viewMode === 'split') {
          this.updateMapMarkers()
        }
      },
      deep: true
    }
  }
}
</script>

<style scoped lang="scss">
.settlements-list-and-map {
  display: flex;
  flex-direction: column;
  height: 100%;

  .view-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-color);
    gap: 1rem;
    flex-wrap: wrap;

    .mode-selector,
    .view-selector {
      flex-shrink: 0;
    }

    .stats {
      display: flex;
      gap: 0.5rem;
      margin-left: auto;
    }
  }

  .content-area {
    flex: 1;
    min-height: 0;
    display: flex;
    gap: 1rem;
    height: 100%;
    min-height: 400px;

    &.list {
      .list-section {
        flex: 1;
        min-height: 0;
        height: 100%;
      }
      .map-section {
        display: none;
      }
    }

    &.map {
      .list-section {
        display: none;
      }
      .map-section {
        flex: 1;
      }
    }

    &.split {
      .list-section {
        flex: 1;
        min-width: 0;
        min-height: 0;
        overflow-y: auto;
        overflow-x: auto;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background-color: var(--bg-secondary);
        margin-right: 0.5rem;
      }
      .map-section {
        flex: 1;
        min-width: 0;
        min-height: 0;
        height: auto;
        max-height: 50vh;
        min-height: 250px;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background-color: var(--bg-secondary);
        overflow: hidden;
        margin-left: 0.5rem;
      }
    }

    &.geojson {
      .list-section,
      .map-section,
      .geojson-section {
        flex: 1;
        min-height: 0;
        height: 100%;
      }
      .list-section,
      .map-section {
        display: none;
      }
      .geojson-section {
        display: flex;
        flex-direction: column;
      }
    }

    .list-section {
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      overflow-x: auto;
      overflow-y: auto;

      // Кастомные стили для скроллбара - толще и всегда видимые
      &::-webkit-scrollbar {
        width: 20px;
        height: 20px;
      }

      &::-webkit-scrollbar-track {
        background: var(--bg-tertiary);
        border-radius: 10px;
        margin: 2px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--accent-primary);
        border-radius: 10px;
        border: 3px solid var(--bg-tertiary);
        min-height: 50px;

        &:hover {
          background: var(--accent-primary);
          opacity: 0.8;
        }

        &:active {
          background: var(--accent-primary);
          opacity: 1;
        }
      }

      &::-webkit-scrollbar-corner {
        background: var(--bg-tertiary);
      }

      // Кнопки скроллбара
      &::-webkit-scrollbar-button {
        display: none;
      }

      // Для Firefox - толще и всегда видимые
      scrollbar-width: auto;
      scrollbar-color: var(--accent-primary) var(--bg-tertiary);

      // Обеспечиваем что таблица занимает всю высоту контейнера
      :deep(.el-table) {
        height: 100% !important;
        flex: 1;
        min-width: fit-content;

        // Обертка таблицы для корректной работы скроллбаров
        .el-table__body-wrapper {
          overflow-x: auto !important;
          overflow-y: auto !important;
        }

        .el-table__header-wrapper {
          overflow-x: auto !important;
        }
      }
    }

    .map-section {
      display: flex;
      flex-direction: column;
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      min-height: 400px;
      flex: 1;
    }

    .geojson-section {
      display: flex;
      flex-direction: column;
      background-color: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      flex: 1;

      .geojson-header {
        padding: 1rem;
        background-color: var(--bg-tertiary);
        border-bottom: 1px solid var(--border-color);

        h3 {
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
          font-size: 1.25rem;
          font-weight: 600;
        }

        .geojson-info {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
      }
    }
  }

  .settlement-name {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .modern-name {
      font-size: 0.85em;
      color: var(--text-muted);
      font-style: italic;
    }
  }

  .number-cell {
    font-family: 'Courier New', monospace;
  }

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
}

@media (max-width: 1024px) {
  .settlements-list-and-map {
    .view-controls {
      flex-direction: column;
      align-items: stretch;

      .stats {
        margin-left: 0;
      }
    }

    .content-area {
      &.split {
        flex-direction: column;

        .list-section {
          max-height: 40vh;
          min-height: 200px;
        }

        .map-section {
          max-height: 40vh;
          min-height: 250px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .settlements-list-and-map {
    .content-area {
      &.split {
        .list-section {
          max-height: 35vh;
          min-height: 180px;
        }

        .map-section {
          max-height: 35vh;
          min-height: 220px;
        }
      }
    }
  }
}

// Стили для Sortable.js drag-and-drop
:deep(.sortable-ghost) {
  opacity: 0.4;
  background-color: var(--accent-primary) !important;
}

:deep(.sortable-chosen) {
  background-color: var(--bg-tertiary) !important;
  cursor: move !important;
}

:deep(.sortable-drag) {
  opacity: 0.8;
  background-color: var(--bg-secondary) !important;
  box-shadow: 0 4px 12px var(--shadow) !important;
}

:deep(.el-table__header-wrapper th) {
  cursor: move;
  user-select: none;

  &:hover {
    background-color: var(--bg-tertiary) !important;
  }
}

// Стили для drawer деталей
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
}

// Стили для итоговой строки таблицы
:deep(.el-table__footer-wrapper) {
  background-color: var(--bg-tertiary) !important;
  font-weight: 600;
  color: var(--text-primary) !important;

  td {
    background-color: var(--bg-tertiary) !important;
    color: var(--text-primary) !important;
    border-top: 2px solid var(--accent-primary) !important;
    font-weight: 600 !important;
  }
}

// Выделение выбранной строки в таблице
:deep(.el-table__body tr.highlighted-row) {
  background-color: var(--accent-primary) !important;
  
  td {
    background-color: var(--accent-primary) !important;
    color: var(--bg-primary) !important;
    font-weight: 600 !important;
  }

  &:hover > td {
    background-color: var(--accent-primary) !important;
  }
}
</style>
