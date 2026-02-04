<template>
  <div class="tag-manage-view">
    <div class="header">
      <button @click="goBack" class="back-btn">← {{ t('tagManage.back') }}</button>
      <h2>{{ t('tagManage.title') }}</h2>
      <div class="header-actions">
        <button @click="openCreateGroup" class="action-btn create">
          <v-icon name="co-plus" scale="0.8" /> {{ t('tagManage.addGroup') }}
        </button>
      </div>
    </div>

    <div class="content">
      <div v-if="libraryStore.tags.length === 0 && libraryStore.groups.length === 0" class="empty-state">
        {{ t('tagManage.noTags') }}
      </div>
      
      <div v-else class="tree-container">
        
        <!-- Groups -->
        <div v-for="group in libraryStore.groups" :key="group.id" class="group-block">
          <div class="group-row">
            <span class="group-name">{{ group.name }}</span>
            <div class="actions">
              <button @click="editGroup(group)" class="small-btn">✎</button>
              <button @click="deleteGroup(group.id)" class="small-btn danger">×</button>
            </div>
          </div>

          <!-- Tags in Group -->
          <div class="group-tags">
            <template v-for="tag in getGroupTags(group.id)" :key="tag.id">
              <div class="tag-row">
                <span class="tag-badge">{{ tag.name }}</span>
                <span class="tag-count">{{ getFileCount(tag.id) }}</span>
                <div class="actions">
                  <button @click="editTag(tag)" class="small-btn">✎</button>
                  <button @click="deleteTag(tag.id)" class="small-btn danger">×</button>
                </div>
              </div>
              <!-- Children -->
              <div v-for="child in getChildTags(tag.id)" :key="child.id" class="tag-row child">
                <span class="child-indicator">↳</span>
                <span class="tag-badge">{{ child.name }}</span>
                <span class="tag-count">{{ getFileCount(child.id) }}</span>
                <div class="actions">
                  <button @click="editTag(child)" class="small-btn">✎</button>
                  <button @click="deleteTag(child.id)" class="small-btn danger">×</button>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Ungrouped -->
        <div class="group-block" v-if="getUngroupedRootTags().length > 0">
          <div class="group-row">
            <span class="group-name">{{ t('sidebar.untagged') }} / Other</span>
          </div>
          <div class="group-tags">
            <template v-for="tag in getUngroupedRootTags()" :key="tag.id">
              <div class="tag-row">
                <span class="tag-badge">{{ tag.name }}</span>
                <span class="tag-count">{{ getFileCount(tag.id) }}</span>
                <div class="actions">
                  <button @click="editTag(tag)" class="small-btn">✎</button>
                  <button @click="deleteTag(tag.id)" class="small-btn danger">×</button>
                </div>
              </div>
              <!-- Children -->
              <div v-for="child in getChildTags(tag.id)" :key="child.id" class="tag-row child">
                <span class="child-indicator">↳</span>
                <span class="tag-badge">{{ child.name }}</span>
                <span class="tag-count">{{ getFileCount(child.id) }}</span>
                <div class="actions">
                  <button @click="editTag(child)" class="small-btn">✎</button>
                  <button @click="deleteTag(child.id)" class="small-btn danger">×</button>
                </div>
              </div>
            </template>
          </div>
        </div>

      </div>
    </div>

    <!-- Edit/Create Group Modal -->
    <div v-if="groupModal.visible" class="modal-backdrop" @click="closeGroupModal">
      <div class="modal" @click.stop>
        <h3>{{ groupModal.isEdit ? 'Edit Group' : 'Create Group' }}</h3>
        
        <label class="input-label">Group Name</label>
        <input v-model="groupModal.name" class="input-field" />
        
        <label class="input-label">Color (Hex)</label>
        <input v-model="groupModal.color" placeholder="#RRGGBB" class="input-field" />
        
        <div class="modal-actions">
          <button @click="closeGroupModal">Cancel</button>
          <button @click="saveGroup" class="primary">Save</button>
        </div>
      </div>
    </div>

    <!-- Edit/Create Tag Modal -->
    <div v-if="tagModal.visible" class="modal-backdrop" @click="closeTagModal">
      <div class="modal" @click.stop>
        <h3>{{ tagModal.isEdit ? 'Edit Tag' : 'Create Tag' }}</h3>
        <input v-model="tagModal.name" placeholder="Tag Name" class="input-field" />
        
        <label>Group:</label>
        <select v-model="tagModal.groupId" class="input-field">
          <option :value="null">None</option>
          <option v-for="g in libraryStore.groups" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>

        <!-- Parent Tag selection disabled -->
        <!-- <label>Parent Tag:</label>
        <select v-model="tagModal.parentId" class="input-field">
          <option :value="null">None</option>
          <option v-for="t in validParentTags" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select> -->

        <div class="modal-actions">
          <button @click="closeTagModal">Cancel</button>
          <button @click="saveTag" class="primary">Save</button>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <div v-if="confirmModal.visible" class="modal-backdrop" @click="closeConfirmModal">
      <div class="modal" @click.stop>
        <h3>{{ confirmModal.title }}</h3>
        <p class="modal-message">{{ confirmModal.message }}</p>
        <div class="modal-actions">
          <button @click="closeConfirmModal">Cancel</button>
          <button @click="confirmAction" class="primary danger">Delete</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { libraryStore, actions, Tag, TagGroup } from '../stores/library';
import { notify } from '../stores/notification';

const { t } = useI18n();
const router = useRouter();

function goBack() {
  router.back();
}

