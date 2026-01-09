  <script setup>
  import { ref, computed, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import { isAuth, ws, users, allMsg } from '@/store/app.js';
  import { connectToChat } from '@/store/app.js';
  import { matchNotification, initializeWebSocketListeners, clearNotification } from '@/store/wsCommandStore.js';
import Button from './components/Button.vue';
import { onMounted } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { initializeWebSocketListeners, matchNotification, clearNotification } from '@/store/wsCommandStore.js';
import Toast from './components/Toast.vue';
import MatchNotification from './components/MatchNotification.vue';
import '@/style.css';

const route = useRoute();
const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/register';
});
const isFullBleed = computed(() => {
  return route.meta?.fullBleed === true;
});

// Watch for user login/logout - initialize WebSocket listeners when adopter logs in
watch(
  () => localStorage.getItem('user_type'),
  async (newUserType) => {
    if (newUserType === 'adopter') {
      console.log('[App] User logged in as adopter, initializing WebSocket listeners...');
      try {
        await initializeWebSocketListeners();
        console.log('[App] ✓ WebSocket listeners initialized for adopter');
      } catch (error) {
        console.error('[App] ✗ Failed to initialize WebSocket listeners:', error);
      }
    } else {
      console.log('[App] User logged out or is not an adopter');
    }
  },
  { immediate: true }
);

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
  <MatchNotification 
    v-if="matchNotification" 
    :notification="matchNotification" 
    @close="clearNotification"
  />
    <router-view />
</template>