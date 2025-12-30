<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BackButton from '@/components/BackButton.vue';
import Toast from '@/components/Toast.vue';
import { useWebSocket } from '@/composables/useWebSocket';
import { ChevronRight, Send } from 'lucide-vue-next';

// Data
const route = useRoute();
const router = useRouter();
const messageInput = ref('');
const messages = ref([]);
const conversationData = ref(null);
const isLoading = ref(true);
const isSendingMessage = ref(false);
const errorMessage = ref('');
const messagesList = ref(null);

// WebSocket
const { subscribeToChatMessages, unsubscribeFromChat, sendChatMessage, isConnected } = useWebSocket();

// Get current user data
const currentUser = computed(() => ({
  id: localStorage.getItem('user_id'),
  type: 'Owner'
}));

// Get conversation ID from route
const conversationId = computed(() => route.params.id);

// Format time display
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const days = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Hier';
  } else if (days < 7) {
    return `${days} jour${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
  }
};

// Scroll to latest message
const scrollToBottom = () => {
  if (messagesList.value) {
    setTimeout(() => {
      messagesList.value.scrollTop = messagesList.value.scrollHeight;
    }, 0);
  }
};

// Load conversation data from API
const loadConversation = async () => {
  try {
    isLoading.value = true;
    const token = localStorage.getItem('token');
    
    const response = await fetch(`/api/matches/${conversationId.value}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch conversation: ${response.statusText}`);
    }

    const data = await response.json();
    conversationData.value = data;

    // Load existing messages from discussion
    if (data.discussion && Array.isArray(data.discussion)) {
      messages.value = data.discussion.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || new Date().toISOString()
      }));
    }

    scrollToBottom();
  } catch (err) {
    console.error('Load conversation error:', err);
    errorMessage.value = 'Failed to load conversation. Please try again.';
  } finally {
    isLoading.value = false;
  }
};

// Handle incoming real-time messages
const handleNewMessage = (message) => {
  // Message is already filtered by channel subscription
  const msgExists = messages.value.some(m => m.timestamp === message.timestamp && m.sender === message.sender);
  
  if (!msgExists) {
    messages.value.push({
      sender: message.sender,
      senderModel: message.senderModel,
      message: message.message,
      timestamp: message.timestamp
    });
    scrollToBottom();
  }
};

// Send message
const sendMessage = async () => {
  if (!messageInput.value.trim()) return;

  try {
    isSendingMessage.value = true;
    errorMessage.value = '';
    
    const msgContent = messageInput.value.trim();
    const token = localStorage.getItem('token');
    const senderId = currentUser.value.id;

    // 1. Save to database via REST API
    const saveResponse = await fetch(`/api/matches/${conversationId.value}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        sender: senderId,
        senderModel: 'Owner',
        message: msgContent
      })
    });

    if (!saveResponse.ok) {
      throw new Error(`Failed to save message: ${saveResponse.statusText}`);
    }

    // 2. Broadcast via WebSocket for real-time delivery
    if (isConnected.value) {
      await sendChatMessage(conversationId.value, {
        senderModel: 'Owner',
        message: msgContent
      });
    }

    // 3. Add message to local list
    messages.value.push({
      sender: senderId,
      senderModel: 'Owner',
      message: msgContent,
      timestamp: new Date().toISOString()
    });

    messageInput.value = '';
    scrollToBottom();
  } catch (err) {
    console.error('Send message error:', err);
    errorMessage.value = 'Failed to send message. Please try again.';
  } finally {
    isSendingMessage.value = false;
  }
};

// Get adopter info
const adopterInfo = computed(() => {
  if (!conversationData.value || !conversationData.value.adopterId) return null;
  return conversationData.value.adopterId;
});

// Get animal info
const animalInfo = computed(() => {
  if (!conversationData.value || !conversationData.value.animalId) return null;
  return conversationData.value.animalId;
});

