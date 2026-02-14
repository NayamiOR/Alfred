<template>
  <div class="window-controls" data-tauri-drag-region="false">
    <button @click="minimize" class="control-btn minimize" :title="t('common.minimize')">
      <span>&#8722;</span>
    </button>
    <button @click="toggleMaximize" class="control-btn maximize"
            :title="isMaximized ? t('common.restore') : t('common.maximize')">
      <span v-if="isMaximized">&#9723;</span>
      <span v-else>&#9723;</span>
    </button>
    <button @click="close" class="control-btn close" :title="t('common.close')">
      <span>&#10005;</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, onUnmounted} from 'vue';
import {useI18n} from 'vue-i18n';
import {getCurrentWindow} from '@tauri-apps/api/window';

const {t} = useI18n();
const appWindow = getCurrentWindow();
const isMaximized = ref(false);
let unlisten: (() => void) | null = null;

async function minimize() {
  try {
    await appWindow.minimize();
  } catch (error) {
    console.error('Failed to minimize:', error);
  }
}

async function toggleMaximize() {
  try {
    await appWindow.toggleMaximize();
    // State will be updated by the resize listener
  } catch (error) {
    console.error('Failed to toggle maximize:', error);
  }
}

async function close() {
  try {
    await appWindow.close();
  } catch (error) {
    console.error('Failed to close:', error);
  }
}

onMounted(async () => {
  try {
    isMaximized.value = await appWindow.isMaximized();

    // Listen for resize events to update maximized state
    unlisten = await appWindow.listen('tauri://resize', async () => {
      isMaximized.value = await appWindow.isMaximized();
    });
  } catch (error) {
    console.error('Failed to get window state:', error);
  }
});

onUnmounted(() => {
  if (unlisten) {
    unlisten();
  }
});
</script>

<style scoped>
.window-controls {
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 4px;
}

.control-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: var(--text-secondary);
  border-radius: 4px;
  transition: all 0.2s ease;
  -webkit-app-region: no-drag;
}

.control-btn:hover {
  background-color: var(--hover-color);
}

.control-btn.close:hover {
  background-color: #e81123;
  color: white;
}

.control-btn span {
  line-height: 1;
}
</style>