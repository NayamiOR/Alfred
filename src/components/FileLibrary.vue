<template>
    <div 
      class="file-library" 
      @dragover.prevent="onDragOver"
      @dragleave.prevent="isDragging = false"
    >
      <!-- Drag Overlay -->
    <div v-if="isDragging" class="drag-overlay">
      <div class="drag-message">Drop files here to add</div>
    </div>

    <div class="toolbar" @click.stop>
      <div class="toolbar-left">
        <div class="toolbar-actions">
          <button class="add-btn" @click="triggerAddFile" title="Add Files">
            <span>+</span>
          </button>
        </div>
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

    <div v-if="showFilterPanel" class="filter-panel" @click.stop>
      <!-- Filter Panel Content -->
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
      </div>
    </div>

    <div 
      :class="['file-container', { 'grid-view': isGridView, 'list-view': !isGridView }]"
      @mousedown="startSelection"
      ref="fileContainerRef"
    >
      <!-- Selection Rectangle -->
      <div 
        v-if="isSelecting" 
        class="selection-rect"
        :style="selectionRectStyle"
      ></div>

      <div v-if="libraryStore.libraries.length === 0" class="empty-state">
        No libraries created.<br>
        Create a library in the sidebar to get started.
      </div>
      <div v-else-if="filteredFiles.length === 0" class="empty-state">
        No files in this library. <br>
        Drag files here or click + to add.
      </div>

      <div
        v-for="(file, index) in filteredFiles"
        :key="file.id"
        :class="['file-item', { 'grid-item': isGridView, 'list-item': !isGridView, 'selected': selectedFileIds.has(file.id) }]"
        @click.stop="selectFile(file, index, $event)"
        @dblclick.stop="openFile(file)"
        @contextmenu.prevent.stop="showContextMenu($event, file)"
        @keydown.space.prevent="openPreview(file)"
        @keydown.delete.prevent="deleteSelectedFiles"
        tabindex="0"
        @keydown.ctrl.a.prevent="selectAll"
        ref="fileItemRefs"
      >
        <div :class="['file-cover', { 'grid-cover': isGridView, 'list-cover': !isGridView }]">
          <div v-if="file.extension === 'folder'" class="folder-icon">📁</div>
          <img 
            v-else-if="file.mime_type.startsWith('image/')" 
            :src="convertFileSrc(file.path)" 
            class="thumbnail-img" 
            loading="lazy"
          />
          <div v-else class="cover-placeholder">{{ file.extension.toUpperCase() }}</div>
        </div>
        <div class="file-name" :title="file.name">{{ file.name }}</div>
      </div>
    </div>

    <!-- Context Menu -->
    <ContextMenu 
      :visible="contextMenu.visible" 
      :position="contextMenu.position" 
      :items="contextMenu.items"
      @close="contextMenu.visible = false"
      @action="handleMenuAction"
    />

    <!-- Preview Modal -->
    <PreviewModal 
      :visible="preview.visible"
      :file-path="preview.file?.path"
      :file-name="preview.file?.name"
      :file-type="preview.file?.extension"
      :mime-type="preview.file?.mime_type"
      @close="preview.visible = false"
      @open="openFile(preview.file)"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import { libraryStore, currentFiles, actions, FileItem } from '../stores/library';
import ContextMenu from './ContextMenu.vue';
import PreviewModal from './PreviewModal.vue';
import { open } from '@tauri-apps/plugin-dialog';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { convertFileSrc } from '@tauri-apps/api/core';

const isGridView = ref(true);
const searchQuery = ref('');
const showFilterPanel = ref(false);
const isDragging = ref(false);
const selectedFileIds = ref<Set<string>>(new Set());
const lastSelectedId = ref<string | null>(null);

