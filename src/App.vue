<template>
  <div class="screen-monitor" v-if="DEBUG">
    {{ screen.type }}<br/>
    {{ screen.width }}px
  </div>
  <AppHeader site-title="Историческое расселение" />
  <router-view />
  <AppFooter site-title="Историческое расселение" />
</template>

<script>
import {useScreen} from "@/composables/useScreen.js";
import AppHeader from '@/layout/AppHeader.vue';
import AppFooter from '@/layout/AppFooter.vue';
export default {
  name: 'App',
  components: {AppFooter, AppHeader},
  data() {
    return {
      DEBUG: import.meta.env.MODE === 'development',
    }
  },
  setup() {
    const {screen, screenBreakPoints, setScreenListener, removeScreenListener} = useScreen();
    return {
      screen,
      screenBreakPoints,
      setScreenListener,
      removeScreenListener
    }
  },
  mounted() {
    this.setScreenListener();
  },
  unmounted() {
    this.removeScreenListener();
  }
}
</script>

<style scoped lang="scss">
  @use './styles/themes.scss' as *;
</style>
