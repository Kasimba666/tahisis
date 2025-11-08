<template>
  <el-drawer
    v-model="visible"
    :title="drawerTitle"
    direction="rtl"
    size="50%"
  >
    <div v-if="loading" class="loading">
      <el-icon class="is-loading"><loading /></el-icon>
      <span>Загрузка данных...</span>
    </div>

    <div v-else-if="subtypeData" class="subtype-details">
      <!-- Основная информация -->
      <el-descriptions :column="1" border>
        <el-descriptions-item label="Тип сословия">
          <div class="type-cell">
            <div class="type-badge" :style="{ backgroundColor: subtypeData.typeColor }"></div>
            <span>{{ subtypeData.typeName }}</span>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="Подтип">
          <strong>{{ subtypeData.subtypeName }}</strong>
        </el-descriptions-item>
        <el-descriptions-item label="Религия">
          {{ subtypeData.religion }}
        </el-descriptions-item>
        <el-descriptions-item label="Принадлежность">
          {{ subtypeData.affiliation }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- Карта -->
      <div v-if="showMap" class="map-section">
        <h4>Карта населённых пунктов</h4>
        <div class="map-wrapper">
          <MapView :geo-json-data="settlementsGeoJson" />
        </div>
      </div>

      <!-- Список населённых пунктов -->
      <div class="estates-section">
        <h4>Список населённых пунктов</h4>
        <el-table
          :data="paginatedEstates"
          style="width: 100%"
          size="small"
          stripe
        >
          <el-table-column label="Населённый пункт" min-width="150">
            <template #default="{ row }">
              {{ row.settlementName || '—' }}
            </template>
          </el-table-column>
          <el-table-column label="Волость" min-width="120">
            <template #default="{ row }">
              {{ row.volostName || '—' }}
            </template>
          </el-table-column>
          <el-table-column label="Помещик" min-width="150">
            <template #default="{ row }">
              {{ row.landownerName || '—' }}
            </template>
          </el-table-column>
          <el-table-column label="Военная организация" min-width="150">
            <template #default="{ row }">
              {{ row.militaryUnitName || '—' }}
            </template>
          </el-table-column>
          <el-table-column label="Мужчин" width="80" align="right">
            <template #default="{ row }">
              {{ row.male || 0 }}
            </template>
          </el-table-column>
          <el-table-column label="Женщин" width="80" align="right">
            <template #default="{ row }">
              {{ row.female || 0 }}
            </template>
          </el-table-column>
          <el-table-column label="Всего" width="80" align="right">
            <template #default="{ row }">
              <strong>{{ (row.male || 0) + (row.female || 0) }}</strong>
            </template>
          </el-table-column>
          <el-table-column label="" width="100" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="showEstateDetails(row)">
                Детали
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Пагинация -->
        <el-pagination
          v-if="estates.length > pageSize"
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="estates.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          style="margin-top: 16px; justify-content: center;"
        />
      </div>

      <!-- Кнопки действий -->
      <div class="actions">
        <el-button type="primary" @click="toggleMap">
          {{ showMap ? 'Скрыть карту' : 'Показать карту' }}
        </el-button>
        <el-button @click="goToEstatesList">
          Перейти к полному списку ревизий
        </el-button>
      </div>
    </div>

    <!-- Детали отдельной записи -->
    <EstateRecordDetails
      v-model="showingEstateDetails"
      :estate-id="selectedEstateId"
    />
  </el-drawer>
</template>

<script>
import { supabase } from '@/services/supabase.js'
import MapView from '@/components/MapView.vue'
import EstateRecordDetails from '@/components/EstateRecordDetails.vue'

export default {
  name: 'SubtypeEstateDetails',
  components: {
    MapView,
    EstateRecordDetails
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    subtypeId: {
      type: Number,
      default: null
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      loading: false,
      subtypeData: null,
      estates: [],
      currentPage: 1,
      pageSize: 20,
      showMap: false,
      settlements: [],
      showingEstateDetails: false,
      selectedEstateId: null
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
    drawerTitle() {
      return this.subtypeData 
        ? `${this.subtypeData.typeName} → ${this.subtypeData.subtypeName}`
        : 'Детали подтипа'
    },
    paginatedEstates() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.estates.slice(start, end)
    },
    settlementsGeoJson() {
      // Формируем GeoJSON из уникальных населённых пунктов
      const features = []
      const uniqueSettlements = new Map()
      
      this.settlements.forEach(settlement => {
        if (!uniqueSettlements.has(settlement.id)) {
          // Собираем все estate для этого settlement
          const settleEstates = this.estates.filter(e => e.settlementId === settlement.id)
          
          // Считаем общую численность
          const maleCount = settleEstates.reduce((sum, e) => sum + (e.male || 0), 0)
          const femaleCount = settleEstates.reduce((sum, e) => sum + (e.female || 0), 0)
          
          // Создаем GeoJSON Feature
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [parseFloat(settlement.lon), parseFloat(settlement.lat)]
            },
            properties: {
              id: settlement.id,
              name: settlement.name_old,
              name_old: settlement.name_old,
              estateTypes: [{
                id: this.subtypeData.typeId,
                name: this.subtypeData.typeName,
                color: this.subtypeData.typeColor,
                population: maleCount + femaleCount
              }],
              maleCount,
              femaleCount,
              totalCount: maleCount + femaleCount
            }
          })
          
          uniqueSettlements.set(settlement.id, true)
        }
      })
      
      return {
        type: 'FeatureCollection',
        features
      }
    }
  },
  watch: {
    subtypeId: {
      handler(newId) {
        if (newId && this.visible) {
          this.loadData()
        }
      },
      immediate: true
    },
    visible(newVal) {
      if (newVal && this.subtypeId) {
        this.loadData()
      }
    }
  },
  methods: {
    async loadData() {
      if (!this.subtypeId) return

      this.loading = true

      try {
        // Загружаем подтип
        const { data: subtype, error: subtypeError } = await supabase
          .from('Subtype_estate')
          .select('*')
          .eq('id', this.subtypeId)
          .single()

        if (subtypeError) throw subtypeError

        // Загружаем тип сословия
        const { data: type, error: typeError } = await supabase
          .from('Type_estate')
          .select('*')
          .eq('id', subtype.id_type_estate)
          .single()

        if (typeError) throw typeError

        // Загружаем религию
        const { data: religion, error: religionError } = await supabase
          .from('Type_religion')
          .select('*')
          .eq('id', subtype.id_type_religion)
          .single()

        if (religionError) throw religionError

        // Загружаем принадлежность
        const { data: affiliation, error: affiliationError } = await supabase
          .from('Type_affiliation')
          .select('*')
          .eq('id', subtype.id_type_affiliation)
          .single()

        if (affiliationError) throw affiliationError

        // Загружаем хозяйства
        const { data: estates, error: estatesError } = await supabase
          .from('Estate')
          .select(`
            id,
            male,
            female,
            id_volost,
            id_landowner,
            id_military_unit,
            id_report_record
          `)
          .eq('id_subtype_estate', this.subtypeId)

        if (estatesError) throw estatesError

        // Загружаем населённые пункты через Report_record
        const reportRecordIds = [...new Set(estates.map(e => e.id_report_record).filter(Boolean))]
        const { data: reportRecords, error: reportError } = await supabase
          .from('Report_record')
          .select('id, id_settlment')
          .in('id', reportRecordIds)

        if (reportError) throw reportError

        const settlementIds = [...new Set(reportRecords.map(r => r.id_settlment).filter(Boolean))]
        const { data: settlements, error: settlementError } = await supabase
          .from('Settlement')
          .select('id, name_old, lat, lon')
          .in('id', settlementIds)

        if (settlementError) throw settlementError
        
        this.settlements = settlements || []

        // Загружаем волости
        const volostIds = [...new Set(estates.map(e => e.id_volost).filter(Boolean))]
        const { data: volosts, error: volostError } = await supabase
          .from('Volost')
          .select('id, name')
          .in('id', volostIds)

        if (volostError) throw volostError

        // Загружаем помещиков
        const landownerIds = [...new Set(estates.map(e => e.id_landowner).filter(Boolean))]
        let landowners = []
        if (landownerIds.length > 0) {
          const { data: landownersData, error: landownersError } = await supabase
            .from('Landowner')
            .select('id, description, person')
            .in('id', landownerIds)

          if (landownersError) throw landownersError
          landowners = landownersData || []
        }

        // Загружаем военные организации
        const militaryUnitIds = [...new Set(estates.map(e => e.id_military_unit).filter(Boolean))]
        let militaryUnits = []
        if (militaryUnitIds.length > 0) {
          const { data: militaryUnitsData, error: militaryUnitsError } = await supabase
            .from('Military_unit')
            .select('id, description, person')
            .in('id', militaryUnitIds)

          if (militaryUnitsError) throw militaryUnitsError
          militaryUnits = militaryUnitsData || []
        }

        // Формируем данные подтипа
        const maleCount = estates.reduce((sum, e) => sum + (e.male || 0), 0)
        const femaleCount = estates.reduce((sum, e) => sum + (e.female || 0), 0)

        this.subtypeData = {
          subtypeId: subtype.id,
          subtypeName: subtype.name,
          typeId: type.id,
          typeName: type.name,
          typeColor: type.color || 'hsl(0, 0%, 50%)',
          religion: religion.name,
          affiliation: affiliation.name,
          estateCount: estates.length,
          maleCount,
          femaleCount,
          totalCount: maleCount + femaleCount
        }

        // Формируем список хозяйств с дополнительными данными
        this.estates = estates.map(estate => {
          const reportRecord = reportRecords.find(r => r.id === estate.id_report_record)
          const settlement = settlements.find(s => s.id === reportRecord?.id_settlment)
          const volost = volosts.find(v => v.id === estate.id_volost)
          const landowner = landowners.find(l => l.id === estate.id_landowner)
          const militaryUnit = militaryUnits.find(m => m.id === estate.id_military_unit)

          return {
            ...estate,
            settlementName: settlement?.name_old,
            settlementId: settlement?.id,
            volostName: volost?.name,
            landownerName: landowner ? (landowner.description || landowner.person) : null,
            militaryUnitName: militaryUnit ? (militaryUnit.description || militaryUnit.person) : null
          }
        })

      } catch (error) {
        console.error('Error loading subtype details:', error)
        this.$message.error('Ошибка загрузки данных')
      } finally {
        this.loading = false
      }
    },

    toggleMap() {
      this.showMap = !this.showMap
    },

    goToEstatesList() {
      this.$router.push({
        name: 'EstatesList',
        query: {
          filters: JSON.stringify({
            subtypeEstate: [this.subtypeId]
          })
        }
      })
      this.visible = false
    },

    showEstateDetails(estate) {
      this.selectedEstateId = estate.id
      this.showingEstateDetails = true
    }
  }
}
</script>

<style scoped lang="scss">
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 12px;
}

.subtype-details {
  padding: 16px;

  .type-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .type-badge {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }
  }

  .map-section {
    margin-top: 24px;

    h4 {
      margin: 0 0 16px 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .map-wrapper {
      height: 500px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
    }
  }

  .estates-section {
    margin-top: 24px;

    h4 {
      margin: 0 0 16px 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .actions {
    margin-top: 24px;
    display: flex;
    gap: 12px;
    justify-content: center;
  }
}
</style>
