<template>
  <div class="excel-upload-container">
    <el-upload
        ref="upload"
        class="upload-component"
        drag
        action="#"
        accept=".xlsx, .xls"
        :auto-upload="false"
        :on-change="handleFileChange"
        :on-exceed="handleExceed"
        :limit="1"
        :show-file-list="true"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        Перетащите файл сюда или <em>нажмите для выбора</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          Поддерживаются файлы .xlsx и .xls размером не более 5MB.
        </div>
      </template>
    </el-upload>

    <div class="button-container">
      <el-button
          type="primary"
          :disabled="!file"
          @click="openRevisionDialog"
          :loading="isLoading"
          class="process-button"
      >
        Обработать и загрузить данные
      </el-button>
      <el-button
          type="danger"
          @click="clearSupabaseTables"
          class="clear-button"
      >
        Очистить таблицы Supabase
      </el-button>
    </div>

    <el-dialog v-model="dialogVisible" title="Новая ревизия" width="400">
      <el-form :model="revisionForm" label-width="120px">
        <el-form-item label="Номер ревизии">
          <el-input v-model="revisionForm.number" />
        </el-form-item>
        <el-form-item label="Год">
          <el-input v-model="revisionForm.year" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">Отмена</el-button>
        <el-button type="primary" @click="processFile">Загрузить</el-button>
      </template>
    </el-dialog>

    <el-alert
        v-if="error"
        :title="error"
        type="error"
        show-icon
        @close="error = null"
        class="status-alert"
    />
    <el-alert
        v-if="success"
        :title="success"
        type="success"
        show-icon
        @close="success = null"
        class="status-alert"
    />
  </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import * as XLSX from 'xlsx'
import { supabase } from '@/services/supabase'

export default {
  name: 'ExcelRevisionsUpload',
  components: { UploadFilled },
  emits: ['dataProcessed'],
  data() {
    return {
      file: null,
      error: null,
      success: null,
      isLoading: false,
      dialogVisible: false,
      revisionForm: {
        number: '',
        year: ''
      }
    }
  },
  methods: {
    async clearSupabaseTables() {
      if (!confirm('Очистить все записи из Estate, Report_record и Revision_report?')) return

      this.isLoading = true
      try {
        await supabase.from('Estate').delete().neq('id', 0)
        await supabase.from('Report_record').delete().neq('id', 0)
        await supabase.from('Revision_report').delete().neq('id', 0)
        this.success = 'Таблицы успешно очищены.'
        this.$emit('dataProcessed')
      } catch (err) {
        this.error = err.message || 'Ошибка очистки таблиц'
      } finally {
        this.isLoading = false
      }
    },
    handleFileChange(uploadedFile) {
      const isExcel =
          uploadedFile.raw.type ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          uploadedFile.raw.type === 'application/vnd.ms-excel'
      if (!isExcel) {
        ElMessage.error('Загрузите файл .xlsx или .xls')
        this.$refs.upload.clearFiles()
        return
      }
      this.file = uploadedFile.raw
      this.error = null
      this.success = null
    },
    handleExceed() {
      ElMessage.warning('Можно загрузить только один файл.')
    },
    openRevisionDialog() {
      if (!this.file) return
      this.dialogVisible = true
    },
    processFile() {
      if (!this.file) return
      this.dialogVisible = false
      this.isLoading = true

      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          if (!jsonData || jsonData.length === 0) throw new Error('Файл пуст')

          await this.processSupabaseData(jsonData)
          this.success = 'Загрузка успешно завершена'
          this.$emit('dataProcessed')
          this.file = null
          this.$refs.upload.clearFiles()
        } catch (err) {
          this.error = err.message || 'Ошибка обработки файла'
        } finally {
          this.isLoading = false
        }
      }
      reader.onerror = () => {
        this.error = 'Не удалось прочитать файл'
        this.isLoading = false
      }
      reader.readAsArrayBuffer(this.file)
    },

    async processSupabaseData(rows) {
      // 1. Создать запись Revision_report
      const { data: revision, error: revErr } = await supabase
          .from('Revision_report')
          .insert([
            {
              year: Number(this.revisionForm.year),
              number: Number(this.revisionForm.number)
            }
          ])
          .select()
          .single()
      if (revErr) throw revErr
      const revisionId = revision.id

      // 2. Для каждой строки Excel
      for (const row of rows) {
        const code = row.id
        const quantityAll = row.populall || null

        const { data: report, error: repErr } = await supabase
            .from('Report_record')
            .insert([
              {
                code,
                quantity_all: quantityAll,
                id_revision_report: revisionId
              }
            ])
            .select()
            .single()
        if (repErr) throw repErr

        const reportId = report.id

        // 3. Обработка estate колонок
        for (let i = 1; i <= 5; i++) {
          const key = i === 1 ? 'estate' : `estate${i}`
          if (row[key]) {
            const estateName = String(row[key]).trim()
            if (!estateName) continue

            // ищем Subtype_estate
            const { data: subtype, error: subErr } = await supabase
                .from('Subtype_estate')
                .select('id')
                .ilike('name', estateName)
                .maybeSingle()
            if (subErr) throw subErr
            if (!subtype) continue

            await supabase.from('Estate').insert([
              {
                id_report_record: reportId,
                id_subtype_estate: subtype.id,
                men_quantity: row.men || null,
                women_quantity: row.women || null
              }
            ])
          }
        }
      }
    }
  }
}
</script>

<style scoped lang="scss">
.excel-upload-container {
  margin: 1.5rem 0;
  padding: 1.5rem;
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-secondary);
  &:hover {
    background-color: var(--bg-primary);
  }
}
.button-container {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}
.process-button {
  min-width: 250px;
}
.status-alert {
  margin-top: 1.5rem;
}
</style>
