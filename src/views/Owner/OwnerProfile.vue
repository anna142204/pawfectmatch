<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Menu from '@/components/Menu.vue';
import Button from '@/components/Button.vue';

const router = useRouter();

const user = ref(null);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      router.push('/login');
      return;
    }

    const response = await fetch(`/api/owners/${userId}`, {
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
</script>

<template>
  <div class="profile-page">
    <div class="profile-container">
      <h1 class="profile-title">Mon Profil</h1>

      <!-- Loading -->
      <div v-if="loading" class="loading">
        <p>Chargement...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-message">
        <p>{{ error }}</p>
      </div>

      <!-- Profile Content -->
      <div v-else-if="user" class="profile-content">
        <!-- Informations personnelles -->
        <section class="profile-section">
          <h2 class="section-title">Informations</h2>
          <div class="info-card">
            <div class="info-item">
              <span class="info-label">Nom</span>
              <span class="info-value">{{ user.firstName }} {{ user.lastName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">{{ user.email }}</span>
            </div>
            <div class="info-item" v-if="user.societyName">
              <span class="info-label">Société / Organisation</span>
              <span class="info-value">{{ user.societyName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Téléphone</span>
              <span class="info-value">{{ user.phoneNumber || 'Non renseigné' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Adresse</span>
              <span class="info-value">{{ user.address?.zip }} {{ user.address?.city }}</span>
            </div>
          </div>
        </section>

        <!-- À propos -->
        <section class="profile-section" v-if="user.about">
          <h2 class="section-title">À propos</h2>
          <div class="info-card">
            <p class="about-text">{{ user.about }}</p>
          </div>
        </section>

        <!-- Bouton déconnexion -->
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
  background-color: var(--color-background);
  padding-bottom: 80px;
}

.profile-container {
  max-width: 430px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.profile-title {
  font-family: var(--font-family);
  font-size: var(--font-size-xxl);
  color: var(--color-primary);
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.loading,
.error-message {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-muted);
}

.error-message {
  color: var(--color-error);
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.profile-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.section-title {
  font-family: var(--font-family);
  font-size: var(--font-size-lg);
  color: var(--color-text);
  margin: 0;
}

.info-card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  font-weight: 500;
}

.info-value {
  font-size: var(--font-size-md);
  color: var(--color-text);
}

.about-text {
  font-size: var(--font-size-md);
  color: var(--color-text);
  line-height: 1.5;
  margin: 0;
}

.logout-section {
  margin-top: var(--spacing-lg);
}

.logout-btn {
  width: 100%;
}
</style>
