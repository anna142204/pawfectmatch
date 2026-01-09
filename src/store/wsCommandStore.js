import { ref } from 'vue'
import { useWebSocket } from '@/composables/useWebSocket'

// Global state for match notifications
export const matchNotification = ref(null)
export const unreadNotifications = ref(0)

// Initialize WebSocket event listeners
export async function initializeWebSocketListeners() {
  try {
    const { initializeWebSocket } = useWebSocket()
    
    // Initialize WebSocket connection
    const wsClient = await initializeWebSocket()

    if (!wsClient) {
      console.warn('[WS Listeners] WebSocket client not available')
      return
    }

    console.log('[WS Listeners] WebSocket client initialized, setting up command listeners...')

    // Listen for match notifications - must be synchronous callback (NO return value)
    wsClient.onCmd('matchNotification', (data) => {
      console.log('[WS Listeners] ✓ Match notification received:', data)
      matchNotification.value = data
      unreadNotifications.value += 1
      
      // Auto-clear notification after 8 seconds if not already cleared
      setTimeout(() => {
        if (matchNotification.value?.matchId === data.matchId) {
          console.log('[WS Listeners] Auto-clearing notification after 8 seconds')
          matchNotification.value = null
        }
      }, 8000)
      
      // IMPORTANT: Do NOT return anything from onCmd callback
    })

    console.log('[WS Listeners] ✓ WebSocket command listener registered for matchNotification')
    
  } catch (error) {
    console.error('[WS Listeners] ✗ Error initializing WebSocket listeners:', error)
    // Don't throw - allow app to continue even if WebSocket setup has issues
  }
}

// Clear current notification
export function clearNotification() {
  console.log('[WS Listeners] Clearing notification')
  matchNotification.value = null
}

// Reset unread counter
export function resetUnreadNotifications() {
  unreadNotifications.value = 0
}

// Disconnect WebSocket (should only be called on logout)
export function disconnectWebSocket() {
  const { disconnect } = useWebSocket()
  disconnect()
  console.log('[WS Listeners] WebSocket disconnected')
}
