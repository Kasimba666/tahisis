<template>
  <div class="estates-filters">
    <div class="filters-row">
      <!-- Dropdown фильтры -->
      <el-dropdown trigger="click" :hide-on-click="false" class="filter-dropdown">
        <el-button size="large">
          Район ({{ filters.districts.length }}) <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="filter-dropdown-menu">
            <div class="filter-search">
              <el-input v-model="searchDistrict" placeholder="Поиск..." size="small" clearable />
            </div>
            <div class="filter-options">
              <el-checkbox-group v-model="filters.districts" @change="onDistrictsChange">
                <el-checkbox 
                  v-for="district in filteredDistrictsSearch" 
                  :key="district.id" 
                  :label="district.id"
                >
                  {{ district.name }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="filter-actions-dropdown">
              <el-button link size="small" @click="selectAllDistricts">Выбрать все</el-button>
              <el-button link size="small" type="danger" @click="filters.districts = []">Сбросить</el-button>
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click" :hide-on-click="false" class="filter-dropdown" :disabled="filters.districts.length === 0">
        <el-button size="large" :disabled="filters.districts.length === 0">
          Нас. пункт (старый) ({{ filters.settlementNamesOld.length }}) <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="filter-dropdown-menu">
            <div class="filter-search">
              <el-input v-model="searchSettlementOld" placeholder="Поиск..." size="small" clearable />
            </div>
            <div class="filter-options">
              <el-checkbox-group v-model="filters.settlementNamesOld" @change="onSettlementNamesOldChange">
                <el-checkbox
                  v-for="settlementName in filteredSettlementNamesOldSearch"
                  :key="settlementName"
                  :label="settlementName"
                >
                  {{ settlementName }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="filter-actions-dropdown">
              <el-button link size="small" @click="selectAllSettlementNamesOld">Выбрать все</el-button>
              <el-button link size="small" type="danger" @click="filters.settlementNamesOld = []">Сбросить</el-button>
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click" :hide-on-click="false" class="filter-dropdown" :disabled="filters.districts.length === 0">
        <el-button size="large" :disabled="filters.districts.length === 0">
          Нас. пункт (совр) ({{ filters.settlementNamesModern.length }}) <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="filter-dropdown-menu">
            <div class="filter-search">
              <el-input v-model="searchSettlementModern" placeholder="Поиск..." size="small" clearable />
            </div>
            <div class="filter-options">
              <el-checkbox-group v-model="filters.settlementNamesModern" @change="onSettlementNamesModernChange">
                <el-checkbox
                  v-for="settlementName in filteredSettlementNamesModernSearch"
                  :key="settlementName"
                  :label="settlementName"
                >
                  {{ settlementName }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="filter-actions-dropdown">
              <el-button link size="small" @click="selectAllSettlementNamesModern">Выбрать все</el-button>
              <el-button link size="small" type="danger" @click="filters.settlementNamesModern = []">Сбросить</el-button>
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click" :hide-on-click="false" class="filter-dropdown">
        <el-button size="large">
          Сословие ({{ filters.typeEstates.length }}) <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="filter-dropdown-menu">
            <div class="filter-options">
              <el-checkbox-group v-model="filters.typeEstates" @change="onTypeEstatesChange">
                <el-checkbox 
                  v-for="type in filteredTypeEstates" 
                  :key="type.id" 
                  :label="type.id"
                >
                  {{ type.name }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="filter-actions-dropdown">
              <el-button link size="small" @click="selectAllTypeEstates">Выбрать все</el-button>
              <el-button link size="small" type="danger" @click="filters.typeEstates = []">Сбросить</el-button>
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click" :hide-on-click="false" class="filter-dropdown" :disabled="filters.typeEstates.length === 0">
        <el-button size="large" :disabled="filters.typeEstates.length === 0">
          Подтип сословия ({{ filters.subtypeEstates.length }}) <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="filter-dropdown-menu">
            <div class="filter-options">
              <el-checkbox-group v-model="filters.subtypeEstates">
                <el-checkbox 
                  v-for="subtype in filteredSubtypeEstates" 
                  :key="subtype.id" 
                  :label="subtype.id"
                >
                  {{ subtype.name }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="filter-actions-dropdown">
              <el-button link size="small" @click="selectAllSubtypeEstates">Выбрать все</el-button>
              <el-button link size="small" type="danger" @click="filters.subtypeEstates = []">Сбросить</el-button>
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click" :hide-on-click="false" class="filter-dropdown">
        <el-button size="large">
          Религия ({{ filters.religions.length }}) <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="filter-dropdown-menu">
            <div class="filter-options">
              <el-checkbox-group v-model="filters.religions">
                <el-checkbox 
                  v-for="religion in filteredReligions" 
                  :key="religion.id" 
                  :label="religion.id"
                >
                  {{ religion.name }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="filter-actions-dropdown">
              <el-button link size="small" @click="selectAllReligions">Выбрать все</el-button>
              <el-button link size="small" type="danger" @click="filters.religions = []">Сбросить</el-button>
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click" :hide-on-click="false" class="filter-dropdown">
        <el-button size="large">
          Принадлежность ({{ filters.affiliations.length }}) <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="filter-dropdown-menu">
            <div class="filter-options">
              <el-checkbox-group v-model="filters.affiliations">
                <el-checkbox 
                  v-for="affiliation in filteredAffiliations" 
                  :key="affiliation.id" 
                  :label="affiliation.id"
                >
                  {{ affiliation.name }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="filter-actions-dropdown">
              <el-button link size="small" @click="selectAllAffiliations">Выбрать все</el-button>
              <el-button link size="small" type="danger" @click="filters.affiliations = []">Сбросить</el-button>
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click" :hide-on-click="false" class="filter-dropdown">
        <el-button size="large">
          Волость ({{ filters.volosts.length }}) <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="filter-dropdown-menu">
            <div class="filter-options">
              <el-checkbox-group v-model="filters.volosts">
                <el-checkbox 
                  v-for="volost in filteredVolosts" 
                  :key="volost.id" 
                  :label="volost.id"
                >
                  {{ volost.name }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="filter-actions-dropdown">
              <el-button link size="small" @click="selectAllVolosts">Выбрать все</el-button>
              <el-button link size="small" type="danger" @click="filters.volosts = []">Сбросить</el-button>
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click" :hide-on-click="false" class="filter-dropdown">
        <el-button size="large">
          Помещик ({{ filters.landowners.length }}) <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="filter-dropdown-menu">
            <div class="filter-search">
              <el-input v-model="searchLandowner" placeholder="Поиск..." size="small" clearable />
            </div>
            <div class="filter-options">
              <el-checkbox-group v-model="filters.landowners">
                <el-checkbox 
                  v-for="landowner in filteredLandownersSearch" 
                  :key="landowner.id" 
                  :label="landowner.id"
                >
                  {{ landowner.name }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="filter-actions-dropdown">
              <el-button link size="small" @click="selectAllLandowners">Выбрать все</el-button>
              <el-button link size="small" type="danger" @click="filters.landowners = []">Сбросить</el-button>
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-dropdown trigger="click" :hide-on-click="false" class="filter-dropdown">
        <el-button size="large">
          Войсковая организация ({{ filters.militaryUnits.length }}) <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="filter-dropdown-menu">
            <div class="filter-search">
              <el-input v-model="searchMilitaryUnit" placeholder="Поиск..." size="small" clearable />
            </div>
            <div class="filter-options">
              <el-checkbox-group v-model="filters.militaryUnits">
                <el-checkbox 
                  v-for="unit in filteredMilitaryUnitsSearch" 
                  :key="unit.id" 
                  :label="unit.id"
                >
                  {{ unit.name }}
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="filter-actions-dropdown">
              <el-button link size="small" @click="selectAllMilitaryUnits">Выбрать все</el-button>
              <el-button link size="small" type="danger" @click="filters.militaryUnits = []">Сбросить</el-button>
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- Фильтры по численности (только для режима estate) -->
      <div v-if="dataMode === 'estate'" class="population-filters">
        <div class="population-filter-group">
          <el-checkbox v-model="filters.maleEnabled" size="large" />
          <label>Мужчины:</label>
          <el-input-number 
            v-model="filters.maleMin" 
            :min="0" 
            :max="filters.maleMax || undefined"
            :disabled="!filters.maleEnabled"
            size="small" 
            placeholder="От"
            controls-position="right"
          />
          <span>—</span>
          <el-input-number 
            v-model="filters.maleMax" 
            :min="filters.maleMin || 0" 
            :disabled="!filters.maleEnabled"
            size="small" 
            placeholder="До"
            controls-position="right"
          />
        </div>
        
        <div class="population-filter-group">
          <el-checkbox v-model="filters.femaleEnabled" size="large" />
          <label>Женщины:</label>
          <el-input-number 
            v-model="filters.femaleMin" 
            :min="0" 
            :max="filters.femaleMax || undefined"
            :disabled="!filters.femaleEnabled"
            size="small" 
            placeholder="От"
            controls-position="right"
          />
          <span>—</span>
          <el-input-number 
            v-model="filters.femaleMax" 
            :min="filters.femaleMin || 0" 
            :disabled="!filters.femaleEnabled"
            size="small" 
            placeholder="До"
            controls-position="right"
          />
        </div>
        
        <div class="population-filter-group">
          <el-checkbox v-model="filters.populationEnabled" size="large" />
          <label>Всего:</label>
          <el-input-number 
            v-model="filters.populationMin" 
            :min="0" 
            :max="filters.populationMax || undefined"
            :disabled="!filters.populationEnabled"
            size="small" 
            placeholder="От"
            controls-position="right"
          />
          <span>—</span>
          <el-input-number 
            v-model="filters.populationMax" 
            :min="filters.populationMin || 0" 
            :disabled="!filters.populationEnabled"
            size="small" 
            placeholder="До"
            controls-position="right"
          />
        </div>
      </div>

      <!-- Фильтры для режима report -->
      <div v-if="dataMode === 'report'" class="population-filters">
        <div class="population-filter-group">
          <el-checkbox v-model="filters.estatesCountEnabled" size="large" />
          <label>Количество сословий:</label>
          <el-input-number 
            v-model="filters.estatesCountMin" 
            :min="0" 
            :max="filters.estatesCountMax || undefined"
            :disabled="!filters.estatesCountEnabled"
            size="small" 
            placeholder="От"
            controls-position="right"
          />
          <span>—</span>
          <el-input-number 
            v-model="filters.estatesCountMax" 
            :min="filters.estatesCountMin || 0" 
            :disabled="!filters.estatesCountEnabled"
            size="small" 
            placeholder="До"
            controls-position="right"
          />
        </div>
      </div>

      <!-- Кнопки действий -->
      <div class="filter-actions">
        <el-button type="primary" size="large" @click="applyFilters">
          Применить
        </el-button>
        <el-button size="large" @click="resetFilters">
          Сбросить значения
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '@/services/supabase'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'

export default {
  name: 'EstatesFilters',
  components: {
    ArrowDown
  },
  props: {
    dataMode: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      filters: {
        revision: null,
        districts: [],
        settlementNamesOld: [],
        settlementNamesModern: [],
        typeEstates: [],
        subtypeEstates: [],
        religions: [],
        affiliations: [],
        volosts: [],
        landowners: [],
        militaryUnits: [],
        maleEnabled: false,
        maleMin: null,
        maleMax: null,
        femaleEnabled: false,
        femaleMin: null,
        femaleMax: null,
        populationEnabled: false,
        populationMin: null,
        populationMax: null,
        estatesCountEnabled: false,
        estatesCountMin: null,
        estatesCountMax: null
      },
      // Все опции из БД
      allRevisions: [],
      allDistricts: [],
      allSettlements: [],
      allTypeEstates: [],
      allSubtypeEstates: [],
      allReligions: [],
      allAffiliations: [],
      allVolosts: [],
      allLandowners: [],
      allMilitaryUnits: [],
      // Поиск
      searchDistrict: '',
      searchSettlementOld: '',
      searchSettlementModern: '',
      searchLandowner: '',
      searchMilitaryUnit: ''
    }
  },
  computed: {
    revisionOptions() {
      return this.allRevisions.map(rev => ({
        label: `${rev.number} ревизия (${rev.year})`,
        value: rev.id
      }))
    },
    
    filteredDistricts() {
      return this.allDistricts
    },
    
    filteredSettlements() {
      if (!this.filters.districts || this.filters.districts.length === 0) {
        return this.allSettlements
      }
      return this.allSettlements.filter(s => this.filters.districts.includes(s.id_district))
    },
    
    filteredTypeEstates() {
      return this.allTypeEstates
    },
    
    filteredSubtypeEstates() {
      if (!this.filters.typeEstates || this.filters.typeEstates.length === 0) {
        return this.allSubtypeEstates
      }
      return this.allSubtypeEstates.filter(s => this.filters.typeEstates.includes(s.id_type_estate))
    },
    
    filteredReligions() {
      return this.allReligions
    },
    
    filteredAffiliations() {
      return this.allAffiliations
    },
    
    filteredVolosts() {
      return this.allVolosts
    },
    
    filteredLandowners() {
      return this.allLandowners
    },
    
    filteredMilitaryUnits() {
      return this.allMilitaryUnits
    },
    
    filteredDistrictsSearch() {
      if (!this.searchDistrict) return this.filteredDistricts
      return this.filteredDistricts.filter(d => 
        d.name.toLowerCase().includes(this.searchDistrict.toLowerCase())
      )
    },
    

    
    filteredLandownersSearch() {
      if (!this.searchLandowner) return this.filteredLandowners
      return this.filteredLandowners.filter(l => 
        l.name.toLowerCase().includes(this.searchLandowner.toLowerCase())
      )
    },
    
    filteredMilitaryUnitsSearch() {
      if (!this.searchMilitaryUnit) return this.filteredMilitaryUnits
      return this.filteredMilitaryUnits.filter(m =>
        m.name.toLowerCase().includes(this.searchMilitaryUnit.toLowerCase())
      )
    },

    settlementNamesOld() {
      // Получаем уникальные старые названия населенных пунктов из загруженных данных
      const oldNames = new Set()
      const filteredSettlements = this.filters.districts?.length > 0
        ? this.allSettlements.filter(s => this.filters.districts.includes(s.id_district))
        : this.allSettlements

      filteredSettlements.forEach(s => {
        if (s.name_old) oldNames.add(s.name_old)
      })
      return Array.from(oldNames).sort()
    },

    settlementNamesModern() {
      // Получаем уникальные современные названия населенных пунктов из загруженных данных
      const modernNames = new Set()
      const filteredSettlements = this.filters.districts?.length > 0
        ? this.allSettlements.filter(s => this.filters.districts.includes(s.id_district))
        : this.allSettlements

      filteredSettlements.forEach(s => {
        if (s.name_modern) modernNames.add(s.name_modern)
      })
      return Array.from(modernNames).sort()
    },

    filteredSettlementNamesOldSearch() {
      if (!this.searchSettlementOld) return this.settlementNamesOld
      return this.settlementNamesOld.filter(name =>
        name.toLowerCase().includes(this.searchSettlementOld.toLowerCase())
      )
    },

    filteredSettlementNamesModernSearch() {
      if (!this.searchSettlementModern) return this.settlementNamesModern
      return this.settlementNamesModern.filter(name =>
        name.toLowerCase().includes(this.searchSettlementModern.toLowerCase())
      )
    }
  },
  mounted() {
    this.loadFilterOptions()
  },
  watch: {
    allDistricts() {
      this.$emit('options-loaded', {
        districts: this.allDistricts,
        settlements: this.allSettlements,
        typeEstates: this.allTypeEstates,
        subtypeEstates: this.allSubtypeEstates,
        religions: this.allReligions,
        affiliations: this.allAffiliations,
        volosts: this.allVolosts
      })
    }
  },
  methods: {
    loadFilterOptions() {
      Promise.all([
        this.loadRevisions(),
        this.loadDistricts(),
        this.loadSettlements(),
        this.loadTypeEstates(),
        this.loadSubtypeEstates(),
        this.loadReligions(),
        this.loadAffiliations(),
        this.loadVolosts(),
        this.loadLandowners(),
        this.loadMilitaryUnits()
      ]).catch(error => {
        console.error('Error loading filter options:', error)
        ElMessage.error('Ошибка загрузки опций фильтров')
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
    },
    
    loadDistricts() {
      return supabase
        .from('District')
        .select('id, name')
        .order('name', { ascending: true })
        .then(({ data, error }) => {
          if (error) throw error
          this.allDistricts = data || []
        })
    },
    
    loadSettlements() {
      return supabase
        .from('Settlement')
        .select('id, name_modern, name_old, id_district')
        .order('name_modern', { ascending: true })
        .then(({ data, error }) => {
          if (error) throw error
          this.allSettlements = (data || []).map(s => ({
            ...s,
            name: s.name_modern || s.name_old
          }))
        })
    },
    
    loadTypeEstates() {
      return supabase
        .from('Type_estate')
        .select('id, name')
        .order('name', { ascending: true })
        .then(({ data, error }) => {
          if (error) throw error
          this.allTypeEstates = data || []
        })
    },
    
    loadSubtypeEstates() {
      return supabase
        .from('Subtype_estate')
        .select('id, name, id_type_estate')
        .order('name', { ascending: true })
        .then(({ data, error }) => {
          if (error) throw error
          this.allSubtypeEstates = data || []
        })
    },
    
    loadReligions() {
      return supabase
        .from('Type_religion')
        .select('id, name')
        .order('name', { ascending: true })
        .then(({ data, error }) => {
          if (error) throw error
          this.allReligions = data || []
        })
    },
    
    loadAffiliations() {
      return supabase
        .from('Type_affiliation')
        .select('id, name')
        .order('name', { ascending: true })
        .then(({ data, error }) => {
          if (error) throw error
          this.allAffiliations = data || []
        })
    },
    
    loadVolosts() {
      return supabase
        .from('Volost')
        .select('id, name')
        .order('name', { ascending: true })
        .then(({ data, error }) => {
          if (error) throw error
          this.allVolosts = data || []
        })
    },
    
    loadLandowners() {
      return supabase
        .from('Landowner')
        .select('id, description, person')
        .order('description', { ascending: true })
        .then(({ data, error }) => {
          if (error) throw error
          this.allLandowners = (data || []).map(l => ({
            ...l,
            name: l.description || l.person || 'Без названия'
          }))
        })
    },
    
    loadMilitaryUnits() {
      return supabase
        .from('Military_unit')
        .select('id, description, person')
        .order('description', { ascending: true })
        .then(({ data, error }) => {
          if (error) throw error
          this.allMilitaryUnits = (data || []).map(m => ({
            ...m,
            name: m.description || m.person || 'Без названия'
          }))
        })
    },
    
    onRevisionChange() {
      this.applyFilters()
    },

    onDistrictsChange() {
      // Ничего не делаем, просто для единообразия
    },
    

    
    onTypeEstatesChange() {
      // Убираем подтипы, которые не относятся к выбранным типам
      if (this.filters.typeEstates.length > 0 && this.filters.subtypeEstates.length > 0) {
        this.filters.subtypeEstates = this.filters.subtypeEstates.filter(subtypeId => {
          const subtype = this.allSubtypeEstates.find(s => s.id === subtypeId)
          return subtype && this.filters.typeEstates.includes(subtype.id_type_estate)
        })
      } else if (this.filters.typeEstates.length === 0) {
        // Если не выбраны типы сословий, очищаем подтипы
        this.filters.subtypeEstates = []
      }
    },
    
    applyFilters() {
      // Проверяем, есть ли активные фильтры
      const hasActiveFilters =
        this.filters.districts?.length > 0 ||
        this.filters.settlementNamesOld?.length > 0 ||
        this.filters.settlementNamesModern?.length > 0 ||
        this.filters.typeEstates?.length > 0 ||
        this.filters.subtypeEstates?.length > 0 ||
        this.filters.religions?.length > 0 ||
        this.filters.affiliations?.length > 0 ||
        this.filters.volosts?.length > 0 ||
        this.filters.landowners?.length > 0 ||
        this.filters.militaryUnits?.length > 0 ||
        this.filters.maleEnabled ||
        this.filters.femaleEnabled ||
        this.filters.populationEnabled ||
        this.filters.estatesCountEnabled

      if (!hasActiveFilters) {
        this.$confirm(
          'У вас не выбран ни один фильтр, продолжить?',
          'Подтверждение',
          {
            confirmButtonText: 'Продолжить',
            cancelButtonText: 'Отмена',
            type: 'warning',
            confirmButtonClass: 'el-button--primary'
          }
        ).then(() => {
          this.$emit('filter-change', this.filters)
        }).catch(() => {
          // Пользователь отменил действие
        })
      } else {
        this.$emit('filter-change', this.filters)
      }
    },
    
    resetFilters() {
      this.filters = {
        revision: null,
        districts: [],
        settlements: [],
        settlementNamesOld: [],
        settlementNamesModern: [],
        typeEstates: [],
        subtypeEstates: [],
        religions: [],
        affiliations: [],
        volosts: [],
        landowners: [],
        militaryUnits: [],
        maleEnabled: false,
        maleMin: null,
        maleMax: null,
        femaleEnabled: false,
        femaleMin: null,
        femaleMax: null,
        populationEnabled: false,
        populationMin: null,
        populationMax: null,
        estatesCountEnabled: false,
        estatesCountMin: null,
        estatesCountMax: null
      }
      this.$emit('filter-change', this.filters)
    },
    
    selectAllDistricts() {
      this.filters.districts = this.filteredDistrictsSearch.map(d => d.id)
    },
    
    selectAllTypeEstates() {
      this.filters.typeEstates = this.filteredTypeEstates.map(t => t.id)
      this.onTypeEstatesChange()
    },
    
    selectAllSubtypeEstates() {
      this.filters.subtypeEstates = this.filteredSubtypeEstates.map(s => s.id)
    },
    
    selectAllReligions() {
      this.filters.religions = this.filteredReligions.map(r => r.id)
    },
    
    selectAllAffiliations() {
      this.filters.affiliations = this.filteredAffiliations.map(a => a.id)
    },
    
    selectAllVolosts() {
      this.filters.volosts = this.filteredVolosts.map(v => v.id)
    },
    
    selectAllLandowners() {
      this.filters.landowners = this.filteredLandownersSearch.map(l => l.id)
    },
    
    selectAllMilitaryUnits() {
      this.filters.militaryUnits = this.filteredMilitaryUnitsSearch.map(m => m.id)
    },

    onSettlementNamesOldChange() {
      // Ничего не делаем, просто для единообразия
    },

    onSettlementNamesModernChange() {
      // Ничего не делаем, просто для единообразия
    },

    selectAllSettlementNamesOld() {
      this.filters.settlementNamesOld = this.filteredSettlementNamesOldSearch
    },

    selectAllSettlementNamesModern() {
      this.filters.settlementNamesModern = this.filteredSettlementNamesModernSearch
    }
  }
}
</script>

<style scoped lang="scss">
.estates-filters {
  .filters-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 3px;
    padding: 3px;
    background-color: var(--bg-secondary);
    border-radius: 4px;
  }
  
  .filter-dropdown {
    :deep(.el-button) {
      width: 100%;
      height: 32px;
      justify-content: space-between;
      background-color: hsl(220, 15%, 18%);
      border-color: hsl(220, 15%, 30%);
      color: hsl(0, 0%, 85%);
      
      &:hover {
        background-color: hsl(220, 15%, 22%);
        border-color: hsl(220, 15%, 35%);
        color: hsl(0, 0%, 90%);
      }
      
      &:disabled {
        background-color: hsl(220, 15%, 12%);
        border-color: hsl(220, 15%, 20%);
        color: hsl(0, 0%, 40%);
      }
    }
  }
  
  .population-filters {
    grid-column: 1 / -1;
    display: flex;
    gap: 8px;
    padding: 0 3px;
    background-color: var(--bg-tertiary);
    border-radius: 4px;
    flex-wrap: wrap;
    
    .population-filter-group {
      display: flex;
      align-items: center;
      gap: 3px;
      
      .el-checkbox {
        margin-right: 2px;
      }
      
      label {
        color: var(--text-primary);
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        margin-right: 3px;
      }
      
      span {
        color: var(--text-secondary);
        font-size: 12px;
      }
      
      :deep(.el-input-number) {
        width: 80px;
        
        .el-input__wrapper {
          padding: 1px 3px;
        }
        
        .el-input__inner {
          text-align: center;
          font-size: 12px;
        }
      }
    }
  }
  
  .filter-actions {
    grid-column: 1 / -1;
    display: flex;
    gap: 3px;
    margin-top: 3px;
    
    :deep(.el-button) {
      flex: 1;
      height: 32px;
      padding: 3px 8px;
      font-size: 12px;
    }
  }
}

:deep(.filter-dropdown-menu) {
  max-width: 300px;
  background-color: hsl(220, 15%, 15%) !important;
  border: 1px solid hsl(220, 15%, 25%) !important;
  box-shadow: 0 4px 12px hsla(0, 0%, 0%, 0.3) !important;
  
  .filter-search {
    padding: 3px;
    border-bottom: 1px solid hsl(220, 15%, 25%);
    background-color: hsl(220, 15%, 15%);
    
    .el-input__wrapper {
      background-color: hsl(220, 15%, 20%) !important;
      box-shadow: none !important;
      border: 1px solid hsl(220, 15%, 30%);
      
      &:hover {
        background-color: hsl(220, 15%, 25%) !important;
        border-color: hsl(220, 15%, 35%);
      }
      
      .el-input__inner {
        color: hsl(0, 0%, 90%);
      }
    }
  }
  
  .filter-options {
    max-height: 300px;
    overflow-y: auto;
    padding: 3px;
    background-color: hsl(220, 15%, 15%);
    
    .el-checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    
    .el-checkbox {
      margin: 0;
      padding: 2px 3px;
      border-radius: 3px;
      
      &:hover {
        background-color: hsl(220, 15%, 22%);
      }
      
      .el-checkbox__input {
        .el-checkbox__inner {
          background-color: hsl(220, 15%, 25%);
          border: 2px solid hsl(220, 15%, 40%);
        }
        
        &.is-checked .el-checkbox__inner {
          background-color: var(--accent-primary);
          border-color: var(--accent-primary);
        }
      }
      
      .el-checkbox__label {
        color: hsl(0, 0%, 85%);
        font-weight: 400;
      }
    }
  }
  
  .filter-actions-dropdown {
    display: flex;
    justify-content: space-between;
    padding: 3px;
    border-top: 1px solid hsl(220, 15%, 25%);
    background-color: hsl(220, 15%, 15%);
    
    .el-button {
      color: hsl(0, 0%, 80%);
      
      &:hover {
        color: var(--accent-primary);
      }
      
      &.el-button--danger {
        color: hsl(0, 70%, 60%);
        
        &:hover {
          color: hsl(0, 70%, 50%);
        }
      }
    }
  }
}
</style>
