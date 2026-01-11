import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { setAuthErrorHandler } from './utils/fetchJson'
import { useAuth } from './composables/useAuth'

setAuthErrorHandler(() => {
  const { handleAuthError } = useAuth()
  handleAuthError()
})

const myApp = createApp(App)
myApp.use(router)
myApp.mount('#app')