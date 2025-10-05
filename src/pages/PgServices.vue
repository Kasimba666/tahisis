<template>
  <main class="pg-services">
    <div class="page-header">
      <h1>Наши услуги</h1>
      <p>Полный спектр услуг для вашего бизнеса</p>
    </div>
    
    <div class="services-grid">
      <div class="service-card">
        <div class="service-icon">🌐</div>
        <h3>Веб-разработка</h3>
        <p>Создание современных веб-сайтов и веб-приложений с использованием передовых технологий</p>
      </div>
      
      <div class="service-card">
        <div class="service-icon">📱</div>
        <h3>Мобильные приложения</h3>
        <p>Разработка нативных и кроссплатформенных мобильных приложений для iOS и Android</p>
      </div>
      
      <div class="service-card">
        <div class="service-icon">🎨</div>
        <h3>UI/UX Дизайн</h3>
        <p>Создание интуитивных и привлекательных пользовательских интерфейсов</p>
      </div>
      
      <div class="service-card">
        <div class="service-icon">💼</div>
        <h3>Консультации</h3>
        <p>Экспертные консультации по выбору технологий и архитектуре проектов</p>
      </div>
    </div>
  </main>
</template>

<script>
export default {
  name: 'PgServices'
}
</script>

<style scoped lang="scss">
@use '@/styles/themes.scss' as *;

.pg-services {
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    color: var(--text-primary);
  }
  
  p {
    font-size: 1.2rem;
    color: var(--text-secondary);
  }
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.service-card {
  @include card-style;
  text-align: center;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
  
  .service-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
  }
  
  h3 {
    color: var(--accent-primary);
    margin-bottom: 1rem;
  }
  
  p {
    color: var(--text-secondary);
    margin: 0;
    line-height: 1.6;
  }
}

@media (max-width: 768px) {
  .pg-services {
    padding: 1rem;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .services-grid {
    grid-template-columns: 1fr;
  }
}
</style>
