  <script setup>
  import { onMounted, onUnmounted, ref, computed } from 'vue';
  import { useRoute } from 'vue-router';
  import { useAuth } from '@/composables/useAuth';
  import { isAuth, ws, users, allMsg } from '@/store/app.js';
  import { connectToChat } from '@/store/app.js';
  import { matchNotification, initializeWebSocketListeners, clearNotification } from '@/store/wsCommandStore.js';
import Button from './components/Button.vue';
import Toast from './components/Toast.vue';
import MatchNotification from './components/MatchNotification.vue';
import './style.css';

const route = useRoute();
const { userType, isAuthenticated } = useAuth();
const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/register';
});
const isFullBleed = computed(() => {
  return route.meta?.fullBleed === true;
});

// Initialize WebSocket listeners on mount
onMounted(async () => {
  if (isAuthenticated.value && userType.value === 'adopter') {
    try {
      await initializeWebSocketListeners();
      console.log('WebSocket listeners initialized for adopter');
    } catch (error) {
      console.error('Failed to initialize WebSocket listeners:', error);
    }
  }
});

  // ws.on('close', () => {
  //   if (isAuth.value) {
  //     $q.notify({
  //       type: 'negative',
  //       message: 'Connection to server lost',
  //       timeout: 2000,
  //       position: 'top',
  //     });
  //   }
  //   isAuth.value = false;
  //   users.value = [];
  //   allMsg.value = [];
  // });

  // // Reconnect when tab becomes visible again
  // function handleVisibilityChange() {
  //   if (document.visibilityState != 'visible' || isAuth.value) return;
  //   connectToChat().catch(() => {});
  // }

  // // Lifecycle hooks
  // onMounted(() => {
  //   document.addEventListener('visibilitychange', handleVisibilityChange);
  //   connectToChat().catch(() => {});
  // });

  // // Cleanup
  // onUnmounted(() => {
  //   document.removeEventListener('visibilitychange', handleVisibilityChange);
  // });
</script>

<template>
  <Toast />
  <MatchNotification 
    v-if="matchNotification" 
    :notification="matchNotification" 
    @close="clearNotification"
  />
    <router-view />
</template>

<style scoped>

</style>