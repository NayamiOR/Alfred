<template>
  <div class="tag-manage-view">
    <div class="header">
      <button @click="goBack" class="back-btn">← Back</button>
      <h2>Manage Tags</h2>
    </div>

    <div class="content">
      <div v-if="allTags.length === 0" class="empty-state">
        No tags found. Add tags to files to manage them here.
      </div>
      
      <div v-else class="tag-list">
        <div v-for="tag in allTags" :key="tag" class="tag-row">
          <div class="tag-info">
            <span class="tag-badge">{{ tag }}</span>
            <span class="tag-count">{{ getFileCount(tag) }} files</span>
          </div>
          <div class="tag-actions">
            <button @click="startRename(tag)" class="action-btn">Rename</button>
            <button @click="confirmDelete(tag)" class="action-btn delete">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Rename Modal -->
    <div v-if="editingTag" class="modal-backdrop" @click="cancelRename">
      <div class="modal" @click.stop>
        <h3>Rename Tag</h3>
        <input 
          v-model="newTagName" 
          @keyup.enter="finishRename"
          @keyup.esc="cancelRename"
          ref="renameInput"
          placeholder="New tag name"
        />
        <div class="modal-actions">
          <button @click="cancelRename">Cancel</button>
          <button @click="finishRename" class="primary">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { libraryStore, allTags, actions } from '../stores/library';

const router = useRouter();
const editingTag = ref<string | null>(null);
const newTagName = ref('');
const renameInput = ref<HTMLInputElement | null>(null);

function goBack() {
  router.back();
}

function getFileCount(tag: string) {
  return libraryStore.files.filter(f => f.tags.includes(tag)).length;
}

function startRename(tag: string) {
  editingTag.value = tag;
  newTagName.value = tag;
  nextTick(() => renameInput.value?.focus());
}

async function finishRename() {
  if (editingTag.value && newTagName.value.trim() && newTagName.value !== editingTag.value) {
    await actions.renameTag(editingTag.value, newTagName.value.trim());
  }
  editingTag.value = null;
}

function cancelRename() {
  editingTag.value = null;
}

async function confirmDelete(tag: string) {
  if (confirm(`Are you sure you want to delete the tag "${tag}"? This will remove it from all files.`)) {
    await actions.deleteTag(tag);
  }
}
</script>

<style scoped>
.tag-manage-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: none;
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.tag-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 600px;
  margin: 0 auto;
}

.tag-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: var(--bg-secondary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.tag-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tag-badge {
  background-color: var(--hover-color);
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.tag-count {
  color: var(--text-secondary);
  font-size: 13px;
}

.action-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
}

.action-btn:hover {
  color: var(--text-primary);
  text-decoration: underline;
}

.action-btn.delete:hover {
  color: #ef4444;
}

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
  padding: 24px;
  border-radius: 8px;
  width: 300px;
}

.modal input {
  width: 100%;
  margin: 16px 0;
  padding: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.modal-actions button {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
}

.modal-actions button.primary {
  background: var(--text-secondary); /* Accent style */
  color: white;
  border: none;
}
</style>
