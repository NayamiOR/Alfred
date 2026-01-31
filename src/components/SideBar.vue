<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h2>{{ t('sidebar.filters') }}</h2>
    </div>

    <!-- Search & Selection Status -->
    <div class="search-section">
      <input 
        v-model="searchQuery" 
        :placeholder="t('sidebar.searchTags')" 
        class="search-input"
      />
    </div>

    <div v-if="libraryStore.ui.tagViewFilters.tags.length > 0" class="selection-status">
      <span class="count">{{ libraryStore.ui.tagViewFilters.tags.length }} selected</span>
      <button @click="clearSelection" class="clear-btn">Clear</button>
    </div>

    <div class="library-list">
      
      <div class="filter-group">
        
        <div class="checkbox-list">
          <!-- Untagged -->
          <label class="filter-item">
            <input 
              type="checkbox" 
              :checked="isUntaggedSelected"
              @change="toggleUntagged"
            >
            <span class="untagged-label">{{ t('sidebar.untagged') }}</span>
          </label>

          <div v-if="libraryStore.tags.length === 0" class="empty-msg">{{ t('sidebar.noTags') }}</div>
          
          <template v-else>
            <!-- Groups -->
            <div 
              v-for="group in filteredGroups" 
              :key="group.id" 
              class="group-section"
              :data-group-id="group.id"
            >
              <div class="group-header" @click="toggleGroup(group.id)">
                <span class="arrow">{{ collapsedGroups.has(group.id) ? '▶' : '▼' }}</span>
                <span class="group-name">{{ group.name }}</span>
              </div>
              
              <div v-show="!collapsedGroups.has(group.id)" class="group-items">
                <template v-for="tag in getVisibleGroupTags(group.id)" :key="tag.id">
                  <div 
                    class="tag-wrapper"
                    :data-tag-id="tag.id"
                    @mousedown="onMouseDown(tag, $event)"
                    @contextmenu.prevent="showContextMenu($event, tag)"
                  >
                    <div class="tag-row-container" :class="{ 'dragging': isDraggingTag(tag.id) }">
                      <span 
                        class="tag-toggle"
                        :class="{ 'hidden': !hasChildren(tag.id) }"
                        @click.stop="toggleTagCollapse(tag.id)"
                      >
                        {{ collapsedTags.has(tag.id) ? '▶' : '▼' }}
                      </span>
                      <label class="filter-item">
                        <input 
                          type="checkbox" 
                          :checked="isTagSelected(tag.id)"
                          @change="toggleTag(tag.id)"
                        >
                        <span>{{ tag.name }}</span>
                      </label>
                    </div>
                  </div>

                  <!-- Children -->
                  <div v-show="!collapsedTags.has(tag.id)">
                    <div 
                      v-for="child in getVisibleChildTags(tag.id)" 
                      :key="child.id" 
                      class="child-tag"
                      :data-tag-id="child.id"
                      @mousedown="onMouseDown(child, $event)"
                      @contextmenu.prevent="showContextMenu($event, child)"
                    >
                      <div class="tag-row-container indent" :class="{ 'dragging': isDraggingTag(child.id) }">
                        <span class="tag-toggle hidden"></span>
                        <label class="filter-item">
                          <input 
                            type="checkbox" 
                            :checked="isTagSelected(child.id)"
                            @change="toggleTag(child.id)"
                          >
                          <span>{{ child.name }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Ungrouped Root Tags -->
            <div 
              v-if="getVisibleUngroupedTags().length > 0" 
              class="group-section"
              data-group-id="ungrouped"
            >
               <div class="group-header" @click="toggleGroup('ungrouped')">
                <span class="arrow">{{ collapsedGroups.has('ungrouped') ? '▶' : '▼' }}</span>
                <span class="group-name">{{ t('sidebar.otherTags') || 'Other' }}</span>
              </div>

              <div v-show="!collapsedGroups.has('ungrouped')" class="group-items">
                <template v-for="tag in getVisibleUngroupedTags()" :key="tag.id">
                  <div 
                    class="tag-wrapper"
                    :data-tag-id="tag.id"
                    @mousedown="onMouseDown(tag, $event)"
                    @contextmenu.prevent="showContextMenu($event, tag)"
                  >
                    <div class="tag-row-container" :class="{ 'dragging': isDraggingTag(tag.id) }">
                      <span 
                        class="tag-toggle"
                        :class="{ 'hidden': !hasChildren(tag.id) }"
                        @click.stop="toggleTagCollapse(tag.id)"
                      >
                        {{ collapsedTags.has(tag.id) ? '▶' : '▼' }}
                      </span>
                      <label class="filter-item">
                        <input 
                          type="checkbox" 
                          :checked="isTagSelected(tag.id)"
                          @change="toggleTag(tag.id)"
                        >
                        <span>{{ tag.name }}</span>
                      </label>
                    </div>
                  </div>
                   <!-- Children of ungrouped -->
                  <div v-show="!collapsedTags.has(tag.id)">
                    <div 
                      v-for="child in getVisibleChildTags(tag.id)" 
                      :key="child.id" 
                      class="child-tag"
                      :data-tag-id="child.id"
                      @mousedown="onMouseDown(child, $event)"
                      @contextmenu.prevent="showContextMenu($event, child)"
                    >
                      <div class="tag-row-container indent" :class="{ 'dragging': isDraggingTag(child.id) }">
                        <span class="tag-toggle hidden"></span>
                        <label class="filter-item">
                          <input 
                            type="checkbox" 
                            :checked="isTagSelected(child.id)"
                            @change="toggleTag(child.id)"
                          >
                          <span>{{ child.name }}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>

          </template>
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <router-link to="/tags" class="add-lib-btn" :title="t('sidebar.manageTags')">
        <v-icon name="co-settings" scale="0.8" /> {{ t('sidebar.manageTags') }}
      </router-link>
    </div>

    <!-- Context Menu -->
    <ContextMenu 
      :visible="contextMenu.visible" 
      :position="contextMenu.position" 
      :items="contextMenu.items"
      @close="contextMenu.visible = false"
      @action="handleMenuAction"
    />
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { libraryStore, actions, Tag } from '../stores/library';
import ContextMenu from './ContextMenu.vue';

const { t } = useI18n();

// Search & Filtering
const searchQuery = ref('');
const collapsedGroups = ref(new Set<string>());
const collapsedTags = ref(new Set<string>());

function toggleGroup(id: string) {
  if (collapsedGroups.value.has(id)) {
    collapsedGroups.value.delete(id);
  } else {
    collapsedGroups.value.add(id);
  }
}

function toggleTagCollapse(id: string) {
  if (collapsedTags.value.has(id)) {
    collapsedTags.value.delete(id);
  } else {
    collapsedTags.value.add(id);
  }
}

function hasChildren(tagId: string) {
  return libraryStore.tags.some(t => t.parent_id === tagId);
}

// Filtered Data
const filteredGroups = computed(() => {
  if (!searchQuery.value) return libraryStore.groups;
  
  const query = searchQuery.value.toLowerCase();
  return libraryStore.groups.filter(g => {
    // Show group if name matches
    if (g.name.toLowerCase().includes(query)) return true;
    
    // OR if any of its tags match
    const groupTags = libraryStore.tags.filter(t => t.group_id === g.id);
    return groupTags.some(t => 
      t.name.toLowerCase().includes(query) || 
      // check children too
      libraryStore.tags.some(child => child.parent_id === t.id && child.name.toLowerCase().includes(query))
    );
  });
});

function getVisibleGroupTags(groupId: string) {
  let tags = libraryStore.tags.filter(t => t.group_id === groupId && !t.parent_id);
  if (!searchQuery.value) return tags;

  const query = searchQuery.value.toLowerCase();
  return tags.filter(t => {
    if (t.name.toLowerCase().includes(query)) return true;
    // Keep parent visible if child matches
    const children = libraryStore.tags.filter(c => c.parent_id === t.id);
    return children.some(c => c.name.toLowerCase().includes(query));
  });
}

function getVisibleUngroupedTags() {
  let tags = libraryStore.tags.filter(t => !t.group_id && !t.parent_id);
  if (!searchQuery.value) return tags;

  const query = searchQuery.value.toLowerCase();
  return tags.filter(t => {
     if (t.name.toLowerCase().includes(query)) return true;
     const children = libraryStore.tags.filter(c => c.parent_id === t.id);
     return children.some(c => c.name.toLowerCase().includes(query));
  });
}

function getVisibleChildTags(parentId: string) {
  let tags = libraryStore.tags.filter(t => t.parent_id === parentId);
  if (!searchQuery.value) return tags;
  
  const query = searchQuery.value.toLowerCase();
  return tags.filter(t => t.name.toLowerCase().includes(query));
}

// Tag Selection
const isUntaggedSelected = computed(() => libraryStore.ui.tagViewFilters.tags.includes('_untagged_'));

function isTagSelected(id: string) {
  return libraryStore.ui.tagViewFilters.tags.includes(id);
}

function toggleUntagged() {
  if (isUntaggedSelected.value) {
    libraryStore.ui.tagViewFilters.tags = [];
  } else {
    libraryStore.ui.tagViewFilters.tags = ['_untagged_'];
  }
}

function toggleTag(id: string) {
  const selected = libraryStore.ui.tagViewFilters.tags;
  
  if (selected.includes('_untagged_')) {
    libraryStore.ui.tagViewFilters.tags = [id];
    return;
  }

  const index = selected.indexOf(id);
  if (index === -1) {
    selected.push(id);
  } else {
    selected.splice(index, 1);
  }
}

function clearSelection() {
  libraryStore.ui.tagViewFilters.tags = [];
}

// Drag and Drop
const draggingTagId = ref<string | null>(null);
const draggedTag = ref<Tag | null>(null);
const dragPreview = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });

function isDraggingTag(id: string) {
  return draggingTagId.value === id;
}

function onMouseDown(tag: Tag, event: MouseEvent) {
  if ((event.target as HTMLElement).tagName === 'INPUT') return;
  if (event.button !== 0 && event.button !== undefined) return;

  event.preventDefault();

  const element = event.currentTarget as HTMLElement;
  const rect = element.getBoundingClientRect();
  dragOffset.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };

  draggedTag.value = tag;
  draggingTagId.value = tag.id;
  isDragging.value = true;

  // Set tag ID on window for FileLibrary to detect
  (window as any).__draggingTagId = tag.id;

  createDragPreview(tag, event.clientX, event.clientY, rect.width, rect.height);

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
}

function onMouseMove(event: MouseEvent) {
  if (!isDragging.value || !dragPreview.value) return;

  const x = event.clientX - dragOffset.value.x;
  const y = event.clientY - dragOffset.value.y;

  dragPreview.value.style.left = x + 'px';
  dragPreview.value.style.top = y + 'px';
}

function onMouseUp(event: MouseEvent) {
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseup', onMouseUp);

  if (dragPreview.value) {
    dragPreview.value.remove();
    dragPreview.value = null;
  }

  // Clean up global tag ID
  delete (window as any).__draggingTagId;

  if (isDragging.value) {
    handleDrop(event.clientX, event.clientY);
  }

  draggedTag.value = null;
  draggingTagId.value = null;
  isDragging.value = false;
}