// Selection Rectangle Logic
const isSelecting = ref(false);
const selectionStart = ref({ x: 0, y: 0 });
const selectionCurrent = ref({ x: 0, y: 0 });
const fileContainerRef = ref<HTMLElement | null>(null);
const fileItemRefs = ref<HTMLElement[]>([]); // Will be auto-populated by v-for ref

const selectionRectStyle = computed(() => {
  const left = Math.min(selectionStart.value.x, selectionCurrent.value.x);
  const top = Math.min(selectionStart.value.y, selectionCurrent.value.y);
  const width = Math.abs(selectionCurrent.value.x - selectionStart.value.x);
  const height = Math.abs(selectionCurrent.value.y - selectionStart.value.y);
  return {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`
  };
});

function startSelection(e: MouseEvent) {
  // Ignore if clicking on a file item or scrollbar
  const target = e.target as HTMLElement;
  if (target.closest('.file-item') || target === fileContainerRef.value && e.offsetX > target.clientWidth) return;
  
  // Also ignore right click
  if (e.button !== 0) return;

  // Clear selection immediately if not dragging or adding to selection
  if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
    clearSelection();
  }

  isSelecting.value = false; // Wait for drag threshold
  
  // Calculate relative position within container
  const containerRect = fileContainerRef.value!.getBoundingClientRect();
  const scrollTop = fileContainerRef.value!.scrollTop;
  const scrollLeft = fileContainerRef.value!.scrollLeft;

  const startX = e.clientX - containerRect.left + scrollLeft;
  const startY = e.clientY - containerRect.top + scrollTop;

  selectionStart.value = { x: startX, y: startY };
  selectionCurrent.value = { x: startX, y: startY };

  window.addEventListener('mousemove', onSelectionMove);
  window.addEventListener('mouseup', endSelection);
}

// Auto-scroll logic
let scrollInterval: number | null = null;
const DRAG_THRESHOLD = 5;

function onSelectionMove(e: MouseEvent) {
  if (!fileContainerRef.value) return;

  const container = fileContainerRef.value;
  const containerRect = container.getBoundingClientRect();
  const scrollTop = container.scrollTop;
  const scrollLeft = container.scrollLeft;

  let currentX = e.clientX - containerRect.left + scrollLeft;
  let currentY = e.clientY - containerRect.top + scrollTop;

  selectionCurrent.value = { x: currentX, y: currentY };

  // Check drag threshold
  if (!isSelecting.value) {
    const dx = currentX - selectionStart.value.x;
    const dy = currentY - selectionStart.value.y;
    if (Math.sqrt(dx*dx + dy*dy) > DRAG_THRESHOLD) {
      isSelecting.value = true;
    } else {
      return;
    }
  }

  updateSelection();

  // Auto-scroll
  const edgeThreshold = 50; // pixels from edge to trigger scroll
  const scrollSpeed = 10;
  
  if (scrollInterval) clearInterval(scrollInterval);
  scrollInterval = null;

  let scrollX = 0;
  let scrollY = 0;

  if (e.clientY < containerRect.top + edgeThreshold) {
    scrollY = -scrollSpeed;
  } else if (e.clientY > containerRect.bottom - edgeThreshold) {
    scrollY = scrollSpeed;
  }

  if (scrollY !== 0) {
    scrollInterval = window.setInterval(() => {
      container.scrollTop += scrollY;
      // Update selection current Y to account for scrolling
      selectionCurrent.value.y += scrollY;
      updateSelection();
    }, 16);
  }
}

function updateSelection() {
  if (!fileContainerRef.value) return;

  const rectLeft = Math.min(selectionStart.value.x, selectionCurrent.value.x);
  const rectTop = Math.min(selectionStart.value.y, selectionCurrent.value.y);
  const rectRight = Math.max(selectionStart.value.x, selectionCurrent.value.x);
  const rectBottom = Math.max(selectionStart.value.y, selectionCurrent.value.y);

  // We need to query file items from the DOM to check intersection
  // Since ref="fileItemRefs" might not be reliable with v-for updates, 
  // we can query manually or trust Vue's ref array if maintained properly.
  // Let's manual query for robustness in this simple case.
  const items = fileContainerRef.value.querySelectorAll('.file-item');
  const containerRect = fileContainerRef.value.getBoundingClientRect();
  const scrollTop = fileContainerRef.value.scrollTop;
  const scrollLeft = fileContainerRef.value.scrollLeft;
  
  items.forEach((item, index) => {
    const itemRect = item.getBoundingClientRect();
    
    // Convert item rect to relative container coordinates
    const itemLeft = itemRect.left - containerRect.left + scrollLeft;
    const itemTop = itemRect.top - containerRect.top + scrollTop;
    const itemRight = itemLeft + itemRect.width;
    const itemBottom = itemTop + itemRect.height;

    // Check intersection
    const isIntersecting = !(rectLeft > itemRight || 
                             rectRight < itemLeft || 
                             rectTop > itemBottom || 
                             rectBottom < itemTop);

    if (isIntersecting) {
      if (index < filteredFiles.value.length) {
        selectedFileIds.value.add(filteredFiles.value[index].id);
      }
    }
  });
}

function endSelection() {
  isSelecting.value = false;
  if (scrollInterval) {
    clearInterval(scrollInterval);
    scrollInterval = null;
  }
  window.removeEventListener('mousemove', onSelectionMove);
  window.removeEventListener('mouseup', endSelection);
}

// Filters
const filters = ref({
  fileTypes: [] as string[],
});

const uniqueFileTypes = computed(() => {
  return [...new Set(currentFiles.value.map(f => f.extension))];
});

const filteredFiles = computed(() => {
  let result = currentFiles.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(file => 
      file.name.toLowerCase().includes(query) || 
      file.extension.toLowerCase().includes(query)
    );
  }

  if (filters.value.fileTypes.length > 0) {
    result = result.filter(file => 
      filters.value.fileTypes.includes(file.extension)
    );
  }

  return result;
});

// Selection Logic
function selectFile(file: FileItem, index: number, event: MouseEvent) {
  const id = file.id;
  // Ensure element focus for keyboard events
  (event.currentTarget as HTMLElement).focus();

  if (event.ctrlKey || event.metaKey) {
    // Toggle
    if (selectedFileIds.value.has(id)) {
      selectedFileIds.value.delete(id);
    } else {
      selectedFileIds.value.add(id);
      lastSelectedId.value = id;
    }
  } else if (event.shiftKey && lastSelectedId.value) {
    // Range select
    const lastIndex = filteredFiles.value.findIndex(f => f.id === lastSelectedId.value);
    if (lastIndex !== -1) {
      const start = Math.min(index, lastIndex);
      const end = Math.max(index, lastIndex);
      
      for (let i = start; i <= end; i++) {
        selectedFileIds.value.add(filteredFiles.value[i].id);
      }
    }
  } else {
    // Single select
    selectedFileIds.value.clear();
    selectedFileIds.value.add(id);
    lastSelectedId.value = id;
  }
}

function clearSelection() {
  selectedFileIds.value.clear();
  lastSelectedId.value = null;
}

function selectAll() {
  filteredFiles.value.forEach(f => selectedFileIds.value.add(f.id));
}

function deleteSelectedFiles() {
  if (selectedFileIds.value.size > 0) {
    actions.deleteFiles(Array.from(selectedFileIds.value));
    selectedFileIds.value.clear();
  }
}

// Add File via Dialog
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

// Drag & Drop
let unlistenDrop: (() => void) | null = null;

onMounted(async () => {
  const appWindow = getCurrentWindow();
  unlistenDrop = await appWindow.listen('tauri://drag-drop', (event) => {
    const payload = event.payload as { paths: string[], position: { x: number, y: number } };
    if (payload.paths && payload.paths.length > 0) {
      actions.addFiles(payload.paths);
      isDragging.value = false;
    }
  });
});

onUnmounted(() => {
  if (unlistenDrop) unlistenDrop();
});

function onDragOver(_: DragEvent) {
  isDragging.value = true;
}

// Context Menu
const contextMenu = reactive({
  visible: false,
  position: { x: 0, y: 0 },
  items: [] as { label: string, action: string }[],
  targetFile: null as FileItem | null
});

function showContextMenu(e: MouseEvent, file: FileItem) {
  if (!selectedFileIds.value.has(file.id)) {
    selectedFileIds.value.clear();
    selectedFileIds.value.add(file.id);
    lastSelectedId.value = file.id;
  }

  contextMenu.targetFile = file;
  contextMenu.position = { x: e.clientX, y: e.clientY };
  
  const count = selectedFileIds.value.size;
  if (count > 1) {
    contextMenu.items = [
      { label: `Delete ${count} items`, action: 'delete' }
    ];
  } else {
    contextMenu.items = [
      { label: 'Open', action: 'open' },
      { label: 'Open File Location', action: 'reveal' },
      { label: 'Copy File', action: 'copy' },
      { label: 'Delete', action: 'delete' }
    ];
  }
  
  contextMenu.visible = true;
}

function handleMenuAction(action: string) {
  const file = contextMenu.targetFile;
  
  switch (action) {
    case 'open':
      if (file) actions.openFile(file.path);
      break;
    case 'reveal':
      if (file) actions.showInExplorer(file.path);
      break;
    case 'copy':
      if (file) actions.copyFile(file.path);
      break;
    case 'delete':
      deleteSelectedFiles();
      break;
  }
}

// Preview
const preview = reactive({
  visible: false,
  file: null as FileItem | null
});

function openFile(file: FileItem | null) {
  if (file) actions.openFile(file.path);
}

function openPreview(file: FileItem) {
  preview.file = file;
  preview.visible = true;
}

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
  outline: none; 
}

.drag-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.05);
  border: 2px dashed var(--text-secondary);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.drag-message {
  background: var(--bg-primary);
  padding: 20px 40px;
  border-radius: 8px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  padding: 0 16px;
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.toolbar-left {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: center;
}

.toolbar-actions {
  display: flex;
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

.filter-panel {
  position: absolute;
  top: 56px;
  right: 16px;
  width: 320px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.filter-header, .filter-footer {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-content {
  padding: 16px;
}

.file-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 0;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  margin: 20px;
}

.file-container.grid-view {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-content: flex-start;
}

.file-container.list-view {
  display: flex;
  flex-direction: column;
}

.file-item {
  cursor: pointer;
  transition: all 0.2s;
  outline: none;
}

.file-item.selected {
  border-color: var(--text-secondary);
  box-shadow: 0 0 0 2px var(--text-secondary);
}

.list-item.selected {
  background-color: var(--hover-color);
}

.grid-item {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  width: 200px;
  height: 180px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  height: 48px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-secondary);
  flex-shrink: 0;
}

.file-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-tertiary), var(--bg-quaternary));
  position: relative;
  overflow: hidden;
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
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  color: var(--text-secondary);
  font-weight: 600;
}

.folder-icon {
  font-size: 48px;
}

.list-cover .folder-icon {
  font-size: 20px;
}

.grid-cover .cover-placeholder { font-size: 24px; }
.list-cover .cover-placeholder { font-size: 10px; }

.file-name {
  color: var(--text-primary);
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grid-item .file-name { padding: 12px; text-align: center; }
.list-item .file-name { flex: 1; }

.file-container {
  position: relative; /* Ensure selection rect is positioned relative to this */
}

.selection-rect {
  position: absolute;
  background-color: rgba(0, 120, 215, 0.2);
  border: 1px solid rgba(0, 120, 215, 0.6);
  z-index: 100;
  pointer-events: none; /* Let clicks pass through */
}
</style>
