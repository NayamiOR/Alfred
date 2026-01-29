<template>
  <nav class="shortcut-bar">

    <div class="top-icons">
      <router-link 
        to="/library" 
        class="icon-button" 
        title="Resource Library" 
        @click="switchToLibraryMode"
        :class="{ active: libraryStore.ui.viewMode === 'library' && route.path === '/library' }"
      >
        <span>&#128193;</span>
      </router-link>
      <router-link 
        to="/library" 
        class="icon-button" 
        title="Tags View" 
        @click="switchToTagMode"
        :class="{ active: libraryStore.ui.viewMode === 'tag' && route.path === '/library' }"
      >
        <span>#</span>
      </router-link>
    </div>

    <div class="bottom-icons">
      <button 
        @click="$emit('toggle-dark-mode')" 
        class="icon-button" 
        :title="isDarkMode ? 'Light Mode' : 'Dark Mode'"
      >
        <span v-if="isDarkMode">&#x2600;</span>
        <span v-else>&#x263E;</span>
      </button>
      
      <router-link to="/settings" class="icon-button" title="Settings">
        <span>&#x2699;</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { libraryStore, actions } from '../stores/library';

defineProps<{ isDarkMode: boolean }>();
defineEmits(['toggle-dark-mode']);

const route = useRoute();

function switchToLibraryMode() {
  libraryStore.ui.viewMode = 'library';
  if (libraryStore.currentLibraryId) {
    actions.loadFiles(libraryStore.currentLibraryId);
  }
}

function switchToTagMode() {
  libraryStore.ui.viewMode = 'tag';
  actions.loadAllFiles();
}
</script>

<style scoped>
.shortcut-bar {
  grid-area: shortcut;
  background-color: var(--bg-tertiary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.icon-button {
  background: none; border: none; cursor: pointer; padding: 10px; margin: 5px 0;
  font-size: 18px; color: var(--text-secondary); text-decoration: none; display: flex;
  justify-content: center; align-items: center; width: 40px; height: 40px; border-radius: 8px;
  transition: color 0.3s ease, background-color 0.3s ease;
}

.icon-button.active {
  color: var(--text-primary);
  background-color: var(--bg-secondary);
  border-left: 3px solid var(--text-primary);
  border-radius: 4px;
}

.icon-button:hover { 
  background-color: var(--hover-color); 
}

.top-icons, .bottom-icons {
  display: flex; flex-direction: column; align-items: center;
}

.bottom-icons {
  margin-bottom: 5px;
}
</style>
