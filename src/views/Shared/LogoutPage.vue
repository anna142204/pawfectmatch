<script setup>
import { onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useWebSocket } from '@/composables/useWebSocket'

const { logout } = useAuth()
const { disconnect } = useWebSocket()

onMounted(async () => {
  try {
    // Disconnect WebSocket before logout
    disconnect()
    console.log('WebSocket disconnected on logout')
    
    // Call logout (qui gère l'API call et la redirection)
    await logout()
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error)
    // Rediriger quand même vers login en cas d'erreur
    await logout()
  }
})
</script>

<template>
  <div class="logout-page">
    <p>Déconnexion en cours...</p>
  </div>
</template>

<style scoped>
.logout-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  color: #666;
}
</style>
