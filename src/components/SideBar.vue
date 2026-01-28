<template>
  <aside class="sidebar">
    <div class="library-list">
      <div class="sidebar-header">
        <h2>Libraries</h2>
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
      
      <!-- Inline Input for New Library -->
      <div v-if="isCreating" class="library-item creating">
        <div class="lib-icon">📁</div>
        <input 
          ref="newLibInput"
          v-model="newLibName" 
          @keydown.enter="finishCreate" 
          @keydown.esc="cancelCreate"
          @blur="cancelCreate"
          class="new-lib-input"
          placeholder="Library Name"
        />
      </div>
    </div>

    <div class="sidebar-footer">
      <button class="add-lib-btn" @click="startCreate">
        <span>+</span> New Library
      </button>
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
import { onMounted, ref, nextTick, reactive } from 'vue';
import { libraryStore, actions } from '../stores/library';
import ContextMenu from './ContextMenu.vue';

const isCreating = ref(false);
const newLibName = ref('');
const newLibInput = ref<HTMLInputElement | null>(null);

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
    { label: 'Delete', action: 'delete' }
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
</style>
