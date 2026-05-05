<template>
  <div class="estates-filters">
    <!-- Активные фильтры -->
    <div v-if="activeFiltersList.length > 0" class="active-filters">
      <div class="active-filters-header">
        <span class="active-filters-title">Активные фильтры:</span>
      </div>
      <div class="active-filters-list">
        <el-tag
          v-for="(filter, index) in activeFiltersList"
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
      <!-- Фильтр по ревизиям -->
      <el-dropdown v-if="allRevisions.length > 0" trigger="click" :hide-on-click="false" class="filter-dropdown">
        <el-button size="large">
          Ревизия ({{ (filters.revision && filters.revision.length > 0) ? filters.revision.length : 0 }}) <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="filter-dropdown-menu">
            <div class="dropdown-close">
              <el-button link type="info" size="small" @click="closeDropdown">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="filter-options">
              <el-checkbox-group v-model="filters.revision">
                <el-checkbox
                  v-for="revision in filteredRevisions"
                  :key="revision.number"
                  :label="revision.number"
                >
                  {{ revision.number }} ревизия ({{ revision.year }})
                </el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="filter-actions-dropdown">
              <el-button link size="small" @click="selectAllRevisions">Выбрать все</el-button>
              <el-button link size="small" type="danger" @click="filters.revision = []">Сбросить</el-button>
            </div>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <!-- Dropdown фильтры -->
      <el-dropdown trigger="click" :hide-on-click="false" class="filter-dropdown">
        <el-button size="large">
          Район ({{ filters.districts.length }}) <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="filter-dropdown-menu">
            <div class="dropdown-close">
              <el-button link type="info" size="small" @click="closeDropdown">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="filter-search">
              <el-input v-model="searchDistrict" placeholder="Поиск..." size="small" clearable />
            </div>
            <div class="filter-options">
              <el-checkbox-group v-model="filters.districts">
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
            <div class="dropdown-close">
              <el-button link type="info" size="small" @click="closeDropdown">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="filter-search">
              <el-input v-model="searchSettlementOld" placeholder="Поиск..." size="small" clearable />
            </div>
            <div class="filter-options">
              <el-checkbox-group v-model="filters.settlementNamesOld">
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
            <div class="dropdown-close">
              <el-button link type="info" size="small" @click="closeDropdown">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="filter-search">
              <el-input v-model="searchSettlementModern" placeholder="Поиск..." size="small" clearable />
            </div>
            <div class="filter-options">
              <el-checkbox-group v-model="filters.settlementNamesModern">
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

      <!-- Фильтр по статусу населённого пункта -->
      <el-dropdown trigger="click" :hide-on-click="false" class="filter-dropdown">
        <el-button size="large">
          Статус НП ({{ filters.vanishedFilter.length }}) <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu class="filter-dropdown-menu">
            <div class="dropdown-close">
              <el-button link type="info" size="small" @click="closeDropdown">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="filter-options">
              <el-checkbox-group v-model="filters.vanishedFilter">
                <el-checkbox label="existing">Существующие</el-checkbox>
                <el-checkbox label="vanished">Исчезнувшие</el-checkbox>
              </el-checkbox-group>
            </div>
            <div class="filter-actions-dropdown">
              <el-button link size="small" @click="selectAllVanished">Выбрать все</el-button>
              <el-button link size="small" type="danger" @click="filters.vanishedFilter = []">Сбросить</el-button>
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
            <div class="dropdown-close">
              <el-button link type="info" size="small" @click="closeDropdown">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
            <div class="filter-options">
              <el-checkbox-group v-model="filters.typeEstates">
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
            <div class="dropdown-close">
              <el-button link type="info" size="small" @click="closeDropdown">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
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
            <div class="dropdown-close">
              <el-button link type="info" size="small" @click="closeDropdown">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
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
            <div class="dropdown-close">
              <el-button link type="info" size="small" @click="closeDropdown">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
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
            <div class="dropdown-close">
              <el-button link type="info" size="small" @click="closeDropdown">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
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
            <div class="dropdown-close">
              <el-button link type="info" size="small" @click="closeDropdown">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
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
            <div class="dropdown-close">
              <el-button link type="info" size="small" @click="closeDropdown">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
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
        <el-button size="large" @click="_applyFiltersNow" type="primary" :class="{ 'has-changes': hasChanges }">
          Применить
        </el-button>
        <el-button size="large" @click="resetFilters" type="danger" plain>
          Сбросить все
        </el-button>
        <el-button size="large" @click="getShareableLink" type="info" plain>
          Получить ссылку с фильтрами
        </el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { ArrowDown, Close } from '@element-plus/icons-vue'