// Helpers
function getGroupTags(groupId: string) {
  return libraryStore.tags.filter(t => t.group_id === groupId && !t.parent_id);
}
function getUngroupedRootTags() {
  return libraryStore.tags.filter(t => !t.group_id && !t.parent_id);
}
function getChildTags(parentId: string) {
  return libraryStore.tags.filter(t => t.parent_id === parentId);
}
function getFileCount(tagId: string) {
  return libraryStore.files.filter(f => f.tag_ids.includes(tagId)).length;
}

// Group Modal
const groupModal = reactive({
  visible: false,
  isEdit: false,
  id: '',
  name: '',
  color: '' as string | null
});

function openCreateGroup() {
  groupModal.visible = true;
  groupModal.isEdit = false;
  groupModal.name = '';
  groupModal.color = '';
}

function editGroup(group: TagGroup) {
  groupModal.visible = true;
  groupModal.isEdit = true;
  groupModal.id = group.id;
  groupModal.name = group.name;
  groupModal.color = group.color || '';
}

function closeGroupModal() {
  groupModal.visible = false;
}

async function saveGroup() {
  if (!groupModal.name) return;
  
  // Validate duplicate name
  const trimmedName = groupModal.name.trim();
  const duplicate = libraryStore.groups.find(g => 
    g.name.toLowerCase() === trimmedName.toLowerCase() && 
    g.id !== groupModal.id
  );

  if (duplicate) {
    notify(t('tagManage.duplicateGroupError'), 'error');
    return;
  }
  
  // Validate color
  const color = groupModal.color ? groupModal.color.trim() : null;
  if (color) {
    const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
    if (!hexRegex.test(color)) {
      alert('Invalid color format. Please use Hex code (e.g. #FF0000).');
      return;
    }
  }

  if (groupModal.isEdit) {
    await actions.updateTagGroup(groupModal.id, trimmedName, color);
  } else {
    await actions.createTagGroup(trimmedName, color);
  }
  closeGroupModal();
}

// Confirmation Modal
const confirmModal = reactive({
  visible: false,
  title: '',
  message: '',
  action: null as (() => Promise<void>) | null
});

function closeConfirmModal() {
  confirmModal.visible = false;
  confirmModal.action = null;
}

async function confirmAction() {
  if (confirmModal.action) {
    await confirmModal.action();
  }
  closeConfirmModal();
}

function deleteGroup(id: string) {
  confirmModal.title = t('tagManage.deleteGroupTitle');
  confirmModal.message = t('tagManage.deleteGroupMessage');
  confirmModal.visible = true;
  confirmModal.action = async () => {
    await actions.deleteTagGroup(id);
  };
}

// Tag Modal
const tagModal = reactive({
  visible: false,
  isEdit: false,
  id: '',
  name: '',
  parentId: null as string | null,
  groupId: null as string | null
});

/*
const validParentTags = computed(() => {
  return libraryStore.tags.filter(t => t.id !== tagModal.id); // Prevent self-parenting
});
*/

// Removed openCreateTag as user does not want to create tags here

function editTag(tag: Tag) {
  tagModal.visible = true;
  tagModal.isEdit = true;
  tagModal.id = tag.id;
  tagModal.name = tag.name;
  tagModal.parentId = tag.parent_id;
  tagModal.groupId = tag.group_id;
}

function closeTagModal() {
  tagModal.visible = false;
}

async function saveTag() {
  if (!tagModal.name) return;
  if (tagModal.isEdit) {
    // Check if renaming or moving
    const tag = libraryStore.tags.find(t => t.id === tagModal.id);
    if (tag) {
      if (tag.name !== tagModal.name) {
        await actions.renameTag(tagModal.id, tagModal.name);
      }
      if (tag.parent_id !== tagModal.parentId || tag.group_id !== tagModal.groupId) {
        await actions.moveTag(tagModal.id, tagModal.parentId, tagModal.groupId);
      }
    }
  } 
  // Removed create logic from here as entry point is removed, but keeping function structure for edit
  closeTagModal();
}

async function deleteTag(id: string) {
  // Directly delete without confirmation as requested
  await actions.deleteTag(id);
}
</script>

<style scoped>
/* ... (existing styles) ... */

.modal-message {
  margin-bottom: 24px;
  color: var(--text-primary);
  line-height: 1.5;
}

.modal-actions button.danger {
  background: #ef4444;
  color: white;
  border: none;
}

</style>

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
  justify-content: space-between;
}

.back-btn {
  background: none;
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  margin-right: 16px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.action-btn.create {
  background-color: var(--bg-secondary);
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.tree-container {
  max-width: 800px;
  margin: 0 auto;
}

.group-block {
  margin-bottom: 24px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: var(--bg-secondary);
  overflow: hidden;
}

.group-row {
  padding: 12px;
  background-color: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-color);
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.group-tags {
  padding: 8px 0;
}

.tag-row {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 12px;
}

.tag-row:hover {
  background-color: var(--hover-color);
}

.tag-row.child {
  padding-left: 32px;
}

.child-indicator {
  color: var(--text-secondary);
  font-size: 12px;
}

.tag-badge {
  background-color: var(--bg-tertiary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

.tag-count {
  color: var(--text-secondary);
  font-size: 12px;
  flex: 1;
}

.actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.tag-row:hover .actions,
.group-row:hover .actions {
  opacity: 1;
}

.small-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
}

.small-btn:hover {
  color: var(--text-primary);
}

.small-btn.danger:hover {
  color: #ef4444;
}

/* Modal */
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
  width: 400px;
  border: 1px solid var(--border-color);
}

.input-label {
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  color: var(--text-secondary);
}

.input-field {
  width: 100%;
  margin-bottom: 16px;
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
  margin-top: 16px;
}

.modal-actions button {
  padding: 8px 16px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
}

.modal-actions button.primary {
  background: var(--text-primary);
  color: var(--bg-primary);
  border: none;
}
</style>
