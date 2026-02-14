<template>
  <div v-if="visible" class="preview-modal" @click.self="$emit('close')">
    <div class="modal-content" :class="{ 'doc-content': isDocument || isCode }">

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <v-icon name="fa-spinner" animation="spin" scale="2"/>
        <span>{{ t('library.loading') }}</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <v-icon name="md-erroroutline" scale="3"/>
        <p>{{ error }}</p>
        <button @click="$emit('open')">{{ t('library.openFile') }}</button>
      </div>

      <!-- Image -->
      <div v-else-if="isImage" class="preview-image">
        <img :src="fileUrl" alt="Preview"/>
      </div>

      <!-- Video -->
      <div v-else-if="isVideo" class="preview-video">
        <video controls autoplay :src="fileUrl"></video>
      </div>

      <!-- PDF -->
      <div v-else-if="isPdf" class="preview-pdf">
        <iframe :src="fileUrl" type="application/pdf" width="100%" height="100%"></iframe>
      </div>

      <!-- Text / Code -->
      <div v-else-if="isCode || isText" class="preview-text">
        <pre><code>{{ textContent }}</code></pre>
      </div>

      <!-- Docx (Container) -->
      <div v-else-if="isDocx" class="preview-docx" ref="docxContainer">
        <!-- Loading state overlay for DOCX -->
        <div v-if="loading" class="docx-loading-state">
          <v-icon name="fa-spinner" animation="spin" scale="2"/>
          <span>{{ t('library.loading') }}</span>
        </div>
      </div>

      <!-- Xlsx (HTML) -->
      <div v-else-if="isXlsx" class="preview-xlsx" v-html="xlsxContent"></div>

      <!-- EPUB -->
      <div v-else-if="isEpub" class="preview-epub" @wheel.prevent="handleEpubWheel">
        <!-- Loading state overlay for EPUB -->
        <div v-if="loading" class="epub-loading-state">
          <v-icon name="fa-spinner" animation="spin" scale="2"/>
          <span>{{ t('library.loading') }}</span>
        </div>
        <div class="epub-container" ref="epubContainer"></div>
        <div class="epub-controls">
          <button @click.stop="epubPrev" class="nav-btn prev" title="Previous Page">
            <v-icon name="co-caret-left" scale="2"/>
          </button>
          <button @click.stop="epubNext" class="nav-btn next" title="Next Page">
            <v-icon name="co-caret-right" scale="2"/>
          </button>
        </div>
      </div>

      <!-- Generic Fallback -->
      <div v-else class="preview-generic">
        <div class="icon">
          <v-icon v-if="mimeType.startsWith('audio/')" name="fc-audio-file" scale="4"/>
          <v-icon v-else-if="isDocument" name="fc-document" scale="4"/>
          <v-icon v-else name="fc-file" scale="4"/>
        </div>
        <div class="filename">{{ fileName }}</div>
        <div class="hint">{{ t('library.previewNotAvailable') }}</div>
        <button @click="$emit('open')">{{ t('library.openFile') }}</button>
      </div>
    </div>
    <button class="close-btn" @click="$emit('close')">&times;</button>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, watch, nextTick, onUnmounted} from 'vue';
import {useI18n} from 'vue-i18n';
import {convertFileSrc} from '@tauri-apps/api/core';
import {readFile, readTextFile} from '@tauri-apps/plugin-fs';
import {renderAsync} from 'docx-preview';
import * as XLSX from 'xlsx';
import Epub from 'epubjs';

const {t} = useI18n();

const props = defineProps({
  visible: Boolean,
  filePath: String,
  fileName: String,
  fileType: {
    type: String,
    default: ''
  },
  mimeType: {
    type: String,
    default: ''
  }
});

defineEmits(['close', 'open']);

const loading = ref(false);
const error = ref<string | null>(null);
const textContent = ref('');
const xlsxContent = ref('');
const docxContainer = ref<HTMLElement | null>(null);
const epubContainer = ref<HTMLElement | null>(null);

// Track if we're waiting for epubContainer to be available
let waitingForEpubContainer = false;

// Define types for epubjs internally since we can't import types easily in Vue SFC without issues sometimes
interface Book {
  renderTo(element: HTMLElement | string, options?: any): Rendition;

  destroy(): void;

  ready: Promise<void>;
  locations: any;
}

interface Rendition {
  display(target?: string): Promise<void>;

  prev(): void;

  next(): void;

  on(event: string, cb: Function): void;
}

let epubBook: Book | null = null;
let epubRendition: Rendition | null = null;
let loadingEpubFile = ref<string | null>(null); // Track which file is currently loading

const fileUrl = computed(() => {

  return props.filePath ? convertFileSrc(props.filePath) : '';
});

const isImage = computed(() => {
  return props.mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(props.fileType.toLowerCase());
});

