<template>
  <div class="estates-list-and-map">
    <div class="view-controls">
      <div class="mode-selector">
        <el-radio-group v-model="dataMode" size="small">
          <el-radio-button label="estate">По сословиям</el-radio-button>
          <el-radio-button label="report">По записям ревизий</el-radio-button>
        </el-radio-group>
      </div>
      
      <div class="view-selector">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="list">Список</el-radio-button>
          <el-radio-button label="map">Карта</el-radio-button>
          <el-radio-button label="split">Разделить</el-radio-button>
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
            <el-button size="small" type="default">
              <el-icon><Setting /></el-icon>
              Столбцы
            </el-button>
          </template>
          <div class="columns-selector">
            <div v-if="dataMode === 'estate'" class="columns-list">
              <el-checkbox v-model="visibleEstateColumns.id">ID</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.revision_year">Год</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.revision_number">Рев.</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.settlement_name">Населенный пункт</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.district_name">Район</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.subtype_estate_name">Подтип сословия</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.type_estate_name">Сословие</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.type_religion_name">Религия</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.type_affiliation_name">Принадлежность</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.male">М</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.female">Ж</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.total">Всего</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.volost_name">Волость</el-checkbox>
              <el-checkbox v-model="visibleEstateColumns.landowner_description">Землевладелец</el-checkbox>
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
        <el-tag size="small" type="info">Всего записей: {{ totalRecords }}</el-tag>
      </div>
    </div>

    <div class="content-area" :class="viewMode">
      <div v-if="viewMode === 'list' || viewMode === 'split'" class="list-section">
        <!-- Режим Estate -->
        <el-table 
          v-if="dataMode === 'estate'"
          :data="estateData" 
          v-loading="loading"
          style="width: 100%; height: calc(100% + 40px)"
          border 
          stripe
          size="small"
          @header-dragend="handleHeaderDragEnd"
          @row-dblclick="viewDetails"
        >
          <el-table-column v-if="visibleEstateColumns.id" prop="id" label="ID" width="50" sortable />
          <el-table-column v-if="visibleEstateColumns.revision_year" prop="revision_year" label="Год" width="60" sortable />
          <el-table-column v-if="visibleEstateColumns.revision_number" prop="revision_number" label="Рев." width="50" sortable />
          <el-table-column v-if="visibleEstateColumns.settlement_name" prop="settlement_name" label="Населенный пункт" min-width="150" sortable />
          <el-table-column v-if="visibleEstateColumns.district_name" prop="district_name" label="Район" width="120" sortable />
          <el-table-column v-if="visibleEstateColumns.subtype_estate_name" prop="subtype_estate_name" label="Подтип сословия" width="150" sortable />
          <el-table-column v-if="visibleEstateColumns.type_estate_name" prop="type_estate_name" label="Сословие" width="120" sortable />
          <el-table-column v-if="visibleEstateColumns.type_religion_name" prop="type_religion_name" label="Религия" width="100" sortable />
          <el-table-column v-if="visibleEstateColumns.type_affiliation_name" prop="type_affiliation_name" label="Принадлежность" width="120" sortable />
          <el-table-column v-if="visibleEstateColumns.male" prop="male" label="М" width="50" align="right" sortable />
          <el-table-column v-if="visibleEstateColumns.female" prop="female" label="Ж" width="50" align="right" sortable />
          <el-table-column v-if="visibleEstateColumns.total" prop="total" label="Всего" width="60" align="right" sortable />
          <el-table-column v-if="visibleEstateColumns.volost_name" prop="volost_name" label="Волость" width="120" sortable />
          <el-table-column v-if="visibleEstateColumns.landowner_description" prop="landowner_description" label="Землевладелец" width="150" sortable />
          <el-table-column v-if="visibleEstateColumns.military_unit_description" prop="military_unit_description" label="Воинская часть" width="150" sortable />
        </el-table>

        <!-- Режим Report_record -->
        <el-table 
          v-else
          :data="reportData" 
          v-loading="loading"
          style="width: 100%; height: calc(100% + 40px)"
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
        </el-table>
      </div>

      <div v-if="viewMode === 'map' || viewMode === 'split'" class="map-section">
        <MapView :settlements="mapSettlements" />
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
            <el-descriptions-item label="Населенный пункт">
              {{ selectedRecord.settlement_name || '—' }}
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
            <el-descriptions-item label="Землевладелец">
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
                  <el-descriptions-item label="Землевладелец">
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
import { Location, Loading, Setting } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { supabase } from '@/services/supabase'
import Sortable from 'sortablejs'
import MapView from './MapView.vue'

