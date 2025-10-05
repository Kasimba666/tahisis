<template>
  <main class="pg-home">
    <div class="hero-section">
      <h1>Добро пожаловать!</h1>
      <p>Это современный сайт с красивым header и переключателем тем</p>
      
      <div class="features">
        <div class="feature-card">
          <h3>🎨 Темы</h3>
          <p>Светлая и тёмная тема с плавными переходами</p>
        </div>
        <div class="feature-card">
          <h3>📱 Адаптивность</h3>
          <p>Отлично работает на всех устройствах</p>
        </div>
        <div class="feature-card">
          <h3>🚀 Element Plus</h3>
          <p>Современные UI компоненты</p>
        </div>
      </div>
      
      <div class="cta-section">
        <router-link to="/demo" class="demo-link">
          <el-button type="primary" size="large">
            Посмотреть демо компонентов
          </el-button>
        </router-link>
      </div>
    </div>
  </main>
</template>

<script>
export default {
  name: 'PgHome'
}
</script>

<style scoped lang="scss">
@use '@/styles/themes.scss' as *;

.pg-home {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.hero-section {
  text-align: center;
  padding: 4rem 0;
  
  h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-hover));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  > p {
    font-size: 1.25rem;
    margin-bottom: 3rem;
    color: var(--text-secondary);
  }
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature-card {
  @include card-style;
  text-align: center;
  
  h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }
  
  p {
    color: var(--text-secondary);
    margin: 0;
  }
}

.cta-section {
  margin-top: 3rem;
  
  .demo-link {
    text-decoration: none;
  }
}

// Адаптивность
@media (max-width: 768px) {
  .pg-home {
    padding: 1rem;
  }
  
  .hero-section {
    padding: 2rem 0;
    
    h1 {
      font-size: 2rem;
    }
    
    > p {
      font-size: 1.1rem;
    }
  }
  
  .features {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
