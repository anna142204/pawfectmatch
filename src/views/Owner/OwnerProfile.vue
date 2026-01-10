<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { MapPinIcon, PawPrint, CheckCircle } from "lucide-vue-next";
import Menu from '@/components/Menu.vue';
import Button from '@/components/Button.vue';
import BackButton from "../../components/BackButton.vue";

const router = useRouter();
const route = useRoute();
const { userId: loggedInUserId, userType: viewerType, getAuthFetchOptions, handleAuthError } = useAuth();

const user = ref(null);
const loading = ref(true);
const error = ref('');

const profileOwnerId = computed(() => {
  return route.params?.id ? String(route.params.id) : String(loggedInUserId.value || '');
});

const isSelfView = computed(() => {
  return viewerType.value === 'owner' && profileOwnerId.value === String(loggedInUserId.value || '');
});

const availableAnimals = computed(() => {
  return user.value?.animals?.filter(a => a.availability === true) || [];
});

const adoptedAnimalsCount = computed(() => {
  return user.value?.animals?.filter(a => a.availability === false).length || 0;
});

onMounted(async () => {
  try {
    if (!profileOwnerId.value) {
      router.push('/login');
      return;
    }

    const response = await fetch(`/api/owners/${profileOwnerId.value}`, {
      credentials: 'include'
    });

    if (response.status === 401 || response.status === 403) {
      handleAuthError();
      return;
    }

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du profil');
    }

    user.value = await response.json();
  } catch (err) {
    error.value = err.message;
    handleAuthError();
  } finally {
    loading.value = false;
  }
});

const handleLogout = () => router.push('/logout');
const handleEdit = () => router.push('/owner/profile/edit');
const handleContact = () => {
  router.push({ name: 'AdopterDiscussions', query: { ownerId: profileOwnerId.value } });
};
</script>

<template>
  <div class="profile-page">
    <div v-if="!isSelfView">
      <BackButton variant="overlay" />
    </div>

    <div v-if="loading" class="loading">
      <p>Chargement...</p>
    </div>

    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="user" class="profile-wrapper">
      <div class="photo-section">
        <img v-if="user.image" :src="user.image" alt="Photo de profil" class="profile-image-full">
        <div v-else class="photo-placeholder">
          <p>Pas de photo de profil</p>
        </div>
      </div>

      <div class="content-section">
        <div class="profile-header">
          <div class="header-left">
            <h2 v-if="user.societyName" class="profile-name">{{ user.societyName }}</h2>
            <h2 v-else class="profile-name">{{ user.firstName }} {{ user.lastName }}</h2>

            <div class="profile-meta">
              <p class="profile-location">
                <MapPinIcon size="16" /> {{ user.address?.city }}
              </p>
            </div>
          </div>

          <Button v-if="isSelfView" variant="primary" size="sm" @click="handleEdit" class="edit-button">
            Modifier
          </Button>
          <Button v-else variant="primary" size="sm" @click="handleContact" class="edit-button">
            Contacter
          </Button>
        </div>

        <div class="stats-section">
          <div class="stat-card">
            <div class="icon-circle">
              <PawPrint size="20" />
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ availableAnimals.length }}</p>
              <p class="stat-label">Disponibles</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="icon-circle">
              <CheckCircle size="20" />
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ adoptedAnimalsCount }}</p>
              <p class="stat-label">Adoptés</p>
            </div>
          </div>
        </div>

        <section class="about-section" v-if="user.about">
          <h4 class="text-h4">À propos</h4>
          <p class="about-text">{{ user.about }}</p>
        </section>

        <section class="animals-section" v-if="availableAnimals.length > 0">
          <h4 class="text-h4">Animaux à adopter</h4>
          <div class="animals-grid">
            <div v-for="animal in availableAnimals" :key="animal._id" class="animal-card"
              :class="{ 'non-clickable': isSelfView }"
              @click="!isSelfView && router.push(`/adopter/animal/${animal._id}`)">
              <img :src="animal.images && animal.images.length ? animal.images[0] : '/default-animal.png'" class="animal-thumb">
              <span class="animal-name">{{ animal.name }}</span>
            </div>
          </div>
        </section>
        <p v-else-if="!loading" class="no-animals">Aucun animal disponible pour le moment.</p>

        <div v-if="isSelfView" class="logout-section">
          <Button variant="secondary" @click="handleLogout" class="logout-btn">
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
    <Menu />
  </div>
</template>

<style scoped>
.profile-page {
  height: 100%;
  background: #FFFFFF;
  padding-bottom: 100px;
}

.loading,
.error-message {
  text-align: center;
  padding: 24px;
  color: #999;
}

.error-message {
  color: #d32f2f;
}

.profile-wrapper {
  display: flex;
  flex-direction: column;
}

.photo-section {
  width: 100%;
  height: 380px;
  background: #E8E8E8;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
}

.profile-image-full {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #f3f4f6;
  color: #9ca3af;
  font-size: 16px;
  font-weight: 500;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 30px;
  background: white;
  margin-top: -60px;
  border-radius: 24px 24px 0 0;
  position: relative;
  z-index: 1;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.05);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  position: relative;
}

.header-left {
  width: 70%;
  max-width: 70%;
  flex-shrink: 0;
}

.profile-name {
  margin: 0;
  font-size: var(--heading-h2-size);
  line-height: 1.2;
  word-break: break-word;
}

.edit-button {
  width: auto !important;
  max-width: 30%;
  min-width: 100px;
  flex-shrink: 0;
  display: inline-flex;
  justify-content: center;
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.profile-location {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stats-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  padding: 0 0 10px 0;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 16px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background-color: #f3f4f6;
  color: var(--color-primary-600);
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
  color: #111827;
}

.stat-label {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
  font-weight: 600;
}

.about-text {
  margin: 0;
  font-size: 15px;
  color: #4b5563;
  line-height: 1.6;
}

.animals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 15px;
  margin-top: 5px;
}

.animal-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: transform 0.2s;
}

.animal-card.non-clickable {
  cursor: default;
}

.animal-card:active {
  transform: scale(0.98);
}

.animal-card.non-clickable:active {
  transform: none;
}

.animal-thumb {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 12px;
  background: #f5f5f5;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.animal-name {
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-animals {
  font-size: 14px;
  color: #9ca3af;
  font-style: italic;
  text-align: center;
  padding: 20px;
}

.logout-section {
  border-top: 1px solid #f3f4f6;
  padding-top: 30px;
  margin-top: 10px;
}

.logout-btn {
  width: 100%;
}
</style>