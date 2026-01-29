<template>
  <div class="app-layout" :class="{ 'dark-mode': isDarkMode }">
    <TopBar :current-route="($route.name as string)" />
    <ShortcutBar @toggle-dark-mode="toggleDarkMode" :is-dark-mode="isDarkMode" />
    <main class="content-area">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted, watch } from "vue";
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { actions, libraryStore } from './stores/library';
import TopBar from "./components/TopBar.vue";
import ShortcutBar from "./components/ShortcutBar.vue";

const isDarkMode = ref(false);
const { locale, t } = useI18n();
const route = useRoute();

// canDrop is only true if we are in /library AND viewMode is 'library'
const canDrop = computed(() => {
  const isLibraryPath = route.path === '/library' || route.path === '/';
  const isLibraryMode = libraryStore.ui.viewMode === 'library';
  return isLibraryPath && isLibraryMode;
});

const dragMessage = computed(() => canDrop.value ? t('drag.accept') : t('drag.reject'));

// Sync drag state to store for child components to use
watch([() => canDrop.value, () => dragMessage.value], () => {
  libraryStore.ui.dragState.type = canDrop.value ? 'accept' : 'reject';
  libraryStore.ui.dragState.message = dragMessage.value;
}, { immediate: true });

let unlistenDrop: (() => void) | null = null;
let unlistenDragEnter: (() => void) | null = null;
let unlistenDragLeave: (() => void) | null = null;

onMounted(async () => {
  const savedMode = localStorage.getItem('isDarkMode');
  if (savedMode !== null) {
    isDarkMode.value = savedMode === 'true';
  }
  
  const savedLocale = localStorage.getItem('locale');
  if (savedLocale) {
    locale.value = savedLocale;
  }

  const appWindow = getCurrentWindow();
  
  unlistenDragEnter = await appWindow.listen('tauri://drag-enter', () => {
    libraryStore.ui.dragState.isDragging = true;
  });

  unlistenDragLeave = await appWindow.listen('tauri://drag-leave', () => {
    libraryStore.ui.dragState.isDragging = false;
  });

  unlistenDrop = await appWindow.listen('tauri://drag-drop', (event) => {
    libraryStore.ui.dragState.isDragging = false;
    if (canDrop.value) {
      const payload = event.payload as { paths: string[] };
      if (payload.paths && payload.paths.length > 0) {
        actions.addFiles(payload.paths);
      }
    }
  });
});

onUnmounted(() => {
  if (unlistenDrop) unlistenDrop();
  if (unlistenDragEnter) unlistenDragEnter();
  if (unlistenDragLeave) unlistenDragLeave();
});

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('isDarkMode', String(isDarkMode.value));
}

defineExpose({ locale });
</script>

<style>
:root {
  --bg-primary: #f8f9fa;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f3f4f6;
  --bg-quaternary: #fafafa;
  --text-primary: #212529;
  --text-secondary: #374151;
  --border-color: #e5e7eb;
  --hover-color: #e5e7eb;
}

.dark-mode {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-tertiary: #242424;
  --bg-quaternary: #333333;
  --text-primary: #e5e5e5;
  --text-secondary: #d1d5db;
  --border-color: #404040;
  --hover-color: #404040;
}

body,
#app {
  margin: 0;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
  user-select: none;
  -webkit-user-select: none;
}

img {
  -webkit-user-drag: none;
}

input, textarea {
  user-select: text;
  -webkit-user-select: text;
}


img {
  -webkit-user-drag: none;
}

input, textarea {
  user-select: text;
  -webkit-user-select: text;
}
</style>

<style scoped>
.app-layout {
  display: grid;
  height: 100vh;
  grid-template-rows: 60px 1fr;
  grid-template-columns: 60px 1fr;
  grid-template-areas:
    "topbar topbar"
    "shortcut content-area";
}

.content-area {
  grid-area: content-area;
  overflow: hidden;
  background-color: var(--bg-primary);
  position: relative;
}
</style>
