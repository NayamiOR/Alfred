<template>
  <div 
    class="library-view" 
    :class="{ 'sidebar-hidden': !isSidebarVisible }"
  >
    <SideBar />
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
import { ref, onMounted } from 'vue';
import FileLibrary from '../components/FileLibrary.vue';
import SideBar from '../components/SideBar.vue';
import GlobalDragOverlay from '../components/GlobalDragOverlay.vue';
import { libraryStore } from '../stores/library';

const isSidebarVisible = ref(true);

onMounted(() => {
  window.addEventListener('toggle-sidebar', () => {
    isSidebarVisible.value = !isSidebarVisible.value;
  });
});
</script>

<style scoped>
.library-view {
  height: 100%;
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 0;
  transition: grid-template-columns 0.2s ease-in-out;
}

.library-view.sidebar-hidden {
  grid-template-columns: 0px 1fr;
}

.main-content-wrapper {
  position: relative;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

aside {
  transition: opacity 0.2s ease-in-out, padding 0.2s ease-in-out;
}

.sidebar-hidden aside {
  opacity: 0;
  pointer-events: none;
  padding: 0;
  border: none;
}
</style>