<template>
    <div 
      class="file-library" 
    >
      <!-- Filter Panel Overlay -->
    <div v-if="libraryStore.ui.showFilterPanel" class="filter-backdrop" @click="libraryStore.ui.showFilterPanel = false"></div>

    <transition name="slide-fade">
      <FilterPanel 
        v-if="libraryStore.ui.showFilterPanel"
        :available-types="uniqueFileTypes"
        v-model:selected-types="libraryStore.ui.filters.fileTypes"
        v-model:sort="libraryStore.ui.sortConfig"
        @close="libraryStore.ui.showFilterPanel = false"
        @reset="resetFilters"
      />
    </transition>

    <div 
      :class="['file-container', { 'grid-view': libraryStore.ui.isGridView, 'list-view': !libraryStore.ui.isGridView }]"
      :style="{ '--card-scale': libraryStore.ui.cardScale }"
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
        {{ t('library.emptyNoLibraries') }}<br>
        {{ t('library.emptyNoLibrariesDesc') }}
      </div>
      <div v-else-if="filteredFiles.length === 0" class="empty-state">
        {{ t('library.emptyNoFiles') }} <br>
        {{ t('library.emptyNoFilesDesc') }}
      </div>

      <div
        v-for="(file, index) in filteredFiles"
        :key="file.id"
        :class="['file-item', { 'grid-item': libraryStore.ui.isGridView, 'list-item': !libraryStore.ui.isGridView, 'selected': selectedFileIds.has(file.id) }]"
        @click.stop="selectFile(file, index, $event)"
        @dblclick.stop="openFile(file)"
        @contextmenu.prevent.stop="showContextMenu($event, file)"
        ref="fileItemRefs"
      >
        <div :class="['file-cover', { 'grid-cover': libraryStore.ui.isGridView, 'list-cover': !libraryStore.ui.isGridView }]">
          <div v-if="file.extension === 'folder'" class="folder-icon">
            <v-icon name="fc-folder" :scale="libraryStore.ui.isGridView ? 3.5 : 1.2" />
          </div>
          <img 
            v-else-if="file.mime_type.startsWith('image/') && !failedImageIds.has(file.id)" 
            :src="convertFileSrc(file.path)" 
            class="thumbnail-img" 
            loading="lazy"
            @error="onImageError(file.id)"
          />
          <div v-else class="cover-placeholder">
            <v-icon v-if="file.mime_type.startsWith('image/')" name="fc-image-file" :scale="libraryStore.ui.isGridView ? 3.5 : 1.2" />
            <v-icon v-else-if="file.mime_type.startsWith('video/')" name="fc-video-file" :scale="libraryStore.ui.isGridView ? 3.5 : 1.2" />
            <v-icon v-else-if="file.mime_type.startsWith('audio/')" name="fc-audio-file" :scale="libraryStore.ui.isGridView ? 3.5 : 1.2" />
            <v-icon v-else-if="isDocument(file.extension)" name="fc-document" :scale="libraryStore.ui.isGridView ? 3.5 : 1.2" />
            <v-icon v-else name="fc-file" :scale="libraryStore.ui.isGridView ? 3.5 : 1.2" />
          </div>
          
          <!-- Tag Badges Overlay -->
          <div v-if="file.tags.length > 0 && libraryStore.ui.isGridView" class="file-tags">
            <span v-for="tag in file.tags.slice(0, 3)" :key="tag" class="tag-badge">{{ tag }}</span>
            <span v-if="file.tags.length > 3" class="tag-badge">+{{ file.tags.length - 3 }}</span>
          </div>
        </div>
        <div class="file-info-row">
          <div class="file-name" :title="file.name">{{ file.name }}</div>
          <!-- List View Tags -->
          <div v-if="!libraryStore.ui.isGridView && file.tags.length > 0" class="list-tags">
            <span v-for="tag in file.tags" :key="tag" class="tag-badge-small">{{ tag }}</span>
          </div>
        </div>
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

    <!-- Tag Input Modal -->
    <div v-if="showTagInput" class="modal-backdrop" @click="showTagInput = false">
      <div class="modal" @click.stop>
        <h3>{{ targetFilesForTags.length > 1 ? t('library.editTagsMulti', { n: targetFilesForTags.length }) : t('library.editTags') }}</h3>
        <div class="current-tags">
          <span v-for="tag in displayedTags" :key="tag" class="tag-chip">
            {{ tag }}
            <button @click="removeTag(tag)" class="remove-tag">×</button>
          </span>
        </div>
        <input 
          v-model="newTagValue" 
          @keydown.enter="addTag"
          :placeholder="t('library.tagInputPlaceholder')"
          class="tag-input"
          autofocus
        />
        <div class="modal-actions">
          <button @click="showTagInput = false" class="close-btn">{{ t('library.done') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { libraryStore, currentFiles, actions, FileItem } from '../stores/library';
import ContextMenu from './ContextMenu.vue';
import FilterPanel from './FilterPanel.vue';
import PreviewModal from './PreviewModal.vue';
import { convertFileSrc } from '@tauri-apps/api/core';

const { t } = useI18n();

// Note: Local UI state has been moved to libraryStore.ui

const selectedFileIds = ref<Set<string>>(new Set());
const lastSelectedId = ref<string | null>(null);
const failedImageIds = ref<Set<string>>(new Set());

function onImageError(id: string) {
  failedImageIds.value.add(id);
}

function isDocument(ext: string) {
  const docs = ['pdf', 'doc', 'docx', 'txt', 'md', 'markdown', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'csv', 'json', 'xml', 'epub'];
  return docs.includes(ext.toLowerCase());
}

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

const uniqueFileTypes = computed(() => {
  return [...new Set(currentFiles.value.map(f => f.extension))];
});

const filteredFiles = computed(() => {
  let result = [...currentFiles.value];

  // 1. Search
  if (libraryStore.ui.searchQuery) {
    const query = libraryStore.ui.searchQuery.toLowerCase();
    result = result.filter(file => 
      file.name.toLowerCase().includes(query) || 
      file.extension.toLowerCase().includes(query)
    );
  }

  // 2. Filter by Type
  if (libraryStore.ui.filters.fileTypes.length > 0) {
    result = result.filter(file => 
      libraryStore.ui.filters.fileTypes.includes(file.extension)
    );
  }

  // 3. Filter by Tag View Mode (Libraries & Tags)
  if (libraryStore.ui.viewMode === 'tag') {
    const { libraries, tags } = libraryStore.ui.tagViewFilters;
    
    // Filter by Selected Libraries
    if (libraries.length > 0) {
      result = result.filter(file => libraries.includes(file.library_id));
    }

    // Filter by Selected Tags
    if (tags.length > 0) {
      const showUntagged = tags.includes('_untagged_');
      const standardTags = tags.filter(t => t !== '_untagged_');

      result = result.filter(file => {
        const matchesStandard = standardTags.length > 0 && standardTags.some(tag => file.tags.includes(tag));
        const matchesUntagged = showUntagged && file.tags.length === 0;
        return matchesStandard || matchesUntagged;
      });
    }
  }

  // 4. Sort
  result.sort((a, b) => {
    let valA, valB;
    
    switch (libraryStore.ui.sortConfig.by) {
      case 'name':
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        break;
      case 'size':
        valA = a.size;
        valB = b.size;
        break;
      case 'extension':
        valA = a.extension.toLowerCase();
        valB = b.extension.toLowerCase();
        break;
      case 'added_at':
      default:
        valA = a.added_at;
        valB = b.added_at;
        break;
    }

    if (valA < valB) return libraryStore.ui.sortConfig.order === 'asc' ? -1 : 1;
    if (valA > valB) return libraryStore.ui.sortConfig.order === 'asc' ? 1 : -1;
    return 0;
  });

  return result;
});

function resetFilters() {
  libraryStore.ui.filters.fileTypes = [];
  libraryStore.ui.sortConfig = { by: 'added_at', order: 'desc' };
}

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

function handleGlobalKeyDown(e: KeyboardEvent) {
  // Don't trigger if user is typing in an input or textarea
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

  if (e.key === 'Delete' || (e.metaKey && e.key === 'Backspace')) {
    e.preventDefault();
    deleteSelectedFiles();
  } else if (e.key === ' ' && !e.repeat) {
    // Space for preview
    if (selectedFileIds.value.size > 0) {
      e.preventDefault();
      const targetId = lastSelectedId.value || Array.from(selectedFileIds.value)[0];
      const file = filteredFiles.value.find(f => f.id === targetId);
      if (file) openPreview(file);
    }
  } else if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
    e.preventDefault();
    selectAll();
  }
}

// Drag & Drop
onMounted(async () => {
  window.addEventListener('keydown', handleGlobalKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeyDown);
});

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
  contextMenu.items = [];

  // Edit Tags (Always available)
  contextMenu.items.push({ 
    label: count > 1 ? t('library.contextEditTagsMulti', { n: count }) : t('library.contextEditTags'), 
    action: 'tags' 
  });

  if (count > 1) {
    contextMenu.items.push({ label: t('library.deleteMulti', { n: count }), action: 'delete' });
  } else {
    contextMenu.items.push(
      { label: t('library.open'), action: 'open' },
      { label: t('library.openFileLocation'), action: 'reveal' },
      { label: t('library.copyFile'), action: 'copy' },
      { label: t('library.delete'), action: 'delete' }
    );
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
    case 'tags':
      if (file) openTagInput(file);
      break;
  }
}

