<template>
  <header class="top-bar" data-tauri-drag-region>
    <component :is="topBarComponent" />
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import LibraryTopBar from './topbars/LibraryTopBar.vue';
import SettingsTopBar from './topbars/SettingsTopBar.vue';

const props = defineProps<{ currentRoute: string }>();

const topBarComponent = computed(() => {
  if (props.currentRoute === 'Library') return LibraryTopBar;
  if (props.currentRoute === 'Settings') return SettingsTopBar;
  return null;
});
</script>

<style scoped>
.top-bar {
  grid-area: topbar;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.3s ease, border-color 0.3s ease;
  display: flex;
  align-items: center;
  height: 100%;
}
</style>