const isVideo = computed(() => {
  return props.mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi'].includes(props.fileType.toLowerCase());
});

const isPdf = computed(() => props.fileType.toLowerCase() === 'pdf');

const isDocx = computed(() => props.fileType.toLowerCase() === 'docx');
const isXlsx = computed(() => ['xls', 'xlsx', 'csv'].includes(props.fileType.toLowerCase()));
const isEpub = computed(() => props.fileType.toLowerCase() === 'epub');

const isText = computed(() => ['txt', 'md', 'markdown', 'log', 'ini', 'conf', 'cfg'].includes(props.fileType.toLowerCase()));
const isCode = computed(() => ['json', 'xml', 'html', 'css', 'js', 'ts', 'vue', 'rs', 'py', 'java', 'c', 'cpp', 'h', 'sh', 'bat', 'cmd', 'ps1', 'yaml', 'yml', 'toml'].includes(props.fileType.toLowerCase()));

const isDocument = computed(() => {
  const docs = ['pdf', 'doc', 'docx', 'txt', 'md', 'markdown', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'csv', 'json', 'xml', 'epub'];
  return docs.includes(props.fileType.toLowerCase());
});

watch(() => props.visible, (val) => {
  if (val) {
    loadContent();
  } else {
    // Cleanup
    textContent.value = '';
    xlsxContent.value = '';
    error.value = null;
    destroyEpub();
  }
});

watch(() => props.filePath, () => {
  if (props.visible) {
    loadContent();
  }
});

// Watch epubContainer to trigger loading when it becomes available
watch(epubContainer, (newVal) => {
  if (newVal && waitingForEpubContainer && props.visible && isEpub.value) {
    waitingForEpubContainer = false;
    loadEpub();
  }
});

onUnmounted(() => {
  destroyEpub();
  waitingForEpubContainer = false;
});

function destroyEpub() {
  if (epubBook) {
    epubBook.destroy();
    epubBook = null;
    epubRendition = null;
  }
  loadingEpubFile.value = null; // Clear guard when destroyed
}

async function loadContent() {
  if (!props.filePath) return;

  loading.value = false;
  error.value = null;
  textContent.value = '';
  xlsxContent.value = '';

  // Clear EPUB loading guard if switching to non-EPUB file
  if (!isEpub.value) {
    loadingEpubFile.value = null;
  }

  if (isImage.value || isVideo.value) return; // Native handling via URL

  if (isPdf.value) return; // Native iframe handling via URL

  loading.value = true;

  try {
    if (isText.value || isCode.value) {
      textContent.value = await readTextFile(props.filePath);
    } else if (isDocx.value) {
      const data = await readFile(props.filePath);
      await nextTick(); // Wait for ref to be available
      if (docxContainer.value) {
        // docx-preview expects Blob or ArrayBuffer. Uint8Array is compatible with rendering logic usually, 
        // but renderAsync takes Buffer|ArrayBuffer|Blob.
        await renderAsync(data.buffer, docxContainer.value, undefined, {
          inWrapper: false,
          ignoreWidth: false,
          ignoreHeight: false
        });
      }
    } else if (isXlsx.value) {
      const data = await readFile(props.filePath);
      const workbook = XLSX.read(data, {type: 'array'});
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      xlsxContent.value = XLSX.utils.sheet_to_html(worksheet, {id: 'excel-table'});
    } else if (isEpub.value) {
      // Check if epubContainer is available
      if (epubContainer.value) {
        await loadEpub();
      } else {
        // Container not ready yet, set flag and wait for watcher
        waitingForEpubContainer = true;
      }
    }
  } catch (e) {
    console.error('Failed to load preview:', e);
    error.value = t('library.previewFailed') || 'Failed to load preview';
  } finally {
    loading.value = false;
  }
}

