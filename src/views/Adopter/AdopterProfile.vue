<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { MapPinIcon, Clock, PartyPopper } from "lucide-vue-next";
import Menu from '@/components/Menu.vue';
import Button from '@/components/Button.vue';
import BackButton from "../../components/BackButton.vue";

const router = useRouter();
const route = useRoute();

const user = ref(null);
const loading = ref(true);
const error = ref('');

const requestsCount = ref(0);
const adoptedCount = ref(0);

const viewerType = computed(() => localStorage.getItem('user_type'));
const loggedInUserId = computed(() => localStorage.getItem('user_id'));

const profileAdopterId = computed(() => {
  return route.params?.id ? String(route.params.id) : String(loggedInUserId.value || '');
});

const isSelfView = computed(() => {
  return viewerType.value === 'adopter' && profileAdopterId.value === String(loggedInUserId.value || '');
});

const fetchStats = async () => {
  try {
    const response = await fetch(`/api/matches?adopterId=${profileAdopterId.value}`, {
      credentials: 'include'
    });

    if (response.ok) {
      const data = await response.json();
      const matches = data.matches || [];
      requestsCount.value = matches.filter(m => m.status === 'en_attente').length;
      adoptedCount.value = matches.filter(m => m.status === 'adopté').length;
    }
  } catch (err) {
    console.error('Erreur stats:', err);
  }
};

const formattedPreferences = computed(() => {
  const prefsRaw = user.value?.preferences;
  if (!prefsRaw) return [[], []];

  const prefs = Array.isArray(prefsRaw)
    ? prefsRaw
    : Object.values(prefsRaw).flat();

  const mid = Math.ceil(prefs.length / 2);
  return [prefs.slice(0, mid), prefs.slice(mid)];
});

const preferencesByCategory = computed(() => {
  const prefs = user.value?.preferences;
  if (!prefs) {
    return { species: [], environment: [], size: [], age: [], weight: [], sex: [], dressage: [], personality: [], maxPrice: null, maxDistance: null };
  }
  
  return {
    species: prefs.species || [],
    environment: prefs.environment || [],
    size: prefs.size || [],
    age: prefs.age || [],
    weight: prefs.weight || [],
    sex: prefs.sex || [],
    dressage: prefs.dressage || [],
    personality: prefs.personality || [],
    maxPrice: prefs.maxPrice || null,
    maxDistance: prefs.maxDistance || null
  };
});

