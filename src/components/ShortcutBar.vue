<template>
  <nav class="shortcut-bar">

    <div class="top-icons">
      <router-link 
        to="/library" 
        class="icon-button" 
        :title="t('shortcutBar.resourceLibrary')" 
        @click="switchToLibraryMode"
        :class="{ active: libraryStore.ui.viewMode === 'library' && route.path === '/library' }"
      >
        <v-icon name="px-archive" scale="1.2" />
      </router-link>
      <router-link 
        to="/library" 
        class="icon-button" 
        :title="t('shortcutBar.tagsView')" 
        @click="switchToTagMode"
        :class="{ active: libraryStore.ui.viewMode === 'tag' && route.path === '/library' }"
      >
        <v-icon name="co-tags" scale="1.2" />
      </router-link>
    </div>

    <div class="bottom-icons">
      <button 
        @click="$emit('toggle-dark-mode')" 
        class="icon-button" 
        :title="isDarkMode ? t('shortcutBar.lightMode') : t('shortcutBar.darkMode')"
      >
        <v-icon v-if="isDarkMode" name="co-sun" scale="1.2" />
        <v-icon v-else name="co-moon" scale="1.2" />
      </button>
      
      <router-link to="/settings" class="icon-button" :title="t('shortcutBar.settings')">
        <v-icon name="co-settings" scale="1.2" />
      </router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { libraryStore, actions } from '../stores/library';


const { t } = useI18n();
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
