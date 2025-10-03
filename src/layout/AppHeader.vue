<template>
  <header class="app-header">
    <div class="header-container">
      <!-- Логотип и заглавие -->
      <div class="header-brand">
        <div class="logo">
          <el-icon size="32" color="var(--accent-primary)">
            <component :is="logoIcon" />
          </el-icon>
        </div>
        <h1 class="site-title">{{ siteTitle }}</h1>
      </div>

      <!-- Горизонтальное меню -->
      <div class="header-menu">
        <el-menu
            :default-active="activeIndex"
            mode="horizontal"
            @select="handleSelect"
            class="main-menu"
            :ellipsis="false"
            router
        >
          <el-menu-item index="/">
            <el-icon><House /></el-icon>
            <span>Главная</span>
          </el-menu-item>
          <el-menu-item index="/about">
            <el-icon><Document /></el-icon>
            <span>О нас</span>
          </el-menu-item>
          <el-sub-menu index="/services">
            <template #title>
              <el-icon><Grid /></el-icon>
              <span>Услуги</span>
            </template>
            <el-menu-item index="/services">Все услуги</el-menu-item>
            <el-menu-item index="/demo">Демо компонентов</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="/data-upload">
            <template #title>
              <el-icon><Upload /></el-icon>
              <span>Загрузка данных</span>
            </template>
            <el-menu-item index="/estate-types-upload">Загрузка типов сословий</el-menu-item>
            <el-menu-item index="/revisions-upload">Загрузка ревизий</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/portfolio">
            <el-icon><Briefcase /></el-icon>
            <span>Портфолио</span>
          </el-menu-item>
          <el-menu-item index="/contact">
            <el-icon><ChatDotRound /></el-icon>
            <span>Контакты</span>
          </el-menu-item>
        </el-menu>
      </div>

      <!-- Мобильное меню -->
      <div class="mobile-menu">
        <el-button
            @click="toggleMobileMenu"
            :icon="mobileMenuOpen ? Close : Menu"
            circle
            size="large"
            class="mobile-menu-btn"
        />

        <div v-if="mobileMenuOpen" class="mobile-menu-overlay" @click="closeMobileMenu">
          <div class="mobile-menu-content" @click.stop>
            <el-menu
                :default-active="activeIndex"
                mode="vertical"
                @select="handleMobileSelect"
                class="mobile-nav"
                router
            >
              <el-menu-item index="/">
                <el-icon><House /></el-icon>
                <span>Главная</span>
              </el-menu-item>
              <el-menu-item index="/about">
                <el-icon><Document /></el-icon>
                <span>О нас</span>
              </el-menu-item>
              <el-sub-menu index="/services">
                <template #title>
                  <el-icon><Grid /></el-icon>
                  <span>Услуги</span>
                </template>
                <el-menu-item index="/services">Все услуги</el-menu-item>
                <el-menu-item index="/demo">Демо компонентов</el-menu-item>
              </el-sub-menu>
              <el-sub-menu index="/data-upload">
                <template #title>
                  <el-icon><Upload /></el-icon>
                  <span>Загрузка данных</span>
                </template>
                <el-menu-item index="/estate-types-upload">Загрузка типов сословий</el-menu-item>
                <el-menu-item index="/revisions-upload">Загрузка ревизий</el-menu-item>
              </el-sub-menu>
              <el-menu-item index="/portfolio">
                <el-icon><Briefcase /></el-icon>
                <span>Портфолио</span>
              </el-menu-item>
              <el-menu-item index="/contact">
                <el-icon><ChatDotRound /></el-icon>
                <span>Контакты</span>
              </el-menu-item>
            </el-menu>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import {useScreen} from '@/composables/useScreen.js';
import {
  House,
  Document,
  Grid,
  Briefcase,
  ChatDotRound,
  Menu,
  Close,
  Star,
  Upload
} from '@element-plus/icons-vue';

