<template>
  <div class="pg-estate-types">
    <h3>Типы сословий</h3>

    <div class="table-info">
      <el-alert
          type="info"
          :closable="false"
          show-icon
      >
        <template #title>
          Всего типов: {{ totalRecords }}
        </template>
      </el-alert>
    </div>

    <div class="table-header">
      <el-button type="success" size="small" @click="addRow">Добавить тип</el-button>
    </div>

    <el-table :data="tableData" style="width: 100%">
      <el-table-column prop="id" label="ID" width="60" />

      <el-table-column label="Название">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-input v-model="editRow.name" />
          </div>
          <div v-else>
            {{ row.name }}
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Цвет" width="120">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-color-picker
              v-model="editRow.color"
              size="small"
              show-alpha
              @change="onColorChange"
            />
          </div>
          <div v-else>
            <div
              class="color-preview"
              :style="{ backgroundColor: row.color || 'hsl(180, 0%, 100%)' }"
            ></div>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Действия" width="200">
        <template #default="{ row }">
          <div v-if="editRowId === row.id">
            <el-button type="success" size="small" @click="updateRow(row.id)">Сохранить</el-button>
            <el-button type="warning" size="small" @click="cancelEdit">Отменить</el-button>
          </div>
          <div v-else>
            <el-button type="primary" size="small" @click="startEdit(row)">Редактировать</el-button>
            <el-button type="danger" size="small" @click="deleteRow(row.id)">Удалить</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { supabase } from "@/services/supabase"

export default {
  name: "PgEstateTypes",
  data() {
    return {
      tableData: [],
      editRowId: null,
      editRow: {}
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
    }
  },
  mounted() {
    this.fetchData()
  }
}
</script>

<style scoped>
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
}
</style>
