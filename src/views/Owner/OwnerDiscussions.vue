<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ChevronRight, CheckCheck } from 'lucide-vue-next';
import Menu from '@/components/Menu.vue';
import Toast from '@/components/Toast.vue';

const router = useRouter();
const route = useRoute();
const toast = ref(null);

const selectedAnimal = ref(null);
const animals = ref([]);
const conversations = ref([]);
const isLoading = ref(true);

// Watch for route changes to refresh data when returning from conversation
watch(() => route.path, async (newPath) => {
  if (newPath === '/owner/discussions') {
    await refreshData();
  }
});

const refreshData = async () => {
  try {
    isLoading.value = true;
    const ownerId = localStorage.getItem('user_id');
    
    // Fetch owner's animals
    const animalsResponse = await fetch(`/api/animals?ownerId=${ownerId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (animalsResponse.ok) {
      const data = await animalsResponse.json();
      animals.value = data.animals || [];
    }
    
    // Reset selected animal and load all conversations
    selectedAnimal.value = null;
    await loadConversations();
  } catch (error) {
    console.error('Error refreshing data:', error);
    toast.value?.show('Erreur au chargement des données', 'error');
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await refreshData();
});

const loadConversations = async (animalId = null) => {
  try {
    const params = new URLSearchParams();
    if (animalId) {
      params.append('animalId', animalId);
    }
    
    const response = await fetch(`/api/matches?${params.toString()}`, {
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
  }
};

const selectAnimal = (animal) => {
  selectedAnimal.value = animal;
  loadConversations(animal._id);
};

const openConversation = (matchId) => {
  router.push(`/owner/conversation/${matchId}`);
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
</script>

<template>
  <div class="discussions-container">
    <Toast ref="toast" />
    
    <!-- Header -->
    <div class="header">
      <h1 class="main-title">Messages</h1>
    </div>

    <!-- Animals Selection Section -->
    <div class="animals-section">
      <h2 class="section-title">Conversations en lien avec</h2>
      <div class="animals-list">
        <div 
          v-for="animal in animals" 
          :key="animal._id"
          class="animal-card"
          :class="{ 'animal-card-selected': selectedAnimal?._id === animal._id }"
          @click="selectAnimal(animal)"
        >
          <div class="animal-card-image">
            <img 
              v-if="animal.image" 
              :src="animal.image" 
              :alt="animal.name"
            />
            <div v-else class="animal-card-placeholder"></div>
            <div class="animal-card-overlay"></div>
          </div>
          <p class="animal-card-name">{{ animal.name }}</p>
        </div>
      </div>
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
              v-if="conversation.adopterId?.image" 
              :src="conversation.adopterId.image" 
              :alt="conversation.adopterId.firstName"
            />
            <div v-else class="avatar-placeholder"></div>
          </div>
          
          <div class="conversation-content">
            <div class="conversation-header">
              <p class="conversation-name">
                {{ conversation.adopterId?.firstName }} {{ conversation.adopterId?.lastName }}
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
    <Menu :userType="'owner'" />
  </div>
</template>

<style scoped>
.discussions-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(180deg, var(--color-primary-50) 0%, var(--color-primary-50) 380px, var(--color-neutral-white) 380px);
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

/* Animals Section */
.animals-section {
  padding: 0 25px;
  margin-top: 35px;
}

.section-title {
  font-family: var(--font-family);
  font-weight: 700;
  font-size: 16px;
  line-height: 18px;
  color: var(--color-neutral-black);
  margin: 0 0 15px 10px;
}

.animals-list {
  display: flex;
  gap: 9px;
  overflow-x: auto;
  padding: 0 10px;
  scrollbar-width: none;
}

.animals-list::-webkit-scrollbar {
  display: none;
}

.animal-card {
  flex-shrink: 0;
  width: 129px;
  height: 141px;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s ease;
}

.animal-card:hover {
  transform: scale(1.05);
}

.animal-card-selected {
  box-shadow: 0 0 0 3px var(--color-primary-500);
}

.animal-card-image {
  position: absolute;
  inset: 0;
  border-radius: 10px;
}

.animal-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.animal-card-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--color-neutral-300);
  border-radius: 10px;
}

.animal-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.4) 100%);
  border-radius: 10px;
  pointer-events: none;
}

.animal-card-name {
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  font-family: var(--font-family);
  font-weight: 400;
  font-size: 20px;
  line-height: 24px;
  color: var(--color-neutral-white);
  margin: 0;
  z-index: 1;
}

/* Conversations Section */
.conversations-section {
  background-color: var(--color-neutral-white);
  border-radius: 30px 30px 0 0;
  box-shadow: 0px 0px 17.8px 3px rgba(0, 0, 0, 0.04);
  padding: 50px 24px 20px;
  margin-top: 30px;
  min-height: 400px;
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
  
  .animals-section {
    padding: 0 15px;
  }
  
  .conversations-section {
    padding: 50px 15px 20px;
  }
}
</style>
