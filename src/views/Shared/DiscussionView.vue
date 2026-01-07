<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ChevronRight, CheckCheck } from 'lucide-vue-next';
import Menu from '@/components/Menu.vue';
import Toast from '@/components/Toast.vue';

const props = defineProps({
  userType: {
    type: String,
    required: true,
    validator: (value) => ['owner', 'adopter'].includes(value)
  }
});

const router = useRouter();
const route = useRoute();
const toast = ref(null);

const selectedAnimal = ref(null);
const selectedMatch = ref(null);
const animals = ref([]);
const conversations = ref([]);
const isLoading = ref(true);

watch(() => route.path, async (newPath) => {
  const basePath = props.userType === 'owner' ? '/owner/discussions' : '/adopter/discussions';
  if (newPath === basePath) {
    await refreshData();
  }
});

const refreshData = async () => {
  try {
    isLoading.value = true;
    
    if (props.userType === 'owner') {
      const ownerId = localStorage.getItem('user_id');
      
      const animalsResponse = await fetch(`/api/animals?ownerId=${ownerId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (animalsResponse.ok) {
        const data = await animalsResponse.json();
        animals.value = data.animals || [];
      }
      
      selectedAnimal.value = null;
    }
    
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
    
    if (props.userType === 'owner' && animalId) {
      params.append('animalId', animalId);
    } else if (props.userType === 'adopter') {
      const adopterId = localStorage.getItem('user_id');
      params.append('adopterId', adopterId);
    }
    
    const response = await fetch(`/api/matches?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      // Uniquement les conversations avec status "validé" donc acceptées par les deux parties
      conversations.value = (data.matches || []).filter(match => match.status === 'validé');
    }
  } catch (error) {
    console.error('Error loading conversations:', error);
  }
};

const selectAnimal = (animal) => {
  selectedAnimal.value = animal;
  loadConversations(animal._id);
};

const selectMatch = (match) => {
  selectedMatch.value = match;
  openConversation(match._id);
};

const openConversation = (matchId) => {
  const path = props.userType === 'owner' 
    ? `/owner/conversation/${matchId}` 
    : `/adopter/conversation/${matchId}`;
  router.push(path);
};

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 0) return "aujourd'hui";
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

const getConversationName = (conversation) => {
  if (props.userType === 'owner') {
    const adopterName = conversation.adopterId?.firstName || '';
    const animalName = conversation.animalId?.name || 'Animal';
    return `${adopterName} x ${animalName}`;
  } else {
    return conversation.animalId?.name || 'Animal';
  }
};

const getConversationImage = (conversation) => {
  if (props.userType === 'owner') {
    return conversation.adopterId?.image || '';
  } else {
    return conversation.animalId?.images?.[0] || '';
  }
};

const getAdopterLabel = (conversation) => {
  return conversation.adopterId?.firstName || '';
};

const getAnimalLabel = (conversation) => {
  return conversation.animalId?.name || 'Animal';
};
</script>

<template>
  <div class="discussions-container" :class="`discussions-container-${userType}`">
    <Toast ref="toast" />
    
    <div class="header">
      <h1 class="text-h1">Messages</h1>
    </div>

    <div v-if="userType === 'adopter' && conversations.length > 0" class="matches-section">
      <h4 class="text-h4">Mes matchs</h4>
      <div class="matches-list">
        <div 
          v-for="match in conversations" 
          :key="match._id"
          class="match-card"
          @click="selectMatch(match)"
        >
          <div class="match-card-image">
            <img 
              v-if="match.animalId?.images?.[0]" 
              :src="match.animalId.images[0]" 
              :alt="match.animalId?.name"
            />
            <div v-else class="match-card-placeholder"></div>
            <div class="match-card-overlay"></div>
          </div>
          <p class="match-card-name">{{ match.animalId?.name }}</p>
        </div>
      </div>
    </div>

    <div v-if="userType === 'owner'" class="animals-section">
      <h4 class="text-h4">Conversations en lien avec</h4>
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
              v-if="animal.images?.[0]" 
              :src="animal.images[0]" 
              :alt="animal.name"
            />
            <div v-else class="animal-card-placeholder"></div>
            <div class="animal-card-overlay"></div>
          </div>
          <p class="animal-card-name">{{ animal.name }}</p>
        </div>
      </div>
    </div>

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
              v-if="getConversationImage(conversation)" 
              :src="getConversationImage(conversation)" 
              :alt="getConversationName(conversation)"
            />
            <div v-else class="avatar-placeholder"></div>
          </div>
          
          <div class="conversation-content">
            <div class="conversation-header">
              <p class="conversation-name">
                <template v-if="userType === 'owner'">
                  {{ getAdopterLabel(conversation) }}
                  <span class="separator-x">x</span>
                  {{ getAnimalLabel(conversation) }}
                </template>
                <template v-else>
                  {{ getAnimalLabel(conversation) }}
                </template>
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
    <Menu :userType="userType" />
  </div>
</template>

<style scoped>
.discussions-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
  padding-bottom: 120px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: max(16px, env(safe-area-inset-top)); 
  padding-bottom: 16px;
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

.animals-section,
.matches-section {
  padding: 0 0 0 30px;
}

.section-title {
  font-family: var(--font-family);
  font-weight: 700;
  font-size: 14px;
  line-height: 16px;
  color: var(--color-neutral-black);
  margin: 0 0 12px 5px;
}

.animals-list,
.matches-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 0 5px 10px 5px;
  scrollbar-width: none;
}

.animals-list::-webkit-scrollbar,
.matches-list::-webkit-scrollbar {
  display: none;
}

.animal-card,
.match-card {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  border-radius: var(--radius-sm);
  position: relative;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.2s ease;
  box-shadow: var(--shadow-md);
}

.animal-card:hover,
.match-card:hover {
  transform: scale(1.05);
}

.animal-card-selected {
  box-shadow: 0 0 0 3px var(--color-primary-500);
}

.animal-card-image,
.match-card-image {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-sm);
}

.animal-card-image img,
.match-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.animal-card-placeholder,
.match-card-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--color-primary-100), var(--color-primary-200));
  border-radius: var(--radius-sm);
}

.animal-card-overlay,
.match-card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 50%, rgba(0, 0, 0, 0.6) 100%);
  border-radius: var(--radius-sm);
  pointer-events: none;
}

.animal-card-name,
.match-card-name {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  font-family: var(--font-family);
  font-weight: 600;
  font-size: 14px;
  line-height: 16px;
  color: var(--color-neutral-white);
  margin: 0;
  z-index: 1;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversations-section {
   background: var(--color-neutral-white);
  border-radius: 30px 30px 0 0;
  box-shadow: 0 -8px 24px rgba(22, 22, 22, 0.09);
  margin-top: 20px;
  min-height: 620px;
  padding: 25px 30px 20px;
}

.conversations-title {
  font-family: var(--font-family);
  font-weight: 700;
  font-size: 24px;
  line-height: 28px;
  color: var(--color-neutral-black);
  margin: 0 0 30px 0;
  padding: 0;
}

.conversations-list {
  display: flex;
  flex-direction: column;
  gap: 0;
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
  padding: 16px 0;
  border-bottom: 1px solid rgba(141, 15, 188, 0.1);
}

.conversation-item:last-child {
  border-bottom: none;
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

.separator-x {
  color: var(--color-primary-700);
  font-weight: 400;
  margin: 0 4px;
}
</style>
