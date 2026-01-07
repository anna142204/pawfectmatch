import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { setAuthErrorHandler } from './utils/fetchJson'

// Configurer le gestionnaire d'erreurs d'authentification
setAuthErrorHandler(() => {
  localStorage.removeItem('token')
  localStorage.removeItem('user_id')
  localStorage.removeItem('user_type')
  router.push('/login')
})

const myApp = createApp(App)
myApp.use(router)
myApp.mount('#app')