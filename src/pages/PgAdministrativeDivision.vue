<template>
  <div class="pg-administrative-division">
    <h3>Административное деление</h3>

    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="Районы" name="districts">
        <div class="table-info">
          <el-alert
              type="info"
              :closable="false"
              show-icon
          >
            <template #title>
              Всего районов: {{ filteredDistricts.length }}
            </template>
          </el-alert>
        </div>

        <div class="table-header">
          <el-button type="success" size="small" @click="addDistrict">Добавить район</el-button>
          <el-input
            v-model="districtFilter"
            placeholder="Поиск по названию района..."
            size="small"
            style="max-width: 300px; margin-left: 10px;"
            clearable
          />
        </div>

        <el-table :data="filteredDistricts" style="width: auto; min-width: 600px;" default-sort="{prop: 'name', order: 'ascending'}">
          <el-table-column prop="id" label="ID" width="60" sortable :resizable="true" />

          <el-table-column prop="name" label="Название района" sortable :resizable="true" min-width="150">
            <template #default="{ row }">
              <div v-if="editDistrictId === row.id">
                <el-input v-model="editDistrict.name" />
              </div>
              <div v-else>
                {{ row.name }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="settlement_count" label="Количество населённых пунктов" sortable :resizable="true" min-width="180">
            <template #default="{ row }">
              {{ getSettlementsCount(row.id) }}
            </template>
          </el-table-column>

          <el-table-column label="Действия" width="420" fixed="right">
            <template #default="{ row }">
              <div v-if="editDistrictId === row.id">
                <el-button type="success" size="small" @click="updateDistrict(row.id)">Сохранить</el-button>
                <el-button type="warning" size="small" @click="cancelDistrictEdit">Отменить</el-button>
              </div>
              <div v-else>
                <el-button type="info" size="small" @click="showSettlementsForDistrict(row)">Показать населённые пункты</el-button>
                <el-button type="primary" size="small" @click="startDistrictEdit(row)">Редактировать</el-button>
                <el-button type="danger" size="small" @click="deleteDistrict(row.id)">Удалить</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Населённые пункты" name="settlements">
        <div class="table-info">
          <el-alert
              type="info"
              :closable="false"
              show-icon
          >
            <template #title>
              Всего населённых пунктов: {{ filteredSettlements.length }}
            </template>
          </el-alert>
        </div>

        <div class="table-header">
          <el-button type="success" size="small" @click="addSettlement">Добавить населённый пункт</el-button>
          <el-select
            v-model="selectedDistrictFilter"
            placeholder="Выберите район для фильтрации"
            clearable
            size="small"
            style="max-width: 250px; margin-left: 10px;"
            @change="filterByDistrict">
            <el-option
              v-for="district in districts"
              :key="district.id"
              :label="district.name"
              :value="district.id"
            />
          </el-select>
          <el-input
            v-model="settlementFilter"
            placeholder="Поиск по названию..."
            size="small"
            style="max-width: 250px; margin-left: 10px;"
            clearable
          />
          <el-button
            v-if="showOnlySelectedDistrict"
            type="warning"
            size="small"
            @click="showAllSettlements"
            style="margin-left: 10px;">
            Показать населённые пункты всех районов
          </el-button>
        </div>

        <el-table :data="filteredSettlements" style="width: auto; min-width: 1200px;" default-sort="{prop: 'name_old', order: 'ascending'}">
          <el-table-column prop="id" label="ID" width="60" sortable resizable />

          <el-table-column prop="name_modern" label="Современное название" sortable :resizable="true" min-width="180">
            <template #default="{ row }">
              <div v-if="editSettlementId === row.id">
                <el-input v-model="editSettlement.name_modern" />
              </div>
              <div v-else>
                {{ row.name_modern }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="name_old" label="Старое название" sortable :resizable="true" min-width="180">
            <template #default="{ row }">
              <div v-if="editSettlementId === row.id">
                <el-input v-model="editSettlement.name_old" />
              </div>
              <div v-else>
                {{ row.name_old }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="name_old_alt" label="Альтернативное название" sortable :resizable="true" min-width="180">
            <template #default="{ row }">
              <div v-if="editSettlementId === row.id">
                <el-input v-model="editSettlement.name_old_alt" />
              </div>
              <div v-else>
                {{ row.name_old_alt }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="id_district" label="Район" sortable resizable min-width="140">
            <template #default="{ row }">
              <div v-if="editSettlementId === row.id">
                <el-select v-model="editSettlement.id_district" placeholder="Выберите район" filterable>
                  <el-option
                    v-for="district in districts"
                    :key="district.id"
                    :label="district.name"
                    :value="district.id"
                  />
                </el-select>
              </div>
              <div v-else>
                {{ getDistrictName(row.id_district) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="lat" label="Широта" sortable resizable width="100">
            <template #default="{ row }">
              <div v-if="editSettlementId === row.id">
                <div class="coordinate-input">
                  <el-input
                    v-model="editSettlement.lat"
                    @input="validateLat"
                    @blur="validateLatOnBlur"
                    placeholder="Широта (-90 до 90)"
                    step="0.000001"
                  />
                  <el-button
                    type="warning"
                    size="mini"
                    @click="setLatNull"
                    style="margin-left: 4px; font-size: 11px;">
                    NULL
                  </el-button>
                </div>
                <div v-if="latError" class="coordinate-error">{{ latError }}</div>
              </div>
              <div v-else>
                {{ row.lat }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="lon" label="Долгота" sortable resizable width="100">
            <template #default="{ row }">
              <div v-if="editSettlementId === row.id">
                <div class="coordinate-input">
                  <el-input
                    v-model="editSettlement.lon"
                    @input="validateLon"
                    @blur="validateLonOnBlur"
                    placeholder="Долгота (-180 до 180)"
                    step="0.000001"
                  />
                  <el-button
                    type="warning"
                    size="mini"
                    @click="setLonNull"
                    style="margin-left: 4px; font-size: 11px;">
                    NULL
                  </el-button>
                </div>
                <div v-if="lonError" class="coordinate-error">{{ lonError }}</div>
              </div>
              <div v-else>
                {{ row.lon }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Действия" width="200" fixed="right">
            <template #default="{ row }">
              <div v-if="editSettlementId === row.id">
                <el-button type="success" size="small" @click="updateSettlement(row.id)">Сохранить</el-button>
                <el-button type="warning" size="small" @click="cancelSettlementEdit">Отменить</el-button>
              </div>
              <div v-else>
                <el-button type="primary" size="small" @click="startSettlementEdit(row)">Редактировать</el-button>
                <el-button type="danger" size="small" @click="deleteSettlement(row.id)">Удалить</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { supabase } from "@/services/supabase"

export default {
  name: "PgAdministrativeDivision",
  data() {
    return {
      activeTab: 'districts',
      districts: [],
      settlements: [],
      editDistrictId: null,
      editDistrict: {},
      editSettlementId: null,
      editSettlement: {},
      districtFilter: '',
      settlementFilter: '',
      showOnlySelectedDistrict: null, // for showing settlements of a specific district
      selectedDistrictFilter: null, // for dropdown filter on settlements tab
      latError: null, // validation error for latitude
      lonError: null // validation error for longitude
     }
  },
  computed: {
    filteredDistricts() {
      if (!this.districtFilter) {
        return this.districts
      }
      const filter = this.districtFilter.toLowerCase()
      return this.districts.filter(district =>
        district.name.toLowerCase().includes(filter)
      )
    },
    filteredSettlements() {
      let result = this.settlements

      // First apply district filters (prioritize showOnlySelectedDistrict over selectedDistrictFilter)
      if (this.showOnlySelectedDistrict) {
        result = result.filter(settlement => settlement.id_district === this.showOnlySelectedDistrict)
      } else if (this.selectedDistrictFilter) {
        result = result.filter(settlement => settlement.id_district === this.selectedDistrictFilter)
      }

      // Then apply search filter
      if (this.settlementFilter) {
        const filter = this.settlementFilter.toLowerCase()
        result = result.filter(settlement =>
          (settlement.name_old && settlement.name_old.toLowerCase().includes(filter)) ||
          (settlement.name_modern && settlement.name_modern.toLowerCase().includes(filter)) ||
          (settlement.name_old_alt && settlement.name_old_alt.toLowerCase().includes(filter))
        )
      }

      return result
    }
  },
  methods: {
    async fetchDistricts() {
      const { data, error } = await supabase
        .from('District')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching districts:', error)
        return
      }

      this.districts = data || []
    },

    async fetchSettlements() {
      const { data, error } = await supabase
        .from('Settlement')
        .select('*')
        .order('name_old', { ascending: true })

      if (error) {
        console.error('Error fetching settlements:', error)
        return
      }

      this.settlements = data || []
    },

    getSettlementsCount(districtId) {
      return this.settlements.filter(s => s.id_district === districtId).length
    },

    getDistrictName(districtId) {
      if (!districtId) return 'Не указан'
      const district = this.districts.find(d => d.id === districtId)
      return district ? district.name : `ID: ${districtId}`
    },

    // District methods
    startDistrictEdit(row) {
      this.editDistrictId = row.id
      this.editDistrict = { ...row }
    },

    cancelDistrictEdit() {
      this.editDistrictId = null
      this.editDistrict = {}
      this.fetchDistricts()
    },

    async updateDistrict(id) {
      const { error } = await supabase
        .from('District')
        .update({ name: this.editDistrict.name })
        .eq('id', id)

      if (!error) {
        this.cancelDistrictEdit()
      } else {
        console.error('Error updating district:', error)
      }
    },

    async deleteDistrict(id) {
      if (!confirm('Удалить этот район? Все связанные населённые пункты будут затронуты.')) return

      const { error } = await supabase
        .from('District')
        .delete()
        .eq('id', id)

      if (!error) {
        this.fetchDistricts()
        this.fetchSettlements()
      } else {
        console.error('Error deleting district:', error)
      }
    },

    async addDistrict() {
      const { data, error } = await supabase
        .from('District')
        .insert([{ name: 'Новый район' }])
        .select()

      if (!error && data?.length) {
        this.districts.push(data[0])
        this.startDistrictEdit(data[0])
      } else {
        console.error('Error adding district:', error)
      }
    },

    // Settlement methods
    startSettlementEdit(row) {
      this.editSettlementId = row.id
      this.editSettlement = { ...row }
    },

    cancelSettlementEdit() {
      this.editSettlementId = null
      this.editSettlement = {}
      this.fetchSettlements()
    },

    async updateSettlement(id) {
      const { error } = await supabase
        .from('Settlement')
        .update({
          name_old: this.editSettlement.name_old,
          name_modern: this.editSettlement.name_modern,
          name_old_alt: this.editSettlement.name_old_alt,
          id_district: this.editSettlement.id_district,
          lat: this.editSettlement.lat,
          lon: this.editSettlement.lon
        })
        .eq('id', id)

      if (!error) {
        this.cancelSettlementEdit()
      } else {
        console.error('Error updating settlement:', error)
      }
    },

    async deleteSettlement(id) {
      const { error } = await supabase
        .from('Settlement')
        .delete()
        .eq('id', id)

      if (!error) {
        this.fetchSettlements()
      } else {
        console.error('Error deleting settlement:', error)
      }
    },

    async addSettlement() {
      const { data, error } = await supabase
        .from('Settlement')
        .insert([{
          name_old: 'Новый населённый пункт',
          id_district: this.districts.length > 0 ? this.districts[0].id : null
        }])
        .select()

      if (!error && data?.length) {
        this.settlements.push(data[0])
        this.startSettlementEdit(data[0])
      } else {
        console.error('Error adding settlement:', error)
      }
    },

    showSettlementsForDistrict(row) {
      // Switch to settlements tab and filter by district
      this.activeTab = 'settlements'
      this.showOnlySelectedDistrict = row.id
      this.settlementFilter = '' // Clear search filter when showing district-specific settlements
    },

    clearSettlementFilters() {
      this.showOnlySelectedDistrict = null
      this.settlementFilter = ''
    },

    filterByDistrict(districtId) {
      // When user selects from dropdown, reset showOnlySelectedDistrict
      this.showOnlySelectedDistrict = null
      this.selectedDistrictFilter = districtId
    },

    showAllSettlements() {
      // Show all settlements by clearing district filters
      this.showOnlySelectedDistrict = null
      this.selectedDistrictFilter = null
      this.settlementFilter = ''
    },

    // Coordinate validation methods
    validateLat(value) {
      // Clear error while typing
      this.latError = null
    },

    validateLon(value) {
      // Clear error while typing
      this.lonError = null
    },

    validateLatOnBlur() {
      const value = this.editSettlement.lat
      if (!value || value === '') {
        return // Empty is allowed
      }

      const num = parseFloat(value)
      if (isNaN(num)) {
        this.latError = 'Широта должна быть числом'
        return
      }

      if (num < -90 || num > 90) {
        this.latError = 'Широта должна быть в диапазоне от -90 до 90 градусов'
        return
      }

      this.latError = null
    },

    validateLonOnBlur() {
      const value = this.editSettlement.lon
      if (!value || value === '') {
        return // Empty is allowed
      }

      const num = parseFloat(value)
      if (isNaN(num)) {
        this.lonError = 'Долгота должна быть числом'
        return
      }

      if (num < -180 || num > 180) {
        this.lonError = 'Долгота должна быть в диапазоне от -180 до 180 градусов'
        return
      }

      this.lonError = null
    },

    setLatNull() {
      this.editSettlement.lat = null
      this.latError = null
    },

    setLonNull() {
      this.editSettlement.lon = null
      this.lonError = null
    }
  },
  mounted() {
    this.fetchDistricts()
    this.fetchSettlements()
  }
}
</script>

<style scoped lang="scss">
.pg-administrative-division {
  padding: 1rem;

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 1.5rem 0;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-hover));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .table-info {
    margin-bottom: 1rem;
  }

  .table-header {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    gap: 10px;
  }

  .coordinate-input {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .coordinate-error {
    color: #f56c6c;
    font-size: 12px;
    margin-top: 2px;
    line-height: 1.2;
  }
}
</style>