import { useEstatesFilters } from '@/composables/useStorage.js'
import { supabase } from '@/services/supabase'

export default {
  name: 'EstatesFilters',
  components: {
    ArrowDown,
    Close
  },
  props: {
    dataMode: {
      type: String,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
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
        revision: [],
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
        vanishedFilter: ['existing', 'vanished'],
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
        if (filters.value[key] === undefined || filters.value[key] === null) {
          filters.value[key] = defaultFilters[key]
        }
      })
      // Нормализация vanishedFilter: если не массив — устанавливаем значение по умолчанию
      if (!Array.isArray(filters.value.vanishedFilter)) {
        filters.value.vanishedFilter = ['existing', 'vanished']
      }
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
      // Сырые данные для кросс-зависимых фильтров
      allEstatesForFilters: [], // Estate с Report_record + Settlement + Subtype_estate
      // Индексные мапы: key -> Set связанных id (полная денормализация)
      indexBySubtype: {},    // subtypeId -> Set<estateId>
      indexByReportRecord: {},// reportRecordId -> estate
      // Поиск
      searchDistrict: '',
      searchSettlementOld: '',
      searchSettlementModern: '',
      searchLandowner: '',
      searchMilitaryUnit: '',
      // Отслеживание изменений
      hasChanges: false,
      appliedFilters: null,
      vanishedEntitySets: null
    }
  },
  computed: {
    /**
     * Кросс-фильтр: применяет все активные фильтры КРОМЕ указанного (excludeKey)
     * и возвращает Set ID сущностей, доступных в оставшихся Estates.
     * Если excludeKey null — фильтрует по всем активным фильтрам.
     */
    _crossFilteredIds() {
      // excludeKey -> Set of entity IDs
      // Кэшируем на уровне вызова
      return (excludeKey, entityKey) => {
        const records = this.allEstatesForFilters
        if (!records || records.length === 0) return null

        const f = this.filters
        const activeFilters = []

        // Ревизии (фильтр по number → revisionId через маппинг)
        if (excludeKey !== 'revision' && f.revision && f.revision.length > 0) {
          const revMap = {}
          this.allRevisions.forEach(r => { revMap[r.number] = r.id })
          const ids = new Set(f.revision.map(n => revMap[n]).filter(Boolean))
          if (ids.size > 0) activeFilters.push(r => ids.has(r.revisionId))
        }

        // Районы
        if (excludeKey !== 'districts' && f.districts && f.districts.length > 0) {
          const ids = new Set(f.districts)
          activeFilters.push(r => ids.has(r.districtId))
        }

        // Старые названия НП
        if (excludeKey !== 'settlementNamesOld' && f.settlementNamesOld && f.settlementNamesOld.length > 0) {
          const ids = new Set(f.settlementNamesOld)
          activeFilters.push(r => ids.has(r.settlementNameOld))
        }

        // Современные названия НП
        if (excludeKey !== 'settlementNamesModern' && f.settlementNamesModern && f.settlementNamesModern.length > 0) {
          const ids = new Set(f.settlementNamesModern)
          activeFilters.push(r => ids.has(r.settlementNameModern))
        }

        // Статус НП (vanished)
        if (excludeKey !== 'vanishedFilter' && f.vanishedFilter && f.vanishedFilter.length === 1) {
          const target = f.vanishedFilter[0] === 'vanished'
          activeFilters.push(r => r.settlementVanished === target)
        }

        // Типы сословий
        if (excludeKey !== 'typeEstates' && f.typeEstates && f.typeEstates.length > 0) {
          const ids = new Set(f.typeEstates)
          activeFilters.push(r => ids.has(r.typeEstateId))
        }

        // Подтипы сословий
        if (excludeKey !== 'subtypeEstates' && f.subtypeEstates && f.subtypeEstates.length > 0) {
          const ids = new Set(f.subtypeEstates)
          activeFilters.push(r => ids.has(r.subtypeEstateId))
        }

        // Религии
        if (excludeKey !== 'religions' && f.religions && f.religions.length > 0) {
          const ids = new Set(f.religions)
          activeFilters.push(r => ids.has(r.religionId))
        }

        // Принадлежности
        if (excludeKey !== 'affiliations' && f.affiliations && f.affiliations.length > 0) {
          const ids = new Set(f.affiliations)
          activeFilters.push(r => ids.has(r.affiliationId))
        }

        // Волости
        if (excludeKey !== 'volosts' && f.volosts && f.volosts.length > 0) {
          const ids = new Set(f.volosts)
          activeFilters.push(r => r.volostId !== null && ids.has(r.volostId))
        }

        // Помещики
        if (excludeKey !== 'landowners' && f.landowners && f.landowners.length > 0) {
          const ids = new Set(f.landowners)
          activeFilters.push(r => r.landownerId !== null && ids.has(r.landownerId))
        }

        // Войсковые организации
        if (excludeKey !== 'militaryUnits' && f.militaryUnits && f.militaryUnits.length > 0) {
          const ids = new Set(f.militaryUnits)
          activeFilters.push(r => r.militaryUnitId !== null && ids.has(r.militaryUnitId))
        }

        if (activeFilters.length === 0) return null

        const result = new Set()
        for (const r of records) {
          if (activeFilters.every(fn => fn(r))) {
            const val = r[entityKey]
            if (val !== null && val !== undefined) result.add(val)
          }
        }
        return result
      }
    },

    filteredRevisions() {
      const allowed = this._crossFilteredIds('revision', 'revisionId')
      if (!allowed) return this.allRevisions
      return this.allRevisions.filter(r => allowed.has(r.id))
    },

    filteredDistricts() {
      const allowed = this._crossFilteredIds('districts', 'districtId')
      if (!allowed) return this.allDistricts
      return this.allDistricts.filter(d => allowed.has(d.id))
    },

    filteredSettlements() {
      if (!this.filters.districts || this.filters.districts.length === 0) {
        return this.allSettlements
      }
      return this.allSettlements.filter(s => this.filters.districts.includes(s.id_district))
    },

    filteredTypeEstates() {
      const cross = this._crossFilteredIds('typeEstates', 'typeEstateId')
      let items = this.allTypeEstates
      if (cross) items = items.filter(t => cross.has(t.id))
      return this._applyVanishedFilter(items, 'typeEstates')
    },

    filteredSubtypeEstates() {
      const cross = this._crossFilteredIds('subtypeEstates', 'subtypeEstateId')
      let items = this.allSubtypeEstates
      if (this.filters.typeEstates && this.filters.typeEstates.length > 0) {
        items = items.filter(s => this.filters.typeEstates.includes(s.id_type_estate))
      }
      if (cross) items = items.filter(s => cross.has(s.id))
      return this._applyVanishedFilter(items, 'subtypeEstates')
    },

    filteredReligions() {
      const cross = this._crossFilteredIds('religions', 'religionId')
      let items = this.allReligions
      if (cross) items = items.filter(r => cross.has(r.id))
      return this._applyVanishedFilter(items, 'religions')
    },

    filteredAffiliations() {
      const cross = this._crossFilteredIds('affiliations', 'affiliationId')
      let items = this.allAffiliations
      if (cross) items = items.filter(a => cross.has(a.id))
      return this._applyVanishedFilter(items, 'affiliations')
    },

    filteredVolosts() {
      const cross = this._crossFilteredIds('volosts', 'volostId')
      let items = this.allVolosts
      if (cross) items = items.filter(v => cross.has(v.id))
      return this._applyVanishedFilter(items, 'volosts')
    },

    filteredLandowners() {
      const cross = this._crossFilteredIds('landowners', 'landownerId')
      let items = this.allLandowners
      if (cross) items = items.filter(l => cross.has(l.id))
      return this._applyVanishedFilter(items, 'landowners')
    },

    filteredMilitaryUnits() {
      const cross = this._crossFilteredIds('militaryUnits', 'militaryUnitId')
      let items = this.allMilitaryUnits
      if (cross) items = items.filter(m => cross.has(m.id))
      return this._applyVanishedFilter(items, 'militaryUnits')
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

      // Ревизии
      if (this.filters.revision && this.filters.revision.length > 0) {
        if (this.filters.revision.length === 1) {
          // Одна ревизия
          const selectedRevision = this.allRevisions.find(r => r.number === this.filters.revision[0])
          if (selectedRevision) {
            activeFilters.push({
              type: 'revision',
              label: `Ревизия: ${selectedRevision.number} (${selectedRevision.year})`,
              value: this.filters.revision
            })
          }
        } else {
          // Несколько ревизий
          const revisionNames = this.filters.revision.map(num => {
            const revision = this.allRevisions.find(r => r.number === num)
            return revision ? `${revision.number} (${revition.year})` : `№:${num}`
          })
          activeFilters.push({
            type: 'revision',
            label: `Ревизии: ${revisionNames.join(', ')}`,
            value: this.filters.revision
          })
        }
      }

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

    // Все активные фильтры всегда видимы
    visibleActiveFilters() {
      return this.activeFiltersList
    }
  },
  mounted() {
    this.loadFilterOptions()
    this.loadFiltersFromURL()
  },
  watch: {
    filters: {
      handler() {
        this.hasChanges = true
        // НЕ вызываем debouncedApplyFilters автоматически —
        // фильтры применяются только по кнопке "Применить"
      },
      deep: true
    }
  },

  methods: {
    _applyVanishedFilter(allItems, entityType) {
      if (!this.vanishedEntitySets) return allItems
      if (!this.filters.vanishedFilter || this.filters.vanishedFilter.length !== 1) return allItems

      const target = this.filters.vanishedFilter[0] === 'vanished' ? 'vanished' : 'existing'
      const allowedIds = new Set(this.vanishedEntitySets[target]?.[entityType] || [])

      return allItems.filter(item => allowedIds.has(item.id))
    },

    async loadVanishedEntitySets() {
      try {
        const allData = []
        let from = 0
        const pageSize = 1000

        while (true) {
          const { data, error } = await supabase
            .from('Estate')
            .select(`
              id_subtype_estate,
              id_volost,
              id_landowner,
              id_military_unit,
              Subtype_estate!Estate_id_subtype_estate_fkey(
                id_type_estate,
                id_type_religion,
                id_type_affiliation
              ),
              Report_record!Estate_id_report_record_fkey(
                Settlement!Report_record_id_settlement_fkey(vanished)
              )
            `)
            .range(from, from + pageSize - 1)
            .order('id')

          if (error) throw error
          if (!data || data.length === 0) break

          allData.push(...data)
          from += pageSize
        }

        const vanished = { subtypeEstates: new Set(), typeEstates: new Set(), religions: new Set(), affiliations: new Set(), volosts: new Set(), landowners: new Set(), militaryUnits: new Set() }
        const existing = { subtypeEstates: new Set(), typeEstates: new Set(), religions: new Set(), affiliations: new Set(), volosts: new Set(), landowners: new Set(), militaryUnits: new Set() }

        allData.forEach(e => {
          const isVanished = e.Report_record?.Settlement?.vanished === true
          const target = isVanished ? vanished : existing

          target.subtypeEstates.add(e.id_subtype_estate)
          if (e.Subtype_estate) {
            target.typeEstates.add(e.Subtype_estate.id_type_estate)
            target.religions.add(e.Subtype_estate.id_type_religion)
            target.affiliations.add(e.Subtype_estate.id_type_affiliation)
          }
          if (e.id_volost) target.volosts.add(e.id_volost)
          if (e.id_landowner) target.landowners.add(e.id_landowner)
          if (e.id_military_unit) target.militaryUnits.add(e.id_military_unit)
        })

        this.vanishedEntitySets = {
          vanished: {
            subtypeEstates: [...vanished.subtypeEstates],
            typeEstates: [...vanished.typeEstates],
            religions: [...vanished.religions],
            affiliations: [...vanished.affiliations],
            volosts: [...vanished.volosts],
            landowners: [...vanished.landowners],
            militaryUnits: [...vanished.militaryUnits]
          },
          existing: {
            subtypeEstates: [...existing.subtypeEstates],
            typeEstates: [...existing.typeEstates],
            religions: [...existing.religions],
            affiliations: [...existing.affiliations],
            volosts: [...existing.volosts],
            landowners: [...existing.landowners],
            militaryUnits: [...existing.militaryUnits]
          }
        }
      } catch (error) {
        console.error('Error loading vanished entity sets:', error)
        this.vanishedEntitySets = null
      }
    },

    /**
     * Загружает плоскую денормализованную таблицу всех Estate
     * со всеми связями для кросс-фильтрации.
     * Результат: массив объектов {revisionId, districtId, settlementNameOld, ...}
     */
    loadCrossFilterData() {
      return Promise.all([
        // Estate: только FK-ключи
        supabase.from('Estate').select('id, id_report_record, id_subtype_estate, id_volost, id_landowner, id_military_unit'),
        // Report_record: связь с ревизией и НП
        supabase.from('Report_record').select('id, id_revision_report, id_settlement'),
        // Settlement: названия, район, статус
        supabase.from('Settlement').select('id, name_old, name_modern, id_district, vanished'),
        // Subtype_estate: типы, религия, принадлежность
        supabase.from('Subtype_estate').select('id, id_type_estate, id_type_religion, id_type_affiliation')
      ]).then(([
        { data: estates, error: eErr },
        { data: reportRecords, error: rErr },
        { data: settlements, error: sErr },
        { data: subtypes, error: stErr }
      ]) => {
        if (eErr || rErr || sErr || stErr) throw eErr || rErr || sErr || stErr

        // Индексы для быстрого поиска
        const reportMap = {}
        ;(reportRecords || []).forEach(r => { reportMap[r.id] = r })

        const settlementMap = {}
        ;(settlements || []).forEach(s => { settlementMap[s.id] = s })

        const subtypeMap = {}
        ;(subtypes || []).forEach(s => { subtypeMap[s.id] = s })

        const result = []
        ;(estates || []).forEach(estate => {
          const reportRecord = reportMap[estate.id_report_record]
          if (!reportRecord) return

          const settlement = settlementMap[reportRecord.id_settlement]
          const subtype = subtypeMap[estate.id_subtype_estate]

          result.push({
            estateId: estate.id,
            revisionId: reportRecord.id_revision_report,
            districtId: settlement ? settlement.id_district : null,
            settlementNameOld: settlement ? settlement.name_old : null,
            settlementNameModern: settlement ? settlement.name_modern : null,
            settlementVanished: settlement ? settlement.vanished : null,
            typeEstateId: subtype ? subtype.id_type_estate : null,
            subtypeEstateId: estate.id_subtype_estate,
            religionId: subtype ? subtype.id_type_religion : null,
            affiliationId: subtype ? subtype.id_type_affiliation : null,
            volostId: estate.id_volost,
            landownerId: estate.id_landowner,
            militaryUnitId: estate.id_military_unit
          })
        })

        this.allEstatesForFilters = result
      }).catch(error => {
        console.error('Error loading cross-filter data:', error)
        // Не фатально — фильтры просто покажут все опции
        this.allEstatesForFilters = []
      })
    },

    loadFilterOptions() {
      const store = this.$store
      Promise.all([
        store.dispatch('reference/loadRevisions').then(data => {
          this.allRevisions = data || []
          if (this.filters && Array.isArray(this.filters.revision) && Array.isArray(this.allRevisions)) {
            const byId = new Map(this.allRevisions.map(r => [r.id, r.number]))
            const byNumber = new Set(this.allRevisions.map(r => r.number))
            const converted = this.filters.revision.map(v => byId.has(v) ? byId.get(v) : v)
            this.filters.revision = converted.filter(v => byNumber.has(v))
          }
        }),
        store.dispatch('reference/loadDistricts').then(data => { this.allDistricts = data || [] }),
        store.dispatch('reference/loadSettlements').then(data => {
          this.allSettlements = (data || []).map(s => ({ ...s, name: s.name_modern || s.name_old }))
        }),
        store.dispatch('reference/loadTypeEstates').then(data => { this.allTypeEstates = data || [] }),
        store.dispatch('reference/loadSubtypeEstates').then(data => { this.allSubtypeEstates = data || [] }),
        store.dispatch('reference/loadTypeReligions').then(data => { this.allReligions = data || [] }),
        store.dispatch('reference/loadTypeAffiliations').then(data => { this.allAffiliations = data || [] }),
        store.dispatch('reference/loadVolosts').then(data => { this.allVolosts = data || [] }),
        store.dispatch('reference/loadLandowners').then(data => {
          this.allLandowners = (data || []).map(l => ({ ...l, name: l.description || l.person || 'Без названия' }))
        }),
        store.dispatch('reference/loadMilitaryUnits').then(data => {
          this.allMilitaryUnits = (data || []).map(m => ({ ...m, name: m.description || m.person || 'Без названия' }))
        })
      ]).then(() => {
        // Загружаем кросс-фильтр данные (связи Estate→Report_record→Settlement+Subtype)
        this.loadCrossFilterData()
        // Загружаем маппинг сущностей к исчезнувшим/существующим НП
        this.loadVanishedEntitySets()
        // Эмитируем options-loaded только когда ВСЕ справочники загружены
        this.$emit('options-loaded', {
          revisions: this.allRevisions,
          districts: this.allDistricts,
          settlements: this.allSettlements,
          typeEstates: this.allTypeEstates,
          subtypeEstates: this.allSubtypeEstates,
          religions: this.allReligions,
          affiliations: this.allAffiliations,
          volosts: this.allVolosts
        })
      }).catch(error => {
        console.error('Error loading filter options:', error)
        ElMessage.error('Ошибка загрузки опций фильтров')
      })
    },
    
    debouncedApplyFilters() {
      // Очищаем предыдущий таймаут
      if (this._debounceTimer) {
        clearTimeout(this._debounceTimer)
      }
      // Устанавливаем новый таймаут — 400ms для числовых фильтров (input-number), 200ms для чекбоксов
      const delay = this._lastChangeWasNumeric ? 400 : 200
      this._debounceTimer = setTimeout(() => {
        this._applyFiltersNow()
      }, delay)
    },

    _applyFiltersNow() {
      // Глубокая копия через JSON чтобы избежать Proxy-ссылок Vue 3
      const filtersCopy = JSON.parse(JSON.stringify(this.filters))
      // Применяем фильтры и загружаем данные
      this.$emit('apply-filters-and-load', filtersCopy)
      // Обновляем URL
      this.updateURLWithFilters()
      // Сохраняем в localStorage
      this.applyStoredFilters()
      // Сбрасываем флаг изменений
      this.hasChanges = false
    },
    
    resetFilters() {
      // Используем метод из composable для сброса фильтров
      this.resetStoredFilters()
      // При сбросе сразу применяем
      this.$emit('apply-filters-and-load', { ...this.filters })
      // Обновляем URL
      this.updateURLWithFilters()
      // Сохраняем в localStorage
      this.applyStoredFilters()
      this.hasChanges = false
    },
    
    selectAllDistricts() {
      this.filters.districts = this.filteredDistrictsSearch.map(d => d.id)
    },
    
    selectAllTypeEstates() {
      this.filters.typeEstates = this.filteredTypeEstates.map(t => t.id)
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

    selectAllRevisions() {
      this.filters.revision = this.filteredRevisions.map(r => r.number)
    },

    selectAllVanished() {
      this.filters.vanishedFilter = ['existing', 'vanished']
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
          // Декодируем URL-параметр перед парсингом JSON
          const decodedFiltersParam = decodeURIComponent(filtersParam)
          const urlFilters = JSON.parse(decodedFiltersParam)

          // Валидация URL фильтров
          if (urlFilters && typeof urlFilters === 'object') {
            // Импортируем фильтры из URL, сохраняя только нужные поля
            const allowedFields = [
              'revision', 'districts', 'settlementNamesOld', 'settlementNamesModern',
              'typeEstates', 'subtypeEstates', 'religions', 'affiliations',
              'volosts', 'landowners', 'militaryUnits',
              'maleEnabled', 'femaleEnabled', 'populationEnabled', 'estatesCountEnabled',
              'maleMin', 'maleMax', 'femaleMin', 'femaleMax',
              'populationMin', 'populationMax', 'estatesCountMin', 'estatesCountMax',
              'vanishedFilter'
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
          this.filters.revision ||
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
        this.filters.estatesCountEnabled ||
        (this.filters.vanishedFilter && this.filters.vanishedFilter.length === 1)

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

    // Восстановление фильтров (вызывается из родительского компонента)
    restoreFilters(savedFilters) {
      if (!savedFilters || typeof savedFilters !== 'object') return
      
      // Применяем сохраненные фильтры
      Object.keys(savedFilters).forEach(key => {
        if (this.filters.hasOwnProperty(key)) {
          this.filters[key] = savedFilters[key]
        }
      })
      
      // Отключаем флаг изменений, так как это восстановление
      this.hasChanges = false
      
    },

    // Удаление конкретного фильтра
    closeDropdown() {
      document.body.click()
    },

    removeFilter(filter) {
      switch (filter.type) {
        case 'revision':
          this.filters.revision = []
          break
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
      background-color: var(--bg-secondary);
      border-color: var(--border-color);
      color: var(--text-primary);
      
      &:hover {
        background-color: var(--bg-tertiary);
        border-color: var(--border-hover);
        color: var(--text-primary);
      }
      
      &:disabled {
        background-color: var(--bg-primary);
        border-color: var(--border-color);
        color: var(--text-disabled);
        opacity: 0.6;
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
  background-color: var(--el-bg-color) !important;
  border: 1px solid var(--el-border-color) !important;
  box-shadow: var(--el-box-shadow) !important;
  
  .dropdown-close {
    position: absolute;
    top: 4px;
    right: 4px;
    z-index: 10;
    
    .el-button {
      padding: 4px;
      min-width: auto;
    }
  }
  
  .filter-search {
    padding: 3px;
    border-bottom: 1px solid var(--el-border-color);
    background-color: var(--el-bg-color);
    
    .el-input__wrapper {
      background-color: var(--el-fill-color-light) !important;
      box-shadow: none !important;
      border: 1px solid var(--el-border-color);
      
      &:hover {
        background-color: var(--el-fill-color-light) !important;
        border-color: var(--el-color-primary);
      }
      
      .el-input__inner {
        color: var(--el-text-color-primary);
      }
    }
  }
  
  .filter-options {
    max-height: 300px;
    overflow-y: auto;
    padding: 3px;
    background-color: var(--el-bg-color);
    
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
        background-color: var(--el-fill-color-light);
      }
      
      .el-checkbox__input {
        .el-checkbox__inner {
          background-color: var(--el-fill-color-light);
          border: 2px solid var(--el-border-color);
        }
        
        &.is-checked .el-checkbox__inner {
          background-color: var(--el-color-primary);
          border-color: var(--el-color-primary);
        }
      }
      
      .el-checkbox__label {
        color: var(--el-text-color-primary);
        font-weight: 400;
      }
    }
  }
  
  .filter-actions-dropdown {
    display: flex;
    justify-content: space-between;
    padding: 3px;
    border-top: 1px solid var(--el-border-color);
    background-color: var(--el-bg-color);
    
    .el-button {
      color: var(--el-text-color-regular);

      &:hover {
        color: var(--el-color-primary);
      }

      &.el-button--danger {
        color: var(--el-color-danger);

        &:hover {
          color: var(--el-color-danger);
          opacity: 0.8;
        }
      }
    }
  }
}

// Пульсация кнопки "Применить" при изменениях
@keyframes pulse-moderate {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 var(--accent-primary);
  }
  25% {
    transform: scale(1.025);
    box-shadow: 0 0 0 5px rgba(var(--accent-primary-rgb, 64, 158, 255), 0.5);
  }
  50% {
    transform: scale(1.04);
    box-shadow: 0 0 0 7.5px rgba(var(--accent-primary-rgb, 64, 158, 255), 0);
    filter: brightness(1.08);
  }
  75% {
    transform: scale(1.025);
    box-shadow: 0 0 0 5px rgba(var(--accent-primary-rgb, 64, 158, 255), 0.5);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 var(--accent-primary);
  }
}

// Пульсация кнопки "Применить" при наличии активных фильтров
@keyframes pulse-subtle {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 var(--accent-secondary);
  }
  50% {
    transform: scale(1.01);
    box-shadow: 0 0 0 3px rgba(var(--accent-secondary-rgb, 34, 197, 94), 0.3);
    filter: brightness(1.02);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 var(--accent-secondary);
  }
}

.filter-actions {
  :deep(.el-button.has-changes) {
    animation: pulse-moderate 1s infinite;
    background-color: var(--accent-primary) !important;
    border-color: var(--accent-primary) !important;
    color: white !important;
    font-weight: 600 !important;
    box-shadow: 0 0 7.5px rgba(var(--accent-primary-rgb, 64, 158, 255), 0.8);
  }

  :deep(.el-button.has-active-filters:not(.has-changes)) {
    animation: pulse-subtle 2s infinite;
    background-color: var(--accent-secondary) !important;
    border-color: var(--accent-secondary) !important;
    color: white !important;
    font-weight: 500 !important;
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
      height: auto;
      min-height: 22px;
      line-height: 1.3;
      padding: 2px 6px;

      :deep(.el-tag__content) {
        white-space: normal;
        word-wrap: break-word;
        word-break: break-word;
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

<style lang="scss">
// Глобальные стили для dropdown меню (они рендерятся вне компонента)
.filter-dropdown-menu.el-dropdown-menu {
  max-width: 300px;
  background-color: var(--el-bg-color) !important;
  border: 2px solid var(--el-border-color) !important;
  box-shadow: var(--el-box-shadow) !important;
  
  .filter-search {
    padding: 3px;
    border-bottom: 2px solid var(--el-border-color);
    background-color: var(--el-bg-color);
    
    .el-input__wrapper {
      background-color: var(--el-fill-color-light) !important;
      box-shadow: none !important;
      border: 1px solid var(--el-border-color) !important;
      
      &:hover {
        background-color: var(--el-fill-color-light) !important;
        border-color: var(--el-color-primary) !important;
      }
      
      .el-input__inner {
        color: var(--el-text-color-primary) !important;
      }
    }
  }
  
  .filter-options {
    max-height: 300px;
    overflow-y: auto;
    padding: 3px;
    background-color: var(--el-bg-color);
    
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
        background-color: var(--el-fill-color-light);
        outline: 1px solid var(--el-border-color);
      }
      
      .el-checkbox__input {
        .el-checkbox__inner {
          background-color: white;
          border: 2px solid var(--el-border-color) !important;
        }
        
        &.is-checked .el-checkbox__inner {
          background-color: var(--el-color-primary) !important;
          border-color: var(--el-color-primary) !important;
        }
      }
      
      .el-checkbox__label {
        color: var(--el-text-color-primary) !important;
        font-weight: 500;
      }
    }
  }
  
  .filter-actions-dropdown {
    display: flex;
    justify-content: space-between;
    padding: 3px;
    border-top: 2px solid var(--el-border-color);
    background-color: var(--el-bg-color);
    
    .el-button {
      color: var(--el-text-color-regular);
      font-weight: 500;

      &:hover {
        color: var(--el-color-primary);
      }

      &.el-button--danger {
        color: var(--el-color-danger);

        &:hover {
          color: var(--el-color-danger);
          opacity: 0.8;
        }
      }
    }
  }
}

// Дополнительная контрастность для светлой темы
:root {
  .filter-dropdown-menu.el-dropdown-menu {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15) !important;
    
    .el-checkbox {
      // Очень светлый hover для светлой темы - СВЕТЛО-СЕРЫЙ!
      &:hover {
        background-color: hsl(0, 0%, 97%) !important;
        outline: none !important;
      }
      
      .el-checkbox__input {
        // Отступ 2px между чекбоксом и текстом
        margin-right: 2px;
        
        .el-checkbox__inner {
          // Белый фон чекбокса
          background-color: white !important;
          border-color: hsl(214, 20%, 80%) !important;
        }
        
        &.is-checked .el-checkbox__inner {
          // Синий чекбокс при выборе
          background-color: var(--el-color-primary) !important;
          border-color: var(--el-color-primary) !important;
        }
      }
      
      // Очень светлые выбранные элементы для светлой темы
      .el-checkbox__input.is-checked {
        & + .el-checkbox__label {
          background-color: hsl(237, 60%, 96%);
          padding: 2px 6px;
          margin-left: -4px;
          border-radius: 3px;
          color: hsl(217, 25%, 45%) !important;
          font-weight: 600;
        }
      }
      
      .el-checkbox__label {
        // Светло-серый текст для мягкого контраста
        color: hsl(217, 20%, 50%) !important;
        font-weight: 400;
      }
    }
  }
}

// Темная тема - темные цвета
[data-theme="dark"] {
  .filter-dropdown-menu.el-dropdown-menu {
    .el-checkbox {
      &:hover {
        background-color: hsl(215, 25%, 22%);
        outline: 1px solid var(--el-border-color);
      }
      
      .el-checkbox__input {
        .el-checkbox__inner {
          background-color: hsl(215, 25%, 18%) !important;
          border-color: hsl(215, 19%, 45%) !important;
        }
      }
      
      .el-checkbox__input.is-checked {
        & + .el-checkbox__label {
          background-color: hsl(237, 50%, 25%);
          padding: 2px 6px;
          margin-left: -6px;
          border-radius: 3px;
        }
      }
    }
  }
}
</style>