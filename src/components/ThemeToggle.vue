<template>
  <el-switch
    v-model="isDark"
    @change="toggleTheme"
    :active-icon="Moon"
    :inactive-icon="Sunny"
    size="small"
    class="theme-switch"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Sunny, Moon } from '@element-plus/icons-vue'

const isDark = ref(false)

const toggleTheme = () => {
  updateTheme()
}

const updateTheme = () => {
  if (isDark.value) {
    document.documentElement.setAttribute('data-theme', 'dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
    localStorage.setItem('theme', 'light')
  }
}

const initTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  isDark.value = savedTheme === 'dark' || (!savedTheme && prefersDark)
  updateTheme()
}

onMounted(() => {
  initTheme()
  
  // Слушаем изменения системной темы
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      isDark.value = e.matches
      updateTheme()
    }
  })
})
</script>

<style scoped lang="scss">
.theme-switch {
  :deep(.el-switch) {
    --el-switch-on-color: var(--accent-primary);
    --el-switch-off-color: var(--bg-secondary);
  }
}
</style>