export default {
  name: 'AppHeader',
  props: {
    siteTitle: {
      type: String,
      default: 'Мой Сайт'
    }
  },
  data() {
    return {
      activeIndex: '/',
      mobileMenuOpen: false
    }
  },
  setup() {
    const {screen, screenBreakpoints} = useScreen();
    return {
      screen,
      screenBreakpoints
    }
  },
  computed: {
    logoIcon() {
      return Star
    }
  },
  watch: {
    '$route.path'(newPath) {
      this.activeIndex = newPath
    }
  },
  mounted() {
    // Устанавливаем начальное значение при монтировании
    this.activeIndex = this.$route.path
  },
  methods: {
    handleSelect(key, keyPath) {
      console.log('Выбран пункт меню:', key, keyPath)
      this.activeIndex = key
    },
    handleMobileSelect(key, keyPath) {
      this.handleSelect(key, keyPath)
      this.closeMobileMenu()
    },
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
    },
    closeMobileMenu() {
      this.mobileMenuOpen = false
    }
  },
  components: {
    House,
    Document,
    Grid,
    Briefcase,
    ChatDotRound,
    Menu,
    Close,
    Star,
    Upload
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/themes.scss' as *;
.app-header {
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 2px 8px var(--shadow);
  position: sticky;
  top: 0;
  z-index: 100;
  @include theme-transition;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  height: 70px;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 1rem;
  
  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .site-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-hover));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.header-menu {
  flex: 1;
  display: flex;
  justify-content: center;
  margin: 0 2rem;
}

.main-menu {
  border-bottom: none !important;
  background-color: transparent !important;
  
  :deep(.el-menu-item) {
    color: var(--text-secondary);
    border-bottom: 2px solid transparent;
    margin: 0 0.5rem;
    border-radius: 8px 8px 0 0;
    @include theme-transition;
    
    &:hover {
      color: var(--accent-primary);
      background-color: var(--bg-secondary);
    }
    
    &.is-active {
      color: var(--accent-primary);
      border-bottom-color: var(--accent-primary);
      background-color: var(--bg-secondary);
    }
  }
  
  :deep(.el-sub-menu) {
    .el-sub-menu__title {
      color: var(--text-secondary);
      border-bottom: 2px solid transparent;
      margin: 0 0.5rem;
      border-radius: 8px 8px 0 0;
      @include theme-transition;
      
      &:hover {
        color: var(--accent-primary);
        background-color: var(--bg-secondary);
      }
    }
    
    &.is-active .el-sub-menu__title {
      color: var(--accent-primary);
      border-bottom-color: var(--accent-primary);
    }
  }
  
  :deep(.el-menu--popup) {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-color);
    box-shadow: 0 4px 12px var(--shadow);
    
    .el-menu-item {
      color: var(--text-secondary);
      margin: 0;
      border-radius: 0;
      border-bottom: none;
      
      &:hover {
        background-color: var(--bg-secondary);
        color: var(--accent-primary);
      }
    }
  }
}

.mobile-menu {
  display: none;
}

.mobile-menu-btn {
  background-color: var(--bg-secondary) !important;
  border-color: var(--border-color) !important;
  color: var(--text-primary) !important;
}

.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding-top: 70px;
}

.mobile-menu-content {
  background-color: var(--bg-primary);
  width: 280px;
  height: calc(100vh - 70px);
  box-shadow: -4px 0 12px var(--shadow);
  overflow-y: auto;
}

.mobile-nav {
  border-right: none !important;
  background-color: transparent !important;
  
  :deep(.el-menu-item) {
    color: var(--text-secondary);
    padding-left: 2rem;
    
    &:hover {
      background-color: var(--bg-secondary);
      color: var(--accent-primary);
    }
    
    &.is-active {
      background-color: var(--bg-secondary);
      color: var(--accent-primary);
      border-right: 3px solid var(--accent-primary);
    }
  }
  
  :deep(.el-sub-menu) {
    .el-sub-menu__title {
      color: var(--text-secondary);
      padding-left: 2rem;
      
      &:hover {
        background-color: var(--bg-secondary);
        color: var(--accent-primary);
      }
    }
    
    .el-menu-item {
      padding-left: 3rem;
    }
  }
}

// Адаптивность
@media (max-width: 768px) {
  .header-container {
    padding: 0 1rem;
  }
  
  .header-menu {
    display: none;
  }
  
  .mobile-menu {
    display: block;
  }
  
  .header-brand {
    .site-title {
      font-size: 1.25rem;
    }
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 0 0.5rem;
  }
  
  .header-brand {
    gap: 0.5rem;
    
    .site-title {
      font-size: 1.1rem;
    }
  }
  
  .mobile-menu-content {
    width: 100vw;
  }
}
</style>
