<template>
  <div 
    class="library-view" 
    :class="{ 'sidebar-hidden': !isSidebarVisible, 'resizing': isResizing }"
    :style="gridStyle"
  >
    <SideBar />
    
    <!-- Resizer Handle -->
    <div 
      class="sidebar-resizer" 
      v-show="isSidebarVisible"
      @mousedown.prevent="startResizing"
    ></div>

    <div class="main-content-wrapper">
      <FileLibrary />
      <GlobalDragOverlay 
        :visible="libraryStore.ui.dragState.isDragging" 
        :message="libraryStore.ui.dragState.message" 
        :type="libraryStore.ui.dragState.type" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import FileLibrary from '../components/FileLibrary.vue';
import SideBar from '../components/SideBar.vue';
import GlobalDragOverlay from '../components/GlobalDragOverlay.vue';
import { libraryStore } from '../stores/library';

const isSidebarVisible = ref(true);
const sidebarWidth = ref(Math.max(200, Number(localStorage.getItem('sidebarWidth')) || 200));
const isResizing = ref(false);
const containerOffset = ref(0);

const gridStyle = computed(() => {
  return {
    gridTemplateColumns: isSidebarVisible.value ? `${sidebarWidth.value}px 1fr` : '0px 1fr'
  };
});

function startResizing() {
  const container = document.querySelector('.library-view') as HTMLElement;
  if (container) {
    containerOffset.value = container.getBoundingClientRect().left;
  }
  
  isResizing.value = true;
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', stopResizing);
}

function handleMouseMove(e: MouseEvent) {
  if (!isResizing.value) return;
  
  // Calculate new width relative to window/grid
  let newWidth = e.clientX - containerOffset.value;
  
  // Constraints
  if (newWidth < 200) newWidth = 200;
  if (newWidth > 600) newWidth = 600; // Reasonable max width
  
  sidebarWidth.value = newWidth;
}

function stopResizing() {
  isResizing.value = false;
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  localStorage.setItem('sidebarWidth', String(sidebarWidth.value));
  
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', stopResizing);
}

onMounted(() => {
  window.addEventListener('toggle-sidebar', () => {
    isSidebarVisible.value = !isSidebarVisible.value;
  });
});

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', stopResizing);
});
</script>

<style scoped>
.library-view {
  height: 100%;
  display: grid;
  /* grid-template-columns set via inline style */
  gap: 0;
  /* Removed transition for grid-cols to make resizing smooth, 
     but added transition for width when toggling? 
     Actually smooth transition conflicts with drag resize usually.
     I'll enable transition only when NOT resizing.
  */
  position: relative;
}

.library-view:not(.resizing) {
  /* Only animate when toggling, not resizing */
  transition: grid-template-columns 0.2s ease-in-out;
}

.main-content-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
  min-width: 0; /* Prevent grid blowout */
}

aside {
  transition: opacity 0.2s ease-in-out;
  overflow: hidden; /* Ensure content doesn't spill during resize/toggle */
}

.sidebar-hidden aside {
  opacity: 0;
  pointer-events: none;
}

.sidebar-resizer {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 5px;
  background: transparent;
  cursor: col-resize;
  z-index: 100;
  /* Position it at the right edge of the sidebar column */
  /* Since we don't have a container for just sidebar+resizer, 
     we rely on grid placement or left offset */
  /* Easier: place it in the first column and align right? 
     Or place absolute relative to library-view and left = sidebarWidth */
  left: v-bind('sidebarWidth + "px"');
  transform: translateX(-50%); /* Center over the line */
}

.sidebar-resizer:hover,
.sidebar-resizer:active {
  background: rgba(0, 120, 212, 0.1); /* Highlight on hover */
}
</style>