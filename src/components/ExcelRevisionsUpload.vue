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
      if (!confirm('Очистить все записи из Estate, Report_record, Revision_report, Settlement и District?')) return

      this.isLoading = true
      try {
        // Удаляем в правильном порядке с учетом внешних ключей
        await supabase.from('Estate').delete().neq('id', 0)
        await supabase.from('Report_record').delete().neq('id', 0)
        await supabase.from('Settlement').delete().neq('id', 0)
        await supabase.from('District').delete().neq('id', 0)
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
      // 1. Проверить, существует ли ревизия с таким номером
      const { data: existingRevision, error: findErr } = await supabase
          .from('Revision_report')
          .select('id, year, number')
          .eq('number', Number(this.revisionForm.number))
          .maybeSingle()

      if (findErr) throw findErr

      let revisionId

      if (existingRevision) {
        // Если ревизия существует, обновляем только год
        const { data: updatedRevision, error: updateErr } = await supabase
            .from('Revision_report')
            .update({
              year: Number(this.revisionForm.year)
            })
            .eq('id', existingRevision.id)
            .select('id')
            .single()

        if (updateErr) throw updateErr
        revisionId = updatedRevision.id
      } else {
        // Если ревизии нет, создаем новую
        const { data: newRevision, error: insertErr } = await supabase
            .from('Revision_report')
            .insert([
              {
                year: Number(this.revisionForm.year),
                number: Number(this.revisionForm.number)
              }
            ])
            .select()
            .single()

        if (insertErr) throw insertErr
        revisionId = newRevision.id
      }

        // 2. Для каждой строки Excel
        for (const row of rows) {
          const code = String(row.id || '').trim()
          const populationAll = row.populall || null
          const nameOld = String(row.nameold || '').trim()
          const nameOldAlt = String(row.nameoldalt || '').trim()
          const nameModern = String(row.namemod || '').trim() || null
          const districtName = String(row.admunitmod || '').trim()
          const lat = row.lat ? Number(row.lat) : 0
          const lon = row.lon ? Number(row.lon) : 0

          // Пропускаем строки без кода или названия старого
          if (!code || !nameOld) {
            console.warn('Пропущена строка без кода или названия:', row)
            continue
          }

          // Проверяем, существует ли уже запись с таким code
          const { data: existingReport, error: findErr } = await supabase
              .from('Report_record')
              .select('id')
              .eq('code', code)
              .maybeSingle()

          let reportId

          if (existingReport && !findErr) {
            // Если запись существует, обновляем её данные
            const { data: updatedReport, error: updateErr } = await supabase
                .from('Report_record')
                .update({
                  population_all: populationAll,
                  id_revision_report: revisionId
                })
                .eq('id', existingReport.id)
                .select('id')
                .single()

            if (updateErr) throw updateErr
            reportId = updatedReport.id

            // Удаляем старые записи Estate для этого report_record
            await supabase
                .from('Estate')
                .delete()
                .eq('id_report_record', reportId)
          } else {
            // Если записи нет, создаем новую
            const { data: newReport, error: insertErr } = await supabase
                .from('Report_record')
                .insert([
                  {
                    code,
                    population_all: populationAll,
                    id_revision_report: revisionId
                  }
                ])
                .select()
                .single()

            if (insertErr) throw insertErr
            reportId = newReport.id
          }

          // 3. Обработка Settlement и District
          let settlementId = null

          if (nameOld) {
            // Ищем существующий Settlement по name_old
            const { data: existingSettlement, error: settleFindErr } = await supabase
                .from('Settlement')
                .select('id')
                .eq('name_old', nameOld)
                .maybeSingle()

            if (settleFindErr) throw settleFindErr

            if (existingSettlement) {
              settlementId = existingSettlement.id
            } else {
              // Создаем новый Settlement
              let districtId = null

              // Обрабатываем District если есть название района
              if (districtName) {
                const { data: existingDistrict, error: distFindErr } = await supabase
                    .from('District')
                    .select('id')
                    .eq('name', districtName)
                    .maybeSingle()

                if (distFindErr) throw distFindErr

                if (existingDistrict) {
                  districtId = existingDistrict.id
                } else {
                  const { data: newDistrict, error: distInsertErr } = await supabase
                      .from('District')
                      .insert([{ name: districtName }])
                      .select('id')
                      .single()

                  if (distInsertErr) throw distInsertErr
                  districtId = newDistrict.id
                }
              }

              // Создаем новый Settlement
              const settlementData = {
                name_old: nameOld,
                name_old_alt: nameOldAlt || null,
                name_modern: nameModern,
                lat: lat,
                lon: lon
              }

              // Добавляем район только если он существует
              if (districtId) {
                settlementData.id_district = districtId
              }

              const { data: newSettlement, error: settleInsertErr } = await supabase
                  .from('Settlement')
                  .insert([settlementData])
                  .select('id')
                  .single()

              if (settleInsertErr) throw settleInsertErr
              settlementId = newSettlement.id
            }

            // Связываем Report_record с Settlement
            await supabase
                .from('Report_record')
                .update({ id_settlment: settlementId })
                .eq('id', reportId)
          }

        // 4. Обработка estate колонок с соответствующими male/female данными
        for (let i = 1; i <= 5; i++) {
          const estateKey = `estate${i}`
          const maleKey = `male${i}`
          const femaleKey = `female${i}`
          const admunitKey = `admunitold${i}`

          if (row[estateKey]) {
            const estateName = String(row[estateKey]).trim()
            if (!estateName) continue

            // ищем Subtype_estate
            const { data: subtype, error: subErr } = await supabase
                .from('Subtype_estate')
                .select('id, id_type_affiliation')
                .ilike('name', estateName)
                .maybeSingle()
            if (subErr) throw subErr
            if (!subtype) continue

            // Получаем информацию о типе принадлежности
            const { data: typeAffiliation, error: affErr } = await supabase
                .from('Type_affiliation')
                .select('name')
                .eq('id', subtype.id_type_affiliation)
                .single()
            if (affErr) throw affErr

            // Подготавливаем данные для Estate записи
            let estateData = {
              id_report_record: reportId,
              id_subtype_estate: subtype.id,
              male: row[maleKey] ? Number(String(row[maleKey]).trim()) || null : null,
              female: row[femaleKey] ? Number(String(row[femaleKey]).trim()) || null : null,
              id_volost: null,
              id_landowner: null,
              id_military_unit: null
            }

            // Обрабатываем административную единицу в зависимости от типа принадлежности
            if (row[admunitKey] && typeAffiliation.name !== 'нет') {
              const admunitValue = String(row[admunitKey]).trim()

              if (typeAffiliation.name === 'волость') {
                // Создаем или находим Volost
                let { data: volost, error: volErr } = await supabase
                    .from('Volost')
                    .select('id')
                    .ilike('name', admunitValue)
                    .maybeSingle()

                if (volErr) throw volErr

                if (!volost) {
                  const { data: newVolost, error: insertVolErr } = await supabase
                      .from('Volost')
                      .insert([{ name: admunitValue }])
                      .select('id')
                      .single()
                  if (insertVolErr) throw insertVolErr
                  volost = newVolost
                }

                estateData.id_volost = volost.id

              } else if (['войско', 'команда', 'старшина', 'кантон'].includes(typeAffiliation.name)) {
                // Создаем или находим Military_unit
                let { data: militaryUnit, error: milErr } = await supabase
                    .from('Military_unit')
                    .select('id')
                    .ilike('description', admunitValue)
                    .maybeSingle()

                if (milErr) throw milErr

                if (!militaryUnit) {
                  const { data: newMilitaryUnit, error: insertMilErr } = await supabase
                      .from('Military_unit')
                      .insert([{ description: admunitValue }])
                      .select('id')
                      .single()
                  if (insertMilErr) throw insertMilErr
                  militaryUnit = newMilitaryUnit
                }

                estateData.id_military_unit = militaryUnit.id

              } else if (typeAffiliation.name === 'фамилия') {
                // Создаем или находим Landowner
                let { data: landowner, error: landErr } = await supabase
                    .from('Landowner')
                    .select('id')
                    .ilike('description', admunitValue)
                    .maybeSingle()

                if (landErr) throw landErr

                if (!landowner) {
                  const { data: newLandowner, error: insertLandErr } = await supabase
                      .from('Landowner')
                      .insert([{ description: admunitValue }])
                      .select('id')
                      .single()
                  if (insertLandErr) throw insertLandErr
                  landowner = newLandowner
                }

                estateData.id_landowner = landowner.id
              }
            }

            // Создаем запись Estate с соответствующими данными
            const { error: estateErr } = await supabase
                .from('Estate')
                .insert([estateData])

            if (estateErr) throw estateErr
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