onMounted(async () => {
  await loadConversation();
  
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('user_id');
  
  if (!token || !userId) {
    console.warn('No authentication token found. WebSocket disabled. Please log in.');
    errorMessage.value = 'Please log in to enable real-time messaging.';
    return;
  }
  
  try {
    await subscribeToChatMessages(conversationId.value, handleNewMessage);
  } catch (err) {
    console.error('WebSocket subscription error:', err);
    // Continue without WebSocket, offline mode
    // Don't show error to user - offline mode is fine
  }
});

onUnmounted(async () => {
  // Unsubscribe from match channel
  try {
    await unsubscribeFromChat(conversationId.value);
  } catch (err) {
    console.error('Unsubscribe error:', err);
  }
});
</script>

<template>
  <div class="conversation-container">
    <!-- Header -->
    <div class="conversation-header">
      <BackButton to="/owner/discussions" />
      <div class="header-content">
        <div class="header-info">
          <h1 class="header-title">
            {{ adopterInfo?.firstName }} {{ adopterInfo?.lastName }}
          </h1>
        </div>
        <div class="header-adopter">
          <p class="adopter-name">{{ animalInfo?.name || 'Animal' }}</p>
          <img 
            v-if="animalInfo?.images?.[0]" 
            :src="animalInfo.images[0]" 
            :alt="animalInfo.name"
            class="adopter-avatar"
          />
          <div v-else class="adopter-avatar placeholder">
            <span>{{ animalInfo?.name?.charAt(0) || 'A' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Messages Container -->
    <div class="messages-container" ref="messagesList">
      <div v-if="isLoading" class="loading">Loading conversation...</div>
      
      <div v-else-if="messages.length === 0" class="empty-state">
        <p>No messages yet. Start the conversation!</p>
      </div>

      <div v-else class="messages-list">
        <div 
          v-for="(msg, index) in messages" 
          :key="`msg-${index}`"
          :class="['message-item', msg.senderModel === 'Owner' ? 'own-message' : 'other-message']"
        >
          <!-- Avatar for other messages -->
          <img 
            v-if="msg.senderModel !== 'Owner'" 
            :src="adopterInfo?.image || 'https://via.placeholder.com/54'"
            :alt="msg.sender"
            class="message-avatar"
          />
          <img 
            v-else 
            src="https://via.placeholder.com/54"
            alt="You"
            class="message-avatar"
          />

          <div class="message-content">
            <div class="message-header">
              <p v-if="msg.senderModel === 'Owner'" class="time">{{ formatTime(msg.timestamp) }}</p>
              <p v-else class="name">{{ msg.sender }}</p>
              <p v-if="msg.senderModel !== 'Owner'" class="time">{{ formatTime(msg.timestamp) }}</p>
              <p v-else class="name-right">Moi</p>
            </div>
            <div :class="['message-bubble', msg.senderModel === 'Owner' ? 'own' : 'other']">
              <p>{{ msg.message }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <div class="message-input-container">
      <div class="text-area">
        <input 
          v-model="messageInput"
          type="text"
          class="input"
          placeholder="Entrez votre message ici..."
          @keyup.enter="sendMessage"
          :disabled="isSendingMessage"
        />
        <button 
          @click="sendMessage"
          class="send-button"
          :disabled="!messageInput.trim() || isSendingMessage"
        >
          <ChevronRight :size="24" />
        </button>
      </div>
    </div>

    <!-- Error Toast -->
    <Toast v-if="errorMessage" :message="errorMessage" type="error" />
  </div>
</template>

<style scoped>
.conversation-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(180deg, var(--color-primary-50, #fcf3ff) 0%, #ffffff 100%);
  position: relative;
}

/* Header */
.conversation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px;
  position: relative;
  z-index: 10;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  margin-left: 16px;
}

.header-info {
  flex: 1;
}

.header-title {
  font-family: 'Comfortaa', sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 28px;
  color: var(--color-neutral-black, #07010a);
  margin: 0;
}

.header-adopter {
  display: flex;
  align-items: center;
  gap: 10px;
}

.adopter-name {
  font-family: 'Comfortaa', sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 18px;
  color: var(--color-neutral-black, #07010a);
  margin: 0;
  white-space: nowrap;
}

.adopter-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  object-fit: cover;
}

.adopter-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-200, #e8d4f5);
  color: var(--color-primary-700, #8d0fbc);
  font-weight: bold;
}

/* Messages Container */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 33px 24px;
  display: flex;
  flex-direction: column;
  gap: 27px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-neutral-black, #07010a);
  font-family: 'Comfortaa', sans-serif;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--color-neutral-black, #07010a);
  font-family: 'Comfortaa', sans-serif;
  opacity: 0.6;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 27px;
}

/* Message Item */
.message-item {
  display: flex;
  gap: 11px;
  align-items: flex-start;
}

.message-item.own-message {
  justify-content: flex-end;
}

.message-item.other-message {
  justify-content: flex-start;
}

.message-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 7px;
  max-width: 70%;
}

.message-item.own-message .message-content {
  align-items: flex-end;
}

.message-item.other-message .message-content {
  align-items: flex-start;
}

.message-header {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
}

.message-item.own-message .message-header {
  justify-content: flex-end;
}

.message-item.other-message .message-header {
  justify-content: flex-start;
}

.message-header .name {
  font-family: 'Comfortaa', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  color: var(--color-neutral-black, #07010a);
  margin: 0;
  order: 1;
}

.message-header .name-right {
  font-family: 'Comfortaa', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 16px;
  color: var(--color-neutral-black, #07010a);
  margin: 0;
  order: 2;
}

.message-header .time {
  font-family: 'Comfortaa', sans-serif;
  font-size: 12px;
  font-weight: 300;
  line-height: 14px;
  color: var(--color-neutral-black, #07010a);
  margin: 0;
  white-space: nowrap;
}

.message-item.own-message .message-header .time {
  order: 1;
}

.message-item.other-message .message-header .time {
  order: 2;
}

/* Message Bubble */
.message-bubble {
  padding: 10px 14px;
  border-radius: 8px;
  box-shadow: 0px 4px 14px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px 0px rgba(10, 13, 18, 0.05);
  max-width: 100%;
}

.message-bubble p {
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  margin: 0;
  word-wrap: break-word;
}

.message-bubble.own {
  background: var(--color-primary-700, #8d0fbc);
  border-radius: 8px 8px 8px 8px;
}

.message-bubble.own p {
  color: var(--color-neutral-white, #fdf9ff);
}

.message-bubble.other {
  background: var(--color-primary-200, #ecf);
  border-radius: 8px 8px 8px 8px;
}

.message-bubble.other p {
  color: var(--color-neutral-black, #07010a);
}

/* Message Input */
.message-input-container {
  padding: 22px 24px 30px;
  background: linear-gradient(180deg, rgba(252, 243, 255, 0.2) 0%, rgba(100, 18, 125, 0.2) 100%);
}

.text-area {
  display: flex;
  gap: 8px;
  align-items: center;
  background: var(--color-neutral-white, #fdf9ff);
  border-radius: 16px;
  padding: 10px 14px;
  box-shadow: 0px 4px 14px 0px rgba(0, 0, 0, 0.1), 0px 1px 2px 0px rgba(10, 13, 18, 0.05);
}

.input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: 'Comfortaa', sans-serif;
  font-size: 14px;
  color: var(--color-neutral-black, #07010a);
  outline: none;
}

.input::placeholder {
  color: rgba(7, 1, 10, 0.24);
}

.send-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: var(--color-accent-400, #ed7b4d);
  border-radius: 30px;
  cursor: pointer;
  padding: 10px;
  color: white;
  transition: opacity 0.2s;
}

.send-button:hover:not(:disabled) {
  opacity: 0.9;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Scrollbar styling */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: transparent;
}

.messages-container::-webkit-scrollbar-thumb {
  background: var(--color-primary-200, #ecf);
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary-300, #d4a9e6);
}

/* Responsive */
@media (max-width: 600px) {
  .conversation-header {
    flex-wrap: wrap;
    gap: 12px;
  }

  .header-content {
    width: 100%;
    margin-left: 0;
  }

  .message-content {
    max-width: 85%;
  }

  .message-input-container {
    padding: 16px;
  }

  .text-area {
    padding: 8px 12px;
  }

  .input {
    font-size: 13px;
  }
}
</style>
