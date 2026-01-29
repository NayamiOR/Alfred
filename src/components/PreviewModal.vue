<template>
  <div v-if="visible" class="preview-modal" @click.self="$emit('close')">
    <div class="modal-content">
      <div v-if="isImage" class="preview-image">
        <img :src="fileUrl" alt="Preview" />
      </div>
      <div v-else-if="isVideo" class="preview-video">
        <video controls autoplay :src="fileUrl"></video>
      </div>
      <div v-else class="preview-generic">
        <div class="icon">
          <v-icon v-if="mimeType.startsWith('audio/')" name="fc-audio-file" scale="4" />
          <v-icon v-else-if="isDocument" name="fc-document" scale="4" />
          <v-icon v-else name="fc-file" scale="4" />
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
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { convertFileSrc } from '@tauri-apps/api/core';

const { t } = useI18n();

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

const fileUrl = computed(() => {
  return props.filePath ? convertFileSrc(props.filePath) : '';
});

const isImage = computed(() => {
  return props.mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(props.fileType.toLowerCase());
});

const isVideo = computed(() => {
  return props.mimeType.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi'].includes(props.fileType.toLowerCase());
});

const isDocument = computed(() => {
  const docs = ['pdf', 'doc', 'docx', 'txt', 'md', 'markdown', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'csv', 'json', 'xml', 'epub'];
  return docs.includes(props.fileType.toLowerCase());
});
</script>

<style scoped>
.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.8);
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
}

.preview-image img,
.preview-video video {
  max-width: 100%;
  max-height: 80vh;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
}

.preview-generic {
  background-color: var(--bg-secondary);
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  min-width: 300px;
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

.preview-generic button {
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
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.4);
}
</style>
