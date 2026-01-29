<template>
  <transition name="fade">
    <div v-if="visible" class="drag-overlay" :class="type">
      <div class="overlay-content">
        <div class="message">{{ message }}</div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  message: string;
  type: 'accept' | 'reject';
}>();
</script>

<style scoped>
.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  padding: 20px;
}

.overlay-content {
  width: 100%;
  height: 100%;
  border: 3px dashed transparent;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.drag-overlay.accept .overlay-content {
  background-color: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.6);
}

.drag-overlay.reject .overlay-content {
  background-color: rgba(107, 114, 128, 0.15);
  border-color: rgba(107, 114, 128, 0.6);
}

.message {
  font-size: 28px;
  font-weight: 700;
  text-align: center;
  padding: 20px;
  color: rgba(55, 65, 81, 0.7);
  user-select: none;
}

.dark-mode .message {
  color: rgba(243, 244, 246, 0.6);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
