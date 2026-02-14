<template>
  <div class="setting-view">
    <h1>{{ t('settings.title') }}</h1>
    <div class="settings-container">
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">{{ t('language.title') }}</span>
        </div>
        <select v-model="locale" @change="changeLanguage" class="language-select">
          <option value="zh">{{ t('language.zh') }}</option>
          <option value="en">{{ t('language.en') }}</option>
        </select>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">{{ t('settings.globalScale.label') }}</span>
          <span class="setting-desc">{{ t('settings.globalScale.desc') }}</span>
        </div>
        <div class="scale-control">
          <input
              type="range"
              v-model.number="localGlobalScale"
              min="0.8"
              max="1.3"
              step="0.1"
              class="scale-slider"
              @change="handleScaleChange"
          />
          <span class="scale-value">{{ localGlobalScale.toFixed(1) }}x</span>
        </div>
      </div>

      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">{{ t('settings.autostart.label') }}</span>
          <span class="setting-desc">{{ t('settings.autostart.desc') }}</span>
        </div>
        <label class="switch">
          <input type="checkbox" v-model="isAutoStartEnabled" @change="toggleAutoStart">
          <span class="slider round"></span>
        </label>
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
import {ref, onMounted, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {isEnabled, enable, disable} from '@tauri-apps/plugin-autostart';
import {libraryStore} from '../stores/library';
import GlobalDragOverlay from '../components/GlobalDragOverlay.vue';

const {t, locale} = useI18n();
const isAutoStartEnabled = ref(false);
// Local ref for deferred update
const localGlobalScale = ref(libraryStore.ui.globalScale);

// Sync local ref if store changes externally
watch(() => libraryStore.ui.globalScale, (newVal) => {
  localGlobalScale.value = newVal;
});

onMounted(async () => {
  try {
    isAutoStartEnabled.value = await isEnabled();
  } catch (error) {
    console.error('Failed to check autostart status:', error);
  }
});

function changeLanguage() {
  localStorage.setItem('locale', locale.value);
}

function handleScaleChange() {
  // Commit to store and localStorage on release (change event)
  libraryStore.ui.globalScale = localGlobalScale.value;
  localStorage.setItem('globalScale', String(libraryStore.ui.globalScale));
}

async function toggleAutoStart() {
  try {
    if (isAutoStartEnabled.value) {
      await enable();
    } else {
      await disable();
    }
  } catch (error) {
    console.error('Failed to toggle autostart:', error);
    isAutoStartEnabled.value = !isAutoStartEnabled.value;
  }
}
</script>

<style scoped>
.setting-view {
  height: 100%;
  padding: 24px 32px;
  overflow-y: auto;
  position: relative;
}

h1 {
  font-size: 24px;
  margin-bottom: 32px;
  color: var(--text-primary);
  font-weight: 500;
}

.settings-container {
  max-width: 600px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 15px;
}

.setting-desc {
  font-size: 13px;
  color: var(--text-secondary);
}

.language-select {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 14px;
}

.language-select:hover {
  border-color: var(--text-primary);
}

.scale-control {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 180px;
}

.scale-slider {
  flex: 1;
  cursor: pointer;
  height: 4px;
  -webkit-appearance: none;
  background: var(--border-color);
  border-radius: 2px;
  outline: none;
}

.scale-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--text-primary);
  cursor: pointer;
  transition: background 0.2s;
}

.scale-slider::-webkit-slider-thumb:hover {
  background: var(--text-secondary);
}

.scale-value {
  font-size: 14px;
  color: var(--text-secondary);
  min-width: 32px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--border-color);
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #0078d4;
}

input:focus + .slider {
  box-shadow: 0 0 1px #0078d4;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.slider.round {
  border-radius: 24px;
}

.slider.round:before {
  border-radius: 50%;
}
</style>