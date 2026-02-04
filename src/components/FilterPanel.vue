<template>
  <div class="filter-panel" @click.stop>
    <div class="filter-header">
      <h3>{{ t('filter.title') }}</h3>
      <button @click="$emit('close')" class="close-button">&times;</button>
    </div>

    <div class="filter-content">
      <!-- Sort Section -->
      <div class="filter-section">
        <h4>{{ t('filter.sortBy') }}</h4>
        <div class="sort-options">
          <select :value="sort.by" @change="updateSortBy($event)" class="sort-select">
            <option value="name">{{ t('filter.name') }}</option>
            <option value="added_at">{{ t('filter.dateAdded') }}</option>
            <option value="size">{{ t('filter.size') }}</option>
            <option value="extension">{{ t('filter.type') }}</option>
          </select>
          <button @click="toggleSortOrder" class="sort-order-btn" :title="sort.order === 'asc' ? t('filter.ascending') : t('filter.descending')">
            {{ sort.order === 'asc' ? '↑' : '↓' }}
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <!-- Filter Section -->
      <div class="filter-section">
        <div class="section-header">
          <h4>{{ t('filter.fileTypes') }}</h4>
          <div class="type-actions">
            <button @click="selectAllTypes" class="text-btn">{{ t('filter.all') }}</button>
            <button @click="deselectAllTypes" class="text-btn">{{ t('filter.none') }}</button>
          </div>
        </div>
        
        <div class="categories-list">
          <div v-for="cat in supportedCategories" :key="cat.key" class="category-group">
            <h5 class="category-title">{{ t(`filter.categories.${cat.key}`) }}</h5>
            <div class="checkbox-grid">
              <label v-for="type in cat.types" :key="type" class="filter-checkbox">
                <input 
                  type="checkbox" 
                  :value="type" 
                  :checked="selectedTypes.includes(type)"
                  @change="toggleType(type)" 
                />
                <span class="checkbox-label">
                  {{ type === 'folder' ? t('filter.formats.folder') : type }}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="filter-footer">
      <button @click="resetAll" class="reset-btn">{{ t('filter.resetDefaults') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface SortConfig {
  by: 'name' | 'added_at' | 'size' | 'extension';
  order: 'asc' | 'desc';
}

const props = defineProps({
  selectedTypes: {
    type: Array as PropType<string[]>,
    required: true
  },
  sort: {
    type: Object as PropType<SortConfig>,
    required: true
  }
});

const supportedCategories = [
  { key: 'image', types: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'] },
  { key: 'video', types: ['mp4', 'mkv', 'avi', 'mov', 'webm'] },
  { key: 'audio', types: ['mp3', 'wav', 'ogg', 'flac', 'm4a'] },
  { key: 'document', types: ['pdf', 'doc', 'docx', 'txt', 'md', 'markdown', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf', 'csv', 'json', 'xml', 'epub'] },
  { key: 'archive', types: ['zip', 'rar', '7z', 'tar', 'gz'] },
  { key: 'other', types: ['folder'] }
];

const allSupportedTypes = supportedCategories.flatMap(c => c.types);

const emit = defineEmits(['close', 'update:selectedTypes', 'update:sort', 'reset']);

function updateSortBy(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit('update:sort', { ...props.sort, by: target.value });
}

function toggleSortOrder() {
  emit('update:sort', { 
    ...props.sort, 
    order: props.sort.order === 'asc' ? 'desc' : 'asc' 
  });
}

function toggleType(type: string) {
  const newTypes = [...props.selectedTypes];
  const index = newTypes.indexOf(type);
  
  if (index === -1) {
    newTypes.push(type);
  } else {
    newTypes.splice(index, 1);
  }
  
  emit('update:selectedTypes', newTypes);
}

function selectAllTypes() {
  // Use all statically supported types instead of dynamic availableTypes
  emit('update:selectedTypes', [...allSupportedTypes]);
}

function deselectAllTypes() {
  emit('update:selectedTypes', []);
}

function resetAll() {
  emit('reset');
}
</script>

<style scoped>
.filter-panel {
  position: absolute;
  top: 8px;
  right: 16px;
  width: 320px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 100;
  display: flex;
  flex-direction: column;
  color: var(--text-primary);
}

.filter-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.filter-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-button:hover {
  color: var(--text-primary);
}

.filter-content {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.filter-section {
  margin-bottom: 0;
}

h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sort-options {
  display: flex;
  gap: 8px;
}

.sort-select {
  flex: 1;
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
}

.sort-order-btn {
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border-radius: 6px;
  cursor: pointer;
}

.sort-order-btn:hover {
  background-color: var(--hover-color);
}

.divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 16px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h4 {
  margin: 0;
}

.type-actions {
  display: flex;
  gap: 8px;
}

.text-btn {
  background: none;
  border: none;
  color: var(--text-secondary); /* Accent color could be better */
  font-size: 12px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.text-btn:hover {
  background-color: var(--hover-color);
  color: var(--text-primary);
}

.category-group {
  margin-bottom: 16px;
}

.category-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
  opacity: 0.8;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.filter-checkbox {
  display: flex;
  align-items: center;
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.filter-checkbox input {
  margin-right: 8px;
}

.checkbox-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border-color);
  background-color: var(--bg-tertiary);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  display: flex;
  justify-content: flex-end;
}

.reset-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
}

.reset-btn:hover {
  color: var(--text-primary);
  text-decoration: underline;
}
</style>