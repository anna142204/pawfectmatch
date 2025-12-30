<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';
import Menu from '@/components/Menu.vue';
import Toast from '@/components/Toast.vue';
import { useWebSocket } from '@/composables/useWebSocket';

const router = useRouter();
const route = useRoute();
const toast = ref(null);

const matchId = ref(route.params.id);

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
  type: 'Adopter'
}));

// Get conversation ID from route
const conversationId = computed(() => matchId.value);

// Format time display (French format)
const formatTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const days = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    const weekday = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${time}`;
  } else if (days === 1) {
    return 'Hier';
  } else if (days < 7) {
    return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
  } else {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
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
    
    const url = `/api/matches/${conversationId.value}`;
    
    const response = await fetch(url, {
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
    console.error('❌ Load conversation error:', err);
    errorMessage.value = 'Erreur lors du chargement de la conversation';
    toast.value?.show('Erreur au chargement de la conversation', 'error');
  } finally {
    isLoading.value = false;
  }
};

// Handle incoming real-time messages
const handleNewMessage = (message) => {
  // Check for duplicates by timestamp, sender AND message content
  const msgExists = messages.value.some(m => 
    m.timestamp === message.timestamp && 
    m.sender === message.sender &&
    m.message === message.message
  );
  
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
        senderModel: 'Adopter',
        message: msgContent
      })
    });

    if (!saveResponse.ok) {
      throw new Error(`Failed to save message: ${saveResponse.statusText}`);
    }

    // 2. Broadcast via WebSocket for real-time delivery
    if (isConnected.value) {
      await sendChatMessage(conversationId.value, {
        senderModel: 'Adopter',
        message: msgContent
      });
    } else {
      // 3. Only add message locally if WebSocket is NOT connected (offline mode)
      messages.value.push({
        sender: senderId,
        senderModel: 'Adopter',
        message: msgContent,
        timestamp: new Date().toISOString()
      });
      scrollToBottom();
    }

    messageInput.value = '';
  } catch (err) {
    console.error('Send message error:', err);
    errorMessage.value = 'Erreur lors de l\'envoi du message';
    toast.value?.show('Erreur lors de l\'envoi du message', 'error');
  } finally {
    isSendingMessage.value = false;
  }
};

// Get owner info
const ownerInfo = computed(() => {
  return conversationData.value?.animalId?.ownerId || null;
});

// Get animal info
const animalInfo = computed(() => {
  return conversationData.value?.animalId || null;
});

// Get adopter info (current user)
const adopterInfo = computed(() => {
  return conversationData.value?.adopterId || null;
});

const goBack = () => {
  router.back();
};

onMounted(async () => {
  try {
    await loadConversation();
  } catch (err) {
    console.error('Error loading conversation:', err);
  }
  
  // Check if user is authenticated
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('user_id');
  
  if (!token || !userId) {
    console.warn('No authentication token found. WebSocket disabled.');
    errorMessage.value = 'Veuillez vous connecter pour activer la messagerie en temps réel.';
    return;
  }
  
  try {
    await subscribeToChatMessages(conversationId.value, handleNewMessage);
  } catch (err) {
    console.error('WebSocket subscription error:', err);
    // Continue without WebSocket, offline mode
  }
});

onUnmounted(async () => {
  try {
    await unsubscribeFromChat(conversationId.value);
  } catch (err) {
    console.error('Unsubscribe error:', err);
  }
});
</script>

<template>
  <div class="conversation-container">
    <Toast ref="toast" />
    
    <!-- Header -->
    <div class="conversation-header">
      <button class="back-button" @click="goBack" aria-label="Retour">
        <ChevronLeft :size="24" stroke-width="2" />
      </button>

      <div class="header-content">
        <div class="header-title">
          <p class="animal-name">{{ animalInfo?.name || 'Animal' }}</p>
        </div>

        <div class="header-owner">
          <p class="owner-name">{{ ownerInfo?.firstName || 'Owner' }}</p>
          <img 
            v-if="ownerInfo?.image" 
            :src="ownerInfo.image" 
            :alt="ownerInfo.firstName"
            class="owner-avatar"
          />
          <div v-else class="owner-avatar placeholder">
            <span>{{ ownerInfo?.firstName?.charAt(0) || 'O' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Messages Container -->
    <div class="messages-container" ref="messagesList">
      <div v-if="isLoading" class="loading">Chargement de la conversation...</div>
      
      <div v-else-if="messages.length === 0" class="empty-state">
        <p>Aucun message pour le moment. Commencez la conversation !</p>
      </div>

      <div v-else class="messages-list">
        <div 
          v-for="(msg, index) in messages" 
          :key="`msg-${index}`"
          :class="['message-item', msg.senderModel === 'Adopter' ? 'own-message' : 'other-message']"
        >
          <!-- Avatar for other messages (Owner) -->
          <img 
            v-if="msg.senderModel !== 'Adopter' && ownerInfo?.image" 
            :src="ownerInfo.image"
            :alt="ownerInfo.firstName"
            class="message-avatar"
          />
          <div 
            v-else-if="msg.senderModel !== 'Adopter'" 
            class="message-avatar placeholder"
          >
            <span>{{ ownerInfo?.firstName?.charAt(0) || 'O' }}</span>
          </div>

          <!-- Avatar for own messages (Adopter) -->
          <img 
            v-if="msg.senderModel === 'Adopter' && adopterInfo?.image" 
            :src="adopterInfo.image"
            :alt="adopterInfo.firstName"
            class="message-avatar"
          />
          <div 
            v-else-if="msg.senderModel === 'Adopter'" 
            class="message-avatar placeholder"
          >
            <span>{{ adopterInfo?.firstName?.charAt(0) || 'M' }}</span>
          </div>

          <div class="message-content">
            <div class="message-header">
              <p v-if="msg.senderModel === 'Adopter'" class="time">{{ formatTime(msg.timestamp) }}</p>
              <p v-else class="name">{{ ownerInfo?.firstName || animalInfo?.name || 'Owner' }}</p>
              <p v-if="msg.senderModel !== 'Adopter'" class="time">{{ formatTime(msg.timestamp) }}</p>
              <p v-else class="name-right">Moi</p>
            </div>
            <div :class="['message-bubble', msg.senderModel === 'Adopter' ? 'own' : 'other']">
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
          aria-label="Envoyer"
        >
          <ChevronRight :size="24" />
        </button>
      </div>
    </div>
  </div>
  
  <!-- Navigation Menu (outside conversation-container) -->
  <Menu :userType="'adopter'" />
</template>

<style scoped>
.conversation-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 90px); /* Subtract menu height */
  background: var(--color-primary-50, #fcf3ff);
  position: relative;
  padding-bottom: 0;
}

/* Header */
.conversation-header {
  display: flex;
  align-items: center;
  padding: 22px 24px;
  position: relative;
  z-index: 10;
  background: var(--color-primary-50, #fcf3ff);
}

.back-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  color: var(--color-neutral-black, #410054);
  flex-shrink: 0;
}

.back-button:hover {
  opacity: 0.7;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  margin-left: 8px;
}

.header-title {
  flex: 1;
}

.animal-name {
  font-family: 'Comfortaa', sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 28px;
  color: var(--color-neutral-black, #07010a);
  margin: 0;
}

.header-owner {
  display: flex;
  align-items: center;
  gap: 10px;
}

.owner-name {
  font-family: 'Comfortaa', sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 18px;
  color: var(--color-neutral-black, #07010a);
  margin: 0;
  white-space: nowrap;
}

.owner-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.owner-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-200, #e8d4f5);
  color: var(--color-primary-700, #8d0fbc);
  font-weight: bold;
  font-family: 'Comfortaa', sans-serif;
}

/* Messages Container */
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 33px 24px;
  display: flex;
  flex-direction: column;
  gap: 27px;
  background: linear-gradient(180deg, rgba(252, 243, 255, 0.2) 76.923%, rgba(100, 18, 125, 0.2) 100%), 
              linear-gradient(90deg, rgba(253, 249, 255, 1) 0%, rgba(253, 249, 255, 1) 100%);
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  box-shadow: 0px 0px 17.8px 3px rgba(0, 0, 0, 0.04);
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
  padding: 20px;
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
  padding-left: 20px;
}

.message-item.other-message {
  justify-content: flex-start;
  padding-right: 20px;
}

.message-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.message-avatar.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-200, #e8d4f5);
  color: var(--color-primary-700, #8d0fbc);
  font-weight: bold;
  font-family: 'Comfortaa', sans-serif;
  font-size: 18px;
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 7px;
  max-width: 70%;
  flex: 1;
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
  word-wrap: break-word;
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
  padding: 22px 38px 30px;
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
  line-height: 16px;
}

.input::placeholder {
  color: rgba(7, 1, 10, 0.24);
  font-family: 'Comfortaa', sans-serif;
  font-size: 14px;
  font-weight: 400;
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
  flex-shrink: 0;
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
    padding: 16px 24px;
  }

  .text-area {
    padding: 8px 12px;
  }

  .input {
    font-size: 13px;
  }
}
</style>