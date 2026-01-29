<template>
  <div class="library-top-bar" data-tauri-drag-region>
    <button @click="toggleSidebar" class="toggle-button" title="Toggle Sidebar" data-tauri-drag-region="false">
      <span>&#x2194;</span>
    </button>
    
    <!-- Left Toolbar (Search & Scale) -->
    <div class="toolbar-section" data-tauri-drag-region="false">
      <div class="search-bar">
        <span class="search-icon">&#128269;</span>
        <input 
          v-model="libraryStore.ui.searchQuery" 
          placeholder="Search files..." 
          class="search-input"
        />
      </div>

      <div class="scale-control" v-if="libraryStore.ui.isGridView">
        <input 
          type="range" 
          v-model.number="libraryStore.ui.cardScale" 
          min="0.5" 
          max="2" 
          step="0.1"
          class="scale-slider"
          title="Card Size"
        />
      </div>

      <button class="add-btn" @click="triggerAddFile" title="Add Files">
        <span>+</span>
      </button>
    </div>

    <div class="spacer"></div>

    <!-- Right Toolbar (View & Filter) -->
    <div class="toolbar-section right" data-tauri-drag-region="false">
      <select v-model="libraryStore.ui.isGridView" class="view-selector">
        <option :value="true">Card View</option>
        <option :value="false">List View</option>
      </select>
      
      <button 
        @click="libraryStore.ui.showFilterPanel = !libraryStore.ui.showFilterPanel" 
        class="filter-button" 
        :class="{ active: libraryStore.ui.showFilterPanel }"
      >
        <span>☰</span>
      </button>
    </div>

    <WindowControls />
  </div>
</template>

<script setup lang="ts">
import WindowControls from '../WindowControls.vue';
import { libraryStore, actions } from '../../stores/library';
import { open } from '@tauri-apps/plugin-dialog';

function toggleSidebar() {
  window.dispatchEvent(new CustomEvent('toggle-sidebar'));
}

async function triggerAddFile() {
  try {
    const selected = await open({
      multiple: true,
      directory: true, 
    });
    
    if (selected) {
      const paths = Array.isArray(selected) ? selected : [selected];
      await actions.addFiles(paths);
    }
  } catch (err) {
    console.error("Failed to open file dialog:", err);
  }
}
</script>

<style scoped>
.library-top-bar {
  display: flex;
  align-items: center;
  padding: 0 16px;
  width: 100%;
  gap: 12px;
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

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-section.right {
  margin-right: 12px;
}

/* Copied & Adapted Styles from FileLibrary */
.search-bar {
  display: flex;
  align-items: center;
  width: 240px;
  height: 32px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0 12px;
  background-color: var(--bg-primary);
}

.search-bar:focus-within {
  border-color: var(--text-secondary);
}

.search-icon {
  color: var(--text-secondary);
  font-size: 14px;
  margin-right: 8px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: none;
  font-size: 14px;
  color: var(--text-primary);
  min-width: 0;
}

.scale-control {
  display: flex;
  align-items: center;
  width: 80px;
}

.scale-slider {
  width: 100%;
  cursor: pointer;
  height: 4px;
  -webkit-appearance: none;
  background: var(--border-color);
  border-radius: 2px;
  outline: none;
}

.scale-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--text-secondary);
  cursor: pointer;
  transition: background 0.2s;
}

.scale-slider::-webkit-slider-thumb:hover {
  background: var(--text-primary);
}

.add-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--text-secondary);
}

.add-btn:hover {
  background: var(--hover-color);
  color: var(--text-primary);
}

.view-selector {
  height: 32px;
  padding: 4px 32px 4px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.filter-button {
  height: 32px;
  width: 32px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-button:hover, .filter-button.active {
  background-color: var(--hover-color);
}
</style>
