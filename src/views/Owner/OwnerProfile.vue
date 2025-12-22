<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { MapPinIcon } from "lucide-vue-next";
import Menu from '@/components/Menu.vue';
import Button from '@/components/Button.vue';
import BackButton from "../../components/BackButton.vue";

const router = useRouter();
const route = useRoute();

const user = ref(null);
const loading = ref(true);
const error = ref('');

const viewerType = computed(() => localStorage.getItem('user_type'));
const loggedInUserId = computed(() => localStorage.getItem('user_id'));

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

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du profil');
    }

    user.value = await response.json();
  } catch (err) {
    error.value = err.message;
    console.error('Erreur:', err);
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
        <img :src="user.image || '/default-avatar.png'" alt="Photo de profil" class="profile-image-full">
      </div>

      <div class="content-section">
        <div class="profile-header">
          <div class="header-left">  
            <h2 v-if="user.societyName" class="profile-name">{{ user.societyName }}</h2>
            <h2 v-else class="profile-name">{{ user.firstName }} {{ user.lastName }}</h2>
            <div class="profile-meta">
            
              <p class="profile-location">
                <MapPinIcon size="20px" /> {{ user.address?.city }}
              </p>
            </div>
          </div>

          <Button v-if="isSelfView" variant="primary" size="sm" @click="handleEdit">
            Modifier
          </Button>
          <Button v-else variant="primary" size="sm" @click="handleContact">
            Contacter
          </Button>
        </div>

        <div class="stats-section">
          <div class="stat-item">
            <p class="stat-label">Disponibles</p>
            <p class="stat-value">{{ availableAnimals.length }}</p>
          </div>
          <div class="stat-item">
            <p class="stat-label">Adoptés</p>
            <p class="stat-value">{{ adoptedAnimalsCount }}</p>
          </div>
        </div>

        <section class="about-section" v-if="user.about">
          <h2 class="section-title">À propos</h2>
          <p class="about-text">{{ user.about }}</p>
        </section>

        <section class="animals-section" v-if="!isSelfView && availableAnimals.length > 0">
          <h2 class="section-title">Ses animaux à adopter</h2>
          <div class="animals-grid">
            <div v-for="animal in availableAnimals" :key="animal._id" class="animal-card"
              @click="router.push(`/adopter/animal/${animal._id}`)">
              <img :src="animal.image || '/default-animal.png'" class="animal-thumb">
              <span class="animal-name">{{ animal.name }}</span>
            </div>
          </div>
        </section>

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

.profile-wrapper {
  display: flex;
  flex-direction: column;
}

.photo-section {
  width: 100%;
  height: 400px;
  background: #E8E8E8;
  overflow: hidden;
  position: relative;
}

.profile-image-full {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 24px 40px;
  background: white;
  margin-top: -100px;
  border-radius: 20px 20px 0 0;
  position: relative;
  z-index: 1;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}

.header-left {
  width: 150%;
  margin-right: 20px;
}

.profile-name {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
}

.society-badge {
  background: #f0ebff;
  color: #6366f1;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  width: fit-content;
  margin-bottom: 4px;
}

.profile-meta {
  display: flex;
  flex-direction: column;
  color: #666;
}

.profile-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.stats-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  text-align: center;
  padding: 10px 0;
  border-top: 1px solid #E8E8E8;
  border-bottom: 1px solid #E8E8E8;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: #999;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 30px;
}

.about-text {
  font-size: 14px;
  color: #555;
  line-height: 1.7;
  text-align: justify;
}

.animals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin-top: 10px;
}

.animal-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.animal-thumb {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 12px;
  background: #f5f5f5;
}

.animal-name {
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  color: #333;
}

.logout-section {
  border-top: 1px solid #E8E8E8;
  padding-top: 26px;
}

.logout-btn {
  width: 100%;
}
</style>