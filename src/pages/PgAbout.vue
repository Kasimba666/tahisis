<template>
  <main class="EstateTypesUpload">
    <div class="page-header">
      <h1>О нас</h1>
      <p>Узнайте больше о нашей компании и команде</p>
    </div>
    
    <div class="content-section">
      <div class="about-card">
        <h2>Наша миссия</h2>
        <p>
          Мы создаём современные веб-решения, которые помогают бизнесу расти и развиваться 
          в цифровом мире. Наша команда профессионалов использует передовые технологии 
          для создания качественных продуктов.
        </p>
      </div>
      
      <div class="about-card">
        <h2>Наши ценности</h2>
        <ul>
          <li>Качество и внимание к деталям</li>
          <li>Инновационный подход к решению задач</li>
          <li>Открытость и честность в общении</li>
          <li>Постоянное развитие и обучение</li>
        </ul>
      </div>
    </div>
  </main>
</template>

<script setup>
// Страница "О нас"
</script>

<style scoped lang="scss">
@use '@/styles/themes.scss' as *;

.EstateTypesUpload {
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

.content-section {
  display: grid;
  gap: 2rem;
}

.about-card {
  @include card-style;
  
  h2 {
    color: var(--accent-primary);
    margin-bottom: 1rem;
  }
  
  p {
    line-height: 1.6;
    margin-bottom: 0;
  }
  
  ul {
    margin: 0;
    padding-left: 1.5rem;
    
    li {
      margin-bottom: 0.5rem;
      color: var(--text-secondary);
    }
  }
}

@media (max-width: 768px) {
  .EstateTypesUpload {
    padding: 1rem;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
}
</style>