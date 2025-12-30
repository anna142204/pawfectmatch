import { ref, onMounted, onUnmounted } from 'vue';
import { WSClient } from 'wsmini';

let wsClient = null;
const isConnected = ref(false);
const connectionError = ref(null);

export function useWebSocket() {
  // Initialize WebSocket client
  const initializeWebSocket = async () => {
    if (wsClient && isConnected.value) {
      return wsClient;
    }

    try {
      const wsProtocol = import.meta.env.VITE_WS_PROTOCOL || 'ws';
      const wsHost = import.meta.env.VITE_WS_HOST || 'localhost';
      const wsPort = import.meta.env.VITE_WS_PORT || '8989';
      
      const wsUrl = `${wsProtocol}://${wsHost}:${wsPort}`;
      
      wsClient = new WSClient(wsUrl);
      
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      await wsClient.connect(token).catch(err => {
        console.error('WebSocket connection error:', err);
        connectionError.value = 'Failed to connect to WebSocket server';
        throw err;
      });
      
      isConnected.value = true;
      connectionError.value = null;
      console.log('WebSocket connected');
      
      return wsClient;
    } catch (err) {
      console.error('WebSocket initialization error:', err);
      connectionError.value = err.message;
      throw err;
    }
  };

  // Subscribe to chat messages
  const subscribeToChatMessages = async (callback) => {
    try {
      if (!wsClient || !isConnected.value) {
        await initializeWebSocket();
      }
      
      await wsClient.sub('chat', (message) => {
        console.log('Received message:', message);
        callback(message);
      });
    } catch (err) {
      console.error('Chat subscription error:', err);
      throw err;
    }
  };

  // Publish a chat message
  const sendChatMessage = async (messageData) => {
    try {
      if (!wsClient || !isConnected.value) {
        await initializeWebSocket();
      }
      
      // messageData should contain: { matchId, sender, senderModel, message }
      await wsClient.pub('chat', messageData);
    } catch (err) {
      console.error('Message publish error:', err);
      throw err;
    }
  };

  // Disconnect WebSocket
  const disconnect = () => {
    if (wsClient) {
      wsClient.disconnect();
      wsClient = null;
      isConnected.value = false;
    }
  };

  onMounted(async () => {
    try {
      await initializeWebSocket();
    } catch (err) {
      console.error('WebSocket mount error:', err);
    }
  });

  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected,
    connectionError,
    initializeWebSocket,
    subscribeToChatMessages,
    sendChatMessage,
    disconnect
  };
}
