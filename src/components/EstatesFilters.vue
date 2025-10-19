<template>
  <div class="estates-filters">
    <!-- Активные фильтры -->
    <div v-if="activeFiltersList.length > 0" class="active-filters">
      <div class="active-filters-header">
        <span class="active-filters-title">Активные фильтры:</span>
        <el-button size="small" text @click="showAllActiveFilters = !showAllActiveFilters">
          {{ showAllActiveFilters ? 'Скрыть' : `Показать все (${activeFiltersList.length})` }}
        </el-button>
      </div>
      <div class="active-filters-list">
        <el-tag
          v-for="(filter, index) in visibleActiveFilters"
          :key="`${filter.type}-${index}`"
          size="small"
          closable
          @close="removeFilter(filter)"
          class="active-filter-tag"
        >
          {{ filter.label }}
        </el-tag>
      </div>
    </div>

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
          Нас. пункт (старый) ({{ (filters.settlementNamesOld || []).length }}) <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="filter-dropdown-menu">
            <div class="filter-search">
              <el-input v-model="searchSettlementOld" placeholder="Поиск..." size="small" clearable />
            </div>
            <div class="filter-options">
              <el-checkbox-group v-model="filters.settlementNamesOld" @change="onFiltersChange">
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
          Нас. пункт (совр) ({{ (filters.settlementNamesModern || []).length }}) <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="filter-dropdown-menu">
            <div class="filter-search">
              <el-input v-model="searchSettlementModern" placeholder="Поиск..." size="small" clearable />
            </div>
            <div class="filter-options">
              <el-checkbox-group v-model="filters.settlementNamesModern" @change="onFiltersChange">
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
              <el-checkbox-group v-model="filters.subtypeEstates" @change="onFiltersChange">
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
              <el-checkbox-group v-model="filters.religions" @change="onFiltersChange">
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
              <el-checkbox-group v-model="filters.affiliations" @change="onFiltersChange">
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
              <el-checkbox-group v-model="filters.volosts" @change="onFiltersChange">
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
              <el-checkbox-group v-model="filters.landowners" @change="onFiltersChange">
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
              <el-checkbox-group v-model="filters.militaryUnits" @change="onFiltersChange">
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

      <!-- Фильтры по численности (для всех режимов) -->
      <div class="population-filters">
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
        <el-button size="large" @click="getShareableLink" type="info" plain>
          Получить ссылку с фильтрами
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { supabase } from '@/services/supabase'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useEstatesFilters } from '@/composables/useStorage.js'

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
  setup() {
    // Используем composable для управления фильтрами с сохранением в localStorage
    const { filters, resetFilters: resetStoredFilters, applyFilters: applyStoredFilters } = useEstatesFilters()

    // Убеждаемся что filters объект инициализирован с нужными свойствами
    if (!filters.value) {
      filters.value = {}
    }

    // Инициализируем все необходимые свойства фильтров с пустыми массивами по умолчанию
    const initFilters = () => {
      const defaultFilters = {
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
        femaleEnabled: false,
        populationEnabled: false,
        estatesCountEnabled: false,
        maleMin: null,
        maleMax: null,
        femaleMin: null,
        femaleMax: null,
        populationMin: null,
        populationMax: null,
        estatesCountMin: null,
        estatesCountMax: null
      }

      Object.keys(defaultFilters).forEach(key => {
        if (filters.value[key] === undefined) {
          filters.value[key] = defaultFilters[key]
        }
      })
    }

    // Инициализируем фильтры
    initFilters()

    return {
      filters,
      resetStoredFilters,
      applyStoredFilters
    }
  },
  data() {
    return {
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
      searchMilitaryUnit: '',
      // Отображение активных фильтров
      showAllActiveFilters: false
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
      if (!this.allSettlements || this.allSettlements.length === 0) {
        return []
      }

      const oldNames = new Set()
      const filteredSettlements = this.filters?.districts?.length > 0
        ? this.allSettlements.filter(s => this.filters.districts.includes(s.id_district))
        : this.allSettlements

      filteredSettlements.forEach(s => {
        if (s.name_old) oldNames.add(s.name_old)
      })
      return Array.from(oldNames).sort()
    },

    settlementNamesModern() {
      // Получаем уникальные современные названия населенных пунктов из загруженных данных
      if (!this.allSettlements || this.allSettlements.length === 0) {
        return []
      }

      const modernNames = new Set()
      const filteredSettlements = this.filters?.districts?.length > 0
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
    },

    // Список активных фильтров
    activeFiltersList() {
      const activeFilters = []

      // Районы
      if (this.filters.districts?.length > 0) {
        const districtNames = this.filters.districts.map(id => {
          const district = this.allDistricts.find(d => d.id === id)
          return district ? district.name : `ID:${id}`
        })
        activeFilters.push({
          type: 'districts',
          label: `Районы: ${districtNames.join(', ')}`,
          value: this.filters.districts
        })
      }

      // Старые названия населенных пунктов
      if (this.filters.settlementNamesOld?.length > 0) {
        activeFilters.push({
          type: 'settlementNamesOld',
          label: `Нас. пункты (старые): ${this.filters.settlementNamesOld.join(', ')}`,
          value: this.filters.settlementNamesOld
        })
      }

      // Современные названия населенных пунктов
      if (this.filters.settlementNamesModern?.length > 0) {
        activeFilters.push({
          type: 'settlementNamesModern',
          label: `Нас. пункты (совр.): ${this.filters.settlementNamesModern.join(', ')}`,
          value: this.filters.settlementNamesModern
        })
      }

      // Типы сословий
      if (this.filters.typeEstates?.length > 0) {
        const typeNames = this.filters.typeEstates.map(id => {
          const type = this.allTypeEstates.find(t => t.id === id)
          return type ? type.name : `ID:${id}`
        })
        activeFilters.push({
          type: 'typeEstates',
          label: `Сословия: ${typeNames.join(', ')}`,
          value: this.filters.typeEstates
        })
      }

      // Подтипы сословий
      if (this.filters.subtypeEstates?.length > 0) {
        const subtypeNames = this.filters.subtypeEstates.map(id => {
          const subtype = this.allSubtypeEstates.find(s => s.id === id)
          return subtype ? subtype.name : `ID:${id}`
        })
        activeFilters.push({
          type: 'subtypeEstates',
          label: `Подтипы сословий: ${subtypeNames.join(', ')}`,
          value: this.filters.subtypeEstates
        })
      }

      // Религии
      if (this.filters.religions?.length > 0) {
        const religionNames = this.filters.religions.map(id => {
          const religion = this.allReligions.find(r => r.id === id)
          return religion ? religion.name : `ID:${id}`
        })
        activeFilters.push({
          type: 'religions',
          label: `Религии: ${religionNames.join(', ')}`,
          value: this.filters.religions
        })
      }

      // Принадлежности
      if (this.filters.affiliations?.length > 0) {
        const affiliationNames = this.filters.affiliations.map(id => {
          const affiliation = this.allAffiliations.find(a => a.id === id)
          return affiliation ? affiliation.name : `ID:${id}`
        })
        activeFilters.push({
          type: 'affiliations',
          label: `Принадлежности: ${affiliationNames.join(', ')}`,
          value: this.filters.affiliations
        })
      }

      // Волости
      if (this.filters.volosts?.length > 0) {
        const volostNames = this.filters.volosts.map(id => {
          const volost = this.allVolosts.find(v => v.id === id)
          return volost ? volost.name : `ID:${id}`
        })
        activeFilters.push({
          type: 'volosts',
          label: `Волости: ${volostNames.join(', ')}`,
          value: this.filters.volosts
        })
      }

      // Помещики
      if (this.filters.landowners?.length > 0) {
        const landownerNames = this.filters.landowners.map(id => {
          const landowner = this.allLandowners.find(l => l.id === id)
          return landowner ? landowner.name : `ID:${id}`
        })
        activeFilters.push({
          type: 'landowners',
          label: `Помещики: ${landownerNames.join(', ')}`,
          value: this.filters.landowners
        })
      }

      // Военные организации
      if (this.filters.militaryUnits?.length > 0) {
        const unitNames = this.filters.militaryUnits.map(id => {
          const unit = this.allMilitaryUnits.find(u => u.id === id)
          return unit ? unit.name : `ID:${id}`
        })
        activeFilters.push({
          type: 'militaryUnits',
          label: `Военные организации: ${unitNames.join(', ')}`,
          value: this.filters.militaryUnits
        })
      }

      // Диапазон мужчин
      if (this.filters.maleEnabled) {
        const min = this.filters.maleMin || 0
        const max = this.filters.maleMax || '∞'
        activeFilters.push({
          type: 'maleRange',
          label: `Мужчины: ${min} - ${max}`,
          value: { min: this.filters.maleMin, max: this.filters.maleMax, enabled: true }
        })
      }

      // Диапазон женщин
      if (this.filters.femaleEnabled) {
        const min = this.filters.femaleMin || 0
        const max = this.filters.femaleMax || '∞'
        activeFilters.push({
          type: 'femaleRange',
          label: `Женщины: ${min} - ${max}`,
          value: { min: this.filters.femaleMin, max: this.filters.femaleMax, enabled: true }
        })
      }

      // Диапазон населения
      if (this.filters.populationEnabled) {
        const min = this.filters.populationMin || 0
        const max = this.filters.populationMax || '∞'
        activeFilters.push({
          type: 'populationRange',
          label: `Население: ${min} - ${max}`,
          value: { min: this.filters.populationMin, max: this.filters.populationMax, enabled: true }
        })
      }

      // Диапазон количества сословий (для режима report)
      if (this.filters.estatesCountEnabled) {
        const min = this.filters.estatesCountMin || 0
        const max = this.filters.estatesCountMax || '∞'
        activeFilters.push({
          type: 'estatesCountRange',
          label: `Количество сословий: ${min} - ${max}`,
          value: { min: this.filters.estatesCountMin, max: this.filters.estatesCountMax, enabled: true }
        })
      }

      return activeFilters
    },

    // Видимые активные фильтры (с учетом флага showAllActiveFilters)
    visibleActiveFilters() {
      if (this.showAllActiveFilters) {
        return this.activeFiltersList
      }
      return this.activeFiltersList.slice(0, 3) // Показываем только первые 3 фильтра
    }
  },
  mounted() {
    this.loadFilterOptions()
    this.loadFiltersFromURL()
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
        .select('id, name, id_type_estate, id_type_religion, id_type_affiliation')
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
      // Обновляем маркеры при изменении районов
      this.onFiltersChange()
      // Также обновляем доступные населенные пункты
      this.updateSettlementNames()
    },

    updateSettlementNames() {
      // Принудительно пересчитываем computed свойства для названий населенных пунктов
      this.$forceUpdate()
    },

    onFiltersChange() {
      // Обновляем маркеры при любом изменении фильтров
      this.$emit('filter-change', this.filters)
      // Обновляем URL с текущими фильтрами
      this.updateURLWithFilters()
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
      // Обновляем маркеры при изменении типов сословий
      this.onFiltersChange()
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
      // Используем метод из composable для сброса фильтров
      this.resetStoredFilters()
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
      // Обновляем маркеры при изменении старых названий населенных пунктов
      this.onFiltersChange()
    },

    onSettlementNamesModernChange() {
      // Обновляем маркеры при изменении современных названий населенных пунктов
      this.onFiltersChange()
    },

    selectAllSettlementNamesOld() {
      this.filters.settlementNamesOld = this.filteredSettlementNamesOldSearch
    },

    selectAllSettlementNamesModern() {
      this.filters.settlementNamesModern = this.filteredSettlementNamesModernSearch
    },



    // Загрузка фильтров из URL параметров
    loadFiltersFromURL() {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const filtersParam = urlParams.get('filters')

        if (filtersParam) {
          // Используем прямой JSON.parse без decodeURIComponent
          const urlFilters = JSON.parse(filtersParam)

          // Валидация URL фильтров
          if (urlFilters && typeof urlFilters === 'object') {
            // Импортируем фильтры из URL, сохраняя только нужные поля
            const allowedFields = [
              'districts', 'settlementNamesOld', 'settlementNamesModern',
              'typeEstates', 'subtypeEstates', 'religions', 'affiliations',
              'volosts', 'landowners', 'militaryUnits',
              'maleEnabled', 'femaleEnabled', 'populationEnabled', 'estatesCountEnabled',
              'maleMin', 'maleMax', 'femaleMin', 'femaleMax',
              'populationMin', 'populationMax', 'estatesCountMin', 'estatesCountMax'
            ]

            const cleanedFilters = {}
            allowedFields.forEach(field => {
              if (urlFilters.hasOwnProperty(field)) {
                cleanedFilters[field] = urlFilters[field]
              }
            })

            // Объединяем с текущими фильтрами
            Object.assign(this.filters, cleanedFilters)

            // Сохраняем в localStorage
            this.applyStoredFilters()

            // Показываем уведомление
            ElMessage.success('Фильтры загружены из URL!')
          }
        }
      } catch (error) {
        console.error('Error loading filters from URL:', error)
        // Не показываем ошибку пользователю, так как это может быть некорректная ссылка
      }
    },

    // Обновление URL с текущими фильтрами
    updateURLWithFilters() {
      try {
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

        if (hasActiveFilters) {
          const url = new URL(window.location)
          // Используем прямой JSON без encodeURIComponent для читаемости
          url.searchParams.set('filters', JSON.stringify(this.filters))
          window.history.replaceState({}, '', url)
        } else {
          // Удаляем параметр фильтров если активных фильтров нет
          const url = new URL(window.location)
          url.searchParams.delete('filters')
          window.history.replaceState({}, '', url)
        }
      } catch (error) {
        console.error('Error updating URL with filters:', error)
      }
    },

    // Получение ссылки для отправки
    getShareableLink() {
      try {
        const currentUrl = window.location.href
        navigator.clipboard.writeText(currentUrl).then(() => {
          ElMessage.success('Ссылка скопирована в буфер обмена!')
        }).catch(() => {
          ElMessage.info('Ссылка: ' + currentUrl)
        })
      } catch (error) {
        console.error('Error getting shareable link:', error)
        ElMessage.error('Ошибка при получении ссылки')
      }
    },

    // Удаление конкретного фильтра
    removeFilter(filter) {
      switch (filter.type) {
        case 'districts':
          this.filters.districts = []
          break
        case 'settlementNamesOld':
          this.filters.settlementNamesOld = []
          break
        case 'settlementNamesModern':
          this.filters.settlementNamesModern = []
          break
        case 'typeEstates':
          this.filters.typeEstates = []
          this.filters.subtypeEstates = [] // Также очищаем подтипы
          break
        case 'subtypeEstates':
          this.filters.subtypeEstates = []
          break
        case 'religions':
          this.filters.religions = []
          break
        case 'affiliations':
          this.filters.affiliations = []
          break
        case 'volosts':
          this.filters.volosts = []
          break
        case 'landowners':
          this.filters.landowners = []
          break
        case 'militaryUnits':
          this.filters.militaryUnits = []
          break
        case 'maleRange':
          this.filters.maleEnabled = false
          this.filters.maleMin = null
          this.filters.maleMax = null
          break
        case 'femaleRange':
          this.filters.femaleEnabled = false
          this.filters.femaleMin = null
          this.filters.femaleMax = null
          break
        case 'populationRange':
          this.filters.populationEnabled = false
          this.filters.populationMin = null
          this.filters.populationMax = null
          break
        case 'estatesCountRange':
          this.filters.estatesCountEnabled = false
          this.filters.estatesCountMin = null
          this.filters.estatesCountMax = null
          break
      }

      // Обновляем данные и URL
      this.onFiltersChange()
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

// Стили для активных фильтров
.active-filters {
  margin-bottom: 8px;
  padding: 8px;
  background-color: var(--bg-tertiary);
  border-radius: 6px;
  border: 1px solid var(--border-color);

  .active-filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;

    .active-filters-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .active-filters-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;

    .active-filter-tag {
      background-color: var(--accent-primary) !important;
      color: white !important;
      border: none !important;
      font-size: 11px;
      max-width: 200px;

      :deep(.el-tag__content) {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      :deep(.el-tag__close) {
        color: white !important;

        &:hover {
          background-color: rgba(255, 255, 255, 0.2) !important;
        }
      }
    }
  }
}
</style>
