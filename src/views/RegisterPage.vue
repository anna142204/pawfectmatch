<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from '@/components/Button.vue';
import Input from '@/components/Input.vue';

const router = useRouter();

const step = ref(1); // Étape actuelle
const userType = ref('adopter'); // 'adopter' ou 'owner'
const firstName = ref('');
const lastName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const zip = ref('');
const city = ref('');
const age = ref('');
const phoneNumber = ref('');
const societyName = ref('');
const about = ref('');
const preferences = ref({
  environment: [],
  species: [],
  sizePreference: []
});

const loading = ref(false);
const error = ref('');

const handleNextStep = () => {
  error.value = '';

  if (step.value === 1) {
    // Validation étape 1
    if (!firstName.value || !lastName.value || !email.value || !password.value || !confirmPassword.value) {
      error.value = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (password.value.length < 6) {
      error.value = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }

    if (password.value !== confirmPassword.value) {
      error.value = 'Les mots de passe ne correspondent pas';
      return;
    }

    // Passer à l'étape 2
    step.value = 2;
  } else if (step.value === 2) {
    // Validation étape 2
    if (!zip.value || !city.value) {
      error.value = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (userType.value === 'adopter' && !age.value) {
      error.value = 'L\'âge est requis pour les adoptants';
      return;
    }

    if (userType.value === 'adopter' && parseInt(age.value) < 18) {
      error.value = 'Vous devez avoir au moins 18 ans pour adopter';
      return;
    }

    // Si owner, finaliser l'inscription
    if (userType.value === 'owner') {
      handleRegister();
    } else {
      // Si adopter, passer à l'étape 3 (préférences)
      step.value = 3;
    }
  }
};

const handlePreviousStep = () => {
  error.value = '';
  if (step.value > 1) {
    step.value--;
  }
};

const handleRegister = async () => {
  loading.value = true;
  error.value = '';

  try {
    const endpoint = userType.value === 'adopter' 
      ? '/api/auth/register/adopter' 
      : '/api/auth/register/owner';

    const body = {
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      password: password.value,
      address: {
        zip: zip.value,
        city: city.value
      },
      about: about.value
    };

    if (userType.value === 'adopter') {
      body.age = parseInt(age.value);
      body.preferences = preferences.value;
    } else {
      body.phoneNumber = phoneNumber.value;
      body.societyName = societyName.value;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) {
      // Stocker les informations utilisateur
      localStorage.setItem('user_type', userType.value);
      localStorage.setItem('user_id', data.user._id);

      // Redirection selon le type d'utilisateur
      router.push(userType.value === 'adopter' ? '/adopter' : '/owner');
    } else {
      error.value = data.error || 'Erreur lors de l\'inscription';
    }
  } catch (err) {
    error.value = 'Une erreur est survenue. Veuillez réessayer.';
    console.error('Erreur d\'inscription:', err);
  } finally {
    loading.value = false;
  }
};

</script>

<template>
  <div class="register-page">
    <div class="register-container">
      <!-- En-tête -->
      <div class="register-header">
        <h1 class="register-title">Inscription</h1>
      </div>

      <!-- Formulaire -->
      <div class="register-form-wrapper">
        <!-- Indicateur d'étapes -->
        <div class="steps-indicator">
          <div :class="['step-dot', { active: step >= 1, completed: step > 1 }]">1</div>
          <div class="step-line" :class="{ active: step > 1 }"></div>
          <div :class="['step-dot', { active: step >= 2, completed: step > 2 }]">2</div>
          <template v-if="userType === 'adopter'">
            <div class="step-line" :class="{ active: step > 2 }"></div>
            <div :class="['step-dot', { active: step >= 3 }]">3</div>
          </template>
        </div>

        <form @submit.prevent="handleNextStep" class="register-form">
          <!-- Étape 1: Informations de base -->
          <template v-if="step === 1">
            <!-- Choix du type d'utilisateur -->
            <div class="user-type-selector">
              <button 
                type="button"
                :class="['type-btn', { active: userType === 'adopter' }]"
                @click="userType = 'adopter'"
              >
                Adoptant
              </button>
              <button 
                type="button"
                :class="['type-btn', { active: userType === 'owner' }]"
                @click="userType = 'owner'"
              >
                Propriétaire
              </button>
            </div>

            <!-- Champs communs -->
          <div class="input-group">
            <Input
              v-model="firstName"
              type="text"
              placeholder="Prénom *"
              required
            />
          </div>

          <div class="input-group">
            <Input
              v-model="lastName"
              type="text"
              placeholder="Nom *"
              required
            />
          </div>

          <div class="input-group">
            <Input
              v-model="email"
              type="email"
              placeholder="Adresse e-mail *"
              icon="email"
              required
            />
          </div>

          <div class="input-group">
            <Input
              v-model="password"
              type="password"
              placeholder="Mot de passe *"
              icon="password"
              required
            />
          </div>

          <div class="input-group">
            <Input
              v-model="confirmPassword"
              type="password"
              placeholder="Confirmer le mot de passe *"
              icon="password"
              required
            />
          </div>
          </template>

          <!-- Étape 2: Adresse et informations spécifiques -->
          <template v-if="step === 2">
          <div class="input-group">
            <Input
              v-model="zip"
              type="text"
              placeholder="Code postal *"
              required
            />
          </div>

          <div class="input-group">
            <Input
              v-model="city"
              type="text"
              placeholder="Ville *"
              required
            />
          </div>

          <!-- Champs spécifiques adoptant -->
          <template v-if="userType === 'adopter'">
            <div class="input-group">
              <Input
                v-model="age"
                type="number"
                placeholder="Âge * (min. 18 ans)"
                required
                min="18"
              />
            </div>
          </template>

          <!-- Champs spécifiques propriétaire -->
          <template v-if="userType === 'owner'">
            <div class="input-group">
              <Input
                v-model="societyName"
                type="text"
                placeholder="Nom de la société (optionnel)"
              />
            </div>

            <div class="input-group">
              <Input
                v-model="phoneNumber"
                type="tel"
                placeholder="Numéro de téléphone"
              />
            </div>
          </template>

          <!-- Champ À propos (commun) -->
          <div class="input-group">
            <textarea
              v-model="about"
              placeholder="À propos de vous (optionnel)"
              class="textarea-input"
              rows="4"
            ></textarea>
          </div>
          </template>

          <!-- Étape 3: Préférences (adoptant uniquement) -->
          <template v-if="step === 3">
            <div class="input-group">
              <label class="field-label">Environnement</label>
              <div class="checkbox-group">
                <label class="checkbox-item">
                  <input type="checkbox" value="appartement" v-model="preferences.environment" />
                  <span>Appartement</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" value="voiture" v-model="preferences.environment" />
                  <span>Voiture</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" value="enfant" v-model="preferences.environment" />
                  <span>Enfants</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" value="chien" v-model="preferences.environment" />
                  <span>Chien</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" value="chat" v-model="preferences.environment" />
                  <span>Chat</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" value="autre animaux" v-model="preferences.environment" />
                  <span>Autres animaux</span>
                </label>
              </div>
            </div>

            <div class="input-group">
              <label class="field-label">Taille préférée</label>
              <div class="checkbox-group">
                <label class="checkbox-item">
                  <input type="checkbox" value="petit" v-model="preferences.sizePreference" />
                  <span>Petit</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" value="moyen" v-model="preferences.sizePreference" />
                  <span>Moyen</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" value="grand" v-model="preferences.sizePreference" />
                  <span>Grand</span>
                </label>
              </div>
            </div>
          </template>

          <!-- Message d'erreur -->
          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <!-- Boutons de navigation -->
          <div class="form-actions">
            <Button 
              v-if="step > 1"
              type="button"
              variant="secondary"
              size="base"
              @click="handlePreviousStep"
              class="btn-back"
            >
              Retour
            </Button>
            
            <Button 
              v-if="step < 3"
              type="submit"
              variant="primary"
              size="base"
              class="btn-next"
            >
              Suivant
            </Button>

            <Button 
              v-else
              type="button"
              variant="primary"
              size="lg"
              :disabled="loading"
              @click="handleRegister"
              class="btn-next"
            >
              <span v-if="loading" class="loader"></span>
              <span v-else>S'inscrire</span>
            </Button>
          </div>
        </form>

        <!-- Lien vers connexion -->
        <div class="login-container-link">
          <router-link to="/login" class="login-link-text">
            J'ai déjà un compte
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  background: var(--gradient-primary-secondary);
  padding: 0;
  overflow-y: auto;
}

.register-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-6);
  padding-top: var(--spacing-8);
}

