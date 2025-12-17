  <script setup>
  import { onMounted, onUnmounted, ref, computed } from 'vue';
  import { useRoute } from 'vue-router';
  import { isAuth, ws, users, allMsg } from '@/store/app.js';
  import { connectToChat } from '@/store/app.js';
import Button from './components/Button.vue';
import Toast from './components/Toast.vue';
import './style.css';

const route = useRoute();
const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/register';
});
const isFullBleed = computed(() => {
  return route.meta?.fullBleed === true;
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
  <div :class="{ 'app-content': !isAuthPage && !isFullBleed }">
    <router-view />
  </div>
</template>

<style scoped>
.app-content {
  padding: 0 var(--spacing-7);
}
</style>