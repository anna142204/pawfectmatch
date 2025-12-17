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

// Si l'owner visite: /owner/adopter/:id  -> on prend l'id du profil dans l'URL
// Sinon (adopter): /adopter/profile      -> on prend son propre id
const profileAdopterId = computed(() => {
  return route.params?.id ? String(route.params.id) : String(loggedInUserId.value || '');
});

const isSelfView = computed(() => {
  return viewerType.value === 'adopter' && profileAdopterId.value && profileAdopterId.value === String(loggedInUserId.value || '');
});

const adoptedCount = computed(() => 1); // À adapter selon les données réelles
const requestsCount = computed(() => 2); // À adapter selon les données réelles

const formattedPreferences = computed(() => {
  const prefsRaw = user.value?.preferences;
  if (!prefsRaw) return [[], []];

  const prefs = Array.isArray(prefsRaw)
      ? prefsRaw
      : Object.values(prefsRaw).flat();

  const mid = Math.ceil(prefs.length / 2);
  return [prefs.slice(0, mid), prefs.slice(mid)];
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

const handleLogout = () => {
  router.push('/logout');
};

const handleEdit = () => {
  router.push('/');
};

// Action "Contacter" côté owner
// Ici on redirige vers la liste des discussions owner en passant l'id en query (pour pré-sélectionner plus tard si tu veux)
const handleContact = () => {
  router.push({ name: 'OwnerDiscussions', query: { adopterId: profileAdopterId.value } });
};
</script>

<template>
  <div class="profile-page">
    <div v-if="!isSelfView">
    <BackButton/>
  </div>
    <!-- Loading -->
    <div v-if="loading" class="loading">
      <p>Chargement...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-message">
      <p>{{ error }}</p>
    </div>

    <!-- Profile Content -->
    <div v-else-if="user" class="profile-wrapper">
      <!-- Full Screen Photo Section -->
      <div class="photo-section">
        <div class="profile-photo">📷</div>
      </div>

      <!-- Content Section -->
      <div class="content-section">
        <!-- Profile Header with Name and Action Button -->
        <div class="profile-header">
          <div class="header-left">
            <h1 class="profile-name">{{ user.firstName }} {{ user.lastName }}</h1>
            <div class="profile-meta">
              <p>{{ user.age }} ans </p>
              <p class="profile-location"><MapPinIcon size="20px"/> {{ user.address?.city }}</p>
            </div>
          </div>

          <Button
              v-if="isSelfView"
              variant="primary"
              size="sm"
              @click="handleEdit"
              class="edit-button"
          >
            Modifier
          </Button>

          <Button
              v-else
              variant="primary"
              size="sm"
              @click="handleContact"
              class="edit-button"
          >
            Contacter
          </Button>
        </div>

        <!-- Stats Section -->
        <div class="stats-section">
          <div class="stat-item">
            <p class="stat-label">Animaux adoptés</p>
            <p class="stat-value">{{ adoptedCount }}</p>
          </div>
          <div class="stat-item">
            <p class="stat-label">Demandes en cours</p>
            <p class="stat-value">{{ requestsCount }}</p>
          </div>
        </div>

        <!-- About Section -->
        <section class="about-section">
          <div v-if="user.description">
            <h2 class="section-title">À propos</h2>
            <p class="about-text">
              {{ user.description }}
            </p>
          </div>
        </section>

        <section class="preferences-section">
          <h2 class="section-title">Préférences</h2>

          <div class="preferences-grid" v-if="formattedPreferences.flat().length > 0">
            <div class="chars">
              <div class="char-col" v-for="(col, idx) in formattedPreferences" :key="idx">
                <ul>
                  <li v-for="(c, i) in col" :key="i" class="text-body-base">
                    <span class="bullet"></span>{{ c }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p v-else class="no-preferences">Aucune préférence renseignée</p>
        </section>

        <!-- Logout Button (uniquement si c'est son propre profil) -->
        <div v-if="isSelfView" class="logout-section">
          <Button
              variant="secondary"
              @click="handleLogout"
              class="logout-btn"
          >
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

.back-button {
  position: fixed;
  top: 16px;
  left: 16px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back-button:hover {
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

/* Profile Wrapper */
.profile-wrapper {
  display: flex;
  flex-direction: column;
}

/* Photo Section - Full Width at Top */
.photo-section {
  width: 100%;
  height: 400px;
  background: linear-gradient(180deg, #DDD 0%, #AAA 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.profile-photo {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 120px;
  background: linear-gradient(180deg, #E8E8E8 0%, #D0D0D0 100%);
}

/* Content Section - White Background */
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

/* Profile Header */
.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-top: 15px;
}

.header-left {
  width: 150%;
}

.profile-name {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #666;
}

.profile-location {
  display: flex;
  align-items: flex-end;
  gap: 4px;
}




/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
  text-align: center;
  padding: 20px 0;
  border-top: 1px solid #E8E8E8;
  border-bottom: 1px solid #E8E8E8;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-label {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #999;
}

.stat-value {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
}


/* Section Titles */
.section-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
}

/* About Section */
.about-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.about-text {
  margin: 0;
  font-size: 14px;
  color: #555;
  line-height: 1.7;
  text-align: justify;
}

/* Preferences Section */

.chars {
  display: flex;
  gap: var(--spacing-4);
  padding: var(--spacing-4) 0;
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
  gap: var(--spacing-2);
  padding: var(--spacing-1) 0;
  color: var(--color-neutral-700);
}

.bullet {
  width: 12px;
  height: 12px;
  background: var(--color-accent-600);
  border-radius: var(--radius-full);
  flex-shrink: 0;
}
.no-preferences {
  margin: 0;
  font-size: 13px;
  color: #999;
  text-align: center;
  padding: 24px;
  background: #FAFAFA;
  border-radius: 8px;
}

/* Logout Section */
.logout-section {
  border-top: 1px solid #E8E8E8;
  padding-top: 26px;
}

.logout-btn {
  width: 100%;
}


</style>
