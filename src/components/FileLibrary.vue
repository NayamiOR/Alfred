<template>
  <div class="file-library">
    <div class="toolbar">
      <div class="toolbar-left">
        <div class="search-bar">
          <span class="search-icon">&#128269;</span>
          <input 
            v-model="searchQuery" 
            placeholder="Search files..." 
            class="search-input"
          />
        </div>
      </div>

      <div class="toolbar-right">
        <select v-model="isGridView" class="view-selector">
          <option :value="true">Card View</option>
          <option :value="false">List View</option>
        </select>
        <button @click="toggleFilterPanel" class="filter-button" :class="{ active: showFilterPanel }">
          <span>☰</span>
        </button>
      </div>
    </div>

    <div v-if="showFilterPanel" class="filter-backdrop" @click="showFilterPanel = false"></div>

    <div v-if="showFilterPanel" class="filter-panel">
      <div class="filter-header">
        <h3>Filters</h3>
        <button @click="showFilterPanel = false" class="close-button">&times;</button>
      </div>
      <div class="filter-content">
        <div class="filter-section">
          <h4>File Type</h4>
          <label v-for="type in uniqueFileTypes" :key="type" class="filter-checkbox">
            <input type="checkbox" :value="type" v-model="filters.fileTypes" />
            {{ type.toUpperCase() }}
          </label>
        </div>
      </div>
      <div class="filter-footer">
        <button @click="clearFilters" class="clear-btn">Clear</button>
<!--        <button @click="applyFilters" class="apply-btn">Apply</button>-->
      </div>
    </div>

    <div :class="['file-container', { 'grid-view': isGridView, 'list-view': !isGridView }]">
      <div
        v-for="file in filteredFiles"
        :key="file.id"
        :class="['file-item', { 'grid-item': isGridView, 'list-item': !isGridView }]"
      >
        <div :class="['file-cover', { 'grid-cover': isGridView, 'list-cover': !isGridView }]">
          <div class="cover-placeholder">{{ file.type.toUpperCase() }}</div>
        </div>
        <div class="file-name">{{ file.name }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const isGridView = ref(true);
const searchQuery = ref('');
const showFilterPanel = ref(false);

interface FileItem {
  id: number;
  name: string;
  type: string;
}

const files: FileItem[] = [
  { id: 1, name: 'Project Report.pdf', type: 'pdf' },
  { id: 2, name: 'Meeting Notes.docx', type: 'docx' },
  { id: 3, name: 'Presentation.pptx', type: 'pptx' },
  { id: 4, name: 'Budget Sheet.xlsx', type: 'xlsx' },
  { id: 5, name: 'Design Mockups.fig', type: 'fig' },
  { id: 6, name: 'Source Code.zip', type: 'zip' },
  { id: 7, name: 'Documentation.md', type: 'md' },
  { id: 8, name: 'Video Demo.mp4', type: 'mp4' },
  { id: 9, name: 'Audio Recording.wav', type: 'wav' },
  { id: 10, name: 'Image Gallery.jpg', type: 'jpg' },
  { id: 11, name: 'Database Backup.sql', type: 'sql' },
  { id: 12, name: 'Configuration.json', type: 'json' },
  { id: 13, name: 'Project Report V2.pdf', type: 'pdf' },
  { id: 14, name: 'Meeting Notes V2.docx', type: 'docx' },
  { id: 15, name: 'Presentation Final.pptx', type: 'pptx' },
  { id: 16, name: 'Budget Sheet Q2.xlsx', type: 'xlsx' },
  { id: 17, name: 'New Mockups.fig', type: 'fig' },
  { id: 18, name: 'Archive.zip', type: 'zip' },
  { id: 19, name: 'Readme.md', type: 'md' },
  { id: 20, name: 'Intro.mp4', type: 'mp4' },
];

const filters = ref({
  fileTypes: [] as string[],
});

const uniqueFileTypes = computed(() => {
  return [...new Set(files.map(f => f.type))];
});

const filteredFiles = computed(() => {
  let result = files;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(file => 
      file.name.toLowerCase().includes(query) || 
      file.type.toLowerCase().includes(query)
    );
  }

  if (filters.value.fileTypes.length > 0) {
    result = result.filter(file => 
      filters.value.fileTypes.includes(file.type)
    );
  }

  return result;
});

function toggleFilterPanel() {
  showFilterPanel.value = !showFilterPanel.value;
}

function clearFilters() {
  filters.value.fileTypes = [];
}
</script>

<style scoped>
.file-library {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.toolbar-left {
  flex: 1;
}

.search-bar {
  display: flex;
  align-items: center;
  width: 300px;
  height: 32px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0 12px;
  background-color: var(--bg-primary);
  transition: border-color 0.2s ease;
}

.search-bar:focus-within {
  border-color: var(--text-secondary);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
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
}

.search-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
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
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  transition: border-color 0.2s ease;
}

.view-selector:hover {
  border-color: var(--text-secondary);
}

.view-selector:focus {
  outline: none;
  border-color: var(--text-secondary);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.filter-button {
  height: 32px;
  width: 32px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: var(--bg-primary);
  color: var(--text-secondary);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.filter-button:hover {
  border-color: var(--text-secondary);
  background-color: var(--hover-color);
}

.filter-button.active {
  background-color: var(--hover-color);
  border-color: var(--text-secondary);
}

.filter-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 99;
}

.filter-panel {
  position: absolute;
  top: 56px;
  right: 16px;
  width: 320px;
  max-height: 400px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.filter-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.close-button:hover {
  background-color: var(--hover-color);
}

.filter-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.filter-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.filter-checkbox {
  display: flex;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary);
}

.filter-checkbox input {
  margin-right: 8px;
  cursor: pointer;
}

.filter-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.clear-btn,
.apply-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-btn {
  background: none;
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.clear-btn:hover {
  background-color: var(--hover-color);
}

.apply-btn {
  background-color: var(--text-primary);
  border: 1px solid var(--text-primary);
  color: var(--bg-primary);
}

.apply-btn:hover {
  opacity: 0.9;
}

.file-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  transition: all 0.3s ease;
  min-height: 0;
}

.file-container.grid-view {
  display: flex;
  flex-wrap: wrap;
  gap: 20px 20px;
  justify-content: flex-start;
  align-content: flex-start;
}

.file-container.list-view {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
}

.file-item {
  transition: all 0.2s ease;
  cursor: pointer;
  overflow: hidden;
}

.grid-item {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  width: 200px;
  height: 180px;
  flex-shrink: 0;
}

.grid-item:hover {
  border-color: var(--text-secondary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.list-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  height: 48px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  width: 100%;
  border-radius: 0;
  flex-shrink: 0;
}

.list-item:hover {
  background-color: var(--hover-color);
}

.file-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-quaternary));
  transition: all 0.3s ease;
}

.grid-cover {
  width: 100%;
  height: 112px;
}

.list-cover {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  margin-right: 12px;
  flex-shrink: 0;
}

.cover-placeholder {
  color: var(--text-secondary);
  font-weight: 600;
}

.grid-cover .cover-placeholder {
  font-size: 24px;
}

.list-cover .cover-placeholder {
  font-size: 10px;
}

.file-name {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-item .file-name {
  padding: 12px;
  text-align: center;
}

.list-item .file-name {
  padding: 0;
  text-align: left;
  flex: 1;
}
</style>