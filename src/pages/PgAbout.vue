<template>
  <main class="pg-about">
    <div class="content-section">
      <div class="about-card">
        <h3>Заголовок</h3>
        <p>
          Что-то о проекте
        </p>
      </div>
      
      <div class="navigation-buttons">
        <el-button type="primary" @click="navigateTo('Settlements')">
          Населённые пункты
        </el-button>
        <el-button type="primary" @click="navigateTo('Estates')">
          Сословия
        </el-button>
        <el-button type="primary" @click="navigateTo('Revisions')">
          Ревизии
        </el-button>
      </div>
    </div>
  </main>
</template>

<script>
export default {
  name: 'PgAbout',
  methods: {
    navigateTo(routeName) {
      this.$router.push({ name: routeName });
    }
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/themes.scss' as *;

.pg-about {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  
  // Фоновое изображение карты
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    background-image: url('/assets/background/land_map.webp');
    background-size: contain;
    background-position: center;
    background-repeat: repeat;
    background-attachment: fixed;
    
    // Осветление и блюр
    filter: brightness(1.3) blur(1px);
    opacity: 0.4;
  }
}

.content-section {
  display: grid;
  gap: 2rem;
}

.about-card {
  @include card-style;
  background-color: hsla(214, 32%, 91%, 0.7) !important;
  
  h3 {
    margin-left: 10px;
  }

  p {
    line-height: 1.6;
    margin: 10px;
  }
  
  // Для тёмной темы
  [data-theme="dark"] & {
    background-color: hsla(217, 33%, 17%, 0.7) !important;
  }
}

.navigation-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  
  .el-button {
    flex: 1;
    min-width: 180px;
    max-width: 300px;
  }
}

@media (max-width: 768px) {
  .pg-about {
    padding: 1rem;
  }
  
  .navigation-buttons {
    flex-direction: column;
    
    .el-button {
      width: 100%;
      max-width: 100%;
    }
  }
}
</style>
