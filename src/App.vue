  <script setup>
  import { onMounted } from 'vue';
  import { useAuth } from '@/composables/useAuth';
  import { initializeWebSocketListeners, matchNotification, clearNotification } from '@/store/wsCommandStore.js';
  import Toast from './components/Toast.vue';
  import MatchNotification from './components/MatchNotification.vue';
  import '@/style.css';

  const { userType, isAuthenticated } = useAuth();

  onMounted(async () => {
    if (!isAuthenticated.value || userType.value !== 'adopter') return;

    try {
      await initializeWebSocketListeners();
      console.log('WebSocket listeners initialized for adopter');
    } catch (error) {
      console.error('Failed to initialize WebSocket listeners:', error);
    }
  });
</script>

<template>
  <Toast />
  <MatchNotification v-if="matchNotification" :notification="matchNotification" @close="clearNotification" />
  <router-view />
</template>