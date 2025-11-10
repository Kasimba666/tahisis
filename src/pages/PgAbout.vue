<template>
  <main class="pg-about">
    <div class="content-section">
      <div class="about-card">
        <h3>Заголовок</h3>
        <p>
          Что-то о проекте
        </p>
      </div>
      
    </div>
  </main>
</template>

<script>
export default {
  name: 'PgAbout'
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
  h3 {
    color: var(--accent-primary);
    margin-left: 10px;
  }

  p {
    line-height: 1.6;
    margin: 10px;
  }
}

@media (max-width: 768px) {
  .pg-about {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 2rem;
  }
}
</style>
