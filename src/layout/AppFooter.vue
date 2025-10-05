<template>
  <footer class="app-footer">
    <div class="footer-container">
      <p class="copyright">
        © {{ currentYear }} {{ siteTitle }}. Все права защищены.
      </p>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'AppFooter',
  props: {
    siteTitle: {
      type: String,
      default: 'Мой Сайт'
    }
  },
  computed: {
    currentYear() {
      return new Date().getFullYear()
    }
  }
}
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
  padding: 0 3px;
}

.copyright {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
  text-align: center;
  padding: 3px 0;
}

</style>
