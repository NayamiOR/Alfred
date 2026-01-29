<template>
  <div class="setting-view">
    <h1>Settings</h1>
    <div class="settings-container">
      <div class="setting-item">
        <div class="setting-info">
          <span class="setting-label">Run on Startup</span>
          <span class="setting-desc">Automatically start Alfred when you log in</span>
        </div>
        <label class="switch">
          <input type="checkbox" v-model="isAutoStartEnabled" @change="toggleAutoStart">
          <span class="slider round"></span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { isEnabled, enable, disable } from '@tauri-apps/plugin-autostart';

const isAutoStartEnabled = ref(false);

onMounted(async () => {
  try {
    isAutoStartEnabled.value = await isEnabled();
  } catch (error) {
    console.error('Failed to check autostart status:', error);
  }
});

async function toggleAutoStart() {
  try {
    if (isAutoStartEnabled.value) {
      await enable();
    } else {
      await disable();
    }
  } catch (error) {
    console.error('Failed to toggle autostart:', error);
    // Revert switch on error
    isAutoStartEnabled.value = !isAutoStartEnabled.value;
  }
}
</script>

<style scoped>
.setting-view {
  height: 100%;
  padding: 24px 32px;
  overflow-y: auto;
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

/* Toggle Switch */
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