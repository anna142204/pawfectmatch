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
        password: password.value
      }),
      credentials: 'include' // Important pour les cookies
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      error.value = errorData.error || 'Email ou mot de passe invalide';
      return;
    }

    const data = await response.json();
    
    // Stocker les informations utilisateur
    localStorage.setItem('user_type', data.type);
    localStorage.setItem('user_id', data.user._id);
    
    // Redirection selon le type d'utilisateur
    if (data.type === 'admin') {
      router.push('/admin');
    } else if (data.type === 'adopter') {
      router.push('/adopter');
    } else {
      router.push('/owner');
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

          <!-- Lien inscription -->
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
  height: 100dvh; /* Dynamic viewport height pour mobile */
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
}

/* En-tête */
.login-header {
  width: 100%;
  text-align: center;
  margin-bottom: var(--spacing-6);
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
  margin-bottom: -50px;
  position: relative;
  z-index: 2;
}

.cat-image {
  width: 200px;
  height: 200px;
  object-fit: cover;
  object-position: top;
  filter: drop-shadow(var(--shadow-md));
}

/* Formulaire wrapper */
.login-form-wrapper {
  width: 100%;
  background: var(--color-neutral-white);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  padding: var(--spacing-6);
  padding-top: var(--spacing-20);
  box-shadow: var(--shadow-2xl);
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
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
  margin-bottom: var(--spacing-4);
  margin-top: var(--spacing-1);
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
  margin-top: var(--spacing-4);
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

/* ========== RESPONSIVE MOBILE ========== */

/* Très petits écrans (iPhone SE, Galaxy S8) - hauteur < 700px */
@media (max-height: 700px) {
  .login-container {
    padding-top: var(--spacing-4);
  }

  .login-header {
    margin-bottom: var(--spacing-2);
  }

  .login-title {
    font-size: var(--heading-h2-size);
  }

  .cat-container {
    margin-bottom: -35px;
  }

  .cat-image {
    width: 140px;
    height: 140px;
  }

  .login-form-wrapper {
    padding-top: var(--spacing-12);
    padding-left: var(--spacing-4);
    padding-right: var(--spacing-4);
  }

  .input-group {
    margin-bottom: var(--spacing-3);
  }

  .forgot-password-container {
    margin-bottom: var(--spacing-2);
    margin-top: 0;
  }

  .forgot-password-link {
    font-size: var(--body-sm-size);
    padding: var(--spacing-1);
    min-height: 36px;
  }

  .signup-container {
    margin-top: var(--spacing-3);
  }
}

/* Écrans moyens (iPhone X/11/12/13/14) - hauteur 700-850px */
@media (min-height: 701px) and (max-height: 850px) {
  .login-container {
    padding-top: var(--spacing-8);
  }

  .cat-image {
    width: 180px;
    height: 180px;
  }

  .login-form-wrapper {
    padding-top: var(--spacing-16);
  }
}

/* Grands téléphones (iPhone Plus/Max, grands Android) - hauteur > 850px */
@media (min-height: 851px) {
  .login-container {
    padding-top: var(--spacing-12);
  }

  .cat-image {
    width: 200px;
    height: 200px;
  }

  .login-form-wrapper {
    padding-top: var(--spacing-18);
  }
}

</style>
