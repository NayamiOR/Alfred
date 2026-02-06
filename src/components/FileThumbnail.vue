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
import { readFile } from '@tauri-apps/plugin-fs';
import * as pdfjsLib from 'pdfjs-dist';
import Epub from 'epubjs';

// Set up PDF.js worker
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

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

async function generatePdfThumbnail(filePath: string): Promise<string> {
  const url = convertFileSrc(filePath);
  const loadingTask = pdfjsLib.getDocument(url);
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);
  
  const viewport = page.getViewport({ scale: 1 });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  // Calculate scale to fit 320px (matches backend logic)
  const MAX_SIZE = 320;
  const scale = Math.min(MAX_SIZE / viewport.width, MAX_SIZE / viewport.height);
  const scaledViewport = page.getViewport({ scale });

  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  if (!context) throw new Error('Canvas context not available');

  await page.render({
    canvasContext: context,
    viewport: scaledViewport,
    canvas: null
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.8);
}

async function generateEpubThumbnail(filePath: string): Promise<string> {
  // Read file as ArrayBuffer to avoid Tauri protocol issues with epubjs
  const data = await readFile(filePath);
  const book = Epub(data.buffer);

  try {
    await book.ready;
    const coverUrl = await book.coverUrl();
    if (coverUrl) {
      return coverUrl;
    }
    throw new Error("No cover found");
  } finally {
    if (book && typeof book.destroy === 'function') {
      book.destroy();
    }
  }
}

async function loadThumbnail() {
  if (loading.value || thumbnailUrl.value || error.value) return;
  
  if (props.file.mime_type.startsWith('image/')) {
    thumbnailUrl.value = convertFileSrc(props.file.path);
    return;
  }

  // Handle PDF on frontend
  if (props.file.extension.toLowerCase() === 'pdf') {
    loading.value = true;
    try {
      thumbnailUrl.value = await generatePdfThumbnail(props.file.path);
    } catch (e) {
      console.error('Failed to generate PDF thumbnail:', e);
      error.value = true;
    } finally {
      loading.value = false;
    }
    return;
  }

  // Handle EPUB on frontend
  if (props.file.extension.toLowerCase() === 'epub') {
    loading.value = true;
    try {
      thumbnailUrl.value = await generateEpubThumbnail(props.file.path);
    } catch (e) {
      console.error('Failed to generate EPUB thumbnail:', e);
      error.value = true;
    } finally {
      loading.value = false;
    }
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
    // console.error('Failed to load thumbnail:', e);
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
