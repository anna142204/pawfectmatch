import { ref } from 'vue'
import { WSClient } from 'wsmini'

let wsClient = null
const isConnected = ref(false)
const connectionError = ref(null)
let reconnectInterval = null

export function useWebSocket() {
  /**
   * Initialise la connexion WebSocket
   * Établit une connexion avec le serveur WebSocket
   * @returns {Promise<WSClient>} Le client WebSocket connecté
   * @throws {Error} Si la connexion échoue
   */
  const initializeWebSocket = async () => {
    if (wsClient && isConnected.value) {
      console.log('[WS] WebSocket already connected')
      return wsClient
    }

    try {
      const wsProtocol = import.meta.env.VITE_WS_PROTOCOL || 'ws'
      const wsHost = import.meta.env.VITE_WS_HOST || 'localhost'
      const wsPort = import.meta.env.VITE_WS_PORT

      const wsUrl = wsPort ? `${wsProtocol}://${wsHost}:${wsPort}` : `${wsProtocol}://${wsHost}`

      wsClient = new WSClient(wsUrl)

      await wsClient.connect().catch(err => {
        console.error('[WS] WebSocket connection error:', err)
        connectionError.value = 'WebSocket connection failed (offline mode enabled)'
        throw err
      })

      isConnected.value = true
      connectionError.value = null
      console.log('[WS] ✓ WebSocket connected successfully')

      if (reconnectInterval) {
        clearInterval(reconnectInterval)
        reconnectInterval = null
      }

      return wsClient
    } catch (err) {
      console.error('[WS] ✗ WebSocket initialization error:', err)
      isConnected.value = false
      wsClient = null
      connectionError.value = 'WebSocket unavailable - working in offline mode'
    }
  }

  /**
   * S'abonne aux messages de chat d'un match spécifique
   * @param {string} matchId - L'ID du match
   * @param {Function} callback - Fonction appelée quand un message arrive
   * @returns {Promise<void>}
   */
  const subscribeToChatMessages = async (matchId, callback) => {
    try {
      if (!matchId) {
        throw new Error('matchId is required for subscribing to chat')
      }

      if (!wsClient || !isConnected.value) {
        await initializeWebSocket()
      }

      if (wsClient && isConnected.value) {
        const channelName = `match:${matchId}`
        await wsClient.sub(channelName, (message) => {
          console.log('Received message:', message)
          callback(message)
        })
        console.log(`Subscribed to ${channelName}`)
      }
    } catch (err) {
      console.error('Chat subscription error:', err)
    }
  }

  /**
   * Se désabonne des messages de chat d'un match
   * @param {string} matchId - L'ID du match
   * @returns {Promise<void>}
   */
  const unsubscribeFromChat = async (matchId) => {
    try {
      if (wsClient && isConnected.value && matchId) {
        const channelName = `match:${matchId}`
        await wsClient.unsub(channelName)
        console.log(`Unsubscribed from ${channelName}`)
      }
    } catch (err) {
      console.error('Unsubscribe error:', err)
    }
  }

  /**
   * Envoie un message de chat via WebSocket
   * @param {string} matchId - L'ID du match
   * @param {Object} messageData - Les données du message à envoyer
   * @returns {Promise<void>}
   */
  const sendChatMessage = async (matchId, messageData) => {
    try {
      if (!matchId) {
        throw new Error('matchId is required for sending chat message')
      }

      if (!wsClient || !isConnected.value) {
        await initializeWebSocket()
      }

      if (wsClient && isConnected.value) {
        const channelName = `match:${matchId}`
        await wsClient.pub(channelName, messageData)
        console.log(`Message sent to ${channelName}`)
      }
    } catch (err) {
      console.error('Message publish error:', err)
    }
  }

  /**
   * Déconnecte le WebSocket et arrête les tentatives de reconnexion
   * @returns {void}
   */
  const disconnect = () => {
    if (wsClient) {
      try {
        if (typeof wsClient.close === 'function') {
          wsClient.close()
        }
        console.log('[WS] ✓ WebSocket disconnected')
      } catch (err) {
        console.warn('[WS] Disconnect warning:', err.message)
      } finally {
        wsClient = null
        isConnected.value = false
        connectionError.value = 'Disconnected'

        if (reconnectInterval) {
          clearInterval(reconnectInterval)
          reconnectInterval = null
        }
      }
    }
  }

  return {
    isConnected,
    connectionError,
    initializeWebSocket,
    subscribeToChatMessages,
    unsubscribeFromChat,
    sendChatMessage,
    disconnect
  }
}
