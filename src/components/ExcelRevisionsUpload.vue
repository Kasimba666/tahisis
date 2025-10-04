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
          @click="processFile"
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
import { ElMessage } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import * as XLSX from 'xlsx';
import { supabase } from '@/services/supabase'; // <-- ИСПРАВЛЕНО: Добавлен импорт

export default {
  name: 'ExcelUpload',
  components: { UploadFilled }, // <-- ИСПРАВЛЕНО: Иконка добавлена в компоненты
  emits: ['dataProcessed'],
  data() {
    return {
      file: null,
      error: null,
      success: null,
      isLoading: false,
    };
  },
  methods: {
    async clearSupabaseTables() {
      if (!confirm('Вы уверены, что хотите очистить все данные в таблицах Type_affiliation, Type_religion, Type_estate и Subtype_estate? Это действие нельзя отменить.')) {
        return;
      }

      this.isLoading = true;
      this.error = null;
      this.success = null;

      try {
        // Delete from Subtype_estate first (due to foreign key constraints)
        const { error: subtypeError } = await supabase.from('Subtype_estate').delete().neq('name', ''); // Delete all records
        if (subtypeError) throw subtypeError;

        // Then delete from reference tables
        const { error: affiliationError } = await supabase.from('Type_affiliation').delete().neq('name', ''); // Delete all records
        if (affiliationError) throw affiliationError;

        const { error: religionError } = await supabase.from('Type_religion').delete().neq('name', ''); // Delete all records
        if (religionError) throw religionError;

        const { error: estateError } = await supabase.from('Type_estate').delete().neq('name', ''); // Delete all records
        if (estateError) throw estateError;

        this.success = 'Все таблицы Supabase успешно очищены.';
        // Emit event to refresh the table data
        this.$emit('dataProcessed');
      } catch (err) {
        this.error = err.message || 'Ошибка при очистке таблиц Supabase.';
        console.error('Clear tables error:', err);
      } finally {
        this.isLoading = false;
      }
    },

    handleFileChange(uploadedFile) {
      // Проверяем тип файла
      const isExcel = uploadedFile.raw.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || uploadedFile.raw.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        ElMessage.error('Пожалуйста, загрузите файл в формате .xlsx или .xls');
        // Очищаем список файлов в el-upload
        this.$refs.upload.clearFiles();
        return;
      }
      this.file = uploadedFile.raw;
      this.error = null;
      this.success = null;
    },

    handleExceed() {
      ElMessage.warning('Можно загрузить только один файл. Сначала удалите предыдущий.');
    },

    processFile() {
      if (!this.file) return;
      this.isLoading = true;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (!jsonData || jsonData.length === 0) {
            throw new Error('Файл Excel пуст или не содержит данных.');
          }

          const requiredColumns = ['Subtype_estate', 'Type_affiliation', 'Type_religion', 'Type_estate'];
          const firstRow = jsonData[0];
          const missingColumns = requiredColumns.filter(col => !firstRow.hasOwnProperty(col));

          if (missingColumns.length > 0) {
            throw new Error(`Отсутствуют обязательные столбцы: ${missingColumns.join(', ')}`);
          }

          this.processSupabaseData(jsonData)
              .then(processedCount => {
                this.success = `Успешно обработано и загружено ${processedCount} записей.`;
                this.$emit('dataProcessed');
                this.file = null;
                this.$refs.upload.clearFiles(); // Убираем файл из списка после успешной обработки
              })
              .catch(err => {
                this.error = err.message || 'Произошла ошибка при обработке данных в Supabase.';
              })
              .finally(() => {
                this.isLoading = false;
              });

        } catch (err) {
          this.error = err.message || 'Неизвестная ошибка при чтении файла.';
          this.isLoading = false;
        }
      };
      reader.onerror = () => {
        this.error = 'Не удалось прочитать файл.';
        this.isLoading = false;
      };
      reader.readAsArrayBuffer(this.file);
    },

    /**
     * Получает существующие ID или создает новые для связанных таблиц.
     * @param {string} tableName - Имя таблицы в Supabase.
     * @param {string[]} names - Массив уникальных имен из Excel.
     * @returns {Promise<Map<string, number>>} - Promise, который разрешается в Map { name -> id }.
     */
    getOrCreateIds(tableName, names) {
      const uniqueNames = [...new Set(names)].filter(Boolean); // Уникальные и непустые имена
      if (uniqueNames.length === 0) {
        return Promise.resolve(new Map());
      }

      const idMap = new Map();

      // 1. Найти существующие записи
      return supabase.from(tableName).select('id, name').in('name', uniqueNames)
          .then(({ data: existingData, error }) => {
            if (error) throw error;

            existingData.forEach(item => idMap.set(item.name, item.id));

            // 2. Определить, какие записи нужно создать
            const namesToCreate = uniqueNames.filter(name => !idMap.has(name));

            if (namesToCreate.length === 0) {
              return idMap; // Все записи уже существуют
            }

            // 3. Создать новые записи
            const recordsToInsert = namesToCreate.map(name => ({ name }));
            return supabase.from(tableName).insert(recordsToInsert).select('id, name')
                .then(({ data: newData, error: insertError }) => {
                  if (insertError) throw insertError;

                  // 4. Обновить карту новыми ID
                  newData.forEach(item => idMap.set(item.name, item.id));

                  return idMap;
                });
          });
    },

    processSupabaseData(data) {
      // Извлекаем все необходимые имена из данных Excel
      const affiliationNames = data.map(row => row.Type_affiliation);
      const religionNames = data.map(row => row.Type_religion);
      const estateNames = data.map(row => row.Type_estate);

      // Используем Promise.all для параллельного получения/создания ID для всех справочников
      return Promise.all([
        this.getOrCreateIds('Type_affiliation', affiliationNames),
        this.getOrCreateIds('Type_religion', religionNames),
        this.getOrCreateIds('Type_estate', estateNames),
      ])
          .then(([affiliationMap, religionMap, estateMap]) => {
            // Теперь у нас есть полные карты ID, включая только что созданные
            const subtypeRecordsToInsert = data.map(row => ({
              name: row.Subtype_estate,
              id_type_affiliation: affiliationMap.get(row.Type_affiliation) || null,
              id_type_religion: religionMap.get(row.Type_religion) || null,
              id_type_estate: estateMap.get(row.Type_estate) || null,
            })).filter(rec => rec.name); // Фильтруем записи без имени

            if (subtypeRecordsToInsert.length === 0) {
              return 0;
            }

            // Выполняем финальную вставку в основную таблицу
            return supabase.from('Subtype_estate').insert(subtypeRecordsToInsert)
                .then(({ error }) => {
                  if (error) throw error;
                  return subtypeRecordsToInsert.length;
                });
          });
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
  transition: background-color 0.3s ease;

  &:hover {
    background-color: var(--bg-primary);
  }
}

.upload-component {
  :deep(.el-upload-dragger) {
    padding: 20px;
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
