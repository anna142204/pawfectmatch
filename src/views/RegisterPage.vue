<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from '@/components/Button.vue';
import Input from '@/components/Input.vue';
import ImageUploader from '@/components/ImageUploader.vue';
import { MapPin } from 'lucide-vue-next'; // Import déplacé ici

const router = useRouter();

const step = ref(1);
const userType = ref('adopter');
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
const imageFile = ref(null);
const imagePreview = ref('');

const loading = ref(false);
const error = ref('');
const locating = ref(false); // Variable pour l'état du bouton localisation

// Gestion de l'image sélectionnée
const handleImageSelected = (files) => {
  if (files && files.length > 0) {
    imageFile.value = files[0].file;
    imagePreview.value = files[0].preview;
  } else {
    imageFile.value = null;
    imagePreview.value = '';
  }
};

// Fonction de géolocalisation CORRIGÉE
const locateUser = () => {
  if (!navigator.geolocation) {
    alert("La géolocalisation n'est pas supportée par votre navigateur.");
    return;
  }

  locating.value = true;

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;

        // Appel à l'API Nominatim (OpenStreetMap)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );

        if (response.ok) {
          const data = await response.json();
          const addr = data.address;

          // CORRECTION : Utilisation des refs directes zip et city
          if (addr.postcode) {
             zip.value = addr.postcode;
          }
          city.value = addr.city || addr.town || addr.village || addr.municipality || '';
        }
      } catch (e) {
        console.error("Erreur geocoding inverse:", e);
      } finally {
        locating.value = false;
      }
    },
    (error) => {
      console.error("Erreur géolocalisation:", error);
      alert("Impossible de récupérer votre position. Vérifiez vos autorisations.");
      locating.value = false;
    }
  );
};