/* En-tête */
.register-header {
  width: 100%;
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.register-title {
  font-family: var(--font-family);
  font-size: var(--heading-h1-size);
  font-weight: var(--heading-h1-weight);
  line-height: var(--heading-h1-height);
  letter-spacing: var(--heading-h1-spacing);
  color: var(--color-neutral-white);
  margin: 0;
  text-shadow: var(--shadow-sm);
}

/* Formulaire wrapper */
.register-form-wrapper {
  width: 100%;
  background: var(--color-neutral-white);
  border-radius: var(--radius-2xl);
  padding: var(--spacing-8);
  box-shadow: var(--shadow-2xl);
  flex: 1;
  display: flex;
  flex-direction: column;
}

.register-form {
  width: 100%;
}

/* Sélecteur de type d'utilisateur */
.user-type-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.type-btn {
  padding: var(--spacing-3) var(--spacing-4);
  border: 2px solid var(--color-neutral-300);
  border-radius: var(--radius-full);
  background: var(--color-neutral-white);
  color: var(--color-neutral-700);
  font-family: var(--font-family);
  font-size: var(--body-base-size);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.3s ease;
}

.type-btn.active {
  background: var(--color-primary-600);
  border-color: var(--color-primary-600);
  color: var(--color-neutral-white);
}

/* Groupes d'input */
.input-group {
  margin-bottom: var(--spacing-4);
}

.field-label {
  display: block;
  font-family: var(--font-family);
  font-size: var(--body-base-size);
  font-weight: var(--font-weight-medium);
  color: var(--color-neutral-700);
  margin-bottom: var(--spacing-2);
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-3);
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--color-primary-600);
}

