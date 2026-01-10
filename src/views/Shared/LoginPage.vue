<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from '@/components/Button.vue';
import Input from '@/components/Input.vue';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();
const { setAuthData } = useAuth();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const userType = ref('adopter'); // 'adopter' ou 'owner'

const handleLogin = async () => {
  // Validation des champs requis
  if (!email.value || !password.value) {
    error.value = 'Veuillez remplir tous les champs';
    return;
  }

  // Validation du format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value)) {
    error.value = 'Format d\'email invalide';
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
        password: password.value,
        type: userType.value
      }),
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      error.value = errorData.error || 'Email ou mot de passe invalide';
      return;
    }

    const data = await response.json();
    
    setAuthData({
      token: data.token,
      userId: data.user?._id,
      userType: data.type
    });
    
    // Redirection selon le type d'utilisateur
    if (data.type === 'admin') {
      router.push('/admin');
    } else if (data.type === 'adopter') {
      router.push('/adopter');
    } else {
      router.push('/owner/requests');
    }
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
      <div class="login-header">
        <h1 class="login-title">Connexion</h1>
      </div>

      <div class="cat-container">
        <img 
          src="@/assets/images/login-cat.png" 
          alt="Chat mignon"
          class="cat-image"
        />
      </div>

      <div class="login-form-wrapper">
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="toggle-group">
            <button 
              type="button"
              :class="['toggle-btn', { active: userType === 'adopter' }]"
              @click="userType = 'adopter'"
            >
              Adoptant
            </button>
            <button 
              type="button"
              :class="['toggle-btn', { active: userType === 'owner' }]"
              @click="userType = 'owner'"
            >
              Propriétaire
            </button>
          </div>

          <div class="input-group">
            <Input
              v-model="email"
              type="email"
              placeholder="adresse e-mail"
              icon="email"
              required
            />
          </div>

          <div class="input-group">
            <Input
              v-model="password"
              type="password"
              placeholder="mot de passe"
              icon="password"
              required
            />
          </div>

          <div class="forgot-password-container">
            <a href="#" class="forgot-password-link">Mot de passe oublié ?</a>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

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

          <div class="signup-container">
            <router-link to="/register" class="signup-link-text">
              Je n'ai pas encore de compte
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  height: 100vh;
  height: 100dvh;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  background: var(--gradient-primary-secondary);
  padding: 0 !important;
  overflow: hidden;
}

.login-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 var(--spacing-6);
  padding-top: var(--spacing-12);
  position: relative;
}

.login-header {
  width: 100%;
  text-align: center;
  margin-bottom: var(--spacing-6);
}

.login-title {
  font-family: var(--font-family);
  font-size: var(--heading-h1-size);
  font-weight: var(--heading-h1-weight);
  color: var(--color-neutral-white);
  margin: 0;
  text-shadow: var(--shadow-sm);
}

.cat-container {
  position: absolute;
top: calc(var(--spacing-12) + 57px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  pointer-events: none;
}

.cat-image {
  width: 200px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(var(--shadow-md));
}

.login-form-wrapper {
  width: 100%;
  background: var(--color-neutral-white);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  padding: var(--spacing-6);
  padding-top: var(--spacing-20);
  box-shadow: var(--shadow-2xl);
  flex: 1;
  margin-top: 130px;
}

.login-form {
  width: 100%;
}

.input-group {
  margin-bottom: var(--spacing-5);
}

.forgot-password-container {
  text-align: right;
  margin-bottom: var(--spacing-4);
  margin-top: var(--spacing-1);
}

.forgot-password-link {
  color: var(--color-neutral-500);
  text-decoration: none;
  transition: color 0.2s ease;
  padding: var(--spacing-2);
  display: inline-block;
}

.error-message {
  background: var(--color-error);
  color: var(--color-neutral-white);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-base);
  margin-bottom: var(--spacing-4);
  text-align: center;
}

.login-form :deep(.btn-login) {
  width: 100%;
}

.loader {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.signup-container {
  text-align: center;
  margin-top: var(--spacing-4);
}

.signup-link-text {
  color: var(--color-primary-600);
  text-decoration: underline;
  padding: var(--spacing-3);
}

.toggle-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-8);
}

.toggle-btn {
  padding: var(--spacing-2) var(--spacing-3);
  border: 2px solid var(--color-neutral-300);
  border-radius: var(--radius-full);
  background: var(--color-neutral-white);
  color: var(--color-neutral-700);
  font-family: var(--font-family);
  font-size: var(--body-sm-size);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
}

.toggle-btn.active {
  background: var(--color-primary-600);
  border-color: var(--color-primary-600);
  color: var(--color-neutral-white);
}
</style>
