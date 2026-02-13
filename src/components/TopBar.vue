<template>
  <header class="top-bar" data-tauri-drag-region>
    <div class="top-bar-content">
      <component :is="topBarComponent" />
    </div>
    <WindowControls />
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import LibraryTopBar from './topbars/LibraryTopBar.vue';
import SettingsTopBar from './topbars/SettingsTopBar.vue';
import TagsTopBar from './topbars/TagsTopBar.vue';
import WindowControls from './WindowControls.vue';

const props = defineProps<{ currentRoute: string }>();

const topBarComponent = computed(() => {
  if (props.currentRoute === 'Library') return LibraryTopBar;
  else if (props.currentRoute === 'Tags') return TagsTopBar;
  else if (props.currentRoute === 'Settings') return SettingsTopBar;
  else console.log("Invalid Route")
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
  padding-right: 16px;
}

.top-bar-content {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: center;
  overflow: hidden;
  margin-right: 12px;
}
</style>