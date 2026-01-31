<template>
  <div class="notification-container">
    <TransitionGroup name="toast">
      <NotificationToast 
        v-for="notification in notificationStore.notifications" 
        :key="notification.id"
        :notification="notification"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { notificationStore } from '../stores/notification';
import NotificationToast from './NotificationToast.vue';
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none; /* Allow clicks to pass through container */
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
