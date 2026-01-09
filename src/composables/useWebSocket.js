import { ref, onMounted, onUnmounted } from 'vue';
import { WSClient } from 'wsmini';

let wsClient = null;
const isConnected = ref(false);
const connectionError = ref(null);
let reconnectInterval = null;

export function useWebSocket() {
  // Initialize WebSocket client
  const initializeWebSocket = async () => {
    if (wsClient && isConnected.value) {
      console.log('[WS] WebSocket already connected');
      return wsClient;
    }

    try {
      const wsProtocol = import.meta.env.VITE_WS_PROTOCOL || 'ws';
      const wsHost = import.meta.env.VITE_WS_HOST || 'localhost';
      const wsPort = import.meta.env.VITE_WS_PORT; // Don't use default - port should be explicit
      
      const wsUrl = wsPort ? `${wsProtocol}://${wsHost}:${wsPort}` : `${wsProtocol}://${wsHost}`;
      
      wsClient = new WSClient(wsUrl);
      
      // Try to get token from localStorage, or rely on cookies with credentials: 'include'
      const token = localStorage.getItem('token');
      
      // Connect - if no token, let the browser send cookies automatically
      // The server's authCallback will extract it from cookies or the token parameter
      await wsClient.connect(token || undefined).catch(err => {
        console.error('[WS] WebSocket connection error:', err);
        connectionError.value = 'WebSocket connection failed (offline mode enabled)';
        // Don't throw - allow offline mode
        throw err;
      });
      
      isConnected.value = true;
      connectionError.value = null;
      console.log('[WS] ✓ WebSocket connected successfully');
      
      // Clear any existing reconnect attempts
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
      
      return wsClient;
    } catch (err) {
      console.error('[WS] ✗ WebSocket initialization error:', err);
      // Don't throw - continue with offline mode
      isConnected.value = false;
      wsClient = null;
      connectionError.value = 'WebSocket unavailable - working in offline mode';
    }
  };

  // Subscribe to chat messages for a specific match
  const subscribeToChatMessages = async (matchId, callback) => {
    try {
      if (!matchId) {
        throw new Error('matchId is required for subscribing to chat');
      }

      if (!wsClient || !isConnected.value) {
        await initializeWebSocket();
      }
      
      // Only subscribe if connection was successful
      if (wsClient && isConnected.value) {
        const channelName = `match:${matchId}`;
        await wsClient.sub(channelName, (message) => {
          console.log('Received message:', message);
          callback(message);
        });
        console.log(`Subscribed to ${channelName}`);
      }
    } catch (err) {
      console.error('Chat subscription error:', err);
      // Silently fail - offline mode
    }
  };

  // Unsubscribe from a match channel
  const unsubscribeFromChat = async (matchId) => {
    try {
      if (wsClient && isConnected.value && matchId) {
        const channelName = `match:${matchId}`;
        await wsClient.unsub(channelName);
        console.log(`Unsubscribed from ${channelName}`);
      }
    } catch (err) {
      console.error('Unsubscribe error:', err);
    }
  };

  // Publish a chat message to a specific match
  const sendChatMessage = async (matchId, messageData) => {
    try {
      if (!matchId) {
        throw new Error('matchId is required for sending chat message');
      }

      if (!wsClient || !isConnected.value) {
        // Try to reconnect
        await initializeWebSocket();
      }
      
      // Only send if connection is active
      if (wsClient && isConnected.value) {
        const channelName = `match:${matchId}`;
        await wsClient.pub(channelName, messageData);
        console.log(`Message sent to ${channelName}`);
      }
    } catch (err) {
      console.error('Message publish error:', err);
      // Non-critical error - message is already saved via REST API
    }
  };

  // Disconnect WebSocket
  const disconnect = () => {
    if (wsClient) {
      try {
        // Use close() method for WebSocket disconnection
        if (typeof wsClient.close === 'function') {
          wsClient.close();
        }
        console.log('[WS] ✓ WebSocket disconnected');
      } catch (err) {
        // Silently ignore disconnect errors
        console.warn('[WS] Disconnect warning:', err.message);
      } finally {
        wsClient = null;
        isConnected.value = false;
        connectionError.value = 'Disconnected';
        
        // Clear any pending reconnect attempts
        if (reconnectInterval) {
          clearInterval(reconnectInterval);
          reconnectInterval = null;
        }
      }
    }
  };

  // Note: We don't automatically initialize WebSocket on mount
  // It will be initialized when needed (on subscribeToChatMessages or by App.vue watcher)
  // Only disconnect explicitly on logout or app closure (no auto-disconnect on unmount)

  return {
    isConnected,
    connectionError,
    initializeWebSocket,
    subscribeToChatMessages,
    unsubscribeFromChat,
    sendChatMessage,
    disconnect
  };
}
