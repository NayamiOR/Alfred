<template>
  <div class="settings-top-bar" data-tauri-drag-region>
    <div class="title">设置</div>
    <div class="spacer"></div>
    <WindowControls />
  </div>
</template>

<script setup lang="ts">
import WindowControls from '../WindowControls.vue';
</script>

<style scoped>
.settings-top-bar {
  display: flex;
  align-items: center;
  padding: 0 16px;
  width: 100%;
}

.spacer {
  flex: 1;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}
</style>