import { ref } from 'vue'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuth } from '@/composables/useAuth'
import { fetchJson } from '@/utils/fetchJson'

export const matchNotification = ref(null)
export const unreadNotifications = ref(0)
let listenerRegistered = false
let autoClearTimer = null

export async function initializeWebSocketListeners() {
  try {
    const { initializeWebSocket } = useWebSocket()
    
    const wsClient = await initializeWebSocket()

    if (!wsClient) {
      return
    }

    if (!listenerRegistered) {
      wsClient.onCmd('matchNotification', (data) => {
        showNotification(data)
      })

      listenerRegistered = true
    }
    
    const userType = localStorage.getItem('user_type')
    if (userType === 'adopter') {
      await fetchPendingNotifications()
    }
    
  } catch (error) {
    console.error(error)
  }
}

async function fetchPendingNotifications() {
  try {
    const { getAuthFetchOptions } = useAuth()
    const authHeaders = getAuthFetchOptions().headers
    
    const { request } = fetchJson({ 
      url: '/api/matches/pending-notifications', 
      method: 'GET',
      headers: authHeaders
    })
    const response = await request
    
    if (response && Array.isArray(response)) {
      response.forEach(matchData => {
        showNotification(matchData)
      })
    }
  } catch (error) {
    if (error?.status === 403) {
      localStorage.removeItem('user_type')
    } else if (error?.status !== 401) {
      console.warn(error?.status)
    }
  }
}

export function clearNotification() {
  matchNotification.value = null
  if (autoClearTimer) {
    clearTimeout(autoClearTimer)
    autoClearTimer = null
  }
}

export function resetUnreadNotifications() {
  unreadNotifications.value = 0
}

export function disconnectWebSocket() {
  const { disconnect } = useWebSocket()
  disconnect()
  listenerRegistered = false
}

function showNotification(data) {
  matchNotification.value = data
  unreadNotifications.value += 1
  if (autoClearTimer) clearTimeout(autoClearTimer)
  autoClearTimer = setTimeout(() => {
    if (matchNotification.value?.matchId === data.matchId) {
      matchNotification.value = null
    }
    autoClearTimer = null
  }, 8000)
}