function createDragPreview(tag: Tag, x: number, y: number, width: number, height: number) {
  const preview = document.createElement('div');
  preview.className = 'drag-preview';
  preview.innerHTML = `<span>${tag.name}</span>`;
  preview.style.left = (x - dragOffset.value.x) + 'px';
  preview.style.top = (y - dragOffset.value.y) + 'px';
  preview.style.width = width + 'px';
  preview.style.height = height + 'px';
  preview.style.minWidth = '100px';
  document.body.appendChild(preview);
  dragPreview.value = preview;
}

function handleDrop(x: number, y: number) {
  const targetElement = document.elementFromPoint(x, y);
  if (!targetElement || !draggedTag.value) return;
  
  const groupSection = targetElement.closest('.group-section');
  const tagWrapper = targetElement.closest('.tag-wrapper, .child-tag');
  
  if (tagWrapper) {
    const tagId = tagWrapper.getAttribute('data-tag-id');
    if (tagId && tagId !== draggedTag.value.id) {
      const targetTag = libraryStore.tags.find(t => t.id === tagId);
      if (targetTag && targetTag.parent_id !== draggedTag.value.id) {
        actions.moveTag(draggedTag.value.id, targetTag.id, targetTag.group_id);
      }
    }
  } else if (groupSection) {
    const groupId = groupSection.getAttribute('data-group-id');
    if (groupId === 'ungrouped') {
      actions.moveTag(draggedTag.value.id, null, null);
    } else {
      actions.moveTag(draggedTag.value.id, null, groupId);
    }
  }
}

