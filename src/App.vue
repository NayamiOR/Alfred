<template>
  <div 
    class="app-layout" 
    :class="{ 'dark-mode': isDarkMode }"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <TopBar :current-route="($route.name || 'Library') as string" />
    <ShortcutBar @toggle-dark-mode="toggleDarkMode" :is-dark-mode="isDarkMode" />
    <main class="content-area">
      <router-view />
    </main>
    <NotificationContainer />
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
import NotificationContainer from "./components/NotificationContainer.vue";

const isDarkMode = ref(false);
const { locale, t } = useI18n();
const route = useRoute();

// canDrop is true if we are in the library view (root or /library)
const canDrop = computed(() => {
  return route.path === '/library' || route.path === '/';
});

const dragMessage = computed(() => canDrop.value ? t('drag.accept') : t('drag.reject'));

// Sync drag state to store for child components to use
watch([() => canDrop.value, () => dragMessage.value], () => {
  libraryStore.ui.dragState.type = canDrop.value ? 'accept' : 'reject';
  libraryStore.ui.dragState.message = dragMessage.value;
}, { immediate: true });

// We keep native listeners ONLY for UI overlay feedback (dragCounter)
let dragCounter = 0;

function handleDragEnter(e: DragEvent) {
  if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
    dragCounter++;
    if (dragCounter === 1) {
      libraryStore.ui.dragState.isDragging = true;
    }
  }
}

function handleDragOver(e: DragEvent) {
  // Prevent default to allow drop (though we handle actual data via Tauri event)
  if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
    e.dataTransfer.dropEffect = 'copy';
  }
}

function handleDragLeave(e: DragEvent) {
  if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      libraryStore.ui.dragState.isDragging = false;
    }
  }
}

function handleDrop(_e: DragEvent) {
  // Reset UI state
  dragCounter = 0;
  libraryStore.ui.dragState.isDragging = false;
  // We do NOT process files here because path is undefined in WebView
}

let processingFiles = new Set<string>();
let unlistenDrop: (() => void) | null = null;

onMounted(async () => {
  const savedMode = localStorage.getItem('isDarkMode');
  if (savedMode !== null) {
    isDarkMode.value = savedMode === 'true';
  }

  const savedLocale = localStorage.getItem('locale');
  if (savedLocale) {
    locale.value = savedLocale;
  }

  loadGlobalScale();

  // Listen for custom Tauri event that carries file paths
  const appWindow = getCurrentWindow();
  unlistenDrop = await appWindow.listen('tauri://drag-drop', (event) => {
    // Reset UI state just in case
    dragCounter = 0;
    libraryStore.ui.dragState.isDragging = false;

    if (canDrop.value) {
      const payload = event.payload as { paths: string[] };
        if (payload.paths && payload.paths.length > 0) {
          const newPaths = payload.paths.filter(path => !processingFiles.has(path));
          if (newPaths.length > 0) {
            newPaths.forEach(path => processingFiles.add(path));

            actions.addFiles(newPaths).then(() => {
              setTimeout(() => {
                newPaths.forEach(path => processingFiles.delete(path));
              }, 1000);
            });
          }
        }
    }
  });

  window.addEventListener('keydown', handleGlobalScale);
});

onUnmounted(() => {
  processingFiles.clear();
  if (unlistenDrop) unlistenDrop();
  window.removeEventListener('keydown', handleGlobalScale);
});

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('isDarkMode', String(isDarkMode.value));
}

function handleGlobalScale(e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === '=' || e.key === '+') {
      e.preventDefault();
      adjustScale(0.1);
    } else if (e.key === '-') {
      e.preventDefault();
      adjustScale(-0.1);
    } else if (e.key === '0') {
      e.preventDefault();
      libraryStore.ui.globalScale = 1.0;
      saveGlobalScale();
    }
  }
}

function adjustScale(delta: number) {
  const newScale = Math.max(0.8, Math.min(1.3, libraryStore.ui.globalScale + delta));
  libraryStore.ui.globalScale = parseFloat(newScale.toFixed(1));
  saveGlobalScale();
}

function saveGlobalScale() {
  localStorage.setItem('globalScale', String(libraryStore.ui.globalScale));
}

function loadGlobalScale() {
  const saved = localStorage.getItem('globalScale');
  if (saved) {
    libraryStore.ui.globalScale = parseFloat(saved);
  }
}

watch(() => libraryStore.ui.globalScale, (newScale) => {
  const appLayout = document.querySelector('.app-layout') as HTMLElement;
  if (appLayout) {
    appLayout.style.transform = `scale(${newScale})`;
    appLayout.style.width = `${100 / newScale}vw`;
    appLayout.style.height = `${100 / newScale}vh`;
  }
}, { immediate: true });

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

/* Scrollbar - Webkit (Chrome, Edge, Safari) */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

::-webkit-scrollbar-corner {
  background: transparent;
}

/* Scrollbar - Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--border-color) transparent;
}
</style>

<style scoped>
.app-layout {
  display: grid;
  height: 100vh;
  width: 100vw;
  grid-template-rows: 60px 1fr;
  grid-template-columns: 60px 1fr;
  grid-template-areas:
    "topbar topbar"
    "shortcut content-area";
  transform-origin: top left;
  transition: transform 0.2s ease;
}

.content-area {
  grid-area: content-area;
  overflow: hidden;
  background-color: var(--bg-primary);
  position: relative;
}
</style>
