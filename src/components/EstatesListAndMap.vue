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
          style="width: 100%"
          max-height="100%"
          border 
          stripe
          size="small"
          @header-dragend="handleHeaderDragEnd"
        >
          <el-table-column prop="id" label="ID" width="50" sortable />
          <el-table-column prop="revision_year" label="Год" width="60" sortable />
          <el-table-column prop="revision_number" label="Рев." width="50" sortable />
          <el-table-column prop="settlement_name" label="Населенный пункт" min-width="150" sortable />
          <el-table-column prop="district_name" label="Район" width="120" sortable />
          <el-table-column prop="subtype_estate_name" label="Подтип сословия" width="150" sortable />
          <el-table-column prop="type_estate_name" label="Сословие" width="120" sortable />
          <el-table-column prop="type_religion_name" label="Религия" width="100" sortable />
          <el-table-column prop="type_affiliation_name" label="Принадлежность" width="120" sortable />
          <el-table-column prop="male" label="М" width="50" align="right" sortable />
          <el-table-column prop="female" label="Ж" width="50" align="right" sortable />
          <el-table-column prop="total" label="Всего" width="60" align="right" sortable />
          <el-table-column prop="volost_name" label="Волость" width="120" sortable />
          <el-table-column prop="landowner_description" label="Землевладелец" width="150" sortable />
          <el-table-column prop="military_unit_description" label="Воинская часть" width="150" sortable />
          <el-table-column label="Действия" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewDetails(row)">
                Детали
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Режим Report_record -->
        <el-table 
          v-else
          :data="reportData" 
          v-loading="loading"
          style="width: 100%"
          max-height="100%"
          border 
          stripe
          size="small"
          @header-dragend="handleHeaderDragEnd"
        >
          <el-table-column prop="id" label="ID" width="50" sortable />
          <el-table-column prop="code" label="Код" width="80" sortable />
          <el-table-column prop="revision_year" label="Год" width="60" sortable />
          <el-table-column prop="revision_number" label="Рев." width="50" sortable />
          <el-table-column prop="settlement_name_old" label="Нас. пункт (старое)" min-width="150" sortable />
          <el-table-column prop="settlement_name_modern" label="Нас. пункт (совр.)" width="150" sortable />
          <el-table-column prop="district_name" label="Район" width="120" sortable />
          <el-table-column prop="lat" label="Широта" width="90" sortable />
          <el-table-column prop="lon" label="Долгота" width="90" sortable />
          <el-table-column prop="population_all" label="Население" width="90" align="right" sortable />
          <el-table-column prop="estates_count" label="Сословий" width="80" align="right" sortable />
          <el-table-column label="Действия" width="100" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="viewDetails(row)">
                Детали
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="viewMode === 'map' || viewMode === 'split'" class="map-section">
        <div class="map-placeholder">
          <el-icon :size="48" color="var(--text-muted)">
            <Location />
          </el-icon>
          <p>OpenStreetMap будет здесь</p>
          <el-button type="primary" size="small">Загрузить карту</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Location } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { supabase } from '@/services/supabase'
import Sortable from 'sortablejs'

export default {
  name: 'EstatesListAndMap',
  components: {
    Location
  },
  data() {
    return {
      dataMode: 'estate',
      viewMode: 'list',
      estateData: [],
      reportData: [],
      loading: false,
      sortableInstance: null
    }
  },
  computed: {
    totalRecords() {
      return this.dataMode === 'estate' ? this.estateData.length : this.reportData.length
    }
  },
  mounted() {
    this.loadData()
    this.$nextTick(() => {
      this.initColumnDragDrop()
    })
  },
  beforeUnmount() {
    if (this.sortableInstance) {
      this.sortableInstance.destroy()
    }
  },
  watch: {
    dataMode() {
      this.loadData()
    }
  },
  methods: {
    loadData() {
      if (this.dataMode === 'estate') {
        this.loadEstateData()
      } else {
        this.loadReportData()
      }
    },

    loadEstateData() {
      this.loading = true
      supabase
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
            Settlement!Report_record_id_report_record_fkey(
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
        .order('id', { ascending: false })
        .then(({ data, error }) => {
          if (error) throw error
          
          // Преобразуем данные в формат для таблицы
          this.estateData = data.map(item => ({
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
        })
        .catch(error => {
          console.error('Error loading estate data:', error)
          ElMessage.error('Ошибка загрузки данных о сословиях: ' + error.message)
        })
        .finally(() => {
          this.loading = false
        })
    },

    loadReportData() {
      this.loading = true
      supabase
        .from('Report_record')
        .select(`
          id,
          code,
          population_all,
          Revision_report!Report_record_id_revision_report_fkey(
            year,
            number
          ),
          Settlement!Report_record_id_report_record_fkey(
            name_old,
            name_modern,
            lat,
            lon,
            District(name)
          )
        `)
        .order('id', { ascending: false })
        .then(({ data, error }) => {
          if (error) throw error
          
          // Преобразуем данные в формат для таблицы
          this.reportData = data.map(item => ({
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
            estates_count: null // Это нужно будет посчитать отдельным запросом или агрегацией
          }))
        })
        .catch(error => {
          console.error('Error loading report data:', error)
          ElMessage.error('Ошибка загрузки данных о ревизиях: ' + error.message)
        })
        .finally(() => {
          this.loading = false
        })
    },

    viewDetails(row) {
      console.log('View details for:', row)
      ElMessage.info(`Просмотр деталей для записи ID: ${row.id}`)
    },

    handleHeaderDragEnd(newWidth, oldWidth, column, event) {
      console.log('Column resized:', column.label, 'New width:', newWidth)
    },

    initColumnDragDrop() {
      // Небольшая задержка для полной отрисовки таблицы
      setTimeout(() => {
        const table = document.querySelector('.list-section .el-table__header-wrapper tr')
        
        if (!table) {
          console.warn('Table header not found')
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
            const { oldIndex, newIndex } = evt
            if (oldIndex !== newIndex) {
              console.log(`Column moved from ${oldIndex} to ${newIndex}`)
              ElMessage.success(`Столбец перемещен с позиции ${oldIndex + 1} на позицию ${newIndex + 1}`)
            }
          }
        })
        
        console.log('Sortable initialized successfully')
      }, 300)
    }
  },
  watch: {
    dataMode() {
      this.loadData()
      this.$nextTick(() => {
        this.initColumnDragDrop()
      })
    },
    viewMode() {
      this.$nextTick(() => {
        this.initColumnDragDrop()
      })
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
      }
      .map-section {
        flex: 1;
        min-width: 0;
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
</style>
