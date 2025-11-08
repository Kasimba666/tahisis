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
          type="info"
          :disabled="!file || isLoading"
          @click="validateOnly"
          :loading="isLoading"
      >
        Валидировать файл
      </el-button>
      <el-button
          type="primary"
          :disabled="!isValidated || isLoading"
          @click="openRevisionDialog"
          :loading="isLoading"
      >
        Загрузить в базу данных
      </el-button>
      <el-button
          type="danger"
          :disabled="isLoading"
          @click="clearSupabaseTables"
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
      <h3 @click="validationLogExpanded = !validationLogExpanded" class="validation-log-header">
        Проверка данных ({{ validationErrors.length }} {{ validationErrors.length === 1 ? 'ошибка' : validationErrors.length < 5 ? 'ошибки' : 'ошибок' }})
        <span class="expand-icon">{{ validationLogExpanded ? '▼' : '▶' }}</span>
      </h3>
      <pre v-show="validationLogExpanded" class="validation-text">{{ validationLogText }}</pre>
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
      const fileName = this.file ? this.file.name : 'неизвестный файл'
      let text = `Валидация файла (${fileName})\n\n`
      this.validationErrors.forEach(err => {
        text += `Строка ${err.row}:\n`
        text += `  ID: "${err.id}"\n`
        text += `  namemod: "${err.namemod}"\n`
        text += `  admunitmod: "${err.admunitmod}"\n`
        text += `  Ошибки: ${err.missing}\n\n`
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
      currentStatus: 'Готов к работе',
      validatedData: null,
      validationLogExpanded: false,
      isValidated: false
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
      this.isValidated = false
      this.validatedData = null
      // Очищаем форму ревизии
      this.revisionForm.number = ''
      this.revisionForm.year = ''
    },
    
    validateOnly() {
      if (!this.file) return
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
          const { errors, hasCriticalErrors } = this.validateRows(jsonData)
          this.validationErrors = errors
          
          if (hasCriticalErrors) {
            this.currentStatus = 'Валидация завершена с ошибками'
            this.error = `Найдены критические ошибки валидации. Проверьте отчет ниже.`
            this.isLoading = false
            this.isValidated = false
            return
          }
          
          // Сохраняем данные для последующей загрузки
          this.validatedData = jsonData
          this.isValidated = true
          
          if (errors.length > 0) {
            ElMessage.warning(`Валидация завершена с предупреждениями (${errors.length}). Данные можно загрузить.`)
          } else {
            ElMessage.success('Валидация прошла успешно. Данные готовы к загрузке.')
          }
          this.currentStatus = 'Файл валидирован и готов к загрузке'
          this.isLoading = false
        } catch (err) {
          this.error = err.message || 'Ошибка обработки файла'
          this.isLoading = false
          this.currentStatus = 'Готов к работе'
          this.isValidated = false
        }
      }
      reader.onerror = () => {
        this.error = 'Не удалось прочитать файл'
        this.isLoading = false
        this.currentStatus = 'Ошибка чтения файла'
        this.isValidated = false
      }
      reader.readAsArrayBuffer(this.file)
    },
    
    openRevisionDialog() {
      if (!this.isValidated || !this.validatedData) return
      this.dialogVisible = true
    },
    
    startProcessing() {
      if (!this.file) return
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
          const { errors, hasCriticalErrors } = this.validateRows(jsonData)
          this.validationErrors = errors
          
          if (hasCriticalErrors) {
            this.currentStatus = 'Валидация завершена с ошибками'
            this.error = `Найдены критические ошибки валидации. Проверьте отчет ниже.`
            this.isLoading = false
            return
          }
          
          if (errors.length > 0) {
            ElMessage.warning(`Валидация завершена с предупреждениями (${errors.length})`)
          } else {
            ElMessage.success('Валидация прошла успешно')
          }
          this.currentStatus = 'Валидация завершена успешно'
          // Очищаем лог валидации при успешной валидации
          this.validationLog = []
          
          // Сохраняем данные и показываем диалог ввода ревизии
          this.validatedData = jsonData
          this.dialogVisible = true
          this.isLoading = false
        } catch (err) {
          this.error = err.message || 'Ошибка обработки файла'
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

    async processFile() {
      // Закрываем диалог и сразу начинаем загрузку
      this.dialogVisible = false
      this.isLoading = true
      this.currentStatus = 'Обработка данных'
      
      try {
        await this.processSupabaseData(this.validatedData)
        this.success = `Загрузка успешно завершена. Обработано записей: ${this.validatedData.length}`
        this.$emit('dataProcessed', { revisionNumber: Number(this.revisionForm.number) })
        this.file = null
        this.$refs.upload.clearFiles()
        this.validatedData = null
        this.isValidated = false
      } catch (err) {
        this.error = err.message || 'Ошибка обработки данных'
      } finally {
        this.isLoading = false
        this.currentStatus = 'Готов к работе'
      }
    },

    async processSupabaseData(rows) {
      this.currentStatus = 'Обработка ревизии'
      this.progress = 10
      
      // Статистика обработки
      let processedRowsCount = 0
      let createdReportRecordsCount = 0
      let createdEstatesCount = 0
      
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

        if (updateErr) throw updateErr
        revisionId = Array.isArray(updatedRevision) ? updatedRevision[0].id : updatedRevision.id
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

        if (insertErr) throw insertErr
        revisionId = Array.isArray(newRevision) ? newRevision[0].id : newRevision.id
      }
        // 2. Для каждой строки Excel
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i]
          this.currentStatus = `Обработка строк: ${i + 1} из ${rows.length}`
          this.progress = Math.round(10 + ((i + 1) / rows.length) * 89)
          
          const populationAll = row.populall || null
          const nameOld = String(row.nameold || '').trim()
          const nameOldAlt = String(row.nameoldalt || '').trim()
          let nameModern = String(row.namemod || '').trim()
          const districtName = String(row.admunitmod || '').trim()
          const lat = (row.lat && Number(row.lat) !== 0) ? Number(row.lat) : null
          const lon = (row.lon && Number(row.lon) !== 0) ? Number(row.lon) : null

          // Если namemod отсутствует, используем nameold
          if (!nameModern && nameOld) {
            nameModern = nameOld
          }

          // Пропускаем строки без обязательных полей
          if (!nameModern || !districtName) {
            console.warn('Пропущена строка без названия или района:', row)
            continue
          }

          // Берём code из поля id исходного файла (может быть не уникальным)
          const idVal = row.id || row.ID || row.Id || row.iD
          const code = idVal ? Number(String(idVal).trim()) : null
          
          // Создаем новую запись Report_record для каждой строки
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

          if (insertErr) throw insertErr
          const reportId = Array.isArray(newReport) ? newReport[0].id : newReport.id
          createdReportRecordsCount++

          // 3. Обработка Settlement и District
          let settlementId = null

          if (nameModern && districtName) {
            // Ищем существующий Settlement по паре namemod + admunitmod
            const { data: existingSettlement, error: settleFindErr } = await supabase
                .from('Settlement')
                .select('id, id_district')
                .eq('name_modern', nameModern)
                .maybeSingle()

            if (settleFindErr) throw settleFindErr

            if (existingSettlement) {
              // Нашли Settlement, обновляем его данные (координаты, старое название)
              const { data: updatedSettlement, error: updateErr } = await supabase
                  .from('Settlement')
                  .update({
                    name_old: nameOld,
                    name_old_alt: nameOldAlt || null,
                    lat: lat,
                    lon: lon
                  })
                  .eq('id', existingSettlement.id)
                  .select('id')

              if (updateErr) throw updateErr
              settlementId = Array.isArray(updatedSettlement) ? updatedSettlement[0].id : updatedSettlement.id
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

                  if (distInsertErr) throw distInsertErr
                  districtId = Array.isArray(newDistrict) ? newDistrict[0].id : newDistrict.id
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

              if (settleInsertErr) throw settleInsertErr
              settlementId = Array.isArray(newSettlement) ? newSettlement[0].id : newSettlement.id
            }

            // Связываем Report_record с Settlement
            await supabase
                .from('Report_record')
                .update({ id_settlment: settlementId })
                .eq('id', reportId)
          }
          
          // Увеличиваем счётчик обработанных строк
          processedRowsCount++

        // 4. Обработка estate колонок с соответствующими male/female данными
        for (let i = 1; i <= 5; i++) {
          const estateKey = `estate${i}`
          const maleKey = `male${i}`
          const femaleKey = `female${i}`
          const admunitKey = `admunitold${i}`

          if (row[estateKey]) {
            const estateName = String(row[estateKey]).trim()
            if (!estateName) continue

            // НОВАЯ ЛОГИКА: ищем в Subtype_estate_source
            const { data: estateSource, error: sourceErr } = await supabase
                .from('Subtype_estate_source')
                .select('id, id_subtype_estate')
                .ilike('name', estateName)
                .maybeSingle()
            
            if (sourceErr) throw sourceErr
            if (!estateSource) {
              console.warn(`Источник подтипа не найден: "${estateName}"`)
              continue
            }

            // Получаем информацию о подтипе (для Type_affiliation)
            const { data: subtype, error: subErr } = await supabase
                .from('Subtype_estate')
                .select('id, id_type_affiliation')
                .eq('id', estateSource.id_subtype_estate)
                .single()
            
            if (subErr) throw subErr

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
              id_subtype_estate_source: estateSource.id, // Добавляем ссылку на источник
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
                  if (insertVolErr) throw insertVolErr
                  volost = Array.isArray(newVolost) ? newVolost[0] : newVolost
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
                  if (insertMilErr) throw insertMilErr
                  militaryUnit = Array.isArray(newMilitaryUnit) ? newMilitaryUnit[0] : newMilitaryUnit
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
                  if (insertLandErr) throw insertLandErr
                  landowner = Array.isArray(newLandowner) ? newLandowner[0] : newLandowner
                }

                estateData.id_landowner = landowner.id
              }
            }

            // Создаем запись Estate с соответствующими данными
            const { error: estateErr } = await supabase
                .from('Estate')
                .insert([estateData])

            if (estateErr) throw estateErr
            createdEstatesCount++
          }
        }
      }
      
      this.progress = 100
      this.success = `Обработано строк: ${processedRowsCount}, создано записей о ревизиях: ${createdReportRecordsCount}, создано записей о сословиях: ${createdEstatesCount}`
    },

    validateRows(rows) {
      this.validationLog = []
      this.currentStatus = 'Валидация данных'
      const errors = []
      let hasCriticalErrors = false
      
      // Проверка на дублирующиеся ID - теперь только предупреждение
      const idFirstOccurrence = {}
      const duplicateIds = new Set()
      
      rows.forEach((row, index) => {
        const id = row.id || row.ID || row.Id || row.iD
        if (id) {
          const idStr = String(id).trim()
          if (idFirstOccurrence.hasOwnProperty(idStr)) {
            duplicateIds.add(idStr)
          } else {
            idFirstOccurrence[idStr] = index
          }
        }
      })
      
      // Если найдены дубликаты ID, добавляем предупреждение в лог
      if (duplicateIds.size > 0) {
        const duplicatesList = Array.from(duplicateIds).join(', ')
        this.validationLog.push(`[НЕ КРИТИЧНО] Найдены дублирующиеся ID: ${duplicatesList}`)
        this.validationLog.push('  → Это не критично, но рекомендуется иметь уникальные ID')
        this.validationLog.push('')
      }
      
      rows.forEach((row, index) => {
        this.currentStatus = `Валидация: строка ${index + 2} из ${rows.length + 1}`
        this.progress = Math.round(((index + 1) / rows.length) * 10)
        const criticalFields = []
        const nonCriticalFields = []
        
        // ID - не обязателен, но если есть - проверяем формат (НЕ КРИТИЧНО)
        const id = row.id || row.ID || row.Id || row.iD
        if (id && String(id).trim() !== '') {
          const idStr = String(id).trim()
          if (idStr === '.' || isNaN(Number(idStr))) {
            nonCriticalFields.push(`id="${idStr}" (недопустимое значение)`)
          }
        }
        
        // namemod (современное название) - НЕ КРИТИЧНО, можно взять из nameold
        const namemodVal = row.namemod || row.NAMEMOD || row.Namemod || row.nameMod
        const nameoldVal = row.nameold || row.NAMEOLD || row.Nameold || row.nameOld
        
        if (!namemodVal || String(namemodVal).trim() === '') {
          if (!nameoldVal || String(nameoldVal).trim() === '') {
            criticalFields.push('namemod и nameold (хотя бы одно поле должно быть заполнено)')
          } else {
            nonCriticalFields.push('namemod (отсутствует, будет использовано nameold)')
          }
        }
        
        // admunitmod (район) - ОБЯЗАТЕЛЬНО (КРИТИЧНО)
        const admunitmodVal = row.admunitmod || row.ADMUNITMOD || row.Admunitmod || row.admunitMod
        if (!admunitmodVal || String(admunitmodVal).trim() === '') {
          criticalFields.push('admunitmod (обязательное поле)')
        }
        
        // Валидация числовых полей male/female (КРИТИЧНО - если некорректное значение)
        for (let i = 1; i <= 5; i++) {
          const maleKey = `male${i}`
          const femaleKey = `female${i}`
          
          if (row[maleKey] !== null && row[maleKey] !== undefined && row[maleKey] !== '') {
            const maleStr = String(row[maleKey]).trim()
            if (maleStr === '.' || (maleStr !== '' && isNaN(Number(maleStr)))) {
              criticalFields.push(`${maleKey}="${maleStr}" (недопустимое значение)`)
            }
          }
          
          if (row[femaleKey] !== null && row[femaleKey] !== undefined && row[femaleKey] !== '') {
            const femaleStr = String(row[femaleKey]).trim()
            if (femaleStr === '.' || (femaleStr !== '' && isNaN(Number(femaleStr)))) {
              criticalFields.push(`${femaleKey}="${femaleStr}" (недопустимое значение)`)
            }
          }
        }
        
        // Валидация populall (КРИТИЧНО)
        if (row.populall !== null && row.populall !== undefined && row.populall !== '') {
          const populallStr = String(row.populall).trim()
          if (populallStr === '.' || (populallStr !== '' && isNaN(Number(populallStr)))) {
            criticalFields.push(`populall="${populallStr}" (недопустимое значение)`)
          }
        }
        
        // Валидация координат lat/lon (НЕ КРИТИЧНО)
        const latVal = row.lat
        const lonVal = row.lon
        
        if (latVal === null || latVal === undefined || String(latVal).trim() === '' || String(latVal).trim() === '0') {
          nonCriticalFields.push('lat (отсутствует)')
        } else {
          const latStr = String(latVal).trim()
          if (latStr === '.' || isNaN(Number(latStr))) {
            nonCriticalFields.push(`lat="${latStr}" (недопустимое значение)`)
          }
        }
        
        if (lonVal === null || lonVal === undefined || String(lonVal).trim() === '' || String(lonVal).trim() === '0') {
          nonCriticalFields.push('lon (отсутствует)')
        } else {
          const lonStr = String(lonVal).trim()
          if (lonStr === '.' || isNaN(Number(lonStr))) {
            nonCriticalFields.push(`lon="${lonStr}" (недопустимое значение)`)
          }
        }
        
        // Check at least one estate field is filled (КРИТИЧНО)
        const estatePresent = !!(String(row.estate1 || '').trim() || String(row.estate2 || '').trim() || String(row.estate3 || '').trim() || String(row.estate4 || '').trim() || String(row.estate5 || '').trim())
        if (!estatePresent) {
          criticalFields.push('estate (хотя бы одно поле estate должно быть заполнено)')
        }
        
        // Добавляем в лог только если есть проблемы
        if (criticalFields.length > 0 || nonCriticalFields.length > 0) {
          this.validationLog.push(`Строка ${index + 2}:`)
          
          if (criticalFields.length > 0) {
            this.validationLog.push(`  [КРИТИЧНО] ${criticalFields.join(', ')}`)
            hasCriticalErrors = true
          }
          
          if (nonCriticalFields.length > 0) {
            this.validationLog.push(`  [НЕ КРИТИЧНО] ${nonCriticalFields.join(', ')}`)
          }
          
          this.validationLog.push('')
          
          errors.push({
            row: index + 2,
            id: String(id || '').trim(),
            namemod: String(namemodVal || '').trim(),
            admunitmod: String(admunitmodVal || '').trim(),
            missing: [...criticalFields, ...nonCriticalFields].join(', ')
          })
        }
      })
      return { errors, hasCriticalErrors }
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
    },

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
  
  .validation-log-header {
    color: var(--text-color);
    margin-bottom: 0.5rem;
    cursor: pointer;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    &:hover {
      color: var(--el-color-primary);
    }
    
    .expand-icon {
      font-size: 0.8em;
      transition: transform 0.2s;
    }
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
