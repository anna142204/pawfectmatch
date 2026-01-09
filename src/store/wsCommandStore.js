import { ref } from 'vue'
import { useWebSocket } from '@/composables/useWebSocket'

// Global state for match notifications
export const matchNotification = ref(null)
export const unreadNotifications = ref(0)
let listenerRegistered = false

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

    // Only register listener once per connection to avoid duplicates
    if (!listenerRegistered) {
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

      listenerRegistered = true
      console.log('[WS Listeners] ✓ WebSocket command listener registered for matchNotification')
    } else {
      console.log('[WS Listeners] Command listener already registered, skipping')
    }
    
    // Check for pending notifications ONLY if user is an adopter
    const userType = localStorage.getItem('user_type')
    if (userType === 'adopter') {
      // This is safe to await - errors are caught inside the function
      await fetchPendingNotifications()
    } else {
      console.log('[WS Listeners] Skipping pending notifications - user is not an adopter')
    }
    
  } catch (error) {
    console.error('[WS Listeners] ✗ Error initializing WebSocket listeners:', error)
    // Don't throw - allow app to continue even if WebSocket setup has issues
  }
}

// Fetch any pending notifications that arrived while adopter was offline
async function fetchPendingNotifications() {
  try {
    console.log('[WS Listeners] Checking for pending notifications...')
    // fetchJson returns { request, abort }; we need to await the request promise
    const { request } = fetchJson({ url: '/api/matches/pending-notifications', method: 'GET' })
    const response = await request
    
    if (response && Array.isArray(response)) {
      console.log(`[WS Listeners] Found ${response.length} pending notifications`)
      
      // Process each pending notification
      response.forEach(matchData => {
        console.log('[WS Listeners] ✓ Displaying pending notification:', matchData)
        matchNotification.value = matchData
        unreadNotifications.value += 1
        
        // Auto-clear after 8 seconds
        setTimeout(() => {
          if (matchNotification.value?.matchId === matchData.matchId) {
            matchNotification.value = null
          }
        }, 8000)
      })
    }
  } catch (error) {
    // Silently handle errors - pending notifications are nice-to-have, not critical
    // Handle 403 specifically - user type mismatch between localStorage and JWT
    if (error?.status === 403) {
      console.log('[WS Listeners] Access denied - user is not an adopter, skipping pending notifications')
      // Clear localStorage if there's a mismatch to prevent future attempts
      localStorage.removeItem('user_type')
    } else if (error?.status !== 401) {
      console.warn('[WS Listeners] Could not fetch pending notifications (non-critical):', error?.status)
    }
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
  listenerRegistered = false  // Reset flag so listener can be re-registered on next login
  console.log('[WS Listeners] ✓ WebSocket disconnected and listener flag reset')
}
