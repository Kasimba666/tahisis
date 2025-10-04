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
          <el-menu-item index="/about">
            <span>О проекте</span>
          </el-menu-item>
          <el-menu-item index="/">
            <span>Список сословий</span>
          </el-menu-item>
          <el-sub-menu index="/services">
            <template #title>
              <span>Услуги</span>
            </template>
            <el-menu-item index="/services">Все услуги</el-menu-item>
            <el-menu-item index="/demo">Демо компонентов</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="/data-upload">
            <template #title>
              <span>Загрузка данных</span>
            </template>
            <el-menu-item index="/estate-types-upload">Загрузка типов сословий</el-menu-item>
            <el-menu-item index="/revisions-upload">Загрузка ревизий</el-menu-item>
          </el-sub-menu>
          <el-menu-item index="/contact">
            <span>Контакты</span>
          </el-menu-item>
          <!-- Spacer -->
          <div class="flex-spacer"></div>

          <!-- Auth Section -->
          <el-menu-item v-if="!authState.user" @click="openAuthModal">
            Login
          </el-menu-item>
          <el-sub-menu v-else index="user-menu">
            <template #title>{{ authState.user.email }}</template>
            <el-menu-item @click="handleLogout">Logout</el-menu-item>
          </el-sub-menu>

          <!-- Theme Toggle in Menu -->
          <li class="theme-menu-item" style="margin-left: auto; display: flex; align-items: center; list-style: none; background: none !important; border: none !important; padding: 0.5rem;">
            <ThemeToggle />
          </li>
        </el-menu>
      </div>


    </div>
  </header>

  <!-- Authentication Modal -->
  <AuthModal v-model="authModalVisible" />
</template>

<script>
import {useScreen} from '@/composables/useScreen.js';
import AuthModal from '@/components/AuthModal.vue'
import { ElMessage } from 'element-plus'
import { state as authState, signOut } from '@/store/auth.js'
import {
  Star
} from '@element-plus/icons-vue';
import ThemeToggle from '@/components/ThemeToggle.vue';

export default {
  name: 'AppHeader',
  components: { AuthModal,
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
      activeIndex: '/',
      authModalVisible: false,
      authState: authState // Make state reactive in the template
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
              // Redirect to home or login page if necessary
              this.$router.push('/')
            }
          })
    }
  },

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
  z-index: 10;
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
  margin: 0 1rem;
}

.main-menu {
  border-bottom: none !important;
  background-color: transparent !important;
  display: flex;
  justify-content: space-between;
  width: 100%;

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


</style>