async function loadEpub() {
  // This function should only be called when epubContainer.value is guaranteed to exist
  if (!epubContainer.value) {
    console.error('EPUB container not available');
    return;
  }

  // Prevent loading if modal is not visible
  if (!props.visible) {
    console.log('EPUB load aborted: modal not visible');
    return;
  }

  // Prevent concurrent loadEpub calls
  if (loadingEpubFile.value === props.filePath) {
    console.log('EPUB load already in progress for:', props.filePath);
    return;
  }

  destroyEpub();

  // Log container dimensions for debugging
  const containerRect = epubContainer.value.getBoundingClientRect();
  console.log('EPUB container dimensions:', {
    width: containerRect.width,
    height: containerRect.height,
    hasDimensions: containerRect.width > 0 && containerRect.height > 0
  });

  // If container has no dimensions, wait a bit for DOM to settle
  if (containerRect.width === 0 || containerRect.height === 0) {
    console.warn('EPUB container has no dimensions, waiting...');
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  try {
    // Check again before proceeding (modal might have closed during ticks)
    if (!props.visible || !epubContainer.value) {
      console.log('EPUB load aborted: modal closed or container missing');
      loadingEpubFile.value = null;
      return;
    }

    loadingEpubFile.value = props.filePath!; // Set guard to prevent concurrent loads
    console.log('Loading EPUB from file:', props.filePath);

    // Read file as ArrayBuffer to avoid Tauri protocol issues with epubjs
    const data = await readFile(props.filePath!);
    console.log('EPUB file read, size:', data.byteLength);

    // Check once more after async file read
    if (!props.visible || !epubContainer.value) {
      console.log('EPUB load aborted: modal closed or container missing after file read');
      loadingEpubFile.value = null;
      return;
    }

    // Create book instance from ArrayBuffer
    epubBook = Epub(data.buffer);

    // Wait for book to be ready before rendering
    await epubBook.ready;
    console.log('EPUB book is ready');

    // Create rendition
    epubRendition = epubBook.renderTo(epubContainer.value, {
      width: '100%',
      height: '100%',
      flow: 'paginated'
    });

    // Display first page
    await epubRendition.display();
    console.log('EPUB rendition displayed');

    // Add wheel event listener to iframe for scrolling through pages
    epubRendition.on('rendered', () => {
      const iframe = epubContainer.value?.querySelector('iframe');
      if (iframe?.contentWindow) {
        iframe.contentWindow.addEventListener('wheel', (e: WheelEvent) => {
          e.preventDefault();
          handleEpubWheel(e);
        }, {passive: false});
      }
    });

    // Hook for location update if needed
    epubRendition.on('relocated', (_location: any) => {
      // console.log(location);
    });
  } catch (e) {
    console.error('Failed to load EPUB:', e);
    error.value = t('library.previewFailed') || 'Failed to load EPUB preview';
    loadingEpubFile.value = null; // Clear guard on error
  }
}

function epubPrev() {
  if (epubRendition) epubRendition.prev();
}

function epubNext() {
  if (epubRendition) epubRendition.next();
}

function handleEpubWheel(e: WheelEvent) {
  if (!epubRendition) return;

  // deltaY > 0 means scroll down → next page
  // deltaY < 0 means scroll up → prev page
  if (e.deltaY > 0) {
    epubRendition.next();
  } else if (e.deltaY < 0) {
    epubRendition.prev();
  }
}
</script>

<style scoped>
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}

.modal-content {
  max-width: 90%;
  max-height: 90%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.modal-content.doc-content {
  width: 80%;
  height: 90%;
  background: var(--bg-primary);
  border-radius: 8px;
  overflow: hidden;
  display: block; /* Important for scroll */
}

.preview-image img,
.preview-video video {
  max-width: 100%;
  max-height: 90vh;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
}

.preview-pdf {
  width: 100%;
  height: 100%;
  background: white;
}

.preview-text {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 20px;
  background: #1e1e1e; /* Dark theme for code */
  color: #d4d4d4;
  text-align: left;
}

.preview-text pre {
  margin: 0;
  font-family: 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.preview-docx {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 20px;
  background: white;
  color: black; /* Ensure black text */
  position: relative; /* For loading overlay positioning */
}

.docx-loading-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 10;
  color: var(--text-primary);
}

.preview-xlsx {
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 20px;
  background: white;
  color: black;
}

/* Excel Table Styles */
:deep(table) {
  border-collapse: collapse;
  width: 100%;
}

:deep(td), :deep(th) {
  border: 1px solid #ccc;
  padding: 4px 8px;
  white-space: nowrap;
}

.preview-generic, .loading-state, .error-state {
  background-color: var(--bg-secondary);
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  min-width: 300px;
  color: var(--text-primary);
}

/* Fill container when in doc mode */
.modal-content.doc-content .preview-generic,
.modal-content.doc-content .loading-state,
.modal-content.doc-content .error-state {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 0;
}

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.preview-generic .icon {
  font-size: 48px;
  font-weight: bold;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.preview-generic .filename {
  font-size: 18px;
  color: var(--text-primary);
  margin-bottom: 24px;
}

.preview-generic .hint {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.preview-generic button, .error-state button {
  padding: 8px 16px;
  background-color: var(--text-primary);
  color: var(--bg-primary);
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 24px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 2100;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}

.preview-epub {
  width: 100%;
  height: 100%;
  position: relative;
  background: white;
  overflow: hidden;
}

.epub-container {
  width: 100%;
  height: 100%;
}

.epub-loading-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  z-index: 10;
  color: var(--text-primary);
}

.epub-controls {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  pointer-events: none;
}

.nav-btn {
  background: rgba(0, 0, 0, 0.3);
  color: white;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transition: background 0.2s;
}

.nav-btn:hover {
  background: rgba(0, 0, 0, 0.6);
}
</style>

