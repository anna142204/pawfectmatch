<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Menu from '@/components/Menu.vue';
import Button from '@/components/Button.vue';
import TagButton from '@/components/TagButton.vue';

const router = useRouter();

const user = ref(null);
const loading = ref(true);
const error = ref('');

const adoptedCount = computed(() => 1); // À adapter selon les données réelles
const requestsCount = computed(() => 2); // À adapter selon les données réelles
const rating = computed(() => '5,5/6');

// Format les préférences depuis les données utilisateur
const formattedPreferences = computed(() => {
  if (!user.value?.preferences) return [];
  
  const prefs = [];
  
  // Ajouter les préférences d'environnement
  if (user.value.preferences.environment?.length > 0) {
    user.value.preferences.environment.forEach(env => {
      prefs.push({ label: env, type: 'environment' });
    });
  }
  
  // Ajouter les espèces recherchées
  if (user.value.preferences.species?.length > 0) {
    user.value.preferences.species.forEach(species => {
      prefs.push({ label: species, type: 'species' });
    });
  }
  
  // Ajouter les tailles préférées
  if (user.value.preferences.sizePreference?.length > 0) {
    user.value.preferences.sizePreference.forEach(size => {
      prefs.push({ label: size, type: 'size' });
    });
  }
  
  return prefs;
});

onMounted(async () => {
  try {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      router.push('/login');
      return;
    }

    const response = await fetch(`/api/adopters/${userId}`, {
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

const handleContact = () => {
  // À implémenter
};
</script>

<template>
  <div class="profile-page">
    <!-- Back button -->
    <button @click="router.back()" class="back-button">←</button>

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
        <!-- Profile Header with Name and Contact Button -->
        <div class="profile-header">
          <div class="header-left">
            <h1 class="profile-name">{{ user.firstName }} {{ user.lastName }}</h1>
            <p class="profile-meta">{{ user.age }} ans 📍 {{ user.address?.city }}</p>
          </div>
          <button class="contact-btn" @click="handleContact">contacter</button>
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
          <div class="stat-item">
            <p class="stat-label">Note</p>
            <p class="stat-value star">⭐ {{ rating }}</p>
          </div>
        </div>

        <!-- About Section -->
        <section class="about-section">
          <h2 class="section-title">À propos</h2>
          <p class="about-text">
            {{ user.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.' }}
          </p>
        </section>

        <!-- Preferences Section -->
        <section class="preferences-section">
          <h2 class="section-title">Préférences</h2>
          <div class="preferences-grid" v-if="formattedPreferences.length > 0">
            <TagButton 
              v-for="(pref, idx) in formattedPreferences" 
              :key="idx"
              :label="pref.label"
            />
          </div>
          <p v-else class="no-preferences">Aucune préférence renseignée</p>
        </section>

        <!-- Testimonials Section -->
        <section class="testimonials-section">
          <h2 class="section-title">Témoignages</h2>
          <p class="coming-soon">Section en construction...</p>
        </section>

        <!-- Logout Button -->
        <div class="logout-section">
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
  min-height: 100vh;
  background: #F5F5F5;
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
  gap: 20px;
  padding: 24px;
  background: white;
  margin-top: -20px;
  border-radius: 20px 20px 0 0;
  position: relative;
  z-index: 1;
}

/* Profile Header */
.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.header-left {
  flex: 1;
}

.profile-name {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1.2;
}

.profile-meta {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #666;
}

/* Contact Button */
.contact-btn {
  padding: 12px 24px;
  background: #7C3AED;
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;
}

.contact-btn:hover {
  background: #6D28D9;
  transform: translateY(-2px);
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

.stat-value.star {
  font-size: 20px;
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
.preferences-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preferences-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
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

/* Testimonials Section */
.testimonials-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.coming-soon {
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
  margin-top: 16px;
}

.logout-btn {
  width: 100%;
}

@media (max-width: 480px) {
  .photo-section {
    height: 320px;
  }

  .content-section {
    padding: 20px;
    margin-top: -16px;
  }

  .profile-name {
    font-size: 24px;
  }

  .profile-header {
    gap: 12px;
  }

  .contact-btn {
    padding: 10px 20px;
    font-size: 12px;
  }

  .preferences-grid {
    grid-template-columns: 1fr;
  }
}
</style>
