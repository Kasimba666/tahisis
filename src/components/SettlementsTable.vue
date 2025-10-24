<template>
  <div class="settlements-table">
    <!-- Панель управления -->
    <div class="table-controls">
      <div class="table-info">
        <el-tag size="large" type="info">Всего населённых пунктов: {{ settlementsData.length }}</el-tag>
        <el-tag size="large" type="success">Общее население: {{ formatNumber(totalPopulation) }}</el-tag>
      </div>

      <div class="table-actions">
        <el-button size="large" type="primary" @click="exportToExcel" :disabled="loading || settlementsData.length === 0">
          <el-icon><Download /></el-icon>
          Экспорт в Excel
        </el-button>
        <el-button size="large" type="success" @click="openGeoJsonViewer">
          <el-icon><DataBoard /></el-icon>
          Экспорт в GeoJSON
        </el-button>
        <el-button
          size="large"
          type="success"
          @click="showOnMap"
          :disabled="loading || settlementsData.length === 0"
          class="map-button"
          title="Показать отфильтрованные поселения на интерактивной карте"
        >
          <el-icon class="map-icon"><MapLocation /></el-icon>
          <span class="button-text">Показать на карте</span>
          <el-tag size="small" type="info" class="count-badge">{{ settlementsData.length }}</el-tag>
        </el-button>
      </div>
    </div>

    <!-- Таблица -->
    <el-table
      :data="settlementsData"
      v-loading="loading"
      style="width: 100%"
      border
      stripe
      size="small"
      height="calc(100vh - 200px)"
      @row-dblclick="viewSettlementDetails"
      :show-summary="true"
      sum-text="Итого"
      :summary-method="getSummary"
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
                  <el-tag size="mini" type="primary">{{ formatNumber(scope.row.total) }}</el-tag>
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
              <el-table-column prop="type_estate_name" label="Тип сословия" width="120" />
              <el-table-column prop="type_religion_name" label="Религия" width="100" />
              <el-table-column prop="male" label="М" width="60" align="right" />
              <el-table-column prop="female" label="Ж" width="60" align="right" />
              <el-table-column prop="total" label="Всего" width="80" align="right">
                <template #default="scope">
                  <el-tag size="mini" type="success">{{ formatNumber(scope.row.total) }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <el-empty v-else description="Нет данных о сословиях" :image-size="60" />
        </div>
      </div>

      <template #footer>
        <el-button @click="closeDetailsDrawer">Закрыть</el-button>
      </template>
    </el-drawer>

    <!-- GeoJSON Viewer -->
    <GeoJsonViewer ref="geoJsonViewer" @show-on-map="handleShowOnMap" />

    <!-- Map Viewer with GeoJSON -->
    <MapWithGeoJsonViewer ref="mapViewer" />
  </div>
</template>

<script>
import { Download, DataBoard } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { supabase } from '@/services/supabase'
import * as XLSX from 'xlsx'
import GeoJsonViewer from './GeoJsonViewer.vue'
import MapWithGeoJsonViewer from './MapWithGeoJsonViewer.vue'

export default {
  name: 'SettlementsTable',
  components: {
    Download,
    GeoJsonViewer,
    MapWithGeoJsonViewer
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
      settlementsData: [],
      allSettlements: [],
      allRevisions: [],
      detailsDrawerVisible: false,
      selectedSettlement: null,
      internalLoading: false,
      currentFilters: null
    }
  },
  computed: {
    totalPopulation() {
      return this.settlementsData.reduce((sum, settlement) => sum + (settlement.total || 0), 0)
    }
  },
  async mounted() {
    await this.loadSettlementsReference()
    await this.loadRevisions()

    // Синхронизируем локальные данные с props
    this.syncWithProps()

    if (this.filters) {
      this.applyFilters(this.filters)
    } else {
      this.loadData()
    }
  },

  watch: {
    filters: {
      handler(newFilters) {
        if (newFilters) {
          this.applyFilters(newFilters)
        }
      },
      deep: true,
      immediate: true
    }
  },

  methods: {
  },

  methods: {
    // Синхронизация локальных данных с props
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
    async loadSettlementsReference() {
      try {
        const { data, error } = await supabase
          .from('Settlement')
          .select('id, name_modern, name_old, lat, lon, id_district')

        if (error) throw error
        this.allSettlements = data || []

        // Диагностика: проверяем данные о районах
        // console.log('=== SETTLEMENTS DEBUG INFO ===')
        // console.log('Total settlements loaded:', this.allSettlements.length)
        // console.log('Sample settlements with district_id:', this.allSettlements.slice(0, 5).map(s => ({
        //   id: s.id,
        //   name: s.name_old,
        //   district_id: s.id_district
        // })))

        // Проверяем таблицу District отдельно
        const { data: districts, error: districtError } = await supabase
          .from('District')
          .select('id, name')

        if (districtError) {
          console.error('Error loading districts:', districtError)
        } else {
          // console.log('Available districts:', districts)
          // console.log('Districts count:', districts?.length)
        }

        // Проверяем связь Settlement -> District
        const { data: settlementsWithDistricts, error: settlementsError } = await supabase
          .from('Settlement')
          .select(`
            id,
            name_old,
            name_modern,
            id_district,
            District!Settlement_id_district_fkey(id, name)
          `)
          .limit(10)

        if (settlementsError) {
          console.error('Error loading settlements with districts:', settlementsError)
        } else {
          // console.log('Sample settlements with district relation:', settlementsWithDistricts?.map(s => ({
          //   id: s.id,
          //   name: s.name_old,
          //   id_district: s.id_district,
          //   district_name: s.District?.name || 'NO DISTRICT'
          // })))
        }

        // Проверяем есть ли вообще данные в таблице Settlement
        const { data: allSettlements, error: allError } = await supabase
          .from('Settlement')
          .select('id, name_old, id_district')

        if (allError) {
          console.error('Error loading all settlements:', allError)
        } else {
          // console.log('All settlements count:', allSettlements?.length)
          // const withDistrict = allSettlements?.filter(s => s.id_district !== null) || []
          // const withoutDistrict = allSettlements?.filter(s => s.id_district === null) || []
          // console.log('Settlements with district:', withDistrict.length)
          // console.log('Settlements without district:', withoutDistrict.length)
        }
      } catch (error) {
        console.error('Error loading settlements reference:', error)
      }
    },

    async loadRevisions() {
      try {
        const { data, error } = await supabase
          .from('Revision_report')
          .select('id, year, number')
          .order('year', { ascending: true })

        if (error) throw error
        this.allRevisions = data || []
      } catch (error) {
        console.error('Error loading revisions:', error)
      }
    },

    async loadData() {
      this.internalLoading = true

      try {
        await this.loadSettlementsDataNew()
      } catch (error) {
        console.error('Error loading settlements data:', error)
        ElMessage.error('Ошибка загрузки данных о населённых пунктах')
      } finally {
        this.internalLoading = false
      }
    },

    // Применение фильтров к данным
    applyFiltersToData(data) {
      if (!this.currentFilters) return data

      let filtered = [...data]
      // console.log('=== SETTLEMENTS FILTER DEBUG ===')
      // console.log('Current filters object:', this.currentFilters)
      // console.log('Initial settlements count:', filtered.length)

      // Проверяем каждый тип фильтра
      // console.log('Filter checks:')
      // console.log('- districts:', this.currentFilters.districts, 'length:', this.currentFilters.districts?.length)
      // console.log('- settlementNamesOld:', this.currentFilters.settlementNamesOld, 'length:', this.currentFilters.settlementNamesOld?.length)
      // console.log('- settlementNamesModern:', this.currentFilters.settlementNamesModern, 'length:', this.currentFilters.settlementNamesModern?.length)
      // console.log('- typeEstates:', this.currentFilters.typeEstates, 'length:', this.currentFilters.typeEstates?.length)
      // console.log('- subtypeEstates:', this.currentFilters.subtypeEstates, 'length:', this.currentFilters.subtypeEstates?.length)
      // console.log('- religions:', this.currentFilters.religions, 'length:', this.currentFilters.religions?.length)
      // console.log('- affiliations:', this.currentFilters.affiliations, 'length:', this.currentFilters.affiliations?.length)
      // console.log('- volosts:', this.currentFilters.volosts, 'length:', this.currentFilters.volosts?.length)
      // console.log('- landowners:', this.currentFilters.landowners, 'length:', this.currentFilters.landowners?.length)
      // console.log('- militaryUnits:', this.currentFilters.militaryUnits, 'length:', this.currentFilters.militaryUnits?.length)

      // Фильтр по районам
      if (this.currentFilters.districts?.length > 0) {
        const beforeCount = filtered.length
        // console.log('District filter IDs:', this.currentFilters.districts)
        // console.log('Sample settlement district_ids:', filtered.slice(0, 3).map(s => s.district_id))
        filtered = filtered.filter(item => {
          if (!item.district_id) return false
          return this.currentFilters.districts.includes(item.district_id)
        })
        // console.log(`District filter applied: ${beforeCount} -> ${filtered.length} settlements`)
      }

      // Фильтр по старым названиям населенных пунктов
      if (this.currentFilters.settlementNamesOld?.length > 0) {
        const beforeCount = filtered.length
        filtered = filtered.filter(item =>
          item.settlement_name_old && this.currentFilters.settlementNamesOld.includes(item.settlement_name_old)
        )
        // console.log(`Old settlement names filter applied: ${beforeCount} -> ${filtered.length} settlements`)
      }

      // Фильтр по современным названиям населенных пунктов
      if (this.currentFilters.settlementNamesModern?.length > 0) {
        const beforeCount = filtered.length
        filtered = filtered.filter(item =>
          item.settlement_name_modern && this.currentFilters.settlementNamesModern.includes(item.settlement_name_modern)
        )
        // console.log(`Modern settlement names filter applied: ${beforeCount} -> ${filtered.length} settlements`)
      }

      // Фильтр по типам сословий
      if (this.currentFilters.typeEstates?.length > 0) {
        const beforeCount = filtered.length
        // console.log('=== TYPE ESTATES FILTER DEBUG ===')
        // console.log('Filter typeEstates:', this.currentFilters.typeEstates)
        // console.log('Sample settlement type_estate_ids:', filtered.slice(0, 3).map(s => s.type_estate_ids))
        filtered = filtered.filter(item => {
          if (!item.type_estate_ids || item.type_estate_ids.length === 0) return false
          return this.currentFilters.typeEstates.some(typeId => item.type_estate_ids.includes(typeId))
        })
        // console.log(`Type estates filter applied: ${beforeCount} -> ${filtered.length} settlements`)
      }

      // Фильтр по подтипам сословий
      if (this.currentFilters.subtypeEstates?.length > 0) {
        const beforeCount = filtered.length
        // console.log('=== SUBTYPE ESTATES FILTER DEBUG ===')
        // console.log('Filter subtypeEstates:', this.currentFilters.subtypeEstates)
        // console.log('Sample settlement subtype_estate_ids:', filtered.slice(0, 3).map(s => s.subtype_estate_ids))
        filtered = filtered.filter(item => {
          if (!item.subtype_estate_ids || item.subtype_estate_ids.length === 0) return false
          return this.currentFilters.subtypeEstates.some(subtypeId => item.subtype_estate_ids.includes(subtypeId))
        })
        // console.log(`Subtype estates filter applied: ${beforeCount} -> ${filtered.length} settlements`)
      }

      // Фильтр по религиям (ЭТОТ РАБОТАЕТ!)
      if (this.currentFilters.religions?.length > 0) {
        const beforeCount = filtered.length
        // console.log('=== RELIGIONS FILTER DEBUG (THIS WORKS) ===')
        // console.log('Filter religions:', this.currentFilters.religions)
        // console.log('Sample settlement religion_ids:', filtered.slice(0, 3).map(s => s.religion_ids))
        filtered = filtered.filter(item => {
          if (!item.religion_ids || item.religion_ids.length === 0) return false
          return this.currentFilters.religions.some(religionId => item.religion_ids.includes(religionId))
        })
        // console.log(`Religions filter applied: ${beforeCount} -> ${filtered.length} settlements`)
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

    async loadSettlementsData() {
      try {
        // console.log('=== LOADING SETTLEMENTS DATA ===')

        // Загружаем все населённые пункты с районами
        const { data: settlements, error: settlementsError } = await supabase
          .from('Settlement')
          .select(`
            id,
            name_old,
            name_modern,
            lat,
            lon,
            id_district,
            District!Settlement_id_district_fkey(id, name)
          `)
          .not('name_old', 'is', null)
          .order('name_old', { ascending: true })

        if (settlementsError) throw settlementsError
        // console.log('Loaded settlements:', settlements?.length)

        // Загружаем все записи ревизий с населенными пунктами
        const { data: reportRecords, error: reportError } = await supabase
          .from('Report_record')
          .select(`
            id,
            code,
            population_all,
            id_settlment,
            Revision_report!Report_record_id_revision_report_fkey(id, year, number)
          `)
          .not('id_settlment', 'is', null)

        if (reportError) throw reportError
        // console.log('Loaded report records:', reportRecords?.length)

        // Загружаем все сословия с полной информацией
        const { data: estates, error: estatesError } = await supabase
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
              Type_religion!Subtype_estate_id_type_religion_fkey(id, name),
              Type_affiliation!Subtype_estate_id_type_affiliation_fkey(id, name)
            ),
            Volost!Estate_id_volost_fkey(id, name),
            Landowner!Estate_id_landowner_fkey(id, description, person),
            Military_unit!Estate_id_military_unit_fkey(id, description, person)
          `)

        if (estatesError) throw estatesError
        // console.log('Loaded estates:', estates?.length)

        // Группируем данные по населенным пунктам
        const settlementsMap = new Map()

        // Обрабатываем каждое поселение
        settlements?.forEach(settlement => {
          const settlementId = settlement.id
          const districtName = settlement.District?.name || '—'

          // Находим все записи ревизий для этого поселения
          const settlementReportRecords = reportRecords?.filter(rr => rr.id_settlment === settlementId) || []

          // Находим все сословия для этого поселения
          const settlementEstates = estates?.filter(estate =>
            settlementReportRecords.some(rr => rr.id === estate.id_report_record)
          ) || []

          if (settlementReportRecords.length > 0) {
            // Рассчитываем агрегированные данные
            const totalMale = settlementEstates.reduce((sum, estate) => sum + (estate.male || 0), 0)
            const totalFemale = settlementEstates.reduce((sum, estate) => sum + (estate.female || 0), 0)
            const totalPopulation = totalMale + totalFemale

            // Получаем уникальные значения
            const uniqueRevisions = new Set(settlementReportRecords.map(rr => rr.Revision_report?.id).filter(id => id))
            const uniqueReligions = new Set(settlementEstates.map(estate => estate.Subtype_estate?.id_type_religion).filter(id => id))
            const uniqueTypeEstates = new Set(settlementEstates.map(estate => estate.Subtype_estate?.id_type_estate).filter(id => id))
            const uniqueSubtypeEstates = new Set(settlementEstates.map(estate => estate.id_subtype_estate).filter(id => id))
            const uniqueAffiliations = new Set(settlementEstates.map(estate => estate.Subtype_estate?.id_type_affiliation).filter(id => id))
            const uniqueVolosts = new Set(settlementEstates.map(estate => estate.id_volost).filter(id => id))
            const uniqueLandowners = new Set(settlementEstates.map(estate => estate.id_landowner).filter(id => id))
            const uniqueMilitaryUnits = new Set(settlementEstates.map(estate => estate.id_military_unit).filter(id => id))

            settlementsMap.set(settlementId, {
              settlement_id: settlementId,
              settlement_name_old: settlement.name_old,
              settlement_name_modern: settlement.name_modern,
              district_name: districtName,
              district_id: settlement.id_district,
              lat: settlement.lat,
              lon: settlement.lon,
              revision_count: uniqueRevisions.size,
              estates_count: settlementEstates.length,
              religions_count: uniqueReligions.size,
              male: totalMale,
              female: totalFemale,
              total: totalPopulation,
              // Данные для фильтрации
              type_estate_ids: Array.from(uniqueTypeEstates),
              subtype_estate_ids: Array.from(uniqueSubtypeEstates),
              religion_ids: Array.from(uniqueReligions),
              affiliation_ids: Array.from(uniqueAffiliations),
              volost_ids: Array.from(uniqueVolosts),
              landowner_ids: Array.from(uniqueLandowners),
              military_unit_ids: Array.from(uniqueMilitaryUnits),
              // Детальные данные
              revisions: settlementReportRecords.map(rr => ({
                id: rr.id,
                year: rr.Revision_report?.year || '—',
                number: rr.Revision_report?.number || '—',
                male: 0,
                female: 0,
                total: rr.population_all || 0
              })),
              estates: settlementEstates.map(estate => ({
                id: estate.id,
                subtype_estate_name: estate.Subtype_estate?.name || '—',
                type_estate_name: estate.Subtype_estate?.Type_estate?.name || '—',
                type_religion_name: estate.Subtype_estate?.Type_religion?.name || '—',
                type_affiliation_name: estate.Subtype_estate?.Type_affiliation?.name || '—',
                volost_name: estate.Volost?.name || '—',
                landowner_description: estate.Landowner?.description || estate.Landowner?.person || '—',
                military_unit_description: estate.Military_unit?.description || estate.Military_unit?.person || '—',
                male: estate.male || 0,
                female: estate.female || 0,
                total: (estate.male || 0) + (estate.female || 0)
              }))
            })
          }
        })

        const allData = Array.from(settlementsMap.values())
        // console.log('Processed settlements with data:', allData.length)

        // НЕ сохраняем в localStorage, чтобы избежать проблем с фильтрацией
        // this.saveToLocalStorage('settlements_all_data', allData)

        // Применяем фильтры к загруженным данным
        const filteredData = this.applyFiltersToData(allData)

        console.log('=== SETTLEMENTS DATA DEBUG ===')
        console.log('Total settlements loaded:', allData.length)
        console.log('Filtered settlements:', filteredData.length)
        console.log('Current filters applied:', this.currentFilters)

        this.settlementsData = filteredData
      } catch (error) {
        console.error('Error loading settlements data:', error)
        throw error
      }
    },

    // Сохранение данных в localStorage
    saveToLocalStorage(key, data) {
      try {
        localStorage.setItem(`settlements_${key}`, JSON.stringify({
          data: data,
          timestamp: Date.now()
        }))
      } catch (error) {
        console.warn('Error saving to localStorage:', error)
      }
    },

    // Загрузка данных из localStorage
    loadFromLocalStorage(key) {
      try {
        const stored = localStorage.getItem(`settlements_${key}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          // Проверяем актуальность данных (5 минут)
          if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
            return parsed.data
          }
        }
      } catch (error) {
        console.warn('Error loading from localStorage:', error)
      }
      return null
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

            value.revisions = rrForSettlement.map(rr => ({
              id: rr.id,
              year: rr.Revision_report?.year || '',
              number: rr.Revision_report?.number || '',
              male: 0,
              female: 0,
              total: rr.population_all || 0
            }))

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

    async calculateSettlementData(settlement) {
      try {
        // Получаем все записи ревизий для этого населённого пункта
        const { data: reportRecords, error: reportError } = await supabase
          .from('Report_record')
          .select(`
            id,
            code,
            population_all,
            Revision_report!Report_record_id_revision_report_fkey(
              id,
              year,
              number
            )
          `)
          .eq('id_settlment', settlement.id)

        if (reportError) throw reportError

        if (!reportRecords || reportRecords.length === 0) {
          return null // Пропускаем населённые пункты без данных
        }

        // Получаем все сословия для этого населённого пункта
        const { data: estates, error: estatesError } = await supabase
          .from('Estate')
          .select(`
            id,
            male,
            female,
            Subtype_estate!Estate_id_subtype_estate_fkey(
              name,
              id_type_religion,
              Type_estate(name),
              Type_religion(name)
            )
          `)
          .in('id_report_record', reportRecords.map(rr => rr.id))

        if (estatesError) throw estatesError

        // Рассчитываем агрегированные данные
        const totalMale = estates?.reduce((sum, estate) => sum + (estate.male || 0), 0) || 0
        const totalFemale = estates?.reduce((sum, estate) => sum + (estate.female || 0), 0) || 0
        const totalPopulation = totalMale + totalFemale

        // Получаем уникальные религии
        const uniqueReligions = new Set()
        estates?.forEach(estate => {
          if (estate.Subtype_estate?.id_type_religion) {
            uniqueReligions.add(estate.Subtype_estate.id_type_religion)
          }
        })

        // Получаем уникальные ревизии
        const uniqueRevisions = new Set()
        reportRecords?.forEach(record => {
          if (record.Revision_report?.id) {
            uniqueRevisions.add(record.Revision_report.id)
          }
        })

        // Получаем уникальные ID для фильтрации
        const typeEstateIds = new Set()
        const subtypeEstateIds = new Set()
        const religionIds = new Set()
        const affiliationIds = new Set()
        const volostIds = new Set()
        const landownerIds = new Set()
        const militaryUnitIds = new Set()

        estates?.forEach(estate => {
          if (estate.Subtype_estate?.id_type_estate) {
            typeEstateIds.add(estate.Subtype_estate.id_type_estate)
          }
          if (estate.id_subtype_estate) {
            subtypeEstateIds.add(estate.id_subtype_estate)
          }
          if (estate.Subtype_estate?.id_type_religion) {
            religionIds.add(estate.Subtype_estate.id_type_religion)
          }
          if (estate.Subtype_estate?.id_type_affiliation) {
            affiliationIds.add(estate.Subtype_estate.id_type_affiliation)
          }
          if (estate.id_volost) {
            volostIds.add(estate.id_volost)
          }
          if (estate.id_landowner) {
            landownerIds.add(estate.id_landowner)
          }
          if (estate.id_military_unit) {
            militaryUnitIds.add(estate.id_military_unit)
          }
        })

        return {
          settlement_id: settlement.id,
          settlement_name_old: settlement.name_old,
          settlement_name_modern: settlement.name_modern,
          district_name: settlement.District?.name || '—',
          district_id: settlement.id_district || null,
          lat: settlement.lat,
          lon: settlement.lon,
          revision_count: uniqueRevisions.size,
          estates_count: estates?.length || 0,
          religions_count: uniqueReligions.size,
          male: totalMale,
          female: totalFemale,
          total: totalPopulation,
          // Данные для фильтрации
          type_estate_ids: Array.from(typeEstateIds),
          subtype_estate_ids: Array.from(subtypeEstateIds),
          religion_ids: Array.from(religionIds),
          affiliation_ids: Array.from(affiliationIds),
          // Дополнительные данные для детального просмотра
          revisions: reportRecords.map(rr => ({
            id: rr.id,
            year: rr.Revision_report?.year || '—',
            number: rr.Revision_report?.number || '—',
            male: 0,
            female: 0,
            total: rr.population_all || 0
          })),
          estates: estates?.map(estate => ({
            id: estate.id,
            subtype_estate_name: estate.Subtype_estate?.name || '—',
            type_estate_name: estate.Subtype_estate?.Type_estate?.name || '—',
            type_religion_name: estate.Subtype_estate?.Type_religion?.name || '—',
            male: estate.male || 0,
            female: estate.female || 0,
            total: (estate.male || 0) + (estate.female || 0)
          })) || []
        }
      } catch (error) {
        console.error('Error calculating settlement data:', error)
        return null
      }
    },

    applyFilters(filters) {
      this.currentFilters = filters
      this.loadData()
    },

    viewSettlementDetails(row) {
      this.selectedSettlement = row
      this.detailsDrawerVisible = true
    },

    closeDetailsDrawer() {
      this.detailsDrawerVisible = false
      this.selectedSettlement = null
    },

    formatNumber(num) {
      return new Intl.NumberFormat('ru-RU').format(num || 0)
    },

    // Метод для расчёта итоговой строки
    getSummary() {
      const sums = {
        revision_count: 0,
        estates_count: 0,
        religions_count: 0,
        male: 0,
        female: 0,
        total: this.totalPopulation
      }

      this.settlementsData.forEach(settlement => {
        sums.revision_count += settlement.revision_count || 0
        sums.estates_count += settlement.estates_count || 0
        sums.religions_count += settlement.religions_count || 0
        sums.male += settlement.male || 0
        sums.female += settlement.female || 0
      })

      return [
        'Итого:',
        '',
        '',
        sums.revision_count.toLocaleString(),
        sums.estates_count.toLocaleString(),
        sums.religions_count.toLocaleString(),
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

    // Открытие GeoJSON viewer
    openGeoJsonViewer() {
      if (this.$refs.geoJsonViewer) {
        // Диагностика: проверяем какие данные передаем
        console.log('=== GEOJSON EXPORT DEBUG ===')
        console.log('Total settlements in table:', this.settlementsData.length)
        console.log('Current filters:', this.currentFilters)
        console.log('Sample settlements for export:', this.settlementsData.slice(0, 3).map(s => ({
          name: s.settlement_name_old,
          district: s.district_name,
          total: s.total,
          has_coordinates: !!(s.lat && s.lon)
        })))

        // Передаем текущие данные в viewer для экспорта с учетом фильтров
        this.$refs.geoJsonViewer.loadSettlementsData(this.settlementsData)
        this.$refs.geoJsonViewer.open()
      }
    },

    // Прямой показ отфильтрованных данных на карте
    async showOnMap() {
      if (!this.settlementsData || this.settlementsData.length === 0) {
        ElMessage.warning('Нет данных для отображения на карте')
        return
      }

      try {
        console.log('=== DIRECT MAP DISPLAY DEBUG ===')
        console.log('Sending settlements to map viewer:', this.settlementsData.length)
        console.log('Sample settlements:', this.settlementsData.slice(0, 3).map(s => s.settlement_name_old))

        // Открываем MapWithGeoJsonViewer с отфильтрованными данными
        if (this.$refs.mapViewer) {
          this.$refs.mapViewer.open(this.settlementsData)
          ElMessage.success(`Отфильтрованные поселения (${this.settlementsData.length}) открыты на карте`)
        } else {
          ElMessage.error('Компонент карты не найден')
        }
      } catch (error) {
        console.error('Error showing settlements on map:', error)
        ElMessage.error('Ошибка при отображении данных на карте')
      }
    },

    // Конвертация данных в GeoJSON для карты
    async convertToGeoJsonForMap(settlementsData) {
      const validSettlements = settlementsData.filter(s => s.lat && s.lon)

      const features = validSettlements.map(settlement => {
        // Подготавливаем данные о сословиях
        const estateTypes = this.prepareEstateTypesForMap(settlement)

        return {
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
            estate_types: estateTypes,
            // Добавляем флаг, что это отфильтрованные данные
            filtered: true
          }
        }
      })

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

    // Подготовка данных о сословиях для карты
    prepareEstateTypesForMap(settlement) {
      if (!settlement.estates || !Array.isArray(settlement.estates)) {
        return []
      }

      const estateTypeMap = new Map()

      settlement.estates.forEach(estate => {
        const typeId = estate.Subtype_estate?.id_type_estate
        const subtypeId = estate.id_subtype_estate
        const fallbackTypeKey = estate.type_estate_name || 'Неизвестный тип'
        const fallbackSubtypeKey = estate.subtype_estate_name || 'Неизвестный подтип'
        const finalTypeId = typeId || fallbackTypeKey
        const finalSubtypeId = subtypeId || fallbackSubtypeKey
        const typeName = estate.type_estate_name || fallbackTypeKey
        const subtypeName = estate.subtype_estate_name || fallbackSubtypeKey

        if (!estateTypeMap.has(finalTypeId)) {
          estateTypeMap.set(finalTypeId, {
            type_id: typeId,
            type_name: typeName,
            type_color: estate.Subtype_estate?.Type_estate?.color || null,
            subtypes: new Map(),
            total_male: 0,
            total_female: 0,
            total_count: 0,
            religions: new Set()
          })
        }

        const typeData = estateTypeMap.get(finalTypeId)

        if (!typeData.subtypes.has(finalSubtypeId)) {
          typeData.subtypes.set(finalSubtypeId, {
            subtype_id: subtypeId,
            subtype_name: subtypeName,
            male: 0,
            female: 0,
            count: 0,
            religions: new Set()
          })
        }

        const subtypeData = typeData.subtypes.get(finalSubtypeId)
        subtypeData.male += estate.male || 0
        subtypeData.female += estate.female || 0
        subtypeData.count += 1

        typeData.total_male += estate.male || 0
        typeData.total_female += estate.female || 0
        typeData.total_count += 1
      })

      return Array.from(estateTypeMap.values()).map(typeData => ({
        type_id: typeData.type_id,
        type_name: typeData.type_name,
        type_color: typeData.type_color,
        total_male: typeData.total_male,
        total_female: typeData.total_female,
        total_count: typeData.total_count,
        subtypes: Array.from(typeData.subtypes.values()).map(subtypeData => ({
          subtype_id: subtypeData.subtype_id,
          subtype_name: subtypeData.subtype_name,
          male: subtypeData.male,
          female: subtypeData.female,
          count: subtypeData.count
        })).sort((a, b) => b.count - a.count)
      })).sort((a, b) => b.total_count - a.count)
    },

    // Обработка события показа данных на карте
    handleShowOnMap(mapData) {
      console.log('Handling show on map event:', mapData)
      // Отправляем событие родительскому компоненту для передачи в MapView
      this.$emit('show-geojson-on-map', mapData)
    }
  }
}
</script>

<style scoped lang="scss">
.settlements-table {
  height: 100%;
  display: flex;
  flex-direction: column;

  .table-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    gap: 1rem;

    .table-info {
      display: flex;
      gap: 0.5rem;
    }

    .table-actions {
      display: flex;
      gap: 0.5rem;
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

/* Стили для красивой кнопки карты */
.map-button {
  position: relative;
  background: linear-gradient(135deg, hsl(100, 56%, 49%) 0%, hsl(100, 50%, 59%) 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    background: linear-gradient(135deg, hsl(120, 39%, 54%) 0%, hsl(110, 45%, 61%) 100%);
    box-shadow: 0 6px 20px rgba(103, 194, 58, 0.4);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
  }

  .map-icon {
    font-size: 16px;
    margin-right: 8px;
  }

  .button-text {
    font-weight: 500;
    margin-right: 8px;
  }

  .count-badge {
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    font-weight: 600;
    min-width: 24px;
    height: 18px;
    line-height: 16px;
    text-align: center;
    border-radius: 10px;
    padding: 0 6px;
  }
}

@media (max-width: 768px) {
  .settlements-table {
    .table-controls {
      flex-direction: column;
      align-items: stretch;

      .table-info {
        justify-content: center;
      }

      .table-actions {
        justify-content: center;

        .map-button {
          width: 100%;
          margin-top: 0.5rem;
        }
      }
    }
  }
}
</style>
