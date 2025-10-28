<template>
  <div class="estates-list-and-map">
    <div class="view-controls">
      <div class="mode-selector">
        <el-radio-group v-model="dataMode" size="small">
          <el-radio-button label="estate">По сословиям</el-radio-button>
          <el-radio-button label="report">По записям ревизий</el-radio-button>
        </el-radio-group>
      </div>
      

      
      <div class="stats">
        <el-popover
          v-model:visible="columnsPopoverVisible"
          placement="bottom"
          :width="250"
          trigger="click"
        >
          <template #reference>
            <el-button size="large" type="default">
              <el-icon><Setting /></el-icon>
              Столбцы
            </el-button>
          </template>
          <div class="columns-selector">
            <div v-if="dataMode === 'estate'" class="columns-list">
              <el-checkbox v-model="visibleEstateColumns.id">ID</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.revision_year">Год</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.revision_number">Рев.</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.settlement_name_old">Нас. пункт (старый)</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.settlement_name_modern">Нас. пункт (совр.)</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.district_name">Район</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.subtype_estate_name">Подтип сословия</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.type_estate_name">Сословие</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.type_religion_name">Религия</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.type_affiliation_name">Принадлежность</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.male">М</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.female">Ж</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.total">Всего</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.volost_name">Волость</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.landowner_description">Помещик</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.military_unit_description">Воинская часть</el-checkbox>
            </div>
            <div v-else class="columns-list">
              <el-checkbox v-model="visibleReportColumns.id">ID</el-checkbox>
              <el-checkbox v-model="visibleReportColumns.code">Код</el-checkbox>
              <el-checkbox v-model="visibleReportColumns.revision_year">Год</el-checkbox>
              <el-checkbox v-model="visibleReportColumns.revision_number">Рев.</el-checkbox>
              <el-checkbox v-model="visibleReportColumns.settlement_name_old">Нас. пункт (старое)</el-checkbox>
              <el-checkbox v-model="visibleReportColumns.settlement_name_modern">Нас. пункт (совр.)</el-checkbox>
              <el-checkbox v-model="visibleReportColumns.district_name">Район</el-checkbox>
              <el-checkbox v-model="visibleReportColumns.lat">Широта</el-checkbox>
              <el-checkbox v-model="visibleReportColumns.lon">Долгота</el-checkbox>
              <el-checkbox v-model="visibleReportColumns.population_all">Население</el-checkbox>
              <el-checkbox v-model="visibleReportColumns.estates_count">Сословий</el-checkbox>
            </div>
          </div>
        </el-popover>

        <el-button size="large" type="primary" @click="showColorSettings = true">
          <el-icon><Brush /></el-icon>
          Цвета сословий
        </el-button>

        <el-button size="large" type="success" @click="exportToExcel" :disabled="loading || totalRecords === 0">
          <el-icon><Download /></el-icon>
          Экспорт в Excel
        </el-button>

        <el-tag size="large" type="info">Всего записей: {{ totalRecords }}</el-tag>
      </div>
    </div>

    <!-- Drawer для настроек цветов -->
    <el-drawer
      v-model="showColorSettings"
      title="Настройки окраски маркеров"
      direction="rtl"
      size="400px"
      :before-close="closeColorSettings"
    >
      <ColorSchemeSelector @settings-change="onColorSettingsChange" />
    </el-drawer>

    <div class="content-area" :class="viewMode">
      <div v-if="viewMode === 'list' || viewMode === 'split'" class="list-section" :class="{ 'split-mode': viewMode === 'split' }">
        <!-- Режим Estate -->
        <el-table
          v-if="dataMode === 'estate'"
          :data="estateData"
          v-loading="loading"
          style="width: 100%; height: 100%"
          border
          stripe
          size="small"
          @header-dragend="handleHeaderDragEnd"
          @row-dblclick="viewDetails"
          :show-summary="visibleEstateColumns.male || visibleEstateColumns.female || visibleEstateColumns.total"
          sum-text="Итого"
          :summary-method="getEstateSummary"
        >
          <el-table-column v-if="visibleEstateColumns.id" prop="id" label="ID" width="50" sortable />
          <el-table-column v-if="visibleEstateColumns.revision_year" prop="revision_year" label="Год" width="60" sortable />
          <el-table-column v-if="visibleEstateColumns.revision_number" prop="revision_number" label="Рев." width="50" sortable />
          <el-table-column v-if="visibleEstateColumns.settlement_name_old" prop="settlement_name_old" label="Нас. пункт (старый)" min-width="150" sortable />
          <el-table-column v-if="visibleEstateColumns.settlement_name_modern" prop="settlement_name_modern" label="Нас. пункт (совр.)" min-width="150" sortable />
          <el-table-column v-if="visibleEstateColumns.district_name" prop="district_name" label="Район" width="120" sortable />
          <el-table-column v-if="visibleEstateColumns.subtype_estate_name" prop="subtype_estate_name" label="Подтип сословия" width="150" sortable />
          <el-table-column v-if="visibleEstateColumns.type_estate_name" prop="type_estate_name" label="Сословие" width="120" sortable />
          <el-table-column v-if="visibleEstateColumns.type_religion_name" prop="type_religion_name" label="Религия" width="100" sortable />
          <el-table-column v-if="visibleEstateColumns.type_affiliation_name" prop="type_affiliation_name" label="Принадлежность" width="120" sortable />
          <el-table-column v-if="visibleEstateColumns.male" prop="male" label="М" width="50" align="right" sortable />
          <el-table-column v-if="visibleEstateColumns.female" prop="female" label="Ж" width="50" align="right" sortable />
          <el-table-column v-if="visibleEstateColumns.total" prop="total" label="Всего" width="60" align="right" sortable />
          <el-table-column v-if="visibleEstateColumns.volost_name" prop="volost_name" label="Волость" width="120" sortable />
          <el-table-column v-if="visibleEstateColumns.landowner_description" prop="landowner_description" label="Помещик" width="150" sortable />
          <el-table-column v-if="visibleEstateColumns.military_unit_description" prop="military_unit_description" label="Воинская часть" width="150" sortable />
        </el-table>

        <!-- Режим Report_record -->
        <el-table
          v-else
          :data="reportData"
          v-loading="loading"
          style="width: 100%; height: 100%"
          border
          stripe
          size="small"
          @header-dragend="handleHeaderDragEnd"
          @row-dblclick="viewDetails"
        >
          <el-table-column v-if="visibleReportColumns.id" prop="id" label="ID" width="50" sortable />
          <el-table-column v-if="visibleReportColumns.code" prop="code" label="Код" width="80" sortable />
          <el-table-column v-if="visibleReportColumns.revision_year" prop="revision_year" label="Год" width="60" sortable />
          <el-table-column v-if="visibleReportColumns.revision_number" prop="revision_number" label="Рев." width="50" sortable />
          <el-table-column v-if="visibleReportColumns.settlement_name_old" prop="settlement_name_old" label="Нас. пункт (старое)" min-width="150" sortable />
          <el-table-column v-if="visibleReportColumns.settlement_name_modern" prop="settlement_name_modern" label="Нас. пункт (совр.)" width="150" sortable />
          <el-table-column v-if="visibleReportColumns.district_name" prop="district_name" label="Район" width="120" sortable />
          <el-table-column v-if="visibleReportColumns.lat" prop="lat" label="Широта" width="90" sortable />
          <el-table-column v-if="visibleReportColumns.lon" prop="lon" label="Долгота" width="90" sortable />
          <el-table-column v-if="visibleReportColumns.population_all" prop="population_all" label="Население" width="90" align="right" sortable />
          <el-table-column v-if="visibleReportColumns.estates_count" prop="estates_count" label="Сословий" width="80" align="right" sortable />
          <el-table-column v-if="visibleReportColumns.total_male" prop="total_male" label="М" width="50" align="right" sortable />
          <el-table-column v-if="visibleReportColumns.total_female" prop="total_female" label="Ж" width="50" align="right" sortable />
          <el-table-column v-if="visibleReportColumns.total_population" prop="total_population" label="Всего" width="60" align="right" sortable />
        </el-table>
      </div>

      <div v-if="viewMode === 'map' || viewMode === 'split'" class="map-section">
        <MapView ref="mapView" :settlements="mapSettlements" />
      </div>
    </div>

    <!-- Drawer для деталей записи -->
    <el-drawer
      v-model="detailsDrawerVisible"
      title="Детали записи"
      direction="rtl"
      size="500px"
      :before-close="closeDetailsDrawer"
    >
      <div v-if="selectedRecord" class="details-content">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="ID">
            {{ selectedRecord.id }}
          </el-descriptions-item>
          
          <template v-if="dataMode === 'estate'">
            <el-descriptions-item label="Год ревизии">
              {{ selectedRecord.revision_year || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Номер ревизии">
              {{ selectedRecord.revision_number || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Населенный пункт (старый)">
              {{ selectedRecord.settlement_name_old || '—' }}
              <span v-if="selectedRecord.settlement_name_modern && selectedRecord.settlement_name_modern !== selectedRecord.settlement_name_old" class="alt-name">
                ({{ selectedRecord.settlement_name_modern }})
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="Населенный пункт (современный)">
              {{ selectedRecord.settlement_name_modern || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Район">
              {{ selectedRecord.district_name || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Подтип сословия">
              {{ selectedRecord.subtype_estate_name || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Тип сословия">
              {{ selectedRecord.type_estate_name || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Религия">
              {{ selectedRecord.type_religion_name || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Принадлежность">
              {{ selectedRecord.type_affiliation_name || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Мужчины">
              {{ selectedRecord.male || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="Женщины">
              {{ selectedRecord.female || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="Всего">
              <el-tag type="success">{{ selectedRecord.total || 0 }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Волость">
              {{ selectedRecord.volost_name || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Помещик">
              {{ selectedRecord.landowner_description || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Воинская часть">
              {{ selectedRecord.military_unit_description || '—' }}
            </el-descriptions-item>
          </template>

          <template v-else>
            <el-descriptions-item label="Код">
              {{ selectedRecord.code }}
            </el-descriptions-item>
            <el-descriptions-item label="Год ревизии">
              {{ selectedRecord.revision_year || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Номер ревизии">
              {{ selectedRecord.revision_number || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Населенный пункт (старое)">
              {{ selectedRecord.settlement_name_old || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Населенный пункт (современное)">
              {{ selectedRecord.settlement_name_modern || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Район">
              {{ selectedRecord.district_name || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Широта">
              {{ selectedRecord.lat || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Долгота">
              {{ selectedRecord.lon || '—' }}
            </el-descriptions-item>
            <el-descriptions-item label="Общее население">
              <el-tag type="success">{{ selectedRecord.population_all || 0 }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Количество сословий">
              {{ selectedRecord.estates_count || '—' }}
            </el-descriptions-item>
          </template>
        </el-descriptions>

        <!-- Связанные сословия для режима Report_record -->
        <div v-if="dataMode === 'report'" class="related-estates-section">
          <el-divider content-position="left">
            <h4 style="margin: 0;">Связанные сословия</h4>
          </el-divider>
          
          <div v-if="selectedRecord.loadingEstates" class="loading-estates">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>Загрузка сословий...</span>
          </div>
          
          <div v-else-if="selectedRecord.relatedEstates && selectedRecord.relatedEstates.length > 0">
            <el-collapse accordion>
              <el-collapse-item 
                v-for="(estate, index) in selectedRecord.relatedEstates" 
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
        <el-button @click="closeDetailsDrawer">Закрыть</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script>
import { Location, Loading, Setting, Brush, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { supabase } from '@/services/supabase'
import Sortable from 'sortablejs'

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
import * as XLSX from 'xlsx'

export default {
  name: 'EstatesListAndMap',
  components: {
    Location,
    Loading,
    Setting
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
  data() {
    return {
      dataMode: 'estate',
      viewMode: 'list', // Added missing viewMode property
      estateData: [],
      reportData: [],
      allEstateData: [],
      allReportData: [],
      loading: false,
      sortableInstance: null,
      detailsDrawerVisible: false,
      selectedRecord: null,
      columnsPopoverVisible: false,
      currentFilters: null,
      allDistricts: [],
      allTypeEstates: [],
      allSubtypeEstates: [],
      allReligions: [],
      allAffiliations: [],
      allVolosts: [],
      visibleEstateColumns: {
        id: false,
        revision_year: false,
        revision_number: true,
        settlement_name_old: true,
        settlement_name_modern: true,
        district_name: true,
        subtype_estate_name: true,
        type_estate_name: true,
        type_religion_name: true,
        type_affiliation_name: true,
        male: true,
        female: true,
        total: true,
        volost_name: true,
        landowner_description: true,
        military_unit_description: true
      },
      visibleReportColumns: {
        id: false,
        code: true,
        revision_year: false,
        revision_number: true,
        settlement_name_old: true,
        settlement_name_modern: true,
        district_name: true,
        lat: false,
        lon: false,
        population_all: true,
        estates_count: true,
        total_male: true,
        total_female: true,
        total_population: true
      }
    }
  },
  computed: {
    totalRecords() {
      return this.dataMode === 'estate' ? this.estateData.length : this.reportData.length
    },

    // Итоговые суммы для режима Estate
    estateTotals() {
      if (this.dataMode !== 'estate' || !this.estateData.length) {
        return { male: 0, female: 0, total: 0 }
      }

      return this.estateData.reduce((acc, item) => ({
        male: acc.male + (item.male || 0),
        female: acc.female + (item.female || 0),
        total: acc.total + (item.total || 0)
      }), { male: 0, female: 0, total: 0 })
    },

    // Итоговые суммы для режима Report
    reportTotals() {
      if (this.dataMode !== 'report' || !this.reportData.length) {
        return { male: 0, female: 0, total: 0, population: 0 }
      }

      return this.reportData.reduce((acc, item) => ({
        male: acc.male + (item.total_male || 0),
        female: acc.female + (item.total_female || 0),
        total: acc.total + (item.total_population || 0),
        population: acc.population + (item.population_all || 0)
      }), { male: 0, female: 0, total: 0, population: 0 })
    },
    
    mapSettlements() {
      // Собираем уникальные населенные пункты из текущих данных
      const settlementsMap = new Map()

      if (this.dataMode === 'estate') {
        this.estateData.forEach((item, index) => {
          const key = item.settlement_name_modern || item.settlement_name_old

          if (key && !settlementsMap.has(key)) {
            // Нужно получить координаты из allSettlements
            const settlement = this.allSettlements?.find(s =>
              s.name_modern === item.settlement_name_modern ||
              s.name_old === item.settlement_name_old ||
              s.name_modern === key ||
              s.name_old === key
            )

            if (settlement && settlement.lat && settlement.lon) {
              settlementsMap.set(key, {
                name: key,
                district: item.district_name,
                lat: settlement.lat,
                lon: settlement.lon,
                population: null
              })
            }
          }
        })
      } else {
        this.reportData.forEach((item, index) => {
          const key = item.settlement_name_modern || item.settlement_name_old

          if (key && item.lat && item.lon && !settlementsMap.has(key)) {
            settlementsMap.set(key, {
              name: key,
              district: item.district_name,
              lat: item.lat,
              lon: item.lon,
              population: item.population_all
            })
          }
        })
      }

      const result = Array.from(settlementsMap.values())

      // Обновляем маркеры на карте при изменении данных
      if (this.viewMode === 'map' || this.viewMode === 'split') {
        this.$nextTick(() => {
          this.updateMapMarkers()
        })
      }

      return result
    }
  },
  mounted() {
    // Восстанавливаем параметры из URL
    this.restoreParamsFromURL()

    // Если есть фильтры из URL, загружаем данные
    if (this.currentFilters && Object.keys(this.currentFilters).length > 0) {
      this.loadData()
    }

    // Не загружаем данные автоматически, ждем применения фильтров
    this.$nextTick(() => {
      this.initColumnDragDrop()
    })
  },
  beforeUnmount() {
    if (this.sortableInstance) {
      this.sortableInstance.destroy()
      this.sortableInstance = null
    }
  },
  methods: {
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
    
    loadData() {
      if (this.dataMode === 'estate') {
        this.loadEstateDataNew()
      } else {
        this.loadReportData()
      }
    },

    async loadEstateData() {
      this.loading = true

      try {
        // Загружаем все данные без фильтров сначала
        const { data, error } = await supabase
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
            Report_record!Estate_id_report_record_fkey!inner(
              id,
              code,
              Revision_report!Report_record_id_revision_report_fkey!inner(
                year,
                number
              ),
              Settlement!Report_record_id_settlment_fkey(
                name_old,
                name_modern,
                id_district,
                District(name)
              )
            ),
            Subtype_estate!Estate_id_subtype_estate_fkey(
              name,
              id_type_estate,
              id_type_religion,
              id_type_affiliation,
              Type_estate(name),
              Type_religion(name),
              Type_affiliation(name)
            ),
            Volost!Estate_id_volost_fkey(name),
            Landowner!Estate_id_landowner_fkey(
              description,
              person
            ),
            Military_unit!Estate_id_military_unit_fkey(
              description,
              person
            )
          `)
          .order('id', { ascending: false })

        if (error) throw error

        // Преобразуем данные в формат для таблицы
        const mappedData = data.map(item => ({
            id: item.id,
            revision_year: item.Report_record?.Revision_report?.year || null,
            revision_number: item.Report_record?.Revision_report?.number || null,
            settlement_name_old: item.Report_record?.Settlement?.name_old || null,
            settlement_name_modern: item.Report_record?.Settlement?.name_modern || null,
            district_name: item.Report_record?.Settlement?.District?.name || null,
            district_id: item.Report_record?.Settlement?.id_district || null,
            subtype_estate_name: item.Subtype_estate?.name || null,
            type_estate_name: item.Subtype_estate?.Type_estate?.name || null,
            type_religion_name: item.Subtype_estate?.Type_religion?.name || null,
            type_affiliation_name: item.Subtype_estate?.Type_affiliation?.name || null,
            type_estate_id: item.Subtype_estate?.id_type_estate || null,
            type_religion_id: item.Subtype_estate?.id_type_religion || null,
            type_affiliation_id: item.Subtype_estate?.id_type_affiliation || null,
            subtype_estate_id: item.id_subtype_estate,
            male: item.male,
            female: item.female,
            total: (item.male || 0) + (item.female || 0),
            volost_name: item.Volost?.name || null,
            volost_id: item.id_volost,
            landowner_description: item.Landowner?.description || item.Landowner?.person || null,
            landowner_id: item.id_landowner,
            military_unit_description: item.Military_unit?.description || item.Military_unit?.person || null,
            military_unit_id: item.id_military_unit
        }))

        // Сохраняем все данные и применяем фильтры на клиентской стороне
        this.allEstateData = mappedData
        this.estateData = this.applyClientSideEstateFiltersImproved(mappedData)

      } catch (error) {
        ElMessage.error('Ошибка загрузки данных о сословиях: ' + error.message)
      } finally {
        this.loading = false
      }
    },

    applyEstateFiltersToQuery(query) {
      if (!this.currentFilters) return query

      // Фильтр по ревизиям
      if (this.currentFilters.revision && this.currentFilters.revision.length > 0) {
        query = query.in('Report_record.Revision_report.number', this.currentFilters.revision)
      }

      // Фильтр по районам через населенные пункты
      if (this.currentFilters.districts?.length > 0) {
        // Получаем ID населенных пунктов для выбранных районов
        const settlementIds = this.allSettlements
          ?.filter(s => this.currentFilters.districts.includes(s.id_district))
          ?.map(s => s.id) || []

        if (settlementIds.length > 0) {
          // Фильтруем Report_record по населенным пунктам выбранных районов
          query = query.in('Report_record.id_settlment', settlementIds)
        } else {
          // Если нет населенных пунктов для выбранных районов, возвращаем пустой результат
          query = query.eq('id', -1) // Это гарантированно вернет пустой результат
        }
      }

      // Фильтр по старым названиям населенных пунктов
      if (this.currentFilters.settlementNamesOld?.length > 0) {
        query = query.in('Report_record.Settlement.name_old', this.currentFilters.settlementNamesOld)
      }

      // Фильтр по современным названиям населенных пунктов
      if (this.currentFilters.settlementNamesModern?.length > 0) {
        query = query.in('Report_record.Settlement.name_modern', this.currentFilters.settlementNamesModern)
      }

      // Фильтр по типам сословий через подтипы
      if (this.currentFilters.typeEstates?.length > 0) {
        const subtypeIds = this.allSubtypeEstates
          ?.filter(s => this.currentFilters.typeEstates.includes(s.id_type_estate))
          ?.map(s => s.id) || []

        if (subtypeIds.length > 0) {
          query = query.in('id_subtype_estate', subtypeIds)
        } else {
          // Если нет подтипов для выбранных типов сословий, возвращаем пустой результат
          query = query.eq('id', -1)
        }
      }

      // Фильтр по подтипам сословия (массив)
      if (this.currentFilters.subtypeEstates?.length > 0) {
        query = query.in('id_subtype_estate', this.currentFilters.subtypeEstates)
      }

      // Фильтр по религиям через подтипы
      if (this.currentFilters.religions?.length > 0) {
        const subtypeIds = this.allSubtypeEstates
          ?.filter(s => this.currentFilters.religions.includes(s.id_type_religion))
          ?.map(s => s.id) || []

        if (subtypeIds.length > 0) {
          query = query.in('id_subtype_estate', subtypeIds)
        } else {
          // Если нет подтипов для выбранных религий, возвращаем пустой результат
          query = query.eq('id', -1)
        }
      }

      // Фильтр по принадлежностям через подтипы
      if (this.currentFilters.affiliations?.length > 0) {
        const subtypeIds = this.allSubtypeEstates
          ?.filter(s => this.currentFilters.affiliations.includes(s.id_type_affiliation))
          ?.map(s => s.id) || []

        if (subtypeIds.length > 0) {
          query = query.in('id_subtype_estate', subtypeIds)
        } else {
          // Если нет подтипов для выбранных принадлежностей, возвращаем пустой результат
          query = query.eq('id', -1)
        }
      }

      // Фильтр по волостям (массив)
      if (this.currentFilters.volosts?.length > 0) {
        query = query.in('id_volost', this.currentFilters.volosts)
      }

      // Фильтр по помещикам (массив)
      if (this.currentFilters.landowners?.length > 0) {
        query = query.in('id_landowner', this.currentFilters.landowners)
      }

      // Фильтр по войсковым организациям (массив)
      if (this.currentFilters.militaryUnits?.length > 0) {
        query = query.in('id_military_unit', this.currentFilters.militaryUnits)
      }

      // Фильтр по количеству мужчин (только если включен)
      if (this.currentFilters.maleEnabled) {
        if (this.currentFilters.maleMin !== null && this.currentFilters.maleMin !== undefined) {
          query = query.gte('male', this.currentFilters.maleMin)
        }
        if (this.currentFilters.maleMax !== null && this.currentFilters.maleMax !== undefined) {
          query = query.lte('male', this.currentFilters.maleMax)
        }
      }

      // Фильтр по количеству женщин (только если включен)
      if (this.currentFilters.femaleEnabled) {
        if (this.currentFilters.femaleMin !== null && this.currentFilters.femaleMin !== undefined) {
          query = query.gte('female', this.currentFilters.femaleMin)
        }
        if (this.currentFilters.femaleMax !== null && this.currentFilters.femaleMax !== undefined) {
          query = query.lte('female', this.currentFilters.femaleMax)
        }
      }

      return query
    },

    // Надёжная загрузка по сословиям с серверной фильтрацией и .then/.catch
    loadEstateDataNew() {
      this.loading = true

      try {
        let query = supabase
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
            Report_record!Estate_id_report_record_fkey!inner(
              id,
              code,
              Revision_report!Report_record_id_revision_report_fkey!inner(
                year,
                number
              ),
              Settlement!Report_record_id_settlment_fkey(
                name_old,
                name_modern,
                id_district,
                District(name)
              )
            ),
            Subtype_estate!Estate_id_subtype_estate_fkey(
              name,
              id_type_estate,
              id_type_religion,
              id_type_affiliation,
              Type_estate(name),
              Type_religion(name),
              Type_affiliation(name)
            ),
            Volost!Estate_id_volost_fkey(name),
            Landowner!Estate_id_landowner_fkey(
              description,
              person
            ),
            Military_unit!Estate_id_military_unit_fkey(
              description,
              person
            )
          `)

        this
          .applyEstateFiltersToQuery(query)
          .order('id', { ascending: false })
          .then(({ data, error }) => {
            if (error) throw error
            const mappedData = (data || []).map(item => ({
              id: item.id,
              revision_year: item.Report_record?.Revision_report?.year || null,
              revision_number: item.Report_record?.Revision_report?.number || null,
              settlement_name_old: item.Report_record?.Settlement?.name_old || null,
              settlement_name_modern: item.Report_record?.Settlement?.name_modern || null,
              district_name: item.Report_record?.Settlement?.District?.name || null,
              district_id: item.Report_record?.Settlement?.id_district || null,
              subtype_estate_name: item.Subtype_estate?.name || null,
              type_estate_name: item.Subtype_estate?.Type_estate?.name || null,
              type_religion_name: item.Subtype_estate?.Type_religion?.name || null,
              type_affiliation_name: item.Subtype_estate?.Type_affiliation?.name || null,
              type_estate_id: item.Subtype_estate?.id_type_estate || null,
              type_religion_id: item.Subtype_estate?.id_type_religion || null,
              type_affiliation_id: item.Subtype_estate?.id_type_affiliation || null,
              subtype_estate_id: item.id_subtype_estate,
              male: item.male,
              female: item.female,
              total: (item.male || 0) + (item.female || 0),
              volost_name: item.Volost?.name || null,
              volost_id: item.id_volost,
              landowner_description: item.Landowner?.description || item.Landowner?.person || null,
              landowner_id: item.id_landowner,
              military_unit_description: item.Military_unit?.description || item.Military_unit?.person || null,
              military_unit_id: item.id_military_unit
            }))

            this.allEstateData = mappedData
            this.estateData = this.applyClientSideEstateFiltersImproved(mappedData)
          })
          .catch(err => {
            ElMessage.error('Ошибка загрузки данных по сословиям: ' + (err?.message || err))
          })
          .finally(() => {
            this.loading = false
          })
      } catch (error) {
        ElMessage.error('Ошибка загрузки данных по сословиям: ' + error.message)
        this.loading = false
      }
    },

    applyClientSideEstateFilters(data) {
      if (!this.currentFilters) return data

      let filtered = [...data]

      // Фильтр по старому названию населенного пункта
      if (this.currentFilters.settlementNamesOld?.length > 0) {
        filtered = filtered.filter(item =>
          this.currentFilters.settlementNamesOld.includes(item.settlement_name_old)
        )
      }

      // Фильтр по современному названию населенного пункта
      if (this.currentFilters.settlementNamesModern?.length > 0) {
        filtered = filtered.filter(item =>
          this.currentFilters.settlementNamesModern.includes(item.settlement_name_modern)
        )
      }

      // Фильтр по общему населению (только если включен)
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

    applyClientSideEstateFiltersImproved(data) {
      // filter by revision number (client-side) added
      if (this.currentFilters?.revision?.length > 0) {
        data = data.filter(it => it.revision_number && this.currentFilters.revision.includes(it.revision_number))
      }
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
          if (!item.type_estate_id) return false
          return this.currentFilters.typeEstates.includes(item.type_estate_id)
        })
      }

      // Фильтр по подтипам сословий
      if (this.currentFilters.subtypeEstates?.length > 0) {
        filtered = filtered.filter(item => {
          if (!item.subtype_estate_id) return false
          return this.currentFilters.subtypeEstates.includes(item.subtype_estate_id)
        })
      }

      // Фильтр по религиям
      if (this.currentFilters.religions?.length > 0) {
        filtered = filtered.filter(item => {
          if (!item.type_religion_id) return false
          return this.currentFilters.religions.includes(item.type_religion_id)
        })
      }

      // Фильтр по принадлежностям
      if (this.currentFilters.affiliations?.length > 0) {
        filtered = filtered.filter(item => {
          if (!item.type_affiliation_id) return false
          return this.currentFilters.affiliations.includes(item.type_affiliation_id)
        })
      }

      // Фильтр по волостям
      if (this.currentFilters.volosts?.length > 0) {
        filtered = filtered.filter(item => {
          if (!item.volost_id) return false
          return this.currentFilters.volosts.includes(item.volost_id)
        })
      }

      // Фильтр по помещикам
      if (this.currentFilters.landowners?.length > 0) {
        filtered = filtered.filter(item => {
          if (!item.landowner_id) return false
          return this.currentFilters.landowners.includes(item.landowner_id)
        })
      }

      // Фильтр по войсковым организациям
      if (this.currentFilters.militaryUnits?.length > 0) {
        filtered = filtered.filter(item => {
          if (!item.military_unit_id) return false
          return this.currentFilters.militaryUnits.includes(item.military_unit_id)
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

    applyClientSideReportFilters(data) {
      if (!this.currentFilters) return data

      let filtered = [...data]

      // Фильтр по району
      if (this.currentFilters.district) {
        const selectedDistrict = this.allDistricts?.find(d => d.id === this.currentFilters.district)
        if (selectedDistrict) {
          filtered = filtered.filter(item => item.district_name === selectedDistrict.name)
        }
      }

      // Фильтр по населенному пункту
      if (this.currentFilters.settlement) {
        const selectedSettlement = this.allSettlements?.find(s => s.id === this.currentFilters.settlement)
        if (selectedSettlement) {
          filtered = filtered.filter(item =>
            item.settlement_name_old === selectedSettlement.name ||
            item.settlement_name_modern === selectedSettlement.name
          )
        }
      }

      // Фильтр по населению (мин)
      if (this.currentFilters.populationMin !== null && this.currentFilters.populationMin !== undefined) {
        filtered = filtered.filter(item => item.population_all >= this.currentFilters.populationMin)
      }

      // Фильтр по населению (макс)
      if (this.currentFilters.populationMax !== null && this.currentFilters.populationMax !== undefined) {
        filtered = filtered.filter(item => item.population_all <= this.currentFilters.populationMax)
      }

      // Фильтр по количеству сословий (только если включен)
      if (this.currentFilters.estatesCountEnabled) {
        if (this.currentFilters.estatesCountMin !== null && this.currentFilters.estatesCountMin !== undefined) {
          filtered = filtered.filter(item => item.estates_count >= this.currentFilters.estatesCountMin)
        }
        if (this.currentFilters.estatesCountMax !== null && this.currentFilters.estatesCountMax !== undefined) {
          filtered = filtered.filter(item => item.estates_count <= this.currentFilters.estatesCountMax)
        }
      }

      // Фильтр по мужчинам (только если включен) - для суммированных данных
      if (this.currentFilters.maleEnabled) {
        if (this.currentFilters.maleMin !== null && this.currentFilters.maleMin !== undefined) {
          filtered = filtered.filter(item => (item.total_male || 0) >= this.currentFilters.maleMin)
        }
        if (this.currentFilters.maleMax !== null && this.currentFilters.maleMax !== undefined) {
          filtered = filtered.filter(item => (item.total_male || 0) <= this.currentFilters.maleMax)
        }
      }

      // Фильтр по женщинам (только если включен) - для суммированных данных
      if (this.currentFilters.femaleEnabled) {
        if (this.currentFilters.femaleMin !== null && this.currentFilters.femaleMin !== undefined) {
          filtered = filtered.filter(item => (item.total_female || 0) >= this.currentFilters.femaleMin)
        }
        if (this.currentFilters.femaleMax !== null && this.currentFilters.femaleMax !== undefined) {
          filtered = filtered.filter(item => (item.total_female || 0) <= this.currentFilters.femaleMax)
        }
      }

      // Фильтр по общему населению (только если включен) - для суммированных данных
      if (this.currentFilters.populationEnabled) {
        if (this.currentFilters.populationMin !== null && this.currentFilters.populationMin !== undefined) {
          filtered = filtered.filter(item => (item.total_population || 0) >= this.currentFilters.populationMin)
        }
        if (this.currentFilters.populationMax !== null && this.currentFilters.populationMax !== undefined) {
          filtered = filtered.filter(item => (item.total_population || 0) <= this.currentFilters.populationMax)
        }
      }

      return filtered
    },

    async loadReportData() {
      this.loading = true

      try {
        // Загружаем allSubtypeEstates если еще не загружены
        if (!this.allSubtypeEstates || this.allSubtypeEstates.length === 0) {
          const { data: subtypes, error: subtypesError } = await supabase
            .from('Subtype_estate')
            .select('id, name, id_type_estate, id_type_religion, id_type_affiliation')

          if (subtypesError) throw subtypesError
          this.allSubtypeEstates = subtypes || []
        }

        // Если есть фильтры по сословиям, сначала найдем подходящие Report_record через Estate
        let reportRecordIdsFromEstates = null

        // Проверяем, есть ли фильтры по сословиям
        const hasEstateFilters =
          this.currentFilters?.typeEstates?.length > 0 ||
          this.currentFilters?.subtypeEstates?.length > 0 ||
          this.currentFilters?.religions?.length > 0 ||
          this.currentFilters?.affiliations?.length > 0 ||
          this.currentFilters?.volosts?.length > 0 ||
          this.currentFilters?.landowners?.length > 0 ||
          this.currentFilters?.militaryUnits?.length > 0

        if (hasEstateFilters) {
          // Строим запрос к Estate с фильтрами
          let estateQuery = supabase
            .from('Estate')
            .select('id_report_record')

          let hasFilters = false

          // Применяем фильтры по сословиям
          if (this.currentFilters.typeEstates?.length > 0 && this.allSubtypeEstates?.length > 0) {
            const subtypeIds = this.allSubtypeEstates
              .filter(s => this.currentFilters.typeEstates.includes(s.id_type_estate))
              .map(s => s.id)
            if (subtypeIds.length > 0) {
              estateQuery = estateQuery.in('id_subtype_estate', subtypeIds)
              hasFilters = true
            }
          }

          if (this.currentFilters.subtypeEstates?.length > 0) {
            estateQuery = estateQuery.in('id_subtype_estate', this.currentFilters.subtypeEstates)
            hasFilters = true
          }

          if (this.currentFilters.religions?.length > 0 && this.allSubtypeEstates?.length > 0) {
            const subtypeIds = this.allSubtypeEstates
              .filter(s => this.currentFilters.religions.includes(s.id_type_religion))
              .map(s => s.id)
            if (subtypeIds.length > 0) {
              estateQuery = estateQuery.in('id_subtype_estate', subtypeIds)
              hasFilters = true
            }
          }

          if (this.currentFilters.affiliations?.length > 0 && this.allSubtypeEstates?.length > 0) {
            const subtypeIds = this.allSubtypeEstates
              .filter(s => this.currentFilters.affiliations.includes(s.id_type_affiliation))
              .map(s => s.id)
            if (subtypeIds.length > 0) {
              estateQuery = estateQuery.in('id_subtype_estate', subtypeIds)
              hasFilters = true
            }
          }

          if (this.currentFilters.volosts?.length > 0) {
            estateQuery = estateQuery.in('id_volost', this.currentFilters.volosts)
            hasFilters = true
          }

          if (this.currentFilters.landowners?.length > 0) {
            estateQuery = estateQuery.in('id_landowner', this.currentFilters.landowners)
            hasFilters = true
          }

          if (this.currentFilters.militaryUnits?.length > 0) {
            estateQuery = estateQuery.in('id_military_unit', this.currentFilters.militaryUnits)
            hasFilters = true
          }

          if (hasFilters) {
            const { data: estates, error: estatesError } = await estateQuery
            if (estatesError) throw estatesError

            // Получаем уникальные id_report_record
            reportRecordIdsFromEstates = [...new Set(estates.map(e => e.id_report_record))]
          }
        }
        
        // Фильтр по районам/населенным пунктам
        let settlementIds = []
        if (this.currentFilters && (this.currentFilters.districts?.length > 0 || this.currentFilters.settlements?.length > 0)) {
          if (this.currentFilters.settlements?.length > 0) {
            settlementIds = this.currentFilters.settlements
          } else if (this.currentFilters.districts?.length > 0) {
            const { data: settlements, error: settlementError } = await supabase
              .from('Settlement')
              .select('id')
              .in('id_district', this.currentFilters.districts)

            if (settlementError) throw settlementError
            settlementIds = settlements.map(s => s.id)
          }
        }

        // Фильтр по старым названиям населенных пунктов
        let oldSettlementNames = []
        if (this.currentFilters && this.currentFilters.settlementNamesOld?.length > 0) {
          oldSettlementNames = this.currentFilters.settlementNamesOld
        }

        // Фильтр по современным названиям населенных пунктов
        let modernSettlementNames = []
        if (this.currentFilters && this.currentFilters.settlementNamesModern?.length > 0) {
          modernSettlementNames = this.currentFilters.settlementNamesModern
        }
        
        // Строим основной запрос к Report_record
        let query = supabase
          .from('Report_record')
          .select(`
            id,
            code,
            population_all,
            Revision_report!Report_record_id_revision_report_fkey!inner(
              year,
              number
            ),
            Settlement!Report_record_id_settlment_fkey(
              name_old,
              name_modern,
              lat,
              lon,
              District(name)
            )
          `)
          .not('Settlement', 'is', null) // Исключаем записи без населенных пунктов

        // Применяем фильтр по ревизиям
        if (this.currentFilters?.revision && this.currentFilters.revision.length > 0) {
          query = query.in('Revision_report.number', this.currentFilters.revision)
        }
        
        // Применяем фильтр по Report_record из Estate
        if (reportRecordIdsFromEstates !== null) {
          if (reportRecordIdsFromEstates.length > 0) {
            query = query.in('id', reportRecordIdsFromEstates)
          } else {
            // Если фильтр применен но ничего не найдено
            this.allReportData = []
            this.reportData = []
            this.loading = false
            return
          }
        }
        
        // Применяем фильтр по населенным пунктам
        if (settlementIds.length > 0) {
          query = query.in('id_settlment', settlementIds)
        }

        // Применяем фильтр по старым названиям населенных пунктов
        if (oldSettlementNames.length > 0) {
          query = query.in('Settlement.name_old', oldSettlementNames)
        }

        // Применяем фильтр по современным названиям населенных пунктов
        if (modernSettlementNames.length > 0) {
          query = query.in('Settlement.name_modern', modernSettlementNames)
        }
        
        query = query.order('id', { ascending: false })
        
        const { data: reportRecords, error } = await query
        if (error) throw error

        // Преобразуем данные в формат для таблицы
        const reportData = reportRecords.map(item => ({
              id: item.id,
              code: item.code,
              revision_year: item.Revision_report?.year || null,
              revision_number: item.Revision_report?.number || null,
              settlement_name_old: item.Settlement?.name_old || null,
              settlement_name_modern: item.Settlement?.name_modern || null,
              district_name: item.Settlement?.District?.name || null,
              lat: item.Settlement?.lat || null,
              lon: item.Settlement?.lon || null,
              population_all: item.population_all,
              estates_count: 0,
              total_male: 0,
              total_female: 0,
              total_population: 0
            }))

            // Теперь для каждой записи считаем количество связанных Estate и суммируем данные
            const countPromises = reportData.map(async (record) => {
                try {
                    // Получаем суммарные данные из связанных Estate
                    const { data: estates, error: estatesError } = await supabase
                        .from('Estate')
                        .select('male, female')
                        .eq('id_report_record', record.id)

                    if (estatesError) throw estatesError

                    // Суммируем данные
                    const totalMale = estates?.reduce((sum, estate) => sum + (estate.male || 0), 0) || 0
                    const totalFemale = estates?.reduce((sum, estate) => sum + (estate.female || 0), 0) || 0
                    const totalPopulation = totalMale + totalFemale

                    record.estates_count = estates?.length || 0
                    record.total_male = totalMale
                    record.total_female = totalFemale
                    record.total_population = totalPopulation

                    return record
                } catch (error) {
                    console.error('Error calculating totals for record:', record.id, error)
                    record.estates_count = 0
                    record.total_male = 0
                    record.total_female = 0
                    record.total_population = 0
                    return record
                }
            })

        const reportDataWithCounts = await Promise.all(countPromises)

        // Сохраняем все данные и применяем клиентские фильтры
        this.allReportData = reportDataWithCounts
        this.reportData = this.applyClientSideReportFilters(reportDataWithCounts)

        // Обновляем маркеры на карте после загрузки данных
        if (this.viewMode === 'map' || this.viewMode === 'split') {
          this.$nextTick(() => {
            this.updateMapMarkers()
          })
        }
      } catch (error) {
        console.error('Error loading report data:', error)
        ElMessage.error('Ошибка загрузки данных о ревизиях: ' + error.message)
      } finally {
        this.loading = false
      }
    },

    viewDetails(row) {
      // console.log('View details for:', row)
      this.selectedRecord = row
      this.detailsDrawerVisible = true

      // Если это режим Report_record, загружаем связанные Estate записи
      if (this.dataMode === 'report') {
        this.loadRelatedEstates(row.id)
      }
    },

    loadRelatedEstates(reportRecordId) {
      this.selectedRecord.relatedEstates = []
      this.selectedRecord.loadingEstates = true

      supabase
          .from('Estate')
          .select(`
          id,
          male,
          female,
          Subtype_estate!Estate_id_subtype_estate_fkey(
            name,
            Type_estate(name),
            Type_religion(name),
            Type_affiliation(name)
          ),
          Volost!Estate_id_volost_fkey(name),
          Landowner!Estate_id_landowner_fkey(
            description,
            person
          ),
          Military_unit!Estate_id_military_unit_fkey(
            description,
            person
          )
        `)
          .eq('id_report_record', reportRecordId)
          .then(({data, error}) => {
            if (error) throw error

            this.selectedRecord.relatedEstates = data.map(item => ({
              id: item.id,
              subtype_estate_name: item.Subtype_estate?.name || '—',
              type_estate_name: item.Subtype_estate?.Type_estate?.name || '—',
              type_religion_name: item.Subtype_estate?.Type_religion?.name || '—',
              type_affiliation_name: item.Subtype_estate?.Type_affiliation?.name || '—',
              male: item.male || 0,
              female: item.female || 0,
              total: (item.male || 0) + (item.female || 0),
              volost_name: item.Volost?.name || '—',
              landowner_description: item.Landowner?.description || item.Landowner?.person || '—',
              military_unit_description: item.Military_unit?.description || item.Military_unit?.person || '—'
            }))

            this.selectedRecord.loadingEstates = false
          })
          .catch(error => {
            console.error('Error loading related estates:', error)
            ElMessage.error('Ошибка загрузки связанных сословий: ' + error.message)
            this.selectedRecord.loadingEstates = false
          })
    },

    closeDetailsDrawer() {
      try {
        this.detailsDrawerVisible = false
        this.selectedRecord = null
      } catch (error) {
        console.warn('Error closing details drawer:', error)
      }
    },

    closeColorSettings() {
      try {
        this.showColorSettings = false
      } catch (error) {
        console.warn('Error closing color settings:', error)
      }
    },

    onColorSettingsChange() {
      // Обновляем маркеры на карте при изменении настроек цветов
      this.$nextTick(() => {
        try {
          if (this.$refs.mapView && this.$refs.mapView.$el && this.$refs.mapView.$el.parentNode) {
            if (this.$refs.mapView.updateLeafletMarkers && typeof this.$refs.mapView.updateLeafletMarkers === 'function') {
              this.$refs.mapView.updateLeafletMarkers()
            }
            if (this.$refs.mapView.updateOpenLayersMarkers && typeof this.$refs.mapView.updateOpenLayersMarkers === 'function') {
              this.$refs.mapView.updateOpenLayersMarkers()
            }
          }
        } catch (error) {
          console.warn('Error updating map markers on color settings change:', error)
        }
      })
    },

    handleHeaderDragEnd(newWidth, oldWidth, column, event) {
      // console.log('Column resized:', column.label, 'New width:', newWidth)
    },

    initColumnDragDrop() {
      // Небольшая задержка для полной отрисовки таблицы
      setTimeout(() => {
        try {
          // Проверяем что компонент еще существует и примонтирован
          if (!this.$el || !this.$el.parentNode) {
            return
          }

          const table = document.querySelector('.list-section .el-table__header-wrapper tr')

          if (!table) {
            // Таблица скрыта (режим "Карта"), это нормально
            return
          }

          if (this.sortableInstance) {
            this.sortableInstance.destroy()
            this.sortableInstance = null
          }

          this.sortableInstance = Sortable.create(table, {
            animation: 150,
            delay: 0,
            handle: '.cell',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            forceFallback: true,
            fallbackClass: 'sortable-fallback',
            fallbackOnBody: true,
            swapThreshold: 0.65,
            onStart: (evt) => {
              // console.log('Drag started', evt.oldIndex)
            },
            onEnd: (evt) => {
              const {oldIndex, newIndex} = evt
              if (oldIndex !== newIndex) {
                // console.log(`Column moved from ${oldIndex} to ${newIndex}`)
                ElMessage.success(`Столбец перемещен с позиции ${oldIndex + 1} на позицию ${newIndex + 1}`)
              }
            }
          })

          // console.log('Sortable initialized successfully')
        } catch (error) {
          console.warn('Error initializing column drag and drop:', error)
        }
      }, 300)
    },

    setFilterOptions(options) {
      // console.log('Setting filter options:', options)
      this.allDistricts = options.districts || []
      this.allSettlements = options.settlements || []
      this.allTypeEstates = options.typeEstates || []
      this.allSubtypeEstates = options.subtypeEstates || []
      this.allReligions = options.religions || []
      this.allAffiliations = options.affiliations || []
      this.allVolosts = options.volosts || []
    },

    applyFilters(filters) {
      this.currentFilters = filters

      // Сохраняем фильтры в URL
      setFiltersInURL(filters)

      // Всегда загружаем данные, даже если фильтров нет
      // Пустые фильтры означают "показать все данные"
      this.loadData()
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

    // Метод для расчета итоговой строки таблицы (режим Estate)
    getEstateSummary() {
      const sums = this.estateTotals
      const columns = []

      // Проходим по всем видимым колонкам и добавляем суммы для числовых полей
      Object.keys(this.visibleEstateColumns).forEach(column => {
        if (this.visibleEstateColumns[column]) {
          switch (column) {
            case 'male':
              columns.push(sums.male.toLocaleString())
              break
            case 'female':
              columns.push(sums.female.toLocaleString())
              break
            case 'total':
              columns.push(sums.total.toLocaleString())
              break
            default:
              columns.push('')
          }
        }
      })

      return columns
    },



    // Обновляем векторные слои на картах
    refreshMapLayers() {
      try {
        if (this.$refs.mapView && this.$refs.mapView.$el && this.$refs.mapView.$el.parentNode && typeof this.$refs.mapView.refreshVectorLayers === 'function') {
          // console.log('Refreshing map layers from EstatesListAndMap')
          this.$refs.mapView.refreshVectorLayers()
        }
      } catch (error) {
        console.warn('Error refreshing map layers:', error)
      }
    },

    // Обновляем маркеры на картах при изменении данных
    updateMapMarkers() {
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

    // Экспорт данных в Excel
    exportToExcel() {
      try {
        const dataToExport = this.dataMode === 'estate' ? this.estateData : this.reportData

        if (!dataToExport || dataToExport.length === 0) {
          ElMessage.warning('Нет данных для экспорта')
          return
        }

        // Создаем книгу Excel
        const workbook = XLSX.utils.book_new()

        // Получаем заголовки и данные для экспорта
        const { headers, exportData } = this.prepareExportData(dataToExport)

        // Создаем лист с данными
        const worksheet = XLSX.utils.aoa_to_sheet(exportData)

        // Устанавливаем ширину колонок
        const columnWidths = this.getColumnWidths(headers, exportData)
        worksheet['!cols'] = columnWidths

        // Добавляем стили форматирования
        this.applyExcelStyles(worksheet, exportData.length)

        // Добавляем лист в книгу
        XLSX.utils.book_append_sheet(workbook, worksheet, this.dataMode === 'estate' ? 'Сословия' : 'Ревизии')

        // Генерируем имя файла с текущей датой и временем
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
        const fileName = `${this.dataMode === 'estate' ? 'сословия' : 'ревизии'}_${timestamp}.xlsx`

        // Сохраняем файл
        XLSX.writeFile(workbook, fileName)

        ElMessage.success(`Данные экспортированы в файл ${fileName}`)
      } catch (error) {
        console.error('Ошибка экспорта в Excel:', error)
        ElMessage.error('Ошибка при экспорте данных в Excel')
      }
    },

    // Подготовка данных для экспорта
    prepareExportData(data) {
      const headers = []
      const exportData = []

      // Определяем видимые колонки в зависимости от режима
      const visibleColumns = this.dataMode === 'estate' ? this.visibleEstateColumns : this.visibleReportColumns

      // Создаем заголовки на основе видимых колонок
      Object.keys(visibleColumns).forEach(column => {
        if (visibleColumns[column]) {
          headers.push(this.getColumnLabel(column))
        }
      })

      // Добавляем компактную информацию о фильтрах в одну строку
      const filterInfo = this.getCompactFilterInfo()
      if (filterInfo) {
        const infoRow = new Array(headers.length).fill('')
        infoRow[0] = filterInfo

        // Очищаем все остальные ячейки в строке фильтров
        for (let i = 1; i < infoRow.length; i++) {
          infoRow[i] = ''
        }

        exportData.push(infoRow)

        // Пустая строка после информации о фильтрах
        exportData.push(new Array(headers.length).fill(''))
      }

      // Добавляем заголовки таблицы
      exportData.push(headers)

      // Подготавливаем данные для экспорта
      data.forEach(row => {
        const rowData = []
        Object.keys(visibleColumns).forEach(column => {
          if (visibleColumns[column]) {
            const value = this.getCellValue(row, column)
            rowData.push(value)
          }
        })
        exportData.push(rowData)
      })

      // Добавляем строку с суммами (если есть числовые колонки)
      const summaryRow = this.getSummaryRow(headers.length)
      if (summaryRow.some(cell => cell !== '')) {
        exportData.push(new Array(headers.length).fill('')) // Пустая строка перед итогами
        exportData.push(summaryRow)
      }

      return { headers, exportData }
    },

    // Получение метки колонки
    getColumnLabel(column) {
      const labels = {
        // Estate mode
        id: 'ID',
        revision_year: 'Год',
        revision_number: 'Рев.',
        settlement_name_old: 'Нас. пункт (старый)',
        settlement_name_modern: 'Нас. пункт (совр.)',
        district_name: 'Район',
        subtype_estate_name: 'Подтип сословия',
        type_estate_name: 'Сословие',
        type_religion_name: 'Религия',
        type_affiliation_name: 'Принадлежность',
        male: 'Мужчины',
        female: 'Женщины',
        total: 'Всего',
        volost_name: 'Волость',
        landowner_description: 'Помещик',
        military_unit_description: 'Воинская часть',
        // Report mode
        code: 'Код',
        lat: 'Широта',
        lon: 'Долгота',
        population_all: 'Население',
        estates_count: 'Сословий',
        total_male: 'Мужчины',
        total_female: 'Женщины',
        total_population: 'Всего'
      }
      return labels[column] || column
    },

    // Получение значения ячейки
    getCellValue(row, column) {
      const value = row[column]
      return value !== null && value !== undefined ? value : ''
    },

    // Получение компактной информации о фильтрах
    getCompactFilterInfo() {
      if (!this.currentFilters) return null

      const activeFilters = []

      // Ревизии
      if (this.currentFilters.revision && this.currentFilters.revision.length > 0) {
        const count = this.currentFilters.revision.length
        activeFilters.push(`Ревизий: ${count}`)
      }

      // Районы
      if (this.currentFilters.districts?.length > 0) {
        const count = this.currentFilters.districts.length
        activeFilters.push(`Районов: ${count}`)
      }

      // Населенные пункты (старые)
      if (this.currentFilters.settlementNamesOld?.length > 0) {
        const count = this.currentFilters.settlementNamesOld.length
        activeFilters.push(`Нас.пунктов (стар.): ${count}`)
      }

      // Населенные пункты (современные)
      if (this.currentFilters.settlementNamesModern?.length > 0) {
        const count = this.currentFilters.settlementNamesModern.length
        activeFilters.push(`Нас.пунктов (совр.): ${count}`)
      }

      // Типы сословий
      if (this.currentFilters.typeEstates?.length > 0) {
        const count = this.currentFilters.typeEstates.length
        activeFilters.push(`Типов сословий: ${count}`)
      }

      // Подтипы сословий
      if (this.currentFilters.subtypeEstates?.length > 0) {
        const count = this.currentFilters.subtypeEstates.length
        activeFilters.push(`Подтипов сословий: ${count}`)
      }

      // Религии
      if (this.currentFilters.religions?.length > 0) {
        const count = this.currentFilters.religions.length
        activeFilters.push(`Религий: ${count}`)
      }

      // Принадлежности
      if (this.currentFilters.affiliations?.length > 0) {
        const count = this.currentFilters.affiliations.length
        activeFilters.push(`Принадлежностей: ${count}`)
      }

      // Волости
      if (this.currentFilters.volosts?.length > 0) {
        const count = this.currentFilters.volosts.length
        activeFilters.push(`Волостей: ${count}`)
      }

      // Помещики
      if (this.currentFilters.landowners?.length > 0) {
        const count = this.currentFilters.landowners.length
        activeFilters.push(`Помещиков: ${count}`)
      }

      // Военные организации
      if (this.currentFilters.militaryUnits?.length > 0) {
        const count = this.currentFilters.militaryUnits.length
        activeFilters.push(`Воен.орг.: ${count}`)
      }

      // Диапазоны населения
      if (this.currentFilters.maleEnabled) {
        const min = this.currentFilters.maleMin || 0
        const max = this.currentFilters.maleMax || '∞'
        activeFilters.push(`М: ${min}-${max}`)
      }

      if (this.currentFilters.femaleEnabled) {
        const min = this.currentFilters.femaleMin || 0
        const max = this.currentFilters.femaleMax || '∞'
        activeFilters.push(`Ж: ${min}-${max}`)
      }

      if (this.currentFilters.populationEnabled) {
        const min = this.currentFilters.populationMin || 0
        const max = this.currentFilters.populationMax || '∞'
        activeFilters.push(`Население: ${min}-${max}`)
      }

      if (this.currentFilters.estatesCountEnabled) {
        const min = this.currentFilters.estatesCountMin || 0
        const max = this.currentFilters.estatesCountMax || '∞'
        activeFilters.push(`Сословий: ${min}-${max}`)
      }

      // Если нет активных фильтров, возвращаем null
      if (activeFilters.length === 0) return null

      // Возвращаем компактную строку с информацией о фильтрах
      return `Фильтры: ${activeFilters.join(' | ')} | Записей: ${this.totalRecords}`
    },

    // Применение стилей форматирования к Excel файлу
    applyExcelStyles(worksheet, dataLength) {
      // Определяем диапазоны для стилизации
      const filterRowIndex = 1 // Строка с информацией о фильтрах
      const headerRowIndex = filterRowIndex + 2 // Строка с заголовками (после пустой строки)
      const dataStartRow = headerRowIndex + 1 // Начало данных
      const summaryRowIndex = dataLength // Последняя строка с итогами

      // Стили для разных частей документа
      const styles = {
        filterInfo: {
          font: { bold: true, color: { rgb: '2E75B6' }, sz: 12 },
          fill: { fgColor: { rgb: 'E7F3FF' } },
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true }
        },
        headers: {
          font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
          fill: { fgColor: { rgb: '4472C4' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        },
        summary: {
          font: { bold: true, color: { rgb: '000000' }, sz: 11 },
          fill: { fgColor: { rgb: 'FFF2CC' } },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: {
            top: { style: 'double', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } }
          }
        }
      }

      // Применяем стили к строке с информацией о фильтрах
      if (worksheet['A' + filterRowIndex]) {
        worksheet['A' + filterRowIndex].s = styles.filterInfo
      }

      // Применяем стили к заголовкам
      const headersRange = this.getHeadersRange(headerRowIndex)
      for (let col = 0; col < headersRange.length; col++) {
        const cellRef = headersRange[col] + headerRowIndex
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = styles.headers
        }
      }

      // Применяем стили к строке с итогами
      if (worksheet['A' + summaryRowIndex]) {
        worksheet['A' + summaryRowIndex].s = styles.summary
      }

      // Применяем стили к числовым колонкам в итоговой строке
      const visibleColumns = this.dataMode === 'estate' ? this.visibleEstateColumns : this.visibleReportColumns
      let colIndex = 0

      Object.keys(visibleColumns).forEach(column => {
        if (visibleColumns[column] && this.isNumericColumn(column)) {
          const cellRef = this.getColumnLetter(colIndex + 1) + summaryRowIndex
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = {
              ...styles.summary,
              alignment: { horizontal: 'right', vertical: 'center' }
            }
          }
        }
        if (visibleColumns[column]) colIndex++
      })

      // Устанавливаем высоту строк
      if (!worksheet['!rows']) worksheet['!rows'] = []
      worksheet['!rows'][filterRowIndex - 1] = { hpt: 18 } // Высота строки с фильтрами
      worksheet['!rows'][headerRowIndex - 1] = { hpt: 20 } // Высота строки с заголовками
      worksheet['!rows'][summaryRowIndex - 1] = { hpt: 18 } // Высота строки с итогами

      // Фиксируем ширину первой колонки для строки с фильтрами
      // Определяем ширину первой колонки на основе заголовка
      const firstColumnWidth = Math.max(
        this.getColumnLabel(Object.keys(visibleColumns).find(col => visibleColumns[col])).length,
        15 // Минимальная ширина
      )

      // Устанавливаем фиксированную ширину для первой колонки
      if (!worksheet['!cols']) worksheet['!cols'] = []
      worksheet['!cols'][0] = { wch: firstColumnWidth }

      // Объединяем ячейки в строке с фильтрами, чтобы текст не переносился
      // и ячейка не растягивалась за пределы первой колонки
      if (worksheet['A' + filterRowIndex] && headersRange.length > 1) {
        // Объединяем только первую ячейку в строке фильтров
        // Не объединяем с другими колонками, чтобы сохранить структуру таблицы
        worksheet['A' + filterRowIndex].s = {
          ...styles.filterInfo,
          alignment: { horizontal: 'left', vertical: 'center', wrapText: true }
        }
      }
    },

    // Получение диапазона заголовков колонок
    getHeadersRange(rowIndex) {
      const visibleColumns = this.dataMode === 'estate' ? this.visibleEstateColumns : this.visibleReportColumns
      const columnCount = Object.keys(visibleColumns).filter(col => visibleColumns[col]).length
      const range = []

      for (let i = 1; i <= columnCount; i++) {
        range.push(this.getColumnLetter(i))
      }

      return range
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

    // Получение ширины колонок
    getColumnWidths(headers, data) {
      const widths = []

      headers.forEach((header, index) => {
        let maxLength = header.length

        // Проверяем длину данных в этой колонке
        data.forEach(row => {
          if (row[index]) {
            const cellLength = String(row[index]).length
            if (cellLength > maxLength) {
              maxLength = cellLength
            }
          }
        })

        // Устанавливаем минимальную и максимальную ширину
        widths.push({ wch: Math.min(Math.max(maxLength, 10), 50) })
      })

      return widths
    },

    // Получение строки сумм
    getSummaryRow(columnCount) {
      const summaryRow = new Array(columnCount).fill('')
      const visibleColumns = this.dataMode === 'estate' ? this.visibleEstateColumns : this.visibleReportColumns

      let columnIndex = 0
      Object.keys(visibleColumns).forEach(column => {
        if (visibleColumns[column]) {
          if (this.isNumericColumn(column)) {
            const sum = this.getColumnSum(column)
            summaryRow[columnIndex] = sum
          }
          columnIndex++
        }
      })

      if (summaryRow.some(cell => cell !== '')) {
        summaryRow[0] = 'Итого:'
      }

      return summaryRow
    },

    // Проверка является ли колонка числовой
    isNumericColumn(column) {
      const numericColumns = [
        'male', 'female', 'total', 'population_all', 'estates_count',
        'total_male', 'total_female', 'total_population'
      ]
      return numericColumns.includes(column)
    },

    // Получение суммы по колонке
    getColumnSum(column) {
      const data = this.dataMode === 'estate' ? this.estateData : this.reportData

      if (!data || data.length === 0) return 0

      return data.reduce((sum, row) => {
        const value = row[column] || 0
        return sum + (typeof value === 'number' ? value : 0)
      }, 0)
    },

    // Экспорт данных в Excel
    exportToExcel() {
      try {
        const dataToExport = this.dataMode === 'estate' ? this.estateData : this.reportData

        if (!dataToExport || dataToExport.length === 0) {
          ElMessage.warning('Нет данных для экспорта')
          return
        }

        // Создаем книгу Excel
        const workbook = XLSX.utils.book_new()

        // Получаем заголовки и данные для экспорта
        const { headers, exportData } = this.prepareExportData(dataToExport)

        // Создаем лист с данными
        const worksheet = XLSX.utils.aoa_to_sheet(exportData)

        // Устанавливаем ширину колонок
        const columnWidths = this.getColumnWidths(headers, exportData)
        worksheet['!cols'] = columnWidths

        // Добавляем стили форматирования
        this.applyExcelStyles(worksheet, exportData.length)

        // Добавляем лист в книгу
        XLSX.utils.book_append_sheet(workbook, worksheet, this.dataMode === 'estate' ? 'Сословия' : 'Ревизии')

        // Генерируем имя файла с текущей датой и временем
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
        const fileName = `${this.dataMode === 'estate' ? 'сословия' : 'ревизии'}_${timestamp}.xlsx`

        // Сохраняем файл
        XLSX.writeFile(workbook, fileName)

        ElMessage.success(`Данные экспортированы в файл ${fileName}`)
      } catch (error) {
        console.error('Ошибка экспорта в Excel:', error)
        ElMessage.error('Ошибка при экспорте данных в Excel')
      }
    },

    // Подготовка данных для экспорта
    prepareExportData(data) {
      const headers = []
      const exportData = []

      // Определяем видимые колонки в зависимости от режима
      const visibleColumns = this.dataMode === 'estate' ? this.visibleEstateColumns : this.visibleReportColumns

      // Создаем заголовки на основе видимых колонок
      Object.keys(visibleColumns).forEach(column => {
        if (visibleColumns[column]) {
          headers.push(this.getColumnLabel(column))
        }
      })

      // Добавляем компактную информацию о фильтрах в одну строку
      const filterInfo = this.getFilterInfo()
      if (filterInfo) {
        const infoRow = new Array(headers.length).fill('')
        infoRow[0] = filterInfo

        // Очищаем все остальные ячейки в строке фильтров
        for (let i = 1; i < infoRow.length; i++) {
          infoRow[i] = ''
        }

        exportData.push(infoRow)

        // Пустая строка после информации о фильтрах
        exportData.push(new Array(headers.length).fill(''))
      }

      // Добавляем заголовки таблицы
      exportData.push(headers)

      // Подготавливаем данные для экспорта
      data.forEach(row => {
        const rowData = []
        Object.keys(visibleColumns).forEach(column => {
          if (visibleColumns[column]) {
            const value = this.getCellValue(row, column)
            rowData.push(value)
          }
        })
        exportData.push(rowData)
      })

      // Добавляем строку с суммами (если есть числовые колонки)
      const summaryRow = this.getSummaryRow(headers.length)
      if (summaryRow.some(cell => cell !== '')) {
        exportData.push(new Array(headers.length).fill('')) // Пустая строка перед итогами
        exportData.push(summaryRow)
      }

      return { headers, exportData }
    },

    // Получение метки колонки
    getColumnLabel(column) {
      const labels = {
        // Estate mode
        id: 'ID',
        revision_year: 'Год',
        revision_number: 'Рев.',
        settlement_name_old: 'Нас. пункт (старый)',
        settlement_name_modern: 'Нас. пункт (совр.)',
        district_name: 'Район',
        subtype_estate_name: 'Подтип сословия',
        type_estate_name: 'Сословие',
        type_religion_name: 'Религия',
        type_affiliation_name: 'Принадлежность',
        male: 'Мужчины',
        female: 'Женщины',
        total: 'Всего',
        volost_name: 'Волость',
        landowner_description: 'Помещик',
        military_unit_description: 'Воинская часть',
        // Report mode
        code: 'Код',
        lat: 'Широта',
        lon: 'Долгота',
        population_all: 'Население',
        estates_count: 'Сословий',
        total_male: 'Мужчины',
        total_female: 'Женщины',
        total_population: 'Всего'
      }
      return labels[column] || column
    },

    // Получение значения ячейки
    getCellValue(row, column) {
      const value = row[column]
      return value !== null && value !== undefined ? value : ''
    },

    // Получение информации о фильтрах
    getFilterInfo() {
      if (!this.currentFilters) return null

      const activeFilters = []

      // Ревизии
      if (this.currentFilters.revision && this.currentFilters.revision.length > 0) {
        const revisionNames = this.currentFilters.revision.map(num => {
          const revision = this.allRevisions?.find(r => r.number === num)
          return revision ? `${revision.number} ревизия (${revision.year})` : `№:${num}`
        })
        activeFilters.push(`Ревизии: ${revisionNames.join(', ')}`)
      }

      // Районы
      if (this.currentFilters.districts?.length > 0) {
        const districtNames = this.currentFilters.districts.map(id => {
          const district = this.allDistricts?.find(d => d.id === id)
          return district ? district.name : `ID:${id}`
        })
        activeFilters.push(`Районы: ${districtNames.join(', ')}`)
      }

      // Населенные пункты (старые)
      if (this.currentFilters.settlementNamesOld?.length > 0) {
        activeFilters.push(`Населенные пункты (старые): ${this.currentFilters.settlementNamesOld.join(', ')}`)
      }

      // Населенные пункты (современные)
      if (this.currentFilters.settlementNamesModern?.length > 0) {
        activeFilters.push(`Населенные пункты (современные): ${this.currentFilters.settlementNamesModern.join(', ')}`)
      }

      // Типы сословий
      if (this.currentFilters.typeEstates?.length > 0) {
        const typeNames = this.currentFilters.typeEstates.map(id => {
          const type = this.allTypeEstates?.find(t => t.id === id)
          return type ? type.name : `ID:${id}`
        })
        activeFilters.push(`Типы сословий: ${typeNames.join(', ')}`)
      }

      // Подтипы сословий
      if (this.currentFilters.subtypeEstates?.length > 0) {
        const subtypeNames = this.currentFilters.subtypeEstates.map(id => {
          const subtype = this.allSubtypeEstates?.find(s => s.id === id)
          return subtype ? subtype.name : `ID:${id}`
        })
        activeFilters.push(`Подтипы сословий: ${subtypeNames.join(', ')}`)
      }

      // Религии
      if (this.currentFilters.religions?.length > 0) {
        const religionNames = this.currentFilters.religions.map(id => {
          const religion = this.allReligions?.find(r => r.id === id)
          return religion ? religion.name : `ID:${id}`
        })
        activeFilters.push(`Религии: ${religionNames.join(', ')}`)
      }

      // Принадлежности
      if (this.currentFilters.affiliations?.length > 0) {
        const affiliationNames = this.currentFilters.affiliations.map(id => {
          const affiliation = this.allAffiliations?.find(a => a.id === id)
          return affiliation ? affiliation.name : `ID:${id}`
        })
        activeFilters.push(`Принадлежности: ${affiliationNames.join(', ')}`)
      }

      // Волости
      if (this.currentFilters.volosts?.length > 0) {
        const volostNames = this.currentFilters.volosts.map(id => {
          const volost = this.allVolosts?.find(v => v.id === id)
          return volost ? volost.name : `ID:${id}`
        })
        activeFilters.push(`Волости: ${volostNames.join(', ')}`)
      }

      // Помещики
      if (this.currentFilters.landowners?.length > 0) {
        const landownerNames = this.currentFilters.landowners.map(id => {
          const landowner = this.allLandowners?.find(l => l.id === id)
          return landowner ? landowner.name : `ID:${id}`
        })
        activeFilters.push(`Помещики: ${landownerNames.join(', ')}`)
      }

      // Военные организации
      if (this.currentFilters.militaryUnits?.length > 0) {
        const unitNames = this.currentFilters.militaryUnits.map(id => {
          const unit = this.allMilitaryUnits?.find(u => u.id === id)
          return unit ? unit.name : `ID:${id}`
        })
        activeFilters.push(`Военные организации: ${unitNames.join(', ')}`)
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

      if (this.currentFilters.estatesCountEnabled) {
        const min = this.currentFilters.estatesCountMin || 0
        const max = this.currentFilters.estatesCountMax || '∞'
        activeFilters.push(`Количество сословий: ${min}-${max}`)
      }

      if (activeFilters.length === 0) return null

      return `Фильтры: ${activeFilters.join(' | ')} | Записей: ${this.totalRecords}`
    },

    // Получение ширины колонок
    getColumnWidths(headers, data) {
      const widths = []

      headers.forEach((header, index) => {
        let maxLength = header.length

        // Проверяем длину данных в этой колонке
        data.forEach(row => {
          if (row[index]) {
            const cellLength = String(row[index]).length
            if (cellLength > maxLength) {
              maxLength = cellLength
            }
          }
        })

        // Устанавливаем минимальную и максимальную ширину
        widths.push({ wch: Math.min(Math.max(maxLength, 10), 50) })
      })

      return widths
    },

    // Получение строки сумм
    getSummaryRow(columnCount) {
      const summaryRow = new Array(columnCount).fill('')
      const visibleColumns = this.dataMode === 'estate' ? this.visibleEstateColumns : this.visibleReportColumns

      let columnIndex = 0
      Object.keys(visibleColumns).forEach(column => {
        if (visibleColumns[column]) {
          if (this.isNumericColumn(column)) {
            const sum = this.getColumnSum(column)
            summaryRow[columnIndex] = sum
          }
          columnIndex++
        }
      })

      if (summaryRow.some(cell => cell !== '')) {
        summaryRow[0] = 'Итого:'
      }

      return summaryRow
    },

    // Проверка является ли колонка числовой
    isNumericColumn(column) {
      const numericColumns = [
        'male', 'female', 'total', 'population_all', 'estates_count',
        'total_male', 'total_female', 'total_population'
      ]
      return numericColumns.includes(column)
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
      const visibleColumns = this.dataMode === 'estate' ? this.visibleEstateColumns : this.visibleReportColumns
      let colIndex = 0

      Object.keys(visibleColumns).forEach(column => {
        if (visibleColumns[column]) {
          const cellRef = this.getColumnLetter(colIndex + 1) + headerRowIndex
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = styles.headers
          }
          colIndex++
        }
      })

      // Применяем стили к итоговой строке
      if (worksheet['A' + summaryRowIndex]) {
        worksheet['A' + summaryRowIndex].s = styles.summary
      }

      // Применяем стили к числовым колонкам в итоговой строке
      colIndex = 0
      Object.keys(visibleColumns).forEach(column => {
        if (visibleColumns[column] && this.isNumericColumn(column)) {
          const cellRef = this.getColumnLetter(colIndex + 1) + summaryRowIndex
          if (worksheet[cellRef]) {
            worksheet[cellRef].s = {
              ...styles.summary,
              alignment: { horizontal: 'right', vertical: 'center' }
            }
          }
        }
        if (visibleColumns[column]) colIndex++
      })
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
    }
  },
  watch: {
    dataMode(newMode) {
      this.$emit('data-mode-change', newMode)

      // Сохраняем режим в URL
      setModeInURL(newMode)

      // Не загружаем данные автоматически при смене режима
      // Данные загружаются только при изменении фильтров
      this.$nextTick(() => {
        this.initColumnDragDrop()
      })
    },

    sorting: {
      handler(newSorting) {
        // Сохраняем сортировку в URL
        setSortingInURL(newSorting)
      },
      deep: true
    },
    viewMode() {
      this.$nextTick(() => {
        this.initColumnDragDrop()
        // Триггерим обновление размера карт через изменение ключа
        this.$forceUpdate()
      })
      // Даем время на отрисовку, затем обновляем карты
      setTimeout(() => {
        this.$forceUpdate()
        // Обновляем векторные слои при переключении режимов карты
        if (this.viewMode === 'map' || this.viewMode === 'split') {
          this.refreshMapLayers()
          // Обновляем маркеры при переключении режимов карты
          this.updateMapMarkers()
        }
      }, 100)
    },
    // Отслеживаем изменения данных для обновления маркеров
    estateData: {
      handler() {
        if (this.viewMode === 'map' || this.viewMode === 'split') {
          this.updateMapMarkers()
        }
      },
      deep: true
    },
    reportData: {
      handler() {
        if (this.viewMode === 'map' || this.viewMode === 'split') {
          this.updateMapMarkers()
        }
      },
      deep: true
    },
    // Отслеживаем изменения фильтров для принудительного пересчета маркеров
    currentFilters: {
      handler() {
        if (this.viewMode === 'map' || this.viewMode === 'split') {
          this.$nextTick(() => {
            this.updateMapMarkers()
          })
        }
      },
      deep: true
    }
  }
}
</script>

<style scoped lang="scss">
.estates-list-and-map {
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
        max-height: 50vh;
        min-height: 250px;
        overflow-y: auto;
        overflow-x: hidden;
        border: 1px solid var(--border-color);
        border-radius: 8px;
        background-color: var(--bg-secondary);
        margin-right: 0.5rem;

        // Улучшенные стили скроллбаров для режима split
        &::-webkit-scrollbar {
          width: 14px;
          height: 14px;
        }

        &::-webkit-scrollbar-track {
          background: var(--bg-tertiary);
          border-radius: 8px;
          margin: 2px;
        }

        &::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 8px;
          border: 2px solid var(--bg-tertiary);
          min-height: 40px;

          &:hover {
            background: var(--text-muted);
            border-color: var(--bg-hover);
          }

          &:active {
            background: var(--accent-primary);
          }
        }

        &::-webkit-scrollbar-corner {
          background: var(--bg-tertiary);
        }

        // Кнопки скроллбара
        &::-webkit-scrollbar-button {
          display: none;
        }

        // Для Firefox
        scrollbar-width: auto;
        scrollbar-color: var(--border-color) var(--bg-tertiary);

        // Специальные стили для режима split
        &.split-mode {
          overflow-x: auto;
          overflow-y: auto;
        }
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

    .list-section {
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      overflow-x: auto;
      overflow-y: auto;

      // Кастомные стили для скроллбара
      &::-webkit-scrollbar {
        width: 16px;
        height: 16px;
      }

      &::-webkit-scrollbar-track {
        background: var(--bg-tertiary);
        border-radius: 8px;
        margin: 2px;
      }

      &::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 8px;
        border: 2px solid var(--bg-tertiary);
        min-height: 40px;

        &:hover {
          background: var(--text-muted);
          border-color: var(--bg-hover);
        }

        &:active {
          background: var(--accent-primary);
        }
      }

      &::-webkit-scrollbar-corner {
        background: var(--bg-tertiary);
      }

      // Кнопки скроллбара
      &::-webkit-scrollbar-button {
        display: none;
      }

      // Для Firefox
      scrollbar-width: auto;
      scrollbar-color: var(--border-color) var(--bg-tertiary);

      // Обеспечиваем что таблица занимает всю высоту контейнера
      :deep(.el-table) {
        height: 100% !important;
        flex: 1;
        min-width: fit-content; // Позволяет таблице быть шире контейнера

        // Обертка таблицы для корректной работы скроллбаров
        .el-table__body-wrapper {
          overflow-x: auto !important;
          overflow-y: auto !important;
        }

        .el-table__header-wrapper {
          overflow-x: auto !important;
        }

        // Стили для горизонтального скроллбара таблицы
        .el-table__body-wrapper::-webkit-scrollbar {
          height: 14px;
        }

        .el-table__body-wrapper::-webkit-scrollbar-track {
          background: var(--bg-tertiary);
          border-radius: 6px;
        }

        .el-table__body-wrapper::-webkit-scrollbar-thumb {
          background: var(--border-color);
          border-radius: 6px;
          border: 2px solid var(--bg-tertiary);

          &:hover {
            background: var(--text-muted);
        }
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

      .map-placeholder {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        color: var(--text-muted);

        p {
          margin: 0;
          font-size: 1rem;
        }
      }
    }
  }
}

@media (max-width: 1024px) {
  .estates-list-and-map {
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
  .estates-list-and-map {
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

// Стили для селектора столбцов
.columns-selector {
  .columns-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 400px;
    overflow-y: auto;

    :deep(.el-checkbox) {
      margin-right: 0;

      .el-checkbox__label {
        color: var(--text-primary);
      }
    }
  }
}

// Стили для альтернативных названий населенных пунктов
.alt-name {
  font-size: 0.85em;
  color: var(--text-muted);
  font-style: italic;
  margin-left: 0.25rem;
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
</style>
