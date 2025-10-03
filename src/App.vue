<script setup>
import AppHeader from './layout/AppHeader.vue'
import AppFooter from './layout/AppFooter.vue'
import ThemeToggle from './components/ThemeToggle.vue'
</script>

<template>
  <ThemeToggle />
  
  <AppHeader site-title="Современный Сайт" />
  
  <router-view />
  
  <AppFooter site-title="Современный Сайт" />
</template>

<style scoped lang="scss">
  @use './styles/themes.scss' as *;
</style>