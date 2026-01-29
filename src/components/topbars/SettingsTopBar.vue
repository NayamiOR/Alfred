<template>
  <div class="settings-top-bar" data-tauri-drag-region>
    <div class="title">{{ t('settings.title') }}</div>
    <div class="spacer"></div>
    <WindowControls />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import WindowControls from '../WindowControls.vue';

const { t } = useI18n();
</script>

<style scoped>
.settings-top-bar {
  display: flex;
  align-items: center;
  padding: 0 16px;
  width: 100%;
}

.spacer {
  flex: 1;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}
</style>