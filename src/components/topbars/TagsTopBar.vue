<template>
  <div class="tags-top-bar" data-tauri-drag-region>
    <button @click="goBack" class="back-btn" data-tauri-drag-region="false">
      ← {{ t('tagManage.back') }}
    </button>

    <div class="title">{{ t('tagManage.title') }}</div>

    <div class="spacer"></div>

    <button @click="openCreateGroup" class="action-btn create" data-tauri-drag-region="false">
      <v-icon name="co-plus" scale="0.8"/>
      {{ t('tagManage.addGroup') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import {useI18n} from 'vue-i18n';
import {useRouter} from 'vue-router';
import {libraryStore} from '../../stores/library';

const {t} = useI18n();
const router = useRouter();

function goBack() {
  router.back();
}

function openCreateGroup() {
  libraryStore.ui.tagGroupModal.visible = true;
  libraryStore.ui.tagGroupModal.isEdit = false;
  libraryStore.ui.tagGroupModal.name = '';
  libraryStore.ui.tagGroupModal.color = '';
}
</script>

<style scoped>
.tags-top-bar {
  display: flex;
  align-items: center;
  padding: 0 16px;
  width: 100%;
  gap: 16px;
}

.spacer {
  flex: 1;
}

.back-btn {
  background: none;
  border: 1px solid var(--border-color);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
}

.back-btn:hover {
  background-color: var(--hover-color);
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
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
  color: var(--text-primary);
  font-size: 14px;
}

.action-btn.create:hover {
  background-color: var(--hover-color);
}
</style>
