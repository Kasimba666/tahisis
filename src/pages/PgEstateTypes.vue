<template>
  <div class="pg-estate-types">
    <h3>Типы сословий</h3>

    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="Общие типы" name="types">
        <div class="table-info">
          <el-alert
              type="info"
              :closable="false"
              show-icon
          >
            <template #title>
              Всего общих типов: {{ totalRecords }}
            </template>
          </el-alert>
        </div>

        <div class="table-header">
          <el-button type="success" size="small" @click="addRow">Добавить общий тип</el-button>
        </div>

        <el-table :data="tableData" style="width: 100%" default-sort="{prop: 'name', order: 'ascending'}">
      <el-table-column prop="id" label="ID" width="60" sortable />

      <el-table-column prop="name" label="Название" sortable resizable min-width="150">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-input v-model="editRow.name" />
          </div>
          <div v-else>
            {{ row.name }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Действия" width="280" fixed="right">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-button type="success" size="small" @click="updateRow(row.id)">Сохранить</el-button>
            <el-button type="warning" size="small" @click="cancelEdit">Отменить</el-button>
          </div>
          <div v-else>
            <el-button type="info" size="small" @click="showTypeDetails(row)">Детали</el-button>
            <el-button type="primary" size="small" @click="startEdit(row)">Редактировать</el-button>
            <el-button type="danger" size="small" @click="deleteRow(row.id)">Удалить</el-button>
          </div>
        </template>
      </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Подтипы сословий (обобщённые)" name="subtypes">
        <div class="table-info">
          <el-alert type="info" :closable="false" show-icon>
            <template #title>
              Всего подтипов: {{ subtypeTableData.length }}
            </template>
          </el-alert>
        </div>

        <div class="table-header">
          <el-button type="success" size="small" @click="addSubtype">Добавить подтип</el-button>
        </div>

        <el-table :data="subtypeTableData" style="width: 100%" default-sort="{prop: 'name', order: 'ascending'}" @row-click="showSubtypeSourcesDialog">
          <el-table-column prop="id" label="ID" width="60" sortable />
          
          <el-table-column prop="name" label="Название" sortable resizable min-width="150">
            <template #default="{ row }">
              <div v-if="editSubtypeId === row.id">
                <el-input v-model="editSubtype.name" />
              </div>
              <div v-else>
                {{ row.name }}
              </div>
            </template>
          </el-table-column>


          <el-table-column prop="id_type_religion" label="Религия" sortable resizable min-width="150">
            <template #default="{ row }">
              <div v-if="editSubtypeId === row.id">
                <el-select v-model="editSubtype.id_type_religion" placeholder="Выберите религию" filterable>
                  <el-option
                    v-for="religion in religionList"
                    :key="religion.id"
                    :label="religion.name"
                    :value="religion.id"
                  />
                </el-select>
              </div>
              <div v-else>
                {{ getReligionName(row.id_type_religion) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="id_type_affiliation" label="Принадлежность" sortable resizable min-width="150">
            <template #default="{ row }">
              <div v-if="editSubtypeId === row.id">
                <el-select v-model="editSubtype.id_type_affiliation" placeholder="Выберите принадлежность" filterable>
                  <el-option
                    v-for="affiliation in affiliationList"
                    :key="affiliation.id"
                    :label="affiliation.name"
                    :value="affiliation.id"
                  />
                </el-select>
              </div>
              <div v-else>
                {{ getAffiliationName(row.id_type_affiliation) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Цвет" width="120">
            <template #default="{ row }">
              <div v-if="editSubtypeId === row.id">
                <el-color-picker v-model="editSubtype.color" size="small" show-alpha @change="onSubtypeColorChange" />
              </div>
              <div v-else>
                <div class="color-preview" :style="{ backgroundColor: row.color || 'hsl(0, 0%, 50%)' }"></div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Действия" width="200" fixed="right">
            <template #default="{ row }">
              <div v-if="editSubtypeId === row.id">
                <el-button type="success" size="small" @click.stop="updateSubtype(row.id)">Сохранить</el-button>
                <el-button type="warning" size="small" @click.stop="cancelSubtypeEdit">Отменить</el-button>
              </div>
              <div v-else>
                <el-button type="primary" size="small" @click.stop="startSubtypeEdit(row)">Редактировать</el-button>
                <el-button type="danger" size="small" @click.stop="deleteSubtype(row.id)">Удалить</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Подтипы из ревизий" name="sources">
        <div class="table-info">
          <el-alert type="info" :closable="false" show-icon>
            <template #title>
              Всего источников: {{ sourceTableData.length }}
            </template>
          </el-alert>
        </div>

        <div class="table-header">
          <el-button type="success" size="small" @click="addSource">Добавить источник</el-button>
        </div>

        <el-table :data="sourceTableData" style="width: 100%" default-sort="{prop: 'name', order: 'ascending'}">
          <el-table-column prop="id" label="ID" width="60" sortable />
          
          <el-table-column prop="name" label="Название из ревизии" sortable resizable min-width="200">
            <template #default="{ row }">
              <div v-if="editSourceId === row.id">
                <el-input v-model="editSource.name" />
              </div>
              <div v-else>
                {{ row.name }}
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="id_subtype_estate" label="Соответствует подтипу" sortable resizable min-width="200">
            <template #default="{ row }">
              <div v-if="editSourceId === row.id">
                <el-select v-model="editSource.id_subtype_estate" placeholder="Выберите подтип" filterable>
                  <el-option
                    v-for="subtype in subtypeTableData"
                    :key="subtype.id"
                    :label="subtype.name"
                    :value="subtype.id"
                  />
                </el-select>
              </div>
              <div v-else>
                {{ getSubtypeName(row.id_subtype_estate) }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Действия" width="200">
            <template #default="{ row }">
              <div v-if="editSourceId === row.id">
                <el-button type="success" size="small" @click="updateSource(row.id)">Сохранить</el-button>
                <el-button type="warning" size="small" @click="cancelSourceEdit">Отменить</el-button>
              </div>
              <div v-else>
                <el-button type="primary" size="small" @click="startSourceEdit(row)">Редактировать</el-button>
                <el-button type="danger" size="small" @click="deleteSource(row.id)">Удалить</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="Загрузка данных" name="upload">
        <ExcelEstateTypesUpload @dataProcessed="onDataProcessed" />
      </el-tab-pane>
    </el-tabs>

    <!-- Диалог для отображения источников подтипа -->
    <el-dialog
      v-model="sourcesDialogVisible"
      :title="`Источники для подтипа: ${selectedSubtypeName}`"
      width="600px"
    >
      <div v-if="selectedSubtypeSources.length > 0">
        <el-table :data="selectedSubtypeSources" style="width: 100%">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="name" label="Название из ревизии" />
        </el-table>
      </div>
      <div v-else style="text-align: center; padding: 20px; color: var(--text-secondary);">
        Нет связанных источников
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { supabase } from "@/services/supabase"
import ExcelEstateTypesUpload from "@/components/ExcelEstateTypesUpload.vue"
import { usePageState } from '@/store/pageState.js'

export default {
  name: "PgEstateTypes",
  components: {
    ExcelEstateTypesUpload
  },
  data() {
    const pageState = usePageState('pg-estate-types')
    
    return {
      activeTab: pageState.activeTab.get() || 'types',
      tableData: [],
      editRowId: null,
      editRow: {},
      subtypeTableData: [],
      editSubtypeId: null,
      editSubtype: {},
      sourceTableData: [],
      editSourceId: null,
      editSource: {},
      sourcesDialogVisible: false,
      selectedSubtypeName: '',
      selectedSubtypeSources: [],
      religionList: [],
      affiliationList: []
    }
  },
  computed: {
    totalRecords() {
      return this.tableData.length
    }
  },
  methods: {
    // Валидация СТРОГОГО HSL формата цвета для базы данных
    isValidHslColor(color) {
      console.log('isValidHslColor called with:', color, 'type:', typeof color)

      if (typeof color !== 'string') {
        console.log('Color is not a string')
        return false
      }

      // Проверяем ТОЛЬКО HSL формат (строго для базы данных)
      const hslMatch = color.match(/^hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)$/)
      if (hslMatch) {
        const h = parseInt(hslMatch[1])
        const s = parseInt(hslMatch[2])
        const l = parseInt(hslMatch[3])
        const isValid = h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100
        console.log('HSL match:', hslMatch, 'values:', {h, s, l}, 'valid:', isValid)
        return isValid
      }

      // Другие форматы (hex, rgb) считаем НЕВАЛИДНЫМИ для базы данных
      console.log('Non-HSL color format - needs conversion')
      return false
    },

    // Обеспечить СТРОГИЙ HSL формат цвета для базы данных
    ensureHslFormatForDatabase(color) {
      console.log('ensureHslFormatForDatabase called with:', color)

      // Если цвет уже в правильном HSL формате, возвращаем как есть
      if (this.isValidHslColor(color)) {
        console.log('Color is already valid HSL:', color)
        return color
      }

      // Если цвет в hex формате, конвертируем в HSL
      if (color.startsWith('#')) {
        console.log('Converting hex color:', color)
        const hsl = this.hexToHsl(color)
        console.log('Converted to HSL:', hsl)
        return hsl
      }

      // Если цвет в rgb/rgba формате, конвертируем в HSL
      if (color.startsWith('rgb')) {
        console.log('Converting RGB color:', color)
        const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (rgbMatch) {
          const r = parseInt(rgbMatch[1])
          const g = parseInt(rgbMatch[2])
          const b = parseInt(rgbMatch[3])
          const hsl = this.rgbToHsl(r, g, b)
          console.log('Converted RGB to HSL:', hsl)
          return hsl
        }
      }

      // Для всех неправильных форматов возвращаем белый цвет
      console.log('Invalid color format, returning white')
      return 'hsl(180, 0%, 100%)'
    },

    // Конвертировать hex цвет в HSL
    hexToHsl(hex) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return this.rgbToHsl(r, g, b)
    },

    // Конвертировать RGB в HSL
    rgbToHsl(r, g, b) {
      console.log('rgbToHsl called with:', {r, g, b})

      r /= 255
      g /= 255
      b /= 255

      console.log('Normalized RGB:', {r, g, b})

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h, s, l = (max + min) / 2

      console.log('Max:', max, 'Min:', min, 'Initial L:', l)

      if (max === min) {
        h = s = 0 // achromatic
        console.log('Achromatic color')
      } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        console.log('Delta:', d, 'Saturation:', s)

        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break
          case g: h = (b - r) / d + 2; break
          case b: h = (r - g) / d + 4; break
          default: h = 0
        }
        h /= 6
        console.log('Hue before normalization:', h)
      }

      h = Math.round(h * 360)
      s = Math.round(s * 100)
      l = Math.round(l * 100)

      const result = `hsl(${h}, ${s}%, ${l}%)`
      console.log('Final HSL result:', result)
      return result
    },

    async fetchData() {
      const { data, error } = await supabase
          .from("Type_estate")
          .select("*")
          .order('id', { ascending: true })

      if (error) {
        console.error('Error fetching estate types:', error)
        return
      }

      // Безопасно обрабатываем цвета из базы данных
      this.tableData = (data || []).map(row => ({
        ...row,
        // Если цвет неправильного формата, показываем белый
        color: this.isValidHslColor(row.color) ? row.color : 'hsl(180, 0%, 100%)'
      }))

      console.log('Loaded estate types with validated colors:', this.tableData)
    },

    startEdit(row) {
      this.editRowId = row.id
      // Безопасно копируем данные для редактирования
      this.editRow = {
        ...row,
        // Если цвет неправильного формата, используем белый для редактирования
        color: this.isValidHslColor(row.color) ? row.color : 'hsl(180, 0%, 100%)'
      }
    },

    cancelEdit() {
      this.editRowId = null
      this.editRow = {}
      // Перезагружаем данные с безопасной обработкой цветов
      this.fetchData()
    },

    async updateRow(id) {
      console.log('Updating row:', id, 'with color:', this.editRow.color)

      // Конвертируем цвет в СТРОГИЙ HSL формат для базы данных
      const hslColorForDB = this.ensureHslFormatForDatabase(this.editRow.color)
      console.log('Converted color for DB:', hslColorForDB)

      const { error } = await supabase
          .from("Type_estate")
          .update({
            name: this.editRow.name,
            color: hslColorForDB
          })
          .eq("id", id)

      if (!error) {
        console.log('Successfully updated estate type')
        this.cancelEdit()
      } else {
        console.error('Error updating estate type:', error)
      }
    },

    async deleteRow(id) {
      const { error } = await supabase
          .from("Type_estate")
          .delete()
          .eq("id", id)

      if (!error) {
        // Перезагружаем данные с безопасной обработкой цветов
        this.fetchData()
      } else {
        console.error('Error deleting estate type:', error)
      }
    },

    async addRow() {
      // Конвертируем цвет в СТРОГИЙ HSL формат для базы данных
      const hslColorForDB = this.ensureHslFormatForDatabase("hsl(0, 0%, 50%)")

      const { data, error } = await supabase
          .from("Type_estate")
          .insert([
            {
              name: "Новый тип",
              color: hslColorForDB
            }
          ])
          .select()

      if (!error && data?.length) {
        this.tableData.push(data[0])
        this.startEdit(data[0])
      } else {
        console.error('Error adding estate type:', error)
      }
    },

    // Обработчик изменения цвета в селекторе
    onColorChange(newColor) {
      console.log('Color changed in picker:', newColor)
      // Принудительно обновляем локальное состояние для немедленного отображения
      this.$nextTick(() => {
        this.editRow.color = newColor
        console.log('Updated editRow.color:', this.editRow.color)
      })
    },

    // === Методы для работы с подтипами сословий ===
    
    async fetchSubtypes() {
      const { data, error } = await supabase
        .from('Subtype_estate')
        .select('*')
        .order('id', { ascending: true })

      if (error) {
        console.error('Error fetching subtypes:', error)
        return
      }

      // Для каждого подтипа загружаем связанные источники
      const subtypesWithSources = await Promise.all(
        (data || []).map(async (row) => {
          const { data: sources, error: sourcesError } = await supabase
            .from('Subtype_estate_source')
            .select('id, name')
            .eq('id_subtype_estate', row.id)

          if (sourcesError) {
            console.error('Error fetching sources for subtype:', row.id, sourcesError)
          }

          return {
            ...row,
            color: this.isValidHslColor(row.color) ? row.color : 'hsl(0, 0%, 50%)',
            sources: (sources || []).map(s => s.name)
          }
        })
      )

      this.subtypeTableData = subtypesWithSources
      
      console.log('Loaded subtypes with sources:')
      this.subtypeTableData.forEach(row => {
        console.log(`ID: ${row.id}, Name: ${row.name}, Sources: ${row.sources.join(' | ')}`)
      })
    },

    startSubtypeEdit(row) {
      this.editSubtypeId = row.id
      this.editSubtype = {
        ...row,
        color: this.isValidHslColor(row.color) ? row.color : 'hsl(0, 0%, 50%)'
      }
    },

    cancelSubtypeEdit() {
      this.editSubtypeId = null
      this.editSubtype = {}
      this.fetchSubtypes()
    },

    async updateSubtype(id) {
      const hslColorForDB = this.ensureHslFormatForDatabase(this.editSubtype.color)

      const { error } = await supabase
        .from('Subtype_estate')
        .update({
          name: this.editSubtype.name,
          color: hslColorForDB,
          id_type_religion: this.editSubtype.id_type_religion,
          id_type_affiliation: this.editSubtype.id_type_affiliation
        })
        .eq('id', id)

      if (!error) {
        this.cancelSubtypeEdit()
      } else {
        console.error('Error updating subtype:', error)
      }
    },

    async deleteSubtype(id) {
      if (!confirm('Удалить этот подтип сословия?')) return

      const { error } = await supabase
        .from('Subtype_estate')
        .delete()
        .eq('id', id)

      if (!error) {
        this.fetchSubtypes()
      } else {
        console.error('Error deleting subtype:', error)
      }
    },

    async addSubtype() {
      const hslColorForDB = this.ensureHslFormatForDatabase('hsl(0, 0%, 50%)')

      // Используем первые доступные значения из справочников или null
      const { data, error } = await supabase
        .from('Subtype_estate')
        .insert([{
          name: 'Новый подтип',
          color: hslColorForDB,
          id_type_estate: this.tableData.length > 0 ? this.tableData[0].id : null,
          id_type_religion: this.religionList.length > 0 ? this.religionList[0].id : null,
          id_type_affiliation: this.affiliationList.length > 0 ? this.affiliationList[0].id : null
        }])
        .select()

      if (!error && data?.length) {
        await this.fetchSubtypes()
        const newSubtype = this.subtypeTableData.find(s => s.id === data[0].id)
        if (newSubtype) {
          this.startSubtypeEdit(newSubtype)
        }
      } else {
        console.error('Error adding subtype:', error)
      }
    },

    onSubtypeColorChange(newColor) {
      this.$nextTick(() => {
        this.editSubtype.color = newColor
      })
    },

    // === Методы для работы с источниками (Subtype_estate_source) ===
    
    async fetchSources() {
      const { data, error } = await supabase
        .from('Subtype_estate_source')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching sources:', error)
        return
      }

      this.sourceTableData = data || []
      console.log('Loaded sources:', this.sourceTableData.length)
    },

    getSubtypeName(subtypeId) {
      if (!subtypeId) return 'Не указано'
      const subtype = this.subtypeTableData.find(s => s.id === subtypeId)
      return subtype ? subtype.name : `ID: ${subtypeId}`
    },

    startSourceEdit(row) {
      this.editSourceId = row.id
      this.editSource = { ...row }
    },

    cancelSourceEdit() {
      this.editSourceId = null
      this.editSource = {}
      this.fetchSources()
    },

    async updateSource(id) {
      const { error } = await supabase
        .from('Subtype_estate_source')
        .update({
          name: this.editSource.name,
          id_subtype_estate: this.editSource.id_subtype_estate
        })
        .eq('id', id)

      if (!error) {
        this.cancelSourceEdit()
        // Обновляем также подтипы, чтобы показать новые связи
        this.fetchSubtypes()
      } else {
        console.error('Error updating source:', error)
      }
    },

    async deleteSource(id) {
      if (!confirm('Удалить этот источник?')) return

      const { error } = await supabase
        .from('Subtype_estate_source')
        .delete()
        .eq('id', id)

      if (!error) {
        this.fetchSources()
        this.fetchSubtypes()
      } else {
        console.error('Error deleting source:', error)
      }
    },

    async addSource() {
      const { data, error } = await supabase
        .from('Subtype_estate_source')
        .insert([{
          name: 'Новый источник',
          id_subtype_estate: this.subtypeTableData.length > 0 ? this.subtypeTableData[0].id : null
        }])
        .select()

      if (!error && data?.length) {
        this.sourceTableData.push(data[0])
        this.startSourceEdit(data[0])
      } else {
        console.error('Error adding source:', error)
      }
    },

    // Обработчик события от компонента загрузки
    onDataProcessed() {
      // Перезагружаем все данные после успешной загрузки
      this.fetchData()
      this.fetchSubtypes()
      this.fetchSources()
    },

    // === Методы для кнопок "Детали" ===
    
    showTypeDetails(typeRow) {
      // Переключаемся на вкладку подтипов и показываем связанные
      this.activeTab = 'subtypes'
      this.$nextTick(() => {
        // Фильтруем и выделяем подтипы, относящиеся к этому типу
        console.log('Showing subtypes for type:', typeRow.name, 'id:', typeRow.id)
      })
    },

    showSubtypeDetails(subtypeRow) {
      // Переключаемся на вкладку источников и показываем связанные
      this.activeTab = 'sources'
      this.$nextTick(() => {
        // Фильтруем и выделяем источники, относящиеся к этому подтипу
        console.log('Showing sources for subtype:', subtypeRow.name, 'sources:', subtypeRow.sources)
      })
    },

    // Показать диалог с источниками при клике на строку подтипа
    async showSubtypeSourcesDialog(row) {
      // Не открываем диалог если в режиме редактирования
      if (this.editSubtypeId === row.id) return

      this.selectedSubtypeName = row.name

      // Загружаем источники для этого подтипа
      const { data, error } = await supabase
        .from('Subtype_estate_source')
        .select('id, name')
        .eq('id_subtype_estate', row.id)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching sources for dialog:', error)
        this.selectedSubtypeSources = []
      } else {
        this.selectedSubtypeSources = data || []
      }

      this.sourcesDialogVisible = true
    },

    // Получить название религии по ID
    getReligionName(religionId) {
      if (!religionId) return 'Не указано'
      const religion = this.religionList.find(r => r.id === religionId)
      return religion ? religion.name : `ID: ${religionId}`
    },

    // Получить название принадлежности по ID
    getAffiliationName(affiliationId) {
      if (!affiliationId) return 'Не указано'
      const affiliation = this.affiliationList.find(a => a.id === affiliationId)
      return affiliation ? affiliation.name : `ID: ${affiliationId}`
    },

    // Загрузить справочники
    async fetchReferenceTables() {
      // Загружаем религии
      const { data: religions, error: religionError } = await supabase
        .from('Type_religion')
        .select('*')
        .order('name', { ascending: true })

      if (religionError) {
        console.error('Error fetching religions:', religionError)
      } else {
        this.religionList = religions || []
      }

      // Загружаем принадлежности
      const { data: affiliations, error: affiliationError } = await supabase
        .from('Type_affiliation')
        .select('*')
        .order('name', { ascending: true })

      if (affiliationError) {
        console.error('Error fetching affiliations:', affiliationError)
      } else {
        this.affiliationList = affiliations || []
      }
    }
  },
  mounted() {
    this.fetchData()
    this.fetchSubtypes()
    this.fetchSources()
    this.fetchReferenceTables()
  },
  watch: {
    activeTab(newTab) {
      // Сохраняем состояние активной вкладки
      const pageState = usePageState('pg-estate-types')
      pageState.activeTab.set(newTab)
    }
  }
}
</script>

<style scoped lang="scss">
.pg-estate-types {
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
    margin-bottom: 1rem;
  }

  .color-preview {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid var(--border-color);
  }

  // Кастомные стили для скроллбаров таблицы - толще и всегда видимые
  :deep(.el-table) {
    // Для Webkit (Chrome, Safari, Edge)
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

    &::-webkit-scrollbar-button {
      display: none;
    }

    // Для Firefox
    scrollbar-width: auto;
    scrollbar-color: var(--accent-primary) var(--bg-tertiary);

    .el-table__body-wrapper {
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

      &::-webkit-scrollbar-button {
        display: none;
      }

      scrollbar-width: auto;
      scrollbar-color: var(--accent-primary) var(--bg-tertiary);
    }
  }
}
</style>