// Context Menu
const contextMenu = reactive({
  visible: false,
  position: { x: 0, y: 0 },
  items: [] as { label: string, action: string }[],
  targetTag: null as Tag | null
});

function showContextMenu(e: MouseEvent, tag: Tag) {
  contextMenu.visible = true;
  contextMenu.position = { x: e.clientX, y: e.clientY };
  contextMenu.targetTag = tag;
  contextMenu.items = [
    { label: t('tagManage.rename'), action: 'rename' },
    { label: t('library.delete'), action: 'delete' }
  ];
}

async function handleMenuAction(action: string) {
  const tag = contextMenu.targetTag;
  if (!tag) return;

  if (action === 'rename') {
    const newName = prompt(t('tagManage.renameTitle'), tag.name);
    if (newName && newName !== tag.name) {
      await actions.renameTag(tag.id, newName);
    }
  } else if (action === 'delete') {
    if (confirm(t('tagManage.delete') + '?')) {
      await actions.deleteTag(tag.id);
    }
  }
}

onMounted(() => {
  if (libraryStore.files.length === 0) {
    actions.loadData();
  }
});
</script>

<style scoped>
.sidebar {
  background-color: var(--bg-quaternary);
  border-right: 1px solid var(--border-color);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

.sidebar-header {
  padding: 20px 16px 10px;
}

.sidebar-header h2 {
  font-size: 12px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin: 0;
  letter-spacing: 1px;
}

.search-section {
  padding: 0 16px 10px;
}

.search-input {
  width: 100%;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 13px;
}

.selection-status {
  padding: 0 16px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

.clear-btn {
  background: none;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.library-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.add-lib-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  background: transparent;
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
  text-decoration: none;
}

.add-lib-btn:hover {
  border-color: var(--text-primary);
  color: var(--text-primary);
  background-color: var(--hover-color);
}

/* Filter Styles */
.filter-group {
  margin-bottom: 24px;
  padding: 0 12px;
}

.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tag-row-container {
  display: flex;
  align-items: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.tag-row-container:hover {
  background-color: var(--hover-color);
}

.tag-row-container.dragging {
  opacity: 0.5;
  background-color: var(--hover-color);
}

.tag-row-container.indent {
  padding-left: 20px;
}

.tag-toggle {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  cursor: pointer;
  color: var(--text-secondary);
  user-select: none;
  flex-shrink: 0;
}

.tag-toggle:hover {
  color: var(--text-primary);
}

.tag-toggle.hidden {
  visibility: hidden;
}

.filter-item {
  display: flex;
  align-items: center;
  padding: 6px 10px 6px 0;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  flex: 1;
}

/* For standalone filter items without row container (e.g. untagged/select all) */
.filter-item:not(.tag-row-container .filter-item) {
  padding: 6px 10px;
  border-radius: 6px;
}

.filter-item:not(.tag-row-container .filter-item):hover {
  background-color: var(--hover-color);
}

.filter-item input {
  margin-right: 10px;
  accent-color: var(--text-secondary);
  cursor: pointer;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.filter-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.empty-msg {
  font-size: 13px;
  color: var(--text-secondary);
  padding: 8px 10px;
  font-style: italic;
  opacity: 0.8;
}

.untagged-label {
  font-style: italic;
  color: var(--text-secondary);
}

.group-section {
  margin-bottom: 8px;
}

.group-header {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  margin: 8px 0 4px 0;
  padding: 4px 10px;
  opacity: 0.8;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 4px;
}

.group-header:hover {
  background-color: var(--hover-color);
}

.arrow {
  font-size: 10px;
  width: 12px;
}

.tag-wrapper, .child-tag {
  /* Wrappers for drag events */
}

/* Drag Preview Styles */
.drag-preview {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  padding: 6px 10px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-primary);
  opacity: 0.9;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: grabbing;
  transform: rotate(2deg);
  transition: transform 0.1s ease;
}

</style>
