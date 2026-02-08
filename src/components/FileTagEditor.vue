<template>
  <div class="file-tag-editor">
    <!-- Left: Filename -->
    <div class="file-name" :title="file.name">{{ file.name }}</div>
    
    <!-- Right: Tag Editor -->
    <div class="tag-editor-container" @click="focusInput">
      <!-- Current Tags -->
      <div class="tag-list">
        <span 
          v-for="tagId in fileTags" 
          :key="tagId" 
          class="tag-chip"
        >
          {{ getTagName(tagId) }}
          <button @click.stop="removeTag(tagId)" class="remove-btn">×</button>
        </span>
      </div>
      
      <!-- Input Area -->
      <div class="input-wrapper">
        <input
          ref="inputRef"
          v-model="inputValue"
          @keydown="onKeyDown"
          @input="onInput"
          @focus="onFocus"
          @blur="onBlur"
          :placeholder="t('tagManage.tagInputPlaceholder') || 'Add tag...'"
          class="tag-input"
          type="text"
        />
        
        <!-- Autocomplete Dropdown -->
        <div v-if="showSuggestions && filteredTags.length > 0" class="suggestions-dropdown">
          <div
            v-for="(tag, index) in filteredTags"
            :key="tag.id"
            :class="['suggestion-item', { 'highlighted': index === highlightedIndex }]"
            @mousedown.prevent="addTag(tag.id)"
            @mouseenter="highlightedIndex = index"
          >
            {{ tag.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { FileItem, libraryStore, actions, getTagName } from '../stores/library';

const props = defineProps<{
  file: FileItem;
}>();

const { t } = useI18n();

const inputRef = ref<HTMLInputElement | null>(null);
const inputValue = ref('');
const showSuggestions = ref(false);
const highlightedIndex = ref(0);

// Track file's tags locally
const fileTags = computed(() => props.file.tag_ids);

// Get all available tags excluding already added ones
const availableTags = computed(() => {
  return libraryStore.tags.filter(tag => !fileTags.value.includes(tag.id));
});

// Filter tags based on input
const filteredTags = computed(() => {
  if (!inputValue.value.trim()) return availableTags.value;
  const query = inputValue.value.toLowerCase();
  return availableTags.value.filter(tag => 
    tag.name.toLowerCase().includes(query)
  );
});

function focusInput() {
  inputRef.value?.focus();
}

function onInput() {
  showSuggestions.value = true;
  highlightedIndex.value = 0;
}

function onFocus() {
  showSuggestions.value = true;
  highlightedIndex.value = 0;
}

function onBlur() {
  // Delay hiding to allow click on suggestion
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
}

async function addTag(tagId: string) {
  if (fileTags.value.includes(tagId)) return;
  
  await actions.attachTag(props.file.id, tagId);
  inputValue.value = '';
  showSuggestions.value = false;
  highlightedIndex.value = 0;
  
  // Re-focus input for quick adding
  nextTick(() => {
    inputRef.value?.focus();
  });
}

async function removeTag(tagId: string) {
  await actions.detachTag(props.file.id, tagId);
}

function onKeyDown(event: KeyboardEvent) {
  // Ctrl+Enter: Save/Confirm (though we auto-save, this closes/blurs)
  if (event.ctrlKey && event.key === 'Enter') {
    event.preventDefault();
    inputRef.value?.blur();
    showSuggestions.value = false;
    return;
  }
  
  // Enter: Add highlighted or first suggestion
  if (event.key === 'Enter') {
    event.preventDefault();
    if (filteredTags.value.length > 0 && showSuggestions.value) {
      const tagToAdd = filteredTags.value[highlightedIndex.value] || filteredTags.value[0];
      if (tagToAdd) {
        addTag(tagToAdd.id);
      }
    }
    return;
  }
  
  // Backspace: Remove last tag if input is empty
  if (event.key === 'Backspace' && !inputValue.value && fileTags.value.length > 0) {
    event.preventDefault();
    const lastTagId = fileTags.value[fileTags.value.length - 1];
    removeTag(lastTagId);
    return;
  }
  
  // Arrow navigation in dropdown
  if (showSuggestions.value && filteredTags.value.length > 0) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      highlightedIndex.value = (highlightedIndex.value + 1) % filteredTags.value.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      highlightedIndex.value = (highlightedIndex.value - 1 + filteredTags.value.length) % filteredTags.value.length;
    } else if (event.key === 'Escape') {
      event.preventDefault();
      showSuggestions.value = false;
    }
  }
}
</script>

<style scoped>
.file-tag-editor {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  min-height: 56px;
}

.file-tag-editor:hover {
  background-color: var(--hover-color);
}

.file-name {
  flex-shrink: 0;
  width: 200px;
  font-size: 14px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-editor-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 4px 8px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: text;
  position: relative;
}

.tag-editor-container:focus-within {
  border-color: var(--text-secondary);
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  background-color: var(--text-primary);
  color: var(--bg-primary);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  padding: 0;
  margin-left: 2px;
  background: none;
  border: none;
  color: var(--bg-primary);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.remove-btn:hover {
  opacity: 1;
}

.input-wrapper {
  position: relative;
  flex: 1;
  min-width: 100px;
}

.tag-input {
  width: 100%;
  padding: 4px 0;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.tag-input::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.suggestion-item {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background-color 0.15s;
}

.suggestion-item:hover,
.suggestion-item.highlighted {
  background-color: var(--hover-color);
}
</style>
