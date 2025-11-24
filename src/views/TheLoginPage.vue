<script setup>
import { ref } from 'vue';

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
    // Logique de connexion à implémenter
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      // Redirection selon le type d'utilisateur
      if (data.userType === 'adopter') {
        window.location.href = '/adoptant';
      } else if (data.userType === 'owner') {
        window.location.href = '/proprietaire';
      }
    } else {
      error.value = 'Email ou mot de passe incorrect';
    }
  } catch (err) {
    error.value = 'Une erreur est survenue. Veuillez réessayer.';
    console.error('Erreur de connexion:', err);
  } finally {
    loading.value = false;
  }
};

const handleGoogleLogin = () => {
  // Logique de connexion Google à implémenter
  window.location.href = '/api/auth/google';
};

const handleFacebookLogin = () => {
  // Logique de connexion Facebook à implémenter
  window.location.href = '/api/auth/facebook';
};

const goToSignup = () => {
  // Navigation vers la page d'inscription
  window.location.href = '/inscription';
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
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M22 6L12 13L2 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <input
                v-model="email"
                type="email"
                placeholder="adresse e-mail"
                class="input-field"
                required
              />
            </div>
          </div>

          <!-- Champ Mot de passe -->
          <div class="input-group">
            <div class="input-wrapper">
              <svg class="input-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <input
                v-model="password"
                type="password"
                placeholder="mot de passe"
                class="input-field"
                required
              />
            </div>
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
          <button 
            type="submit" 
            class="btn-login"
            :disabled="loading"
          >
            <span v-if="loading" class="loader"></span>
            <span v-else>connexion</span>
          </button>
        </form>

        <!-- Lien inscription -->
        <div class="signup-container">
          <button @click="goToSignup" class="signup-link">
            Je n'ai pas encore de compte
          </button>
        </div>

        <!-- Séparateur -->
        <div class="divider"></div>

        <!-- Boutons de connexion sociale -->
        <div class="social-login">
          <button @click="handleGoogleLogin" class="btn-social btn-google">
            Google
          </button>
          <button @click="handleFacebookLogin" class="btn-social btn-facebook">
            Facebook
          </button>
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
  background: linear-gradient(180deg, #9D4EDD 0%, #C77DBB 50%, #E0A0B8 100%);
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
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
}

/* Formulaire wrapper */
.login-form-wrapper {
  width: 100%;
  background: var(--color-neutral-white);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  padding: var(--spacing-16) var(--spacing-8);
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

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-neutral-50);
  border-radius: var(--radius-full);
  padding: var(--spacing-5) var(--spacing-6);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
  min-height: 56px;
}

.input-wrapper:focus-within {
  background: var(--color-neutral-white);
  box-shadow: 0 4px 12px rgba(157, 78, 221, 0.15);
  outline: 2px solid var(--color-primary-200);
}

.input-icon {
  width: 28px;
  height: 28px;
  color: var(--color-neutral-400);
  margin-right: var(--spacing-4);
  flex-shrink: 0;
}

.input-field {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-family: var(--font-family);
  font-size: var(--body-lg-size);
  line-height: var(--body-lg-height);
  color: var(--color-neutral-800);
  font-weight: var(--font-weight-normal);
}

.input-field::placeholder {
  color: var(--color-neutral-400);
  font-weight: var(--font-weight-light);
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
.btn-login {
  width: 100%;
  background: var(--color-primary-600);
  color: var(--color-neutral-white);
  border: none;
  border-radius: var(--radius-full);
  padding: var(--spacing-5) var(--spacing-6);
  font-family: var(--font-family);
  font-size: var(--button-base-size);
  font-weight: var(--button-base-weight);
  line-height: var(--button-base-height);
  letter-spacing: var(--button-base-spacing);
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-lg);
  text-transform: lowercase;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-login:active:not(:disabled) {
  background: var(--color-primary-700);
  transform: scale(0.98);
  box-shadow: var(--shadow-md);
}

.btn-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
}

.signup-link {
  background: none;
  border: none;
  font-family: var(--font-family);
  font-size: var(--body-lg-size);
  line-height: var(--body-lg-height);
  color: var(--color-neutral-700);
  cursor: pointer;
  transition: color 0.2s ease;
  font-weight: var(--font-weight-medium);
  text-decoration: underline;
  padding: var(--spacing-2);
  min-height: 44px;
}

.signup-link:hover {
  color: var(--color-primary-600);
}

/* Séparateur */
.divider {
  width: 100%;
  height: 1px;
  background: var(--color-neutral-200);
  margin: var(--spacing-10) 0;
}

/* Boutons de connexion sociale */
.social-login {
  display: flex;
  gap: var(--spacing-4);
  width: 100%;
}

.btn-social {
  flex: 1;
  border: none;
  border-radius: var(--radius-full);
  padding: var(--spacing-4) var(--spacing-6);
  font-family: var(--font-family);
  font-size: var(--button-md-size);
  font-weight: var(--button-md-weight);
  line-height: var(--button-md-height);
  letter-spacing: var(--button-md-spacing);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 56px;
}

.btn-google {
  background: #DB4437;
  color: var(--color-neutral-white);
  box-shadow: 0 2px 8px rgba(219, 68, 55, 0.3);
}

.btn-google:active {
  background: #C33D2E;
  transform: scale(0.98);
  box-shadow: 0 2px 6px rgba(219, 68, 55, 0.3);
}

.btn-facebook {
  background: #D45353;
  color: var(--color-neutral-white);
  box-shadow: 0 2px 8px rgba(212, 83, 83, 0.3);
}

.btn-facebook:active {
  background: #C04545;
  transform: scale(0.98);
  box-shadow: 0 2px 6px rgba(212, 83, 83, 0.3);
}

.btn-social:active {
  transform: scale(0.98);
}
</style>
