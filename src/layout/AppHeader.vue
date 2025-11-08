<template>
  <header class="app-header">
    <div class="header-container">
      <div class="header-top">
        <div class="header-brand">
          <div class="logo">
            <el-icon :size="24" color="var(--accent-primary)">
              <component :is="logoIcon" />
            </el-icon>
          </div>
          <h1 class="site-title">{{ siteTitle }}</h1>
        </div>
        <div class="header-actions">
          <ThemeToggle />
        </div>
      </div>
      
      <div class="header-bottom">
        <nav class="main-nav" :class="{ 'multi-line': isSmallScreen }">
          <router-link to="/about" class="nav-item" :class="{ active: isActive('/about') }">
            О проекте
          </router-link>
          <router-link to="/estates" class="nav-item" :class="{ active: isActive('/estates') }">
            Сословия
          </router-link>
          <router-link to="/revisions" class="nav-item" :class="{ active: isActive('/revisions') }">
            Ревизии
          </router-link>
          <router-link to="/settlements" class="nav-item" :class="{ active: isActive('/settlements') }">
            Населённые пункты
          </router-link>
          <router-link to="/settings" class="nav-item" :class="{ active: isActive('/settings') }">
            Настройки
          </router-link>
          <div v-if="authState.user" class="nav-item has-submenu">
            <span class="submenu-trigger">Управление данными</span>
            <div class="submenu">
              <router-link to="/estate-types" class="submenu-item">
                Типы сословий
              </router-link>
              <router-link to="/revisions-upload" class="submenu-item">
                Ревизии
              </router-link>
              <div class="submenu-divider"></div>
              <router-link to="/vector-layer-types" class="submenu-item">
                Типы векторных слоев
              </router-link>
              <router-link to="/vector-layers" class="submenu-item">
                Векторные слои
              </router-link>
            </div>
          </div>

          <div class="nav-spacer"></div>
          
          <a v-if="!authState.user" @click="openAuthModal" class="nav-item nav-action">
            Login
          </a>
          <div v-else class="nav-item has-submenu">
            <span class="submenu-trigger">{{ authState.user.email }}</span>
            <div class="submenu">
              <a @click="handleLogout" class="submenu-item">Logout</a>
            </div>
          </div>
        </nav>
      </div>
    </div>
  </header>

  <AuthModal v-model="authModalVisible" />
</template>

<script>
import {useScreen} from '@/composables/useScreen.js'
import AuthModal from '@/components/AuthModal.vue'
import { ElMessage } from 'element-plus'
import { state as authState, signOut } from '@/store/auth.js'
import { Star } from '@element-plus/icons-vue'
import ThemeToggle from '@/components/ThemeToggle.vue'

export default {
  name: 'AppHeader',
  components: { 
    AuthModal,
    Star,
    ThemeToggle
  },
  props: {
    siteTitle: {
      type: String,
      default: 'Мой Сайт'
    }
  },
  data() {
    return {
      authModalVisible: false,
      authState: authState,
      screen: null,
      setScreenListener: null,
      removeScreenListener: null
    }
  },
  computed: {
    logoIcon() {
      return Star
    },
    isSmallScreen() {
      return this.screen && (this.screen.type === 'xs' || this.screen.type === 'sm')
    }
  },
  created() {
    const screenComposable = useScreen()
    this.screen = screenComposable.screen
    this.setScreenListener = screenComposable.setScreenListener
    this.removeScreenListener = screenComposable.removeScreenListener
  },
  mounted() {
    this.setScreenListener()
  },
  unmounted() {
    this.removeScreenListener()
  },
  methods: {
    isActive(path) {
      return this.$route.path === path
    },
    openAuthModal() {
      this.authModalVisible = true
    },
    handleLogout() {
      signOut()
        .then(({ error }) => {
          if (error) {
            ElMessage.error(error.message)
          } else {
            ElMessage.success('You have been logged out.')
            this.$router.push('/')
          }
        })
    }
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/themes.scss' as *;

.app-header {
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 1px 4px var(--shadow);
  position: sticky;
  top: 0;
  z-index: 10;
  @include theme-transition;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 3px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 0;
  border-bottom: 1px solid var(--border-color);
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 3px;

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .site-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
    background: linear-gradient(135deg, var(--accent-primary), var(--accent-hover));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.header-actions {
  display: flex;
  align-items: center;
}

.header-bottom {
  padding: 3px 0;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: nowrap;
  
  &.multi-line {
    flex-wrap: wrap;
  }
}

.nav-item {
  position: relative;
  padding: 3px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
  cursor: pointer;
  @include theme-transition;
  
  &:hover {
    color: var(--accent-primary);
    background-color: var(--bg-secondary);
  }
  
  &.active {
    color: var(--accent-primary);
    background-color: var(--bg-secondary);
  }
  
  &.nav-action {
    cursor: pointer;
  }
  
  &.has-submenu {
    .submenu-trigger {
      display: block;
      padding: 0;
      cursor: pointer;
    }
    
    &:hover .submenu {
      display: block;
    }
  }
}

.submenu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 180px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  box-shadow: 0 2px 8px var(--shadow);
  padding: 3px 0;
  margin-top: 2px;
  z-index: 100;
}

.submenu-item {
  display: block;
  padding: 3px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  white-space: nowrap;
  cursor: pointer;
  @include theme-transition;

  &:hover {
    color: var(--accent-primary);
    background-color: var(--bg-secondary);
  }
}

.submenu-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 2px 0;
}

.nav-spacer {
  flex: 1;
  min-width: 3px;
}

@media (max-width: 576px) {
  .header-brand .site-title {
    font-size: 1rem;
  }
  
  .nav-item {
    font-size: 0.85rem;
    padding: 2px;
  }
}
</style>
