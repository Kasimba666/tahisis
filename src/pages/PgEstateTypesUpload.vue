<template>
  <main class="EstateTypesUpload">
    <div class="page-header">
      <h1>Загрузка типов сословий</h1>
      <p>Импорт данных о типах сословий из Excel файлов</p>
    </div>

    <div class="upload-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>Загрузка файла</span>
          </div>
        </template>

        <div class="upload-container">
          <el-alert
            title="Информация"
            type="info"
            description="Загрузите Excel файл с данными о типах сословий. Файл должен содержать колонки: Код, Название, Описание."
            show-icon
            :closable="false"
          />

          <div class="upload-area">
            <el-upload
              :auto-upload="false"
              :show-file-list="true"
              accept=".xlsx,.xls"
              drag
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                Перетащите Excel файл сюда или <em>нажмите для выбора</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  Поддерживаются файлы .xlsx и .xls
                </div>
              </template>
            </el-upload>
          </div>

          <div class="action-buttons">
            <el-button type="primary" size="large" @click="">
              <el-icon><Upload /></el-icon>
              Загрузить данные
            </el-button>
            <el-button size="large">
              <el-icon><Download /></el-icon>
              Скачать шаблон
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </main>
</template>

<script>
import { UploadFilled, Upload, Download } from '@element-plus/icons-vue';

export default {
  components: {},
  setup() {
    return{}
  },
  mounted() {}
};

</script>

<style lang="scss" scoped>
.EstateTypesUpload {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  .page-header {
    margin-bottom: 30px;
  }

  .page-header h1 {
    color: var(--text-primary);
    margin-bottom: 10px;
  }

  .page-header p {
    color: var(--text-secondary);
    font-size: 16px;
  }

  .upload-section {
    margin-top: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
    font-size: 16px;
  }

  .upload-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .upload-area {
    margin: 20px 0;
  }

  .action-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  @media (max-width: 768px) {
    .action-buttons {
      flex-direction: column;
    }
  }
}
</style>
