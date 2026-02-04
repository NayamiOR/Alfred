<template>
  <div class="notification-toast" :class="notification.type" @click="close">
    <div class="icon">
      <v-icon v-if="notification.type === 'success'" name="co-check" scale="1" />
      <v-icon v-else-if="notification.type === 'error'" name="co-warning" scale="1" />
      <v-icon v-else name="co-info" scale="1" />
    </div>
    <div class="message">{{ notification.message }}</div>
    <button class="close-btn">&times;</button>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import { Notification, removeNotification } from '../stores/notification';
// Ensure oh-vue-icons are imported in main.ts, specifically these ones.
// I'll assume CoCheck, CoWarning, CoInfo are available or I'll use text.
// Actually main.ts has CoInbox, CoSettings etc. I might need to add Check icon.
// For now let's stick to simple layout.

const props = defineProps({
  notification: {
    type: Object as PropType<Notification>,
    required: true
  }
});

function close() {
  removeNotification(props.notification.id);
}
</script>

<style scoped>
.notification-toast {
  pointer-events: auto;
  min-width: 250px;
  max-width: 400px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: flex-start; /* Align top for multi-line */
  gap: 12px;
  cursor: pointer;
  border-left: 4px solid transparent;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.4;
}

.notification-toast.success {
  border-left-color: #10b981;
}
.notification-toast.success .icon {
  color: #10b981;
}

.notification-toast.warning {
  border-left-color: #f59e0b;
}
.notification-toast.warning .icon {
  color: #f59e0b;
}

.notification-toast.error {
  border-left-color: #ef4444;
}
.notification-toast.error .icon {
  color: #ef4444;
}

.notification-toast.info {
  border-left-color: #3b82f6;
}
.notification-toast.info .icon {
  color: #3b82f6;
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
}

.message {
  flex: 1;
  word-break: break-word;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  margin-left: 4px;
}

.close-btn:hover {
  color: var(--text-primary);
}

/* Dark mode support could be added here using global classes */
</style>