onMounted(async () => {
  try {
    if (!profileAdopterId.value) {
      router.push('/login');
      return;
    }
    const response = await fetch(`/api/adopters/${profileAdopterId.value}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Erreur profil');
    user.value = await response.json();
    await fetchStats();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

const handleLogout = () => router.push('/logout');
const handleEdit = () => router.push('/adopter/profile/edit');
const handleContact = () => router.push({ name: 'OwnerDiscussions', query: { adopterId: profileAdopterId.value } });
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
            <h2 class="profile-name">{{ user.firstName }} {{ user.lastName }}</h2>
            <div class="profile-meta">
              <p>{{ user.age }} ans </p>
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
              <PartyPopper size="20" />
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ adoptedCount }}</p>
              <p class="stat-label">Adoptés</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="icon-circle">
              <Clock size="20" />
            </div>
            <div class="stat-info">
              <p class="stat-value">{{ requestsCount }}</p>
              <p class="stat-label">En attente</p>
            </div>
          </div>
        </div>

        <section class="about-section">
          <div v-if="user.about">
            <h2 class="section-title">À propos</h2>
            <p class="about-text">{{ user.about }}</p>
          </div>
        </section>

        <section class="preferences-section">
          <h2 class="section-title">Préférences</h2>
          
          <div v-if="preferencesByCategory.species.length > 0" class="preference-group">
            <h3 class="category-title">Espèces</h3>
            <div class="tags-list">
              <span v-for="item in preferencesByCategory.species" :key="item" class="pref-tag">
                {{ item }}
              </span>
            </div>
          </div>

          <div v-if="preferencesByCategory.size.length > 0" class="preference-group">
            <h3 class="category-title">Taille</h3>
            <div class="tags-list">
              <span v-for="item in preferencesByCategory.size" :key="item" class="pref-tag">
                {{ item }}
              </span>
            </div>
          </div>

          <div v-if="preferencesByCategory.age.length > 0" class="preference-group">
            <h3 class="category-title">Âge</h3>
            <div class="tags-list">
              <span v-for="item in preferencesByCategory.age" :key="item" class="pref-tag">
                {{ item }}
              </span>
            </div>
          </div>

          <div v-if="preferencesByCategory.weight.length > 0" class="preference-group">
            <h3 class="category-title">Poids</h3>
            <div class="tags-list">
              <span v-for="item in preferencesByCategory.weight" :key="item" class="pref-tag">
                {{ item }}
              </span>
            </div>
          </div>

          <div v-if="preferencesByCategory.sex.length > 0" class="preference-group">
            <h3 class="category-title">Sexe</h3>
            <div class="tags-list">
              <span v-for="item in preferencesByCategory.sex" :key="item" class="pref-tag">
                {{ item === 'male' ? 'Mâle' : item === 'female' ? 'Femelle' : item }}
              </span>
            </div>
          </div>

          <div v-if="preferencesByCategory.environment.length > 0" class="preference-group">
            <h3 class="category-title">Environnement</h3>
            <div class="tags-list">
              <span v-for="item in preferencesByCategory.environment" :key="item" class="pref-tag">
                {{ item }}
              </span>
            </div>
          </div>

          <div v-if="preferencesByCategory.dressage.length > 0" class="preference-group">
            <h3 class="category-title">Dressage</h3>
            <div class="tags-list">
              <span v-for="item in preferencesByCategory.dressage" :key="item" class="pref-tag">
                {{ item }}
              </span>
            </div>
          </div>

          <div v-if="preferencesByCategory.personality.length > 0" class="preference-group">
            <h3 class="category-title">Personnalité</h3>
            <div class="tags-list">
              <span v-for="item in preferencesByCategory.personality" :key="item" class="pref-tag">
                {{ item }}
              </span>
            </div>
          </div>

          <div v-if="preferencesByCategory.maxPrice || preferencesByCategory.maxDistance" class="preference-group">
            <h3 class="category-title">Critères additionnels</h3>
            <div class="tags-list">
              <span v-if="preferencesByCategory.maxPrice" class="pref-tag">
                Budget max: {{ preferencesByCategory.maxPrice }} CHF
              </span>
              <span v-if="preferencesByCategory.maxDistance" class="pref-tag">
                Distance max: {{ preferencesByCategory.maxDistance }} km
              </span>
            </div>
          </div>

          <p v-if="!preferencesByCategory.species.length && !preferencesByCategory.environment.length && !preferencesByCategory.size.length && !preferencesByCategory.age.length && !preferencesByCategory.weight.length && !preferencesByCategory.sex.length && !preferencesByCategory.dressage.length && !preferencesByCategory.personality.length && !preferencesByCategory.maxPrice && !preferencesByCategory.maxDistance" class="no-preferences">Aucune préférence renseignée</p>
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
  padding: 30px;
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
  font-size: 26px;
  font-weight: 800;
  color: #1f2937;
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
  margin: 0;
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

.section-title {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.about-text {
  margin: 0;
  font-size: 15px;
  color: #4b5563;
  line-height: 1.6;
}

.preferences-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preference-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pref-tag {
  display: inline-block;
  padding: 6px 12px;
  background-color: var(--color-primary-100);
  color: var(--color-primary-700);
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.chars {
  display: flex;
  gap: 20px;
}

.char-col {
  flex: 1;
}

.char-col ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.char-col li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  color: #374151;
  font-size: 14px;
}

.bullet {
  width: 8px;
  height: 8px;
  background: var(--color-primary-600);
  border-radius: 50%;
  flex-shrink: 0;
}

.no-preferences {
  font-size: 14px;
  color: #9ca3af;
  font-style: italic;
  background: #f9fafb;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
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