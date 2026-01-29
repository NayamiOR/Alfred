<template>
  <aside class="sidebar">
    <div v-if="libraryStore.ui.viewMode === 'library'" class="library-list">
      <div class="sidebar-header">
        <h2>{{ t('sidebar.libraries') }}</h2>
      </div>
      
      <div 
        v-for="lib in libraryStore.libraries" 
        :key="lib.id"
        class="library-item"
        :class="{ active: libraryStore.currentLibraryId === lib.id }"
        @click="selectLibrary(lib.id)"
        @contextmenu.prevent="showContextMenu($event, lib)"
      >
        <div class="lib-icon">{{ lib.icon }}</div>
        <div class="lib-name">{{ lib.name }}</div>
        <div class="lib-options" @click.stop="showContextMenu($event, lib)">⋮</div>
      </div>
      
      <div v-if="isCreating" class="library-item creating">
        <div class="lib-icon">📁</div>
        <input 
          ref="newLibInput"
          v-model="newLibName" 
          @keydown.enter="finishCreate" 
          @keydown.esc="cancelCreate"
          @blur="cancelCreate"
          class="new-lib-input"
          :placeholder="t('sidebar.libraryName')"
        />
      </div>
    </div>

    <div v-else class="library-list">
      <div class="sidebar-header">
        <h2>{{ t('sidebar.filters') }}</h2>
      </div>

      <div class="filter-group">
        <h3>{{ t('sidebar.libraries') }}</h3>
        <div class="checkbox-list">
          <label v-for="lib in libraryStore.libraries" :key="lib.id" class="filter-item">
            <input 
              type="checkbox" 
              :value="lib.id"
              v-model="libraryStore.ui.tagViewFilters.libraries"
            >
            <span>{{ lib.name }}</span>
          </label>
        </div>
      </div>

      <div class="filter-group">
        <h3>{{ t('sidebar.tags') }}</h3>
        <div class="checkbox-list">
          <label class="filter-item">
            <input 
              type="checkbox" 
              :checked="isUntaggedSelected"
              @change="toggleUntagged"
            >
            <span class="untagged-label">{{ t('sidebar.untagged') }}</span>
          </label>

          <div v-if="allTags.length === 0" class="empty-msg">{{ t('sidebar.noTags') }}</div>
          
          <template v-else>
            <label class="filter-item">
              <input 
                type="checkbox" 
                :checked="areAllTagsSelected"
                @change="toggleAllTags"
              >
              <span>{{ t('sidebar.selectAll') }}</span>
            </label>

            <label v-for="tag in allTags" :key="tag" class="filter-item">
              <input 
                type="checkbox" 
                :checked="libraryStore.ui.tagViewFilters.tags.includes(tag)"
                @change="toggleTag(tag)"
              >
              <span>{{ tag }}</span>
            </label>
          </template>
        </div>
      </div>
    </div>

    <div class="sidebar-footer">
      <template v-if="libraryStore.ui.viewMode === 'library'">
        <button class="add-lib-btn" @click="startCreate">
          <span>+</span> {{ t('sidebar.newLibrary') }}
        </button>
      </template>
      <template v-else>
        <router-link to="/tags" class="add-lib-btn" :title="t('sidebar.manageTags')">
          <span>⚙️</span> {{ t('sidebar.manageTags') }}
        </router-link>
      </template>
    </div>

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
import { onMounted, ref, nextTick, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { libraryStore, actions, allTags } from '../stores/library';
import ContextMenu from './ContextMenu.vue';

const { t } = useI18n();
const isCreating = ref(false);
const newLibName = ref('');
const newLibInput = ref<HTMLInputElement | null>(null);

// Tag Selection Logic
const isUntaggedSelected = computed(() => libraryStore.ui.tagViewFilters.tags.includes('_untagged_'));

const areAllTagsSelected = computed(() => {
  const selected = libraryStore.ui.tagViewFilters.tags;
  // Check if all tags are present AND untagged is NOT present
  return allTags.value.length > 0 && 
         allTags.value.every(t => selected.includes(t)) && 
         !selected.includes('_untagged_');
});

function toggleUntagged() {
  if (isUntaggedSelected.value) {
    // Deselect untagged
    libraryStore.ui.tagViewFilters.tags = [];
  } else {
    // Select untagged, clear everything else
    libraryStore.ui.tagViewFilters.tags = ['_untagged_'];
  }
}

function toggleAllTags() {
  if (areAllTagsSelected.value) {
    // Deselect all
    libraryStore.ui.tagViewFilters.tags = [];
  } else {
    // Select all tags, clear untagged
    libraryStore.ui.tagViewFilters.tags = [...allTags.value];
  }
}

function toggleTag(tag: string) {
  const selected = libraryStore.ui.tagViewFilters.tags;
  
  // If untagged was selected, clear it first
  if (selected.includes('_untagged_')) {
    libraryStore.ui.tagViewFilters.tags = [tag];
    return;
  }

  const index = selected.indexOf(tag);
  if (index === -1) {
    selected.push(tag);
  } else {
    selected.splice(index, 1);
  }
}

// ... existing script content ...
// Load libraries on mount if empty
onMounted(() => {
  if (libraryStore.libraries.length === 0) {
    actions.loadLibraries();
  }
});

function selectLibrary(id: string) {
  actions.selectLibrary(id);
}

function startCreate() {
  isCreating.value = true;
  newLibName.value = '';
  nextTick(() => {
    newLibInput.value?.focus();
  });
}

function finishCreate() {
  if (newLibName.value.trim()) {
    actions.createLibrary(newLibName.value.trim());
  }
  isCreating.value = false;
}

function cancelCreate() {
  // Small delay to allow enter key to trigger first if pressed
  setTimeout(() => {
    isCreating.value = false;
  }, 100);
}

// Context Menu Logic
const contextMenu = reactive({
  visible: false,
  position: { x: 0, y: 0 },
  items: [] as { label: string, action: string }[],
  targetLib: null as any
});

function showContextMenu(e: MouseEvent, lib: any) {
  contextMenu.targetLib = lib;
  contextMenu.position = { x: e.clientX, y: e.clientY };
  contextMenu.items = [
    { label: t('sidebar.delete'), action: 'delete' }
  ];
  contextMenu.visible = true;
}

function handleMenuAction(action: string) {
  if (action === 'delete' && contextMenu.targetLib) {
    actions.deleteLibrary(contextMenu.targetLib.id);
  }
}
</script>

<style scoped>
.sidebar {
  background-color: var(--bg-quaternary);
  border-right: 1px solid var(--border-color);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* ... existing styles ... */
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

.library-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.library-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  color: var(--text-primary);
}

.library-item:hover {
  background-color: var(--hover-color);
}

.library-item.active {
  background-color: var(--bg-secondary);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  font-weight: 500;
}

.lib-icon {
  margin-right: 10px;
  font-size: 16px;
}

.lib-name {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.lib-options {
  opacity: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: var(--text-secondary);
  font-weight: bold;
  font-size: 16px;
  transition: all 0.2s;
}

.lib-options:hover {
  background-color: var(--hover-color);
  color: var(--text-primary);
}

.library-item:hover .lib-options {
  opacity: 1;
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

.new-lib-input {
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--text-primary);
  width: 100%;
  border-bottom: 1px solid var(--text-secondary);
}

/* New Filter Styles */
.filter-group {
  margin-bottom: 24px;
  padding: 0 12px;
}

.filter-group h3 {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin: 0 0 12px 4px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.filter-item {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  transition: all 0.2s;
  user-select: none;
  overflow: hidden; /* Prevent content from spilling out */
}

.filter-item:hover {
  background-color: var(--hover-color);
}

.filter-item input {
  margin-right: 10px;
  accent-color: var(--text-secondary);
  cursor: pointer;
  width: 14px;
  height: 14px;
  flex-shrink: 0; /* Don't squash the checkbox */
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
</style>
