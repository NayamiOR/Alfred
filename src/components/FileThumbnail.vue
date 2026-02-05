<template>
  <div class="file-thumbnail" ref="el">
    <!-- Folder -->
    <div v-if="file.extension === 'folder'" class="folder-icon">
      <v-icon name="fc-folder" :scale="iconScale" />
    </div>
    
    <!-- Image / Thumbnail -->
    <img 
      v-else-if="thumbnailUrl && !error" 
      :src="thumbnailUrl" 
      class="thumbnail-img" 
      :style="{ opacity: loading ? 0.5 : 1 }"
      @error="onError"
    />
    
    <!-- Fallback Icon -->
    <div v-else class="cover-placeholder">
      <v-icon v-if="file.mime_type.startsWith('image/')" name="fc-image-file" :scale="iconScale" />
      <v-icon v-else-if="file.mime_type.startsWith('video/')" name="fc-video-file" :scale="iconScale" />
      <v-icon v-else-if="file.mime_type.startsWith('audio/')" name="fc-audio-file" :scale="iconScale" />
      <v-icon v-else-if="isDocument(file.extension)" name="fc-document" :scale="iconScale" />
      <v-icon v-else name="fc-file" :scale="iconScale" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { FileItem, libraryStore } from '../stores/library';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';

const props = defineProps<{
  file: FileItem;
}>();

const el = ref<HTMLElement | null>(null);
const error = ref(false);
const loading = ref(false);
const thumbnailUrl = ref<string | null>(null);
let observer: IntersectionObserver | null = null;

const iconScale = computed(() => libraryStore.ui.isGridView ? 3.5 : 1.2);

function isDocument(ext: string) {
  const docs = ['pdf', 'doc', 'docx', 'txt', 'md', 'markdown', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'csv', 'json', 'xml', 'epub'];
  return docs.includes(ext.toLowerCase());
}

function onError() {
  error.value = true;
  loading.value = false;
}

async function loadThumbnail() {
  if (loading.value || thumbnailUrl.value || error.value) return;
  
  if (props.file.mime_type.startsWith('image/')) {
    thumbnailUrl.value = convertFileSrc(props.file.path);
    return;
  }

  // Only try generating thumbnails for media and docs
  const isMedia = props.file.mime_type.startsWith('video/') || props.file.mime_type.startsWith('audio/');
  const isDoc = isDocument(props.file.extension);

  if (!isMedia && !isDoc) return;

  loading.value = true;
  try {
    const path = await invoke<string>('get_file_thumbnail', { fileId: props.file.id });
    thumbnailUrl.value = convertFileSrc(path);
  } catch (e) {
    console.error('Failed to load thumbnail:', e);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (props.file.extension === 'folder') return;

  if (props.file.mime_type.startsWith('image/')) {
    // Images load immediately via native img tag logic (lazy via browser or immediate)
    // But we use convertFileSrc
    thumbnailUrl.value = convertFileSrc(props.file.path);
  } else {
    // Lazy load others
    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadThumbnail();
        if (observer) observer.disconnect();
      }
    });
    if (el.value) observer.observe(el.value);
  }
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});

// Watch for file change (recycling)
watch(() => props.file.id, () => {
  thumbnailUrl.value = null;
  error.value = false;
  loading.value = false;
  if (props.file.mime_type.startsWith('image/')) {
    thumbnailUrl.value = convertFileSrc(props.file.path);
  } else if (observer && el.value) {
    observer.disconnect();
    observer.observe(el.value);
  }
});
</script>

<style scoped>
.file-thumbnail {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.folder-icon, .cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--text-secondary);
}
</style>
