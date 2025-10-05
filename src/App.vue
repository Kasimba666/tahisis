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
import {useScreen} from "@/composables/useScreen.js"
import AppHeader from '@/layout/AppHeader.vue'
import AppFooter from '@/layout/AppFooter.vue'

export default {
  name: 'App',
  components: {
    AppFooter, 
    AppHeader
  },
  data() {
    return {
      DEBUG: import.meta.env.MODE === 'development',
      screen: null,
      screenBreakPoints: null,
      setScreenListener: null,
      removeScreenListener: null
    }
  },
  created() {
    const screenComposable = useScreen()
    this.screen = screenComposable.screen
    this.screenBreakPoints = screenComposable.screenBreakPoints
    this.setScreenListener = screenComposable.setScreenListener
    this.removeScreenListener = screenComposable.removeScreenListener
  },
  mounted() {
    this.setScreenListener()
  },
  unmounted() {
    this.removeScreenListener()
  }
}
</script>

<style scoped lang="scss">
@use './styles/themes.scss' as *;
.screen-monitor {
  position: absolute;
  left: 10px;
  top: 10px;
  font-size: 12px;
  color: gray;
  z-index: 1000;
}

</style>
