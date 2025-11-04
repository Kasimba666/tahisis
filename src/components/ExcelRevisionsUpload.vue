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

    <el-alert
        v-if="currentStatus && currentStatus !== 'Готов к работе'"
        :title="currentStatus"
        type="info"
        show-icon
        class="status-alert"
    />

    <div v-if="validationLog.length" class="validation-log">
      <h3>Проверка данных:</h3>
      <pre class="validation-text">{{ validationLogText }}</pre>
    </div>

    <div v-if="validationErrors.length > 0" class="errors-report">
      <h3>Отчёт об ошибках:</h3>
      <pre class="errors-text">{{ errorReportText }}</pre>
      <div class="errors-buttons">
        <el-button @click="copyErrors" type="primary" size="small">Копировать</el-button>
        <el-button @click="saveErrors" type="success" size="small">Сохранить</el-button>
        <el-button @click="closeErrors" type="danger" size="small">Закрыть</el-button>
      </div>
    </div>
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
  computed: {
    errorReportText() {
      let text = 'Отчёт об ошибках валидации:\n\n'
      this.validationErrors.forEach(err => {
        text += `Строка ${err.row}: ID "${err.id}", nameold "${err.nameold}", admunitmod "${err.admunitmod}" - отсутствующие поля: ${err.missing}\n`
      })
      return text
    },
    validationLogText() {
      return this.validationLog.join('\n')
    }
  },
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
      },
      progress: 0,
      validationErrors: [],
      validationLog: [],
      currentStatus: 'Готов к работе'
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
          this.progress = 0
          this.currentStatus = 'Готов к работе'
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
      // Replace existing file
      this.$refs.upload.fileList = [uploadedFile]
      this.file = uploadedFile.raw
      this.error = null
      this.success = null
      this.progress = 0
      this.validationErrors = []
      this.validationLog = []
      this.currentStatus = 'Готов к работе'
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

          this.currentStatus = 'Валидация данных'
          // Валидация обязательных полей
          const validationErrors = this.validateRows(jsonData)
          if (validationErrors.length > 0) {
            this.currentStatus = 'Валидация завершена с ошибками'
            this.validationErrors = validationErrors
            this.error = `Найдены ошибки валидации. Проверьте отчет ниже.`
            return
          }
          ElMessage.success('Валидация прошла успешно')
          this.currentStatus = 'Обработка данных'

          await this.processSupabaseData(jsonData)
          this.success = `Загрузка успешно завершена. Обработано записей: ${jsonData.length}`
          this.$emit('dataProcessed')
          this.file = null
          this.$refs.upload.clearFiles()
        } catch (err) {
          this.error = err.message || 'Ошибка обработки файла'
        } finally {
          this.isLoading = false
          this.currentStatus = 'Готов к работе'
        }
      }
      reader.onerror = () => {
        this.error = 'Не удалось прочитать файл'
        this.isLoading = false
        this.currentStatus = 'Ошибка чтения файла'
      }
      reader.readAsArrayBuffer(this.file)
    },

    async processSupabaseData(rows) {
      this.currentStatus = 'Обработка ревизии'
      this.progress = 10
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
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          this.currentStatus = `Обработка строк: ${i + 1} из ${rows.length}`
          this.progress = Math.round(10 + ((i + 1) / rows.length) * 89)
          const code = String(row.id || '').trim()
          const populationAll = row.populall || null
          const nameOld = String(row.nameold || '').trim()
          const nameOldAlt = String(row.nameoldalt || '').trim()
          const nameModern = String(row.namemod || '').trim() || null
          const districtName = String(row.admunitmod || '').trim()
          const lat = (row.lat && Number(row.lat) !== 0) ? Number(row.lat) : null
          const lon = (row.lon && Number(row.lon) !== 0) ? Number(row.lon) : null

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
      this.progress = 100
    },

    validateRows(rows) {
      this.validationLog = []
      this.currentStatus = 'Валидация данных'
      const errors = []
      
      rows.forEach((row, index) => {
        this.currentStatus = `Валидация: строка ${index + 2} из ${rows.length + 1}`
        this.progress = Math.round(((index + 1) / rows.length) * 10) // progress до 10%
        const missingFields = []
        const invalidFields = []
        
        // Support case insensitive column names
        const id = row.id || row.ID || row.Id || row.iD
        if (!id || String(id).trim() === '') {
          missingFields.push('id')
        } else {
          const idStr = String(id).trim()
          if (idStr === '.' || isNaN(Number(idStr))) {
            invalidFields.push(`id="${idStr}" (недопустимое значение)`)
          }
        }
        
        const nameoldVal = row.nameold || row.NAMEOLD || row.Nameold || row.nameOld
        if (!nameoldVal || String(nameoldVal).trim() === '') missingFields.push('nameold')
        
        const admunitmodVal = row.admunitmod || row.ADMUNITMOD || row.Admunitmod || row.admunitMod || row.admunitmod || row.icon || row.ADMUNITMOD
        if (!admunitmodVal || String(admunitmodVal).trim() === '') missingFields.push('admunitmod')
        
        // Валидация числовых полей male/female
        for (let i = 1; i <= 5; i++) {
          const maleKey = `male${i}`
          const femaleKey = `female${i}`
          
          if (row[maleKey] !== null && row[maleKey] !== undefined && row[maleKey] !== '') {
            const maleStr = String(row[maleKey]).trim()
            if (maleStr === '.' || (maleStr !== '' && isNaN(Number(maleStr)))) {
              invalidFields.push(`${maleKey}="${maleStr}" (недопустимое значение)`)
            }
          }
          
          if (row[femaleKey] !== null && row[femaleKey] !== undefined && row[femaleKey] !== '') {
            const femaleStr = String(row[femaleKey]).trim()
            if (femaleStr === '.' || (femaleStr !== '' && isNaN(Number(femaleStr)))) {
              invalidFields.push(`${femaleKey}="${femaleStr}" (недопустимое значение)`)
            }
          }
        }
        
        // Валидация populall
        if (row.populall !== null && row.populall !== undefined && row.populall !== '') {
          const populallStr = String(row.populall).trim()
          if (populallStr === '.' || (populallStr !== '' && isNaN(Number(populallStr)))) {
            invalidFields.push(`populall="${populallStr}" (недопустимое значение)`)
          }
        }
        
        // Валидация координат lat/lon
        if (row.lat !== null && row.lat !== undefined && row.lat !== '') {
          const latStr = String(row.lat).trim()
          if (latStr === '.' || (latStr !== '' && latStr !== '0' && isNaN(Number(latStr)))) {
            invalidFields.push(`lat="${latStr}" (недопустимое значение)`)
          }
        }
        
        if (row.lon !== null && row.lon !== undefined && row.lon !== '') {
          const lonStr = String(row.lon).trim()
          if (lonStr === '.' || (lonStr !== '' && lonStr !== '0' && isNaN(Number(lonStr)))) {
            invalidFields.push(`lon="${lonStr}" (недопустимое значение)`)
          }
        }
        
        // Check at least one estate field is filled
        const estatePresent = !!(String(row.estate1 || '').trim() || String(row.estate2 || '').trim() || String(row.estate3 || '').trim() || String(row.estate4 || '').trim() || String(row.estate5 || '').trim())
        if (!estatePresent) missingFields.push('estate (хотя бы одно поле estate должно быть заполнено)')
        
        // Формируем статус валидации
        const problems = []
        if (missingFields.length > 0) problems.push(`MISSING: ${missingFields.join(', ')}`)
        if (invalidFields.length > 0) problems.push(`INVALID: ${invalidFields.join(', ')}`)
        
        const status = problems.length === 0 ? 'OK' : problems.join(' | ')
        this.validationLog.push(`Строка ${index + 2}: ${status}`)
        
        if (missingFields.length > 0 || invalidFields.length > 0) {
          errors.push({
            row: index + 2,
            id: String(id || '').trim(),
            nameold: String(nameoldVal || '').trim(),
            admunitmod: String(admunitmodVal || '').trim(),
            missing: [...missingFields, ...invalidFields].join(', ')
          })
        }
      })
      return errors
    },

    copyErrors() {
      navigator.clipboard.writeText(this.errorReportText).then(() => {
        ElMessage.success('Текст скопирован в буфер обмена')
      }).catch(() => {
        ElMessage.error('Не удалось скопировать')
      })
    },

    saveErrors() {
      const blob = new Blob([this.errorReportText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'validation_errors.txt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      ElMessage.success('Файл скачан')
    },

    closeErrors() {
      this.validationErrors = []
      this.validationLog = []
      this.error = null
      this.currentStatus = 'Готов к работе'
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
.validation-log {
  margin-top: 1.5rem;
  h3 {
    color: var(--text-color);
    margin-bottom: 0.5rem;
  }
  .validation-text {
    white-space: pre-wrap;
    padding: 0.5rem;
    border-radius: 4px;
    background-color: var(--bg-tertiary);
    color: var(--text-color-secondary);
    font-family: monospace;
    font-size: 0.9rem;
  }
}
.errors-report {
  margin-top: 1.5rem;
  h3 {
    color: var(--text-color);
    margin-bottom: 0.5rem;
  }
  .errors-text {
    white-space: pre-wrap;
    padding: 0.5rem;
    border-radius: 4px;
    background-color: var(--bg-tertiary);
    color: var(--text-color-secondary);
    font-family: monospace;
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }
.errors-buttons {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-start;
    margin-top: 0.5rem;
  }
}

// Adjust remove button closer to file name
:deep(.el-upload-list__item-name) {
  margin-right: 0.2rem !important;
}

:deep(.el-upload-list__item-status-label) {
  padding-left: 0.2rem !important;
}
</style>