const handleNextStep = () => {
  error.value = '';

  if (step.value === 1) {
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
    step.value = 2;
  } else if (step.value === 2) {
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
    if (userType.value === 'owner') {
      handleRegister();
    } else {
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

    let imageUrl = '';
    if (imageFile.value) {
      const formData = new FormData();
      formData.append('image', imageFile.value);
      const uploadRes = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      const uploadData = await uploadRes.json();
      if (uploadRes.ok && uploadData.url) {
        imageUrl = uploadData.url;
      }
    }

    const body = {
      firstName: firstName.value,
      lastName: lastName.value,
      email: email.value,
      password: password.value,
      address: {
        zip: zip.value,
        city: city.value
      },
      about: about.value,
      image: imageUrl
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
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('user_type', userType.value);
      localStorage.setItem('user_id', data.user._id);
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
      <div class="register-header">
        <h1 class="register-title">Inscription</h1>
      </div>

      <div class="register-form-wrapper">
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
          <template v-if="step === 1">
            <div class="user-type-selector">
              <button type="button" :class="['type-btn', { active: userType === 'adopter' }]"
                @click="userType = 'adopter'">
                Adoptant
              </button>
              <button type="button" :class="['type-btn', { active: userType === 'owner' }]" @click="userType = 'owner'">
                Propriétaire
              </button>
            </div>

            <div class="input-group">
              <ImageUploader :multiple="false" @filesSelected="handleImageSelected" />
            </div>
            <div class="input-group">
              <Input v-model="firstName" type="text" placeholder="Prénom *" required />
            </div>
            <div class="input-group">
              <Input v-model="lastName" type="text" placeholder="Nom *" required />
            </div>
            <div class="input-group">
              <Input v-model="email" type="email" placeholder="Adresse e-mail *" icon="email" required />
            </div>
            <div class="input-group">
              <Input v-model="password" type="password" placeholder="Mot de passe *" icon="password" required />
            </div>
            <div class="input-group">
              <Input v-model="confirmPassword" type="password" placeholder="Confirmer le mot de passe *" icon="password" required />
            </div>
          </template>

          <template v-if="step === 2">
            <div class="form-group input-group" >
              <label class="field-label">Adresse</label>

              <button type="button" @click="locateUser" class="geo-btn" :disabled="locating">
                <MapPin size="16" />
                {{ locating ? 'Localisation...' : 'Utiliser ma position actuelle' }}
              </button>

              <div class="row">
                <Input v-model="zip" label="NPA" placeholder="1000" required class="input-group" />
                <Input v-model="city" label="Ville" placeholder="Lausanne" required class="input-group" />
              </div>
            </div>

            <template v-if="userType === 'adopter'">
              <div class="input-group">
                <Input v-model="age" type="number" placeholder="Âge * (min. 18 ans)" required min="18" />
              </div>
            </template>

            <template v-if="userType === 'owner'">
              <div class="input-group">
                <Input v-model="societyName" type="text" placeholder="Nom de la société (optionnel)" />
              </div>
              <div class="input-group">
                <Input v-model="phoneNumber" type="tel" placeholder="Numéro de téléphone (optionnel)" />
              </div>
            </template>

            <div class="input-group">
              <textarea v-model="about" placeholder="À propos de vous (optionnel)" class="textarea-input" rows="4"></textarea>
            </div>
          </template>

          <template v-if="step === 3">
            <div class="input-group">
              <label class="field-label">Environnement</label>
              <div class="checkbox-group">
                <label class="checkbox-item"><input type="checkbox" value="appartement" v-model="preferences.environment" /><span>Appartement</span></label>
                <label class="checkbox-item"><input type="checkbox" value="voiture" v-model="preferences.environment" /><span>Voiture</span></label>
                <label class="checkbox-item"><input type="checkbox" value="enfant" v-model="preferences.environment" /><span>Enfants</span></label>
                <label class="checkbox-item"><input type="checkbox" value="chien" v-model="preferences.environment" /><span>Chien</span></label>
                <label class="checkbox-item"><input type="checkbox" value="chat" v-model="preferences.environment" /><span>Chat</span></label>
                <label class="checkbox-item"><input type="checkbox" value="autre animaux" v-model="preferences.environment" /><span>Autres animaux</span></label>
              </div>
            </div>

            <div class="input-group">
              <label class="field-label">Taille préférée</label>
              <div class="checkbox-group">
                <label class="checkbox-item"><input type="checkbox" value="petit" v-model="preferences.sizePreference" /><span>Petit</span></label>
                <label class="checkbox-item"><input type="checkbox" value="moyen" v-model="preferences.sizePreference" /><span>Moyen</span></label>
                <label class="checkbox-item"><input type="checkbox" value="grand" v-model="preferences.sizePreference" /><span>Grand</span></label>
              </div>
            </div>
          </template>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="form-actions">
            <Button v-if="step > 1" type="button" variant="secondary" size="base" @click="handlePreviousStep" class="btn-back">Retour</Button>
            <Button v-if="step < 3" type="submit" variant="primary" size="base" class="btn-next">Suivant</Button>
            <Button v-else type="button" variant="primary" size="base" :disabled="loading" @click="handleRegister" class="btn-next">
              <span v-if="loading" class="loader"></span>
              <span v-else>S'inscrire</span>
            </Button>
          </div>
        </form>

        <div class="login-container-link">
          <router-link to="/login" class="login-link-text">J'ai déjà un compte</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  height: 100vh;
  height: 100dvh;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  background: var(--gradient-primary-secondary);
  padding: 0;
  overflow: hidden;
}

.register-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 var(--spacing-6);
  padding-top: var(--spacing-10);
}

.register-header {
  width: 100%;
  text-align: center;
  margin-bottom: var(--spacing-12);
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

.register-form-wrapper {
  width: 100%;
  background: var(--color-neutral-white);
  border-radius: var(--radius-2xl) var(--radius-2xl) 0 0;
  padding: var(--spacing-6);
  box-shadow: var(--shadow-2xl);
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.register-form {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.user-type-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-4);
}

.type-btn {
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

.type-btn.active {
  background: var(--color-primary-600);
  border-color: var(--color-primary-600);
  color: var(--color-neutral-white);
}

.input-group {
  margin-bottom: var(--spacing-3);
}

.field-label {
  display: block;
  font-family: var(--font-family);
  font-size: var(--body-sm-size);
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
  padding: var(--spacing-3);
  cursor: pointer;
  border: 2px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  background: var(--color-neutral-50, #f9f9f9);
  transition: all 0.2s ease;
}

.checkbox-item:hover {
  border-color: var(--color-primary-400);
  background: var(--color-primary-50, #f5f0ff);
}

.checkbox-item input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: var(--color-primary-600);
  flex-shrink: 0;
}

.checkbox-item input[type="checkbox"]:checked+span {
  color: var(--color-primary-600);
  font-weight: var(--font-weight-semibold);
}

.checkbox-item span {
  font-family: var(--font-family);
  font-size: var(--body-sm-size);
  color: var(--color-neutral-700);
  transition: all 0.2s ease;
}

.textarea-input {
  width: 100%;
  padding: var(--spacing-3);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-lg);
  font-family: var(--font-family);
  font-size: var(--body-sm-size);
  color: var(--color-neutral-900);
  resize: none;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.textarea-input:focus {
  outline: none;
  border-color: var(--color-primary-600);
}

.textarea-input::placeholder {
  color: var(--color-neutral-400);
}

.error-message {
  background: var(--color-error);
  color: var(--color-neutral-white);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--radius-base);
  font-size: var(--body-sm-size);
  margin-bottom: var(--spacing-3);
  text-align: center;
}

.steps-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: var(--spacing-4);
  margin-bottom: var(--spacing-8);
  gap: var(--spacing-2);
}

.step-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-family);
  font-size: var(--body-sm-size);
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
  width: 30px;
  height: 2px;
  background: var(--color-neutral-200);
  transition: all 0.3s ease;
}

.step-line.active {
  background: var(--color-primary-600);
}

.form-actions {
  display: flex;
  gap: var(--spacing-3);
  margin-top: auto;
  padding-top: var(--spacing-4);
}

.form-actions :deep(.btn-back) {
  flex: 1;
}

.form-actions :deep(.btn-next) {
  flex: 2;
}

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
  to {
    transform: rotate(360deg);
  }
}

