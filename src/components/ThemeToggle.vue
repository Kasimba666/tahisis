<template>
  <el-switch
    v-model="isDark"
    @change="toggleTheme"
    :active-icon="moonIcon"
    :inactive-icon="sunnyIcon"
    size="small"
    class="theme-switch"
  />
</template>

<script>
import { Sunny, Moon } from '@element-plus/icons-vue'

export default {
  name: 'ThemeToggle',
  data() {
    return {
      isDark: false,
      sunnyIcon: Sunny,
      moonIcon: Moon
    }
  },
  mounted() {
    this.initTheme()
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.isDark = e.matches
        this.updateTheme()
      }
    })
  },
  methods: {
    toggleTheme() {
      this.updateTheme()
    },
    updateTheme() {
      if (this.isDark) {
        document.documentElement.setAttribute('data-theme', 'dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.removeAttribute('data-theme')
        localStorage.setItem('theme', 'light')
      }
    },
    initTheme() {
      const savedTheme = localStorage.getItem('theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      
      this.isDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
      this.updateTheme()
    }
  }
}
</script>

<style scoped lang="scss">
.theme-switch {
  :deep(.el-switch) {
    --el-switch-on-color: var(--accent-primary);
    --el-switch-off-color: var(--bg-secondary);
  }
}
</style>
