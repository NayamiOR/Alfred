<template>
  <div class="library-top-bar" data-tauri-drag-region>
    <button @click="toggleSidebar" class="toggle-button" title="Toggle Sidebar" data-tauri-drag-region="false">
      <span>&#x2194;</span>
    </button>
    <div class="spacer"></div>
    <WindowControls />
  </div>
</template>

<script setup lang="ts">
import WindowControls from '../WindowControls.vue';

function toggleSidebar() {
  window.dispatchEvent(new CustomEvent('toggle-sidebar'));
}
</script>

<style scoped>
.library-top-bar {
  display: flex;
  align-items: center;
  padding: 0 16px;
  width: 100%;
}

.spacer {
  flex: 1;
}

.toggle-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  margin: 0;
  font-size: 18px;
  color: var(--text-secondary);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  transition: color 0.3s ease, background-color 0.3s ease;
}

.toggle-button:hover {
  background-color: var(--hover-color);
}
</style>