.login-container-link {
  text-align: center;
  margin-top: var(--spacing-3);
  padding-bottom: var(--spacing-4);
  width: 100%;
}

.login-link-text {
  display: inline-block;
  font-family: var(--font-family);
  font-size: var(--body-base-size);
  color: var(--color-primary-600);
  text-decoration: underline;
  padding: var(--spacing-2);
  transition: color 0.2s ease;
}

.login-link-text:hover {
  color: var(--color-primary-700);
}

/* ========== RESPONSIVE ========== */
@media (max-height: 670px) {
  .register-container {
    padding-top: var(--spacing-6);
  }
  .register-header {
    margin-bottom: var(--spacing-3);
  }
  .register-title {
    font-size: var(--heading-h2-size);
  }
  .register-form-wrapper {
    padding: var(--spacing-6);
  }
  .steps-indicator {
    margin-bottom: var(--spacing-3);
  }
  .step-dot {
    width: 28px;
    height: 28px;
    font-size: var(--body-xs-size);
  }
  .step-line {
    width: 24px;
  }
  .input-group {
    margin-bottom: var(--spacing-2);
  }
  .user-type-selector {
    margin-bottom: var(--spacing-3);
  }
}

.geo-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #4b5563;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  margin-bottom: 12px;
  transition: all 0.2s;
  width: fit-content;
}

.geo-btn:hover {
  background-color: #e5e7eb;
  color: #1f2937;
}

.geo-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}
</style>