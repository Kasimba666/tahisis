<template>
  <footer class="app-footer">
    <div class="footer-container">
      <!-- Основная информация -->
      <div class="footer-content">

      </div>
      
      <!-- Нижняя часть -->
      <div class="footer-bottom">
        <div class="footer-bottom-content">
          <p class="copyright">
            © {{ currentYear }} {{ siteTitle }}. Все права защищены.
          </p>
          <div class="footer-bottom-links">
            <a href="#privacy">Политика конфиденциальности</a>
            <a href="#terms">Условия использования</a>
            <a href="#cookies">Cookie</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { 
  Star, 
  Message, 
  Phone, 
  Location, 
  ChatDotRound, 
  Link 
} from '@element-plus/icons-vue'

// Props
const props = defineProps({
  siteTitle: {
    type: String,
    default: 'Мой Сайт'
  }
})

// Computed
const currentYear = computed(() => new Date().getFullYear())
</script>

<style scoped lang="scss">
@use '@/styles/themes.scss' as *;

.app-footer {
  background-color: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  margin-top: auto;
  @include theme-transition;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  gap: 3rem;
  padding: 3rem 0 2rem 0;
}

.footer-section {
  h4 {
    color: var(--text-primary);
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  
  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .brand-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-hover));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.brand-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    margin-bottom: 0.5rem;
    
    a {
      color: var(--text-secondary);
      text-decoration: none;
      @include theme-transition;
      
      &:hover {
        color: var(--accent-primary);
        text-decoration: none;
      }
    }
  }
}

.contact-info {
  margin-bottom: 1.5rem;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: var(--text-secondary);
  
  .el-icon {
    color: var(--accent-primary);
    font-size: 1rem;
  }
  
  span {
    font-size: 0.9rem;
  }
}

.social-links {
  display: flex;
  gap: 0.75rem;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  color: var(--text-secondary);
  text-decoration: none;
  @include theme-transition;
  
  &:hover {
    background-color: var(--accent-primary);
    border-color: var(--accent-primary);
    color: var(--bg-primary);
    transform: translateY(-2px);
  }
  
  .el-icon {
    font-size: 1.1rem;
  }
}

.footer-bottom {
  border-top: 1px solid var(--border-color);
  padding: 1.5rem 0;
}

.footer-bottom-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.copyright {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.footer-bottom-links {
  display: flex;
  gap: 1.5rem;
  
  a {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.9rem;
    @include theme-transition;
    
    &:hover {
      color: var(--accent-primary);
      text-decoration: none;
    }
  }
}

// Адаптивность
@media (max-width: 1024px) {
  .footer-content {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
}

@media (max-width: 768px) {
  .footer-container {
    padding: 0 1rem;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 2rem;
    padding: 2rem 0 1.5rem 0;
  }
  
  .footer-bottom-content {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }
  
  .footer-bottom-links {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .footer-container {
    padding: 0 0.5rem;
  }
  
  .footer-content {
    padding: 1.5rem 0 1rem 0;
  }
  
  .footer-bottom-links {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .social-links {
    justify-content: center;
  }
}
</style>