// Tag Input
const showTagInput = ref(false);
const targetFilesForTags = ref<FileItem[]>([]);
const newTagValue = ref('');

function openTagInput(file: FileItem) {
  if (selectedFileIds.value.size > 0 && selectedFileIds.value.has(file.id)) {
    // Bulk edit
    targetFilesForTags.value = libraryStore.files.filter(f => selectedFileIds.value.has(f.id));
  } else {
    // Single edit
    targetFilesForTags.value = [file];
  }
  showTagInput.value = true;
  newTagValue.value = '';
}

const displayedTags = computed(() => {
  const allTags = new Set<string>();
  targetFilesForTags.value.forEach(file => {
    file.tags.forEach(tag => allTags.add(tag));
  });
  return Array.from(allTags).sort();
});

function addTag() {
  const tag = newTagValue.value.trim();
  if (tag) {
    targetFilesForTags.value.forEach(file => {
      actions.addTag(file.id, tag);
    });
    newTagValue.value = '';
  }
}

function removeTag(tag: string) {
  targetFilesForTags.value.forEach(file => {
    if (file.tags.includes(tag)) {
      actions.removeTag(file.id, tag);
    }
  });
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

.file-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  border: 2px dashed var(--border-color);
  border-radius: 12px;
}

.file-container.grid-view {
  flex-direction: row;
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
  width: calc(200px * var(--card-scale));
  height: calc(180px * var(--card-scale));
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

/* Tag Badges Overlay (Grid) */
.file-tags {
  position: absolute;
  bottom: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap-reverse;
  justify-content: flex-end;
  pointer-events: none;
}

.tag-badge {
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
}

.file-info-row {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.list-tags {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}

.tag-badge-small {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  border: 1px solid var(--border-color);
}

.grid-cover {
  width: 100%;
  height: calc(112px * var(--card-scale));
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

.folder-icon, .cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

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

/* Modal Styles */
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-primary);
  padding: 20px;
  border-radius: 8px;
  width: 320px;
  border: 1px solid var(--border-color);
}

.modal h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: var(--text-primary);
}

.current-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.tag-chip {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 4px 10px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-primary);
}

.remove-tag {
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
}

.remove-tag:hover {
  color: #ef4444;
}

.tag-input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  margin-bottom: 16px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}

.close-btn {
  padding: 6px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-primary);
  cursor: pointer;
}

.close-btn:hover {
  background: var(--hover-color);
}
</style>
