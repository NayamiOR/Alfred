<template>
  <div class="tag-manage-view">
    <div class="header">
      <button @click="goBack" class="back-btn">← {{ t('tagManage.back') }}</button>
      <h2>{{ t('tagManage.title') }}</h2>
    </div>

    <div class="content">
      <div v-if="allTags.length === 0" class="empty-state">
        {{ t('tagManage.noTags') }}
      </div>
      
      <div v-else class="tag-list">
        <div v-for="tag in allTags" :key="tag" class="tag-row">
          <div class="tag-info">
            <span class="tag-badge">{{ tag }}</span>
            <span class="tag-count">{{ getFileCount(tag) }} {{ t('tagManage.files') }}</span>
          </div>
          <div class="tag-actions">
            <button @click="startRename(tag)" class="action-btn">{{ t('tagManage.rename') }}</button>
            <button @click="deleteTag(tag)" class="action-btn delete">{{ t('tagManage.delete') }}</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="editingTag" class="modal-backdrop" @click="cancelRename">
      <div class="modal" @click.stop>
        <h3>{{ t('tagManage.renameTitle') }}</h3>
        <input 
          v-model="newTagName" 
          @keyup.enter="finishRename"
          @keyup.esc="cancelRename"
          ref="renameInput"
          :placeholder="t('tagManage.newName')"
        />
        <div class="modal-actions">
          <button @click="cancelRename">{{ t('tagManage.cancel') }}</button>
          <button @click="finishRename" class="primary">{{ t('tagManage.save') }}</button>
        </div>
      </div>
    </div>

    <GlobalDragOverlay 
      :visible="libraryStore.ui.dragState.isDragging" 
      :message="libraryStore.ui.dragState.message" 
      :type="libraryStore.ui.dragState.type" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { libraryStore, allTags, actions } from '../stores/library';
import GlobalDragOverlay from '../components/GlobalDragOverlay.vue';

const { t } = useI18n();
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

async function deleteTag(tag: string) {
  await actions.deleteTag(tag);
}
</script>

<style scoped>
.tag-manage-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  position: relative;
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
  overflow: hidden; /* Allow content to shrink */
  flex: 1;
}

.tag-badge {
  background-color: var(--hover-color);
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 250px; /* Sensible limit for the badge itself */
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