export default {
  name: 'EstatesListAndMap',
  components: {
    Location,
    Loading,
    Setting,
    MapView
  },
  data() {
    return {
      dataMode: 'estate',
      viewMode: 'list',
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
      allSettlements: [],
      allTypeEstates: [],
      allSubtypeEstates: [],
      allReligions: [],
      allAffiliations: [],
      allVolosts: [],
      visibleEstateColumns: {
        id: true,
        revision_year: true,
        revision_number: true,
        settlement_name: true,
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
        id: true,
        code: true,
        revision_year: true,
        revision_number: true,
        settlement_name_old: true,
        settlement_name_modern: true,
        district_name: true,
        lat: true,
        lon: true,
        population_all: true,
        estates_count: true
      }
    }
  },
  computed: {
    totalRecords() {
      return this.dataMode === 'estate' ? this.estateData.length : this.reportData.length
    },
    
    mapSettlements() {
      // Собираем уникальные населенные пункты из текущих данных
      const settlementsMap = new Map()
      
      console.log('Computing mapSettlements, dataMode:', this.dataMode)
      console.log('estateData length:', this.estateData.length)
      console.log('reportData length:', this.reportData.length)
      console.log('allSettlements length:', this.allSettlements?.length)
      
      if (this.dataMode === 'estate') {
        this.estateData.forEach(item => {
          const key = item.settlement_name
          if (key && !settlementsMap.has(key)) {
            // Нужно получить координаты из allSettlements
            const settlement = this.allSettlements?.find(s => 
              s.name_modern === item.settlement_name || s.name_old === item.settlement_name
            )
            if (settlement && settlement.lat && settlement.lon) {
              console.log('Found settlement with coords:', settlement.name_modern || settlement.name_old, settlement.lat, settlement.lon)
              settlementsMap.set(key, {
                name: item.settlement_name,
                district: item.district_name,
                lat: settlement.lat,
                lon: settlement.lon,
                population: null // Можно посчитать сумму по этому населенному пункту
              })
            } else {
              console.log('Settlement without coords:', key, settlement)
            }
          }
        })
      } else {
        this.reportData.forEach(item => {
          const key = item.settlement_name_modern || item.settlement_name_old
          if (key && item.lat && item.lon && !settlementsMap.has(key)) {
            console.log('Report settlement with coords:', key, item.lat, item.lon)
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
      console.log('Final mapSettlements:', result)
      return result
    }
  },
  async mounted() {
    // Загружаем справочник населенных пунктов для режима Estate
    await this.loadSettlementsReference()
    
    // Не загружаем данные автоматически, ждем применения фильтров
    this.$nextTick(() => {
      this.initColumnDragDrop()
    })
  },
  beforeUnmount() {
    if (this.sortableInstance) {
      this.sortableInstance.destroy()
    }
  },
  methods: {
    async loadSettlementsReference() {
      try {
        const { data, error } = await supabase
          .from('Settlement')
          .select('id, name_modern, name_old, lat, lon, id_district')
        
        if (error) throw error
        this.allSettlements = data || []
        console.log('Loaded settlements reference:', this.allSettlements.length)
      } catch (error) {
        console.error('Error loading settlements reference:', error)
      }
    },
    
    loadData() {
      if (this.dataMode === 'estate') {
        this.loadEstateData()
      } else {
        this.loadReportData()
      }
    },

    async loadEstateData() {
      this.loading = true
      
      try {
        // Сначала получаем ID Report_record с учетом фильтров по району/населенному пункту
        let reportRecordIds = null
        
        if (this.currentFilters && (this.currentFilters.districts?.length > 0 || this.currentFilters.settlements?.length > 0)) {
          let settlementIds = []
          
          // Если выбраны конкретные населенные пункты, используем их
          if (this.currentFilters.settlements?.length > 0) {
            settlementIds = this.currentFilters.settlements
          } 
          // Иначе если выбраны районы, получаем все населенные пункты этих районов
          else if (this.currentFilters.districts?.length > 0) {
            const { data: settlements, error: settlementError } = await supabase
              .from('Settlement')
              .select('id')
              .in('id_district', this.currentFilters.districts)
            
            if (settlementError) throw settlementError
            settlementIds = settlements.map(s => s.id)
          }
          
          // Теперь получаем Report_record для этих населенных пунктов
          if (settlementIds.length > 0) {
            const { data: reportRecords, error: reportError } = await supabase
              .from('Report_record')
              .select('id')
              .in('id_settlment', settlementIds)
            
            if (reportError) throw reportError
            reportRecordIds = reportRecords.map(r => r.id)
          }
        }
        
        // Строим основной запрос
        let query = supabase
          .from('Estate')
          .select(`
            id,
            male,
            female,
            Report_record!Estate_id_report_record_fkey(
              id,
              code,
              Revision_report!Report_record_id_revision_report_fkey(
                year,
                number
              ),
              Settlement!Report_record_id_settlment_fkey(
                name_old,
                name_modern,
                District(name)
              )
            ),
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
        
        // Применяем фильтры на уровне SQL
        if (this.currentFilters) {
          // Фильтр по Report_record (район/населенный пункт)
          if (reportRecordIds && reportRecordIds.length > 0) {
            query = query.in('id_report_record', reportRecordIds)
          } else if (reportRecordIds && reportRecordIds.length === 0) {
            // Если фильтр применен но ничего не найдено, возвращаем пустой результат
            this.allEstateData = []
            this.estateData = []
            this.loading = false
            return
          }
          
          // Фильтр по типам сословий через подтипы
          if (this.currentFilters.typeEstates?.length > 0) {
            // Получаем все подтипы, относящиеся к выбранным типам
            const subtypeIds = this.allSubtypeEstates
              .filter(s => this.currentFilters.typeEstates.includes(s.id_type_estate))
              .map(s => s.id)
            if (subtypeIds.length > 0) {
              query = query.in('id_subtype_estate', subtypeIds)
            }
          }
          
          // Фильтр по подтипам сословия (массив)
          if (this.currentFilters.subtypeEstates?.length > 0) {
            query = query.in('id_subtype_estate', this.currentFilters.subtypeEstates)
          }
          
          // Фильтр по религиям через подтипы
          if (this.currentFilters.religions?.length > 0) {
            const subtypeIds = this.allSubtypeEstates
              .filter(s => this.currentFilters.religions.includes(s.id_type_religion))
              .map(s => s.id)
            if (subtypeIds.length > 0) {
              query = query.in('id_subtype_estate', subtypeIds)
            }
          }
          
          // Фильтр по принадлежностям через подтипы
          if (this.currentFilters.affiliations?.length > 0) {
            const subtypeIds = this.allSubtypeEstates
              .filter(s => this.currentFilters.affiliations.includes(s.id_type_affiliation))
              .map(s => s.id)
            if (subtypeIds.length > 0) {
              query = query.in('id_subtype_estate', subtypeIds)
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
        }
        
        query = query.order('id', { ascending: false })
        
        const { data, error } = await query
        if (error) throw error
        
        // Преобразуем данные в формат для таблицы
        const mappedData = data.map(item => ({
            id: item.id,
            revision_year: item.Report_record?.Revision_report?.year || null,
            revision_number: item.Report_record?.Revision_report?.number || null,
            settlement_name: item.Report_record?.Settlement?.name_modern || item.Report_record?.Settlement?.name_old || null,
            district_name: item.Report_record?.Settlement?.District?.name || null,
            subtype_estate_name: item.Subtype_estate?.name || null,
            type_estate_name: item.Subtype_estate?.Type_estate?.name || null,
            type_religion_name: item.Subtype_estate?.Type_religion?.name || null,
            type_affiliation_name: item.Subtype_estate?.Type_affiliation?.name || null,
            male: item.male,
            female: item.female,
            total: (item.male || 0) + (item.female || 0),
            volost_name: item.Volost?.name || null,
            landowner_description: item.Landowner?.description || item.Landowner?.person || null,
            military_unit_description: item.Military_unit?.description || item.Military_unit?.person || null
        }))
        
        // Сохраняем все данные
        this.allEstateData = mappedData
        // Применяем фильтры если они есть
        this.filterEstateData()
      } catch (error) {
        console.error('Error loading estate data:', error)
        ElMessage.error('Ошибка загрузки данных о сословиях: ' + error.message)
      } finally {
        this.loading = false
      }
    },

    async loadReportData() {
      this.loading = true

      try {
        console.log('Loading report data with filters:', this.currentFilters)
        
        // Загружаем allSubtypeEstates если еще не загружены
        if (!this.allSubtypeEstates || this.allSubtypeEstates.length === 0) {
          const { data: subtypes, error: subtypesError } = await supabase
            .from('Subtype_estate')
            .select('id, name, id_type_estate, id_type_religion, id_type_affiliation')
          
          if (subtypesError) throw subtypesError
          this.allSubtypeEstates = subtypes || []
          console.log('Loaded allSubtypeEstates:', this.allSubtypeEstates.length)
        }
        
        console.log('allSubtypeEstates:', this.allSubtypeEstates?.length)
        
        // Если есть фильтры по сословиям, сначала найдем подходящие Report_record через Estate
        let reportRecordIdsFromEstates = null
        
        if (this.currentFilters && (
          this.currentFilters.typeEstates?.length > 0 ||
          this.currentFilters.subtypeEstates?.length > 0 ||
          this.currentFilters.religions?.length > 0 ||
          this.currentFilters.affiliations?.length > 0 ||
          this.currentFilters.volosts?.length > 0 ||
          this.currentFilters.landowners?.length > 0 ||
          this.currentFilters.militaryUnits?.length > 0
        )) {
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
            console.log('Type estates filter - subtypeIds:', subtypeIds)
            if (subtypeIds.length > 0) {
              estateQuery = estateQuery.in('id_subtype_estate', subtypeIds)
              hasFilters = true
            }
          }
          
          if (this.currentFilters.subtypeEstates?.length > 0) {
            console.log('Subtype estates filter:', this.currentFilters.subtypeEstates)
            estateQuery = estateQuery.in('id_subtype_estate', this.currentFilters.subtypeEstates)
            hasFilters = true
          }
          
          if (this.currentFilters.religions?.length > 0 && this.allSubtypeEstates?.length > 0) {
            const subtypeIds = this.allSubtypeEstates
              .filter(s => this.currentFilters.religions.includes(s.id_type_religion))
              .map(s => s.id)
            console.log('Religions filter - subtypeIds:', subtypeIds)
            if (subtypeIds.length > 0) {
              estateQuery = estateQuery.in('id_subtype_estate', subtypeIds)
              hasFilters = true
            }
          }
          
          if (this.currentFilters.affiliations?.length > 0 && this.allSubtypeEstates?.length > 0) {
            const subtypeIds = this.allSubtypeEstates
              .filter(s => this.currentFilters.affiliations.includes(s.id_type_affiliation))
              .map(s => s.id)
            console.log('Affiliations filter - subtypeIds:', subtypeIds)
            if (subtypeIds.length > 0) {
              estateQuery = estateQuery.in('id_subtype_estate', subtypeIds)
              hasFilters = true
            }
          }
          
          if (this.currentFilters.volosts?.length > 0) {
            console.log('Volosts filter:', this.currentFilters.volosts)
            estateQuery = estateQuery.in('id_volost', this.currentFilters.volosts)
            hasFilters = true
          }
          
          if (this.currentFilters.landowners?.length > 0) {
            console.log('Landowners filter:', this.currentFilters.landowners)
            estateQuery = estateQuery.in('id_landowner', this.currentFilters.landowners)
            hasFilters = true
          }
          
          if (this.currentFilters.militaryUnits?.length > 0) {
            console.log('Military units filter:', this.currentFilters.militaryUnits)
            estateQuery = estateQuery.in('id_military_unit', this.currentFilters.militaryUnits)
            hasFilters = true
          }
          
          if (hasFilters) {
            const { data: estates, error: estatesError } = await estateQuery
            if (estatesError) throw estatesError
            
            console.log('Found estates:', estates?.length)
            
            // Получаем уникальные id_report_record
            reportRecordIdsFromEstates = [...new Set(estates.map(e => e.id_report_record))]
            console.log('Unique report record IDs:', reportRecordIdsFromEstates.length)
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
        
        // Строим основной запрос к Report_record
        let query = supabase
          .from('Report_record')
          .select(`
            id,
            code,
            population_all,
            Revision_report!Report_record_id_revision_report_fkey(
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
              estates_count: 0
            }))

            // Теперь для каждой записи считаем количество связанных Estate
            const countPromises = reportData.map(record =>
                supabase
                    .from('Estate')
                    .select('id', {count: 'exact', head: true})
                    .eq('id_report_record', record.id)
                    .then(({count, error}) => {
                      if (error) throw error
                      record.estates_count = count || 0
                      return record
                    })
            )

        const reportDataWithCounts = await Promise.all(countPromises)
        
        // Сохраняем все данные
        this.allReportData = reportDataWithCounts
        // Применяем фильтры если они есть
        this.filterReportData()
      } catch (error) {
        console.error('Error loading report data:', error)
        ElMessage.error('Ошибка загрузки данных о ревизиях: ' + error.message)
      } finally {
        this.loading = false
      }
    },

    viewDetails(row) {
      console.log('View details for:', row)
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
      this.detailsDrawerVisible = false
      this.selectedRecord = null
    },

    handleHeaderDragEnd(newWidth, oldWidth, column, event) {
      console.log('Column resized:', column.label, 'New width:', newWidth)
    },

    initColumnDragDrop() {
      // Небольшая задержка для полной отрисовки таблицы
      setTimeout(() => {
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
            console.log('Drag started', evt.oldIndex)
          },
          onEnd: (evt) => {
            const {oldIndex, newIndex} = evt
            if (oldIndex !== newIndex) {
              console.log(`Column moved from ${oldIndex} to ${newIndex}`)
              ElMessage.success(`Столбец перемещен с позиции ${oldIndex + 1} на позицию ${newIndex + 1}`)
            }
          }
        })

        console.log('Sortable initialized successfully')
      }, 300)
    },

    setFilterOptions(options) {
      console.log('Setting filter options:', options)
      this.allDistricts = options.districts || []
      this.allSettlements = options.settlements || []
      this.allTypeEstates = options.typeEstates || []
      this.allSubtypeEstates = options.subtypeEstates || []
      this.allReligions = options.religions || []
      this.allAffiliations = options.affiliations || []
      this.allVolosts = options.volosts || []
    },

    applyFilters(filters) {
      console.log('Applying filters:', filters)
      this.currentFilters = filters
      
      // Проверяем, есть ли хоть один активный фильтр
      const hasActiveFilters = 
        filters.districts?.length > 0 ||
        filters.settlements?.length > 0 ||
        filters.typeEstates?.length > 0 ||
        filters.subtypeEstates?.length > 0 ||
        filters.religions?.length > 0 ||
        filters.affiliations?.length > 0 ||
        filters.volosts?.length > 0 ||
        filters.landowners?.length > 0 ||
        filters.militaryUnits?.length > 0 ||
        filters.maleEnabled ||
        filters.femaleEnabled ||
        filters.populationEnabled ||
        filters.estatesCountEnabled
      
      if (hasActiveFilters) {
        // Загружаем данные только если есть активные фильтры
        this.loadData()
      } else {
        // Если фильтров нет, очищаем таблицу
        this.estateData = []
        this.reportData = []
        this.allEstateData = []
        this.allReportData = []
      }
    },

    filterEstateData() {
      if (!this.currentFilters) {
        this.estateData = [...this.allEstateData]
        return
      }
      
      let filtered = [...this.allEstateData]

      // Фильтр по району - фильтруем по ID из фильтра, сравнивая с названием района
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
            item.settlement_name === selectedSettlement.name_modern || 
            item.settlement_name === selectedSettlement.name_old
          )
        }
      }

      // Фильтр по типам сословия (массив)
      if (this.currentFilters.typeEstates?.length > 0) {
        const selectedTypeNames = this.currentFilters.typeEstates
          .map(id => this.allTypeEstates?.find(t => t.id === id)?.name)
          .filter(Boolean)
        if (selectedTypeNames.length > 0) {
          filtered = filtered.filter(item => selectedTypeNames.includes(item.type_estate_name))
        }
      }

      // Фильтр по подтипам сословия (массив) - уже применен на SQL уровне, но для полноты
      if (this.currentFilters.subtypeEstates?.length > 0) {
        const selectedSubtypeNames = this.currentFilters.subtypeEstates
          .map(id => this.allSubtypeEstates?.find(s => s.id === id)?.name)
          .filter(Boolean)
        if (selectedSubtypeNames.length > 0) {
          filtered = filtered.filter(item => selectedSubtypeNames.includes(item.subtype_estate_name))
        }
      }

      // Фильтр по религиям (массив)
      if (this.currentFilters.religions?.length > 0) {
        const selectedReligionNames = this.currentFilters.religions
          .map(id => this.allReligions?.find(r => r.id === id)?.name)
          .filter(Boolean)
        if (selectedReligionNames.length > 0) {
          filtered = filtered.filter(item => selectedReligionNames.includes(item.type_religion_name))
        }
      }

      // Фильтр по принадлежностям (массив)
      if (this.currentFilters.affiliations?.length > 0) {
        const selectedAffiliationNames = this.currentFilters.affiliations
          .map(id => this.allAffiliations?.find(a => a.id === id)?.name)
          .filter(Boolean)
        if (selectedAffiliationNames.length > 0) {
          filtered = filtered.filter(item => selectedAffiliationNames.includes(item.type_affiliation_name))
        }
      }

      // Фильтр по волостям (массив) - уже применен на SQL уровне, но для полноты
      if (this.currentFilters.volosts?.length > 0) {
        const selectedVolostNames = this.currentFilters.volosts
          .map(id => this.allVolosts?.find(v => v.id === id)?.name)
          .filter(Boolean)
        if (selectedVolostNames.length > 0) {
          filtered = filtered.filter(item => selectedVolostNames.includes(item.volost_name))
        }
      }

      // Фильтр по мужчинам (только если включен)
      if (this.currentFilters.maleEnabled) {
        if (this.currentFilters.maleMin !== null && this.currentFilters.maleMin !== undefined) {
          filtered = filtered.filter(item => (item.male || 0) >= this.currentFilters.maleMin)
        }
        if (this.currentFilters.maleMax !== null && this.currentFilters.maleMax !== undefined) {
          filtered = filtered.filter(item => (item.male || 0) <= this.currentFilters.maleMax)
        }
      }

      // Фильтр по женщинам (только если включен)
      if (this.currentFilters.femaleEnabled) {
        if (this.currentFilters.femaleMin !== null && this.currentFilters.femaleMin !== undefined) {
          filtered = filtered.filter(item => (item.female || 0) >= this.currentFilters.femaleMin)
        }
        if (this.currentFilters.femaleMax !== null && this.currentFilters.femaleMax !== undefined) {
          filtered = filtered.filter(item => (item.female || 0) <= this.currentFilters.femaleMax)
        }
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

      this.estateData = filtered
    },

    filterReportData() {
      if (!this.currentFilters) {
        this.reportData = [...this.allReportData]
        return
      }
      
      let filtered = [...this.allReportData]

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

      this.reportData = filtered
    }
  },
  watch: {
    dataMode(newMode) {
      this.$emit('data-mode-change', newMode)
      this.loadData()
      this.$nextTick(() => {
        this.initColumnDragDrop()
      })
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
      }, 100)
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
      }
      .map-section {
        flex: 1;
        min-width: 0;
        min-height: 0;
        height: auto;
      }
    }

    .list-section {
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow-x: auto;
      overflow-y: auto;
      
      // Кастомные стили для скроллбара
      &::-webkit-scrollbar {
        width: 16px;
        height: 16px;
      }
      
      &::-webkit-scrollbar-track {
        background: var(--bg-secondary);
        border-radius: 8px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: var(--border-color);
        border-radius: 8px;
        border: 2px solid var(--bg-secondary);
        
        &:hover {
          background: var(--text-muted);
        }
      }
      
      // Для Firefox
      scrollbar-width: auto;
      scrollbar-color: var(--border-color) var(--bg-secondary);
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
</style>
