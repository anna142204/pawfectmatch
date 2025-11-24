<script setup>
  import { onMounted, onUnmounted, ref } from 'vue';
  import { isAuth, ws, users, allMsg } from '@/store/app.js';
  import { connectToChat } from '@/store/app.js';
import Button from './components/Button.vue';
import './style.css';
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
  <router-view />
</template>

<style scoped>
  
</style>