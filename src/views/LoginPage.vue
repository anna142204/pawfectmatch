<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from '@/components/Button.vue';
import Input from '@/components/Input.vue';

const router = useRouter();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  if (!email.value || !password.value) {
    error.value = 'Veuillez remplir tous les champs';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      }),
      credentials: 'include' // Important pour les cookies
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      error.value = errorData.error || 'Email ou mot de passe incorrect';
      return;
    }

    const data = await response.json();
    
    // Stocker les informations utilisateur
    localStorage.setItem('user_type', data.type);
    localStorage.setItem('user_id', data.user._id);
    
    // Redirection selon le type d'utilisateur
    router.push(data.type === 'adopter' ? '/adopter' : '/owner');
  } catch (err) {
    error.value = 'Une erreur est survenue. Veuillez réessayer.';
    console.error('Erreur de connexion:', err);
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <!-- En-tête avec titre -->
      <div class="login-header">
        <h1 class="login-title">Connexion</h1>
      </div>

      <!-- Image du chat -->
      <div class="cat-container">
        <img 
          src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop" 
          alt="Chat mignon"
          class="cat-image"
        />
      </div>

      <!-- Formulaire de connexion -->
      <div class="login-form-wrapper">
        <form @submit.prevent="handleLogin" class="login-form">
          <!-- Champ Email -->
          <div class="input-group">
            <Input
              v-model="email"
              type="email"
              placeholder="adresse e-mail"
              icon="email"
              required
            />
          </div>

          <!-- Champ Mot de passe -->
          <div class="input-group">
            <Input
              v-model="password"
              type="password"
              placeholder="mot de passe"
              icon="password"
              required
            />
          </div>

          <!-- Lien mot de passe oublié -->
          <div class="forgot-password-container">
            <a href="#" class="forgot-password-link">Mot de passe oublié ?</a>
          </div>

          <!-- Message d'erreur -->
          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <!-- Bouton de connexion -->
          <Button 
            type="submit"
            variant="primary"
            size="lg"
            :disabled="loading"
            class="btn-login"
          >
            <span v-if="loading" class="loader"></span>
            <span v-else>Connexion</span>
          </Button>
        </form>

        <!-- Lien inscription -->
        <div class="signup-container">
          <router-link to="/register" class="signup-link-text">
            Je n'ai pas encore de compte
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  background: var(--gradient-primary-secondary);
  padding: 0;
  overflow-y: auto;
}

.login-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-8) var(--spacing-6);
  padding-top: var(--spacing-12);
}

/* En-tête */
.login-header {
  width: 100%;
  text-align: center;
  margin-bottom: var(--spacing-10);
}

.login-title {
  font-family: var(--font-family);
  font-size: var(--heading-h1-size);
  font-weight: var(--heading-h1-weight);
  line-height: var(--heading-h1-height);
  letter-spacing: var(--heading-h1-spacing);
  color: var(--color-neutral-white);
  margin: 0;
  text-shadow: var(--shadow-sm);
}

/* Container du chat */
.cat-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: -60px;
  position: relative;
  z-index: 2;
}

.cat-image {
  width: 240px;
  height: 240px;
  object-fit: cover;
  object-position: top;
  filter: drop-shadow(var(--shadow-md));
}

/* Formulaire wrapper */
.login-form-wrapper {
  width: 100%;
  background: var(--color-neutral-white);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  padding: var(--spacing-10) var(--spacing-8);
  padding-top: var(--spacing-20);
  box-shadow: var(--shadow-2xl);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.login-form {
  width: 100%;
}

/* Groupes d'input */
.input-group {
  margin-bottom: var(--spacing-5);
}

/* Mot de passe oublié */
.forgot-password-container {
  text-align: right;
  margin-bottom: var(--spacing-10);
  margin-top: var(--spacing-2);
}

.forgot-password-link {
  font-family: var(--font-family);
  font-size: var(--body-base-size);
  line-height: var(--body-base-height);
  color: var(--color-neutral-500);
  text-decoration: none;
  font-weight: var(--font-weight-normal);
  transition: color 0.2s ease;
  padding: var(--spacing-2);
  display: inline-block;
  min-height: 44px;
}

.forgot-password-link:hover {
  color: var(--color-primary-600);
}

/* Message d'erreur */
.error-message {
  background: var(--color-error);
  color: var(--color-neutral-white);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-base);
  font-size: var(--body-sm-size);
  margin-bottom: var(--spacing-4);
  text-align: center;
}

/* Bouton de connexion */
.login-form :deep(.btn-login) {
  width: 100%;
}

/* Loader */
.loader {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Lien inscription */
.signup-container {
  text-align: center;
  margin-top: var(--spacing-8);
  width: 100%;
}

.signup-link-text {
  display: inline-block;
  font-family: var(--font-family);
  font-size: var(--body-base-size);
  color: var(--color-primary-600);
  text-decoration: underline;
  padding: var(--spacing-3);
  transition: color 0.2s ease;
}

.signup-link-text:hover {
  color: var(--color-primary-700);
}

/* Séparateur */
.divider {
  width: 100%;
  height: 1px;
  background: var(--color-neutral-200);
  margin: var(--spacing-10) 0;
}

</style>
