<template>
  <div 
    v-if="visible" 
    class="context-menu" 
    :style="{ top: `${position.y}px`, left: `${position.x}px` }"
  >
    <div 
      v-for="item in items" 
      :key="item.label" 
      class="menu-item"
      @click="handleAction(item)"
    >
      {{ item.label }}
    </div>
  </div>
  <div v-if="visible" class="menu-backdrop" @click="$emit('close')"></div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';

interface MenuItem {
  label: string;
  action: string;
}

defineProps({
  visible: Boolean,
  position: {
    type: Object as PropType<{ x: number, y: number }>,
    default: () => ({ x: 0, y: 0 })
  },
  items: {
    type: Array as PropType<MenuItem[]>,
    default: () => []
  }
});

const emit = defineEmits(['close', 'action']);

function handleAction(item: MenuItem) {
  emit('action', item.action);
  emit('close');
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 160px;
  z-index: 1000;
}

.menu-item {
  padding: 8px 16px;
  font-size: 14px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: var(--hover-color);
}

.menu-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
  background: transparent;
}
</style>
