<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ChevronRight, CheckCheck } from 'lucide-vue-next';
import Menu from '@/components/Menu.vue';
import Toast from '@/components/Toast.vue';

const router = useRouter();
const toast = ref(null);

const conversations = ref([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const adopterId = localStorage.getItem('user_id');
    
    // Fetch all matches/conversations for the adopter
    const response = await fetch(`/api/matches?adopterId=${adopterId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      conversations.value = data.matches || [];
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
    toast.value?.show('Erreur au chargement des conversations', 'error');
  } finally {
    isLoading.value = false;
  }
});

const openConversation = (matchId) => {
  router.push(`/adopter/conversation/${matchId}`);
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return "aujourd'hui";
  if (diffInDays === 1) return "il y a 1 jour";
  if (diffInDays < 7) return `il y a ${diffInDays} jours`;
  if (diffInDays < 30) return `il y a ${Math.floor(diffInDays / 7)} semaines`;
  return `il y a ${Math.floor(diffInDays / 30)} mois`;
};

const getLastMessage = (discussion) => {
  if (!discussion || discussion.length === 0) return 'Aucun message';
  const lastMsg = discussion[discussion.length - 1];
  return lastMsg.message.length > 40 ? lastMsg.message.substring(0, 40) + '...' : lastMsg.message;
};

const getAnimalName = (conversation) => {
  return conversation.animalId?.name || 'Animal';
};

const getAnimalImage = (conversation) => {
  return conversation.animalId?.image || '';
};
</script>

<template>
  <div class="discussions-container">
    <Toast ref="toast" />
    
    <!-- Header -->
    <div class="header">
      <h1 class="main-title">Messages</h1>
    </div>

    <!-- Conversations Section -->
    <div class="conversations-section">
      <h2 class="conversations-title">Conversations</h2>
      
      <div class="conversations-list">
        <div 
          v-if="conversations.length === 0" 
          class="empty-state"
        >
          <p>Aucune conversation pour le moment</p>
        </div>
        
        <div 
          v-for="conversation in conversations" 
          :key="conversation._id"
          class="conversation-item"
          @click="openConversation(conversation._id)"
        >
          <div class="conversation-avatar">
            <img 
              v-if="getAnimalImage(conversation)" 
              :src="getAnimalImage(conversation)" 
              :alt="getAnimalName(conversation)"
            />
            <div v-else class="avatar-placeholder"></div>
          </div>
          
          <div class="conversation-content">
            <div class="conversation-header">
              <p class="conversation-name">
                {{ getAnimalName(conversation) }}
              </p>
              <span class="conversation-time">
                {{ formatTimeAgo(conversation.updatedAt) }}
              </span>
            </div>
            
            <div class="conversation-preview">
              <CheckCheck :size="14" class="check-icon" />
              <p class="preview-text">{{ getLastMessage(conversation.discussion) }}</p>
            </div>
          </div>
          
          <ChevronRight :size="24" class="chevron-icon" />
        </div>
      </div>
    </div>

    <!-- Navigation Menu -->
    <Menu :userType="'adopter'" />
  </div>
</template>

<style scoped>
.discussions-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(180deg, var(--color-primary-50) 0%, var(--color-primary-50) 150px, var(--color-neutral-white) 150px);
  position: relative;
  padding-bottom: 120px;
}

/* Header */
.header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  margin-top: 65px;
  width: 100%;
}

.main-title {
  font-family: var(--font-family);
  font-weight: 700;
  font-size: 48px;
  line-height: 54px;
  color: var(--color-primary-950);
  text-align: center;
  margin: 0;
}

/* Conversations Section */
.conversations-section {
  background-color: var(--color-neutral-white);
  border-radius: 30px 30px 0 0;
  box-shadow: 0px 0px 17.8px 3px rgba(0, 0, 0, 0.04);
  padding: 62px 24px 20px;
  margin-top: 15px;
  min-height: 620px;
}

.conversations-title {
  font-family: var(--font-family);
  font-weight: 700;
  font-size: 24px;
  line-height: 28px;
  color: var(--color-neutral-black);
  margin: 0 0 30px 0;
  padding: 10px 0;
}

.conversations-list {
  display: flex;
  flex-direction: column;
  gap: 27px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-state p {
  font-family: var(--font-family);
  font-weight: 300;
  font-size: 14px;
  color: var(--color-neutral-500);
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.conversation-item:hover {
  transform: translateX(5px);
}

.conversation-avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.conversation-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--color-neutral-300);
}

.conversation-content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 5px;
}

.conversation-name {
  font-family: var(--font-family);
  font-weight: 400;
  font-size: 16px;
  line-height: 18px;
  color: var(--color-neutral-black);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.conversation-time {
  font-family: var(--font-family);
  font-weight: 300;
  font-size: 10px;
  line-height: 14px;
  color: var(--color-neutral-black);
  white-space: nowrap;
}

.conversation-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
}

.check-icon {
  flex-shrink: 0;
  color: var(--color-neutral-black);
}

.preview-text {
  font-family: var(--font-family);
  font-weight: 300;
  font-size: 12px;
  line-height: 14px;
  color: var(--color-neutral-black);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chevron-icon {
  flex-shrink: 0;
  color: var(--color-neutral-500);
}

@media (max-width: 430px) {
  .main-title {
    font-size: 40px;
    line-height: 46px;
  }
  
  .conversations-section {
    padding: 62px 15px 20px;
  }
}
</style>
