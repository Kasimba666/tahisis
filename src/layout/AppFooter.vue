<template>
  <footer class="app-footer">
    <div class="footer-container">
          <p class="copyright">
            © {{ currentYear }} {{ siteTitle }}. Все права защищены.
          </p>
        </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'


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

.copyright {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
  text-align: center;
  padding: 1.5rem 0;
}

</style>
