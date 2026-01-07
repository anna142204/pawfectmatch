<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { X } from 'lucide-vue-next'

const props = defineProps({
  notification: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const router = useRouter()

// Auto-close after 8 seconds
onMounted(() => {
  setTimeout(() => {
    emit('close')
  }, 8000)
})

const handleStartConversation = () => {
  router.push(props.notification.conversationLink)
  emit('close')
}

const handleViewProfile = () => {
  // Close notification but don't navigate - user can manually view the profile
  emit('close')
}
</script>

<template>
  <div class="match-notification-overlay" @click="emit('close')">
    <div class="match-notification-container" @click.stop>
      <button class="close-btn" @click="emit('close')">
        <X :size="20" />
      </button>

      <!-- Background gradient -->
      <div class="notification-background"></div>

      <!-- Content -->
      <div class="notification-content">
        <!-- Images section -->
        <div class="images-container">
          <!-- Adopter image -->
          <div class="image-wrapper adopter-image">
            <img
              v-if="notification.adopterImage"
              :src="notification.adopterImage"
              :alt="notification.adopterName"
              class="profile-image"
            />
            <div v-else class="placeholder-image">👤</div>
          </div>

          <!-- Animal image -->
          <div class="image-wrapper animal-image">
            <img
              v-if="notification.animalImage"
              :src="notification.animalImage"
              :alt="notification.animalName"
              class="profile-image"
            />
            <div v-else class="placeholder-image">🐾</div>
          </div>
        </div>

        <!-- Text content -->
        <div class="text-content">
          <h2 class="match-title">C'est un match !</h2>

          <div class="match-message">
            <p class="message-intro">Félicitations !</p>
            <p class="message-body">
              Vous venez de matcher avec <strong>{{ notification.animalName }}</strong> le
              <strong>{{ notification.animalSpecies }}</strong
              >. Vous pouvez maintenant discuter avec son propriétaire
              <strong>{{ notification.ownerName }}</strong
              >.
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions-container">
          <button class="btn-primary" @click="handleStartConversation">
            Commencer la conversation
          </button>
          <button class="btn-secondary" @click="handleViewProfile">
            Voir le profil de l'animal
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.match-notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  background-color: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.match-notification-container {
  position: relative;
  width: 90%;
  max-width: 380px;
  background: var(--color-neutral-white);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--shadow-2xl);
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--color-neutral-700);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-base);
}

.close-btn:hover {
  background: var(--color-neutral-white);
  color: var(--color-neutral-900);
  transform: scale(1.05);
}

.notification-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200px;
  background: var(--color-primary-100);
  z-index: 0;
}

.notification-content {
  position: relative;
  z-index: 1;
  padding: var(--spacing-8) var(--spacing-6) var(--spacing-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
}

.images-container {
  position: relative;
  width: 100%;
  height: 200px;
  margin-bottom: var(--spacing-2);
}

.image-wrapper {
  position: absolute;
  width: 140px;
  height: 140px;
  border-radius: 10px;
  overflow: hidden;
  background: var(--color-neutral-100);
  border: 3px solid var(--color-neutral-white);
  box-shadow: var(--shadow-lg);
}

.adopter-image {
  top: 0;
  left: var(--spacing-3);
  z-index: 2;
}

.animal-image {
  top: 60px;
  right: var(--spacing-3);
  z-index: 1;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.placeholder-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.text-content {
  text-align: center;
  margin-top: var(--spacing-6);
}

.match-title {
  font-family: var(--font-family-heading, 'Comfortaa');
  font-size: 36px;
  font-weight: 700;
  line-height: 42px;
  color: var(--color-neutral-900);
  margin: 0 0 var(--spacing-2) 0;
}

.match-message {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.message-intro {
  font-family: var(--font-family-heading, 'Comfortaa');
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  color: var(--color-neutral-900);
  margin: 0;
}

.message-body {
  font-family: var(--font-family-heading, 'Comfortaa');
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  color: var(--color-neutral-900);
  margin: 0;
}

.message-body strong {
  font-weight: 700;
}

.actions-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  width: 100%;
  margin-top: var(--spacing-2);
}

.btn-primary {
  background: var(--color-primary-600);
  color: var(--color-neutral-white);
  border: none;
  border-radius: 12px;
  padding: 10px 12px;
  font-family: var(--font-family-heading, 'Comfortaa');
  font-size: 16px;
  font-weight: 400;
  line-height: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-base);
}

.btn-primary:hover {
  background: var(--color-primary-700);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-secondary {
  background: transparent;
  color: var(--color-neutral-900);
  border: none;
  border-radius: 12px;
  padding: 10px 12px;
  font-family: var(--font-family-heading, 'Comfortaa');
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  text-decoration: underline;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  color: var(--color-primary-600);
}

/* Responsive design */
@media (max-width: 480px) {
  .match-notification-container {
    width: 95%;
    max-width: none;
  }

  .match-title {
    font-size: 28px;
    line-height: 34px;
  }

  .image-wrapper {
    width: 120px;
    height: 120px;
  }

  .adopter-image {
    left: var(--spacing-2);
  }

  .animal-image {
    right: var(--spacing-2);
    top: 50px;
  }
}
</style>