.checkbox-item span {
  font-family: var(--font-family);
  font-size: var(--body-sm-size);
  color: var(--color-neutral-700);
}

/* Textarea */
.textarea-input {
  width: 100%;
  padding: var(--spacing-4);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-lg);
  font-family: var(--font-family);
  font-size: var(--body-base-size);
  color: var(--color-neutral-900);
  resize: vertical;
  transition: border-color 0.2s ease;
}

.textarea-input:focus {
  outline: none;
  border-color: var(--color-primary-600);
}

.textarea-input::placeholder {
  color: var(--color-neutral-400);
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

/* Indicateur d'étapes */
.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-8);
  gap: var(--spacing-2);
}

.step-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family);
  font-size: var(--body-base-size);
  font-weight: var(--font-weight-semibold);
  background: var(--color-neutral-200);
  color: var(--color-neutral-500);
  transition: all 0.3s ease;
}

.step-dot.active {
  background: var(--color-primary-600);
  color: var(--color-neutral-white);
}

.step-dot.completed {
  background: var(--color-primary-700);
}

.step-line {
  width: 40px;
  height: 2px;
  background: var(--color-neutral-200);
  transition: all 0.3s ease;
}

.step-line.active {
  background: var(--color-primary-600);
}

/* Boutons de navigation */
.form-actions {
  display: flex;
  gap: var(--spacing-4);
  margin-top: var(--spacing-4);
}

.form-actions :deep(.btn-back) {
  flex: 1;
}

.form-actions :deep(.btn-next) {
  flex: 2;
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

/* Lien vers connexion */
.login-container-link {
  text-align: center;
  margin-top: var(--spacing-6);
  width: 100%;
}

.login-link-text {
  display: inline-block;
  font-family: var(--font-family);
  font-size: var(--body-base-size);
  color: var(--color-primary-600);
  text-decoration: underline;
  padding: var(--spacing-3);
  transition: color 0.2s ease;
}

.login-link-text:hover {
  color: var(--color-primary-700);
}
</style>
