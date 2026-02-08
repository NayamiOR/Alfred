import { reactive, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { notify } from './notification';
import i18n from '../i18n';

const t = (key: string, values?: any) => i18n.global.t(key, values);


export interface Tag {
  id: string;
  name: string;
  parent_id: string | null;
  group_id: string | null;
}

export interface TagGroup {
  id: string;
  name: string;
  color: string | null;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  extension: string;
  size: number;
  mime_type: string;
  added_at: number;
  tag_ids: string[];
}

interface AddFilesResponse {
  added_files: FileItem[];
  skipped_duplicates: string[];
}

interface AppData {
  version: number;
  files: FileItem[];
  tags: Tag[];
  groups: TagGroup[];
}

interface LibraryState {
  files: FileItem[];
  tags: Tag[];
  groups: TagGroup[];
  isLoading: boolean;
  ui: {
    searchQuery: string;
    cardScale: number;
    globalScale: number;
    isGridView: boolean;
    showFilterPanel: boolean;
    selectedFileIds: string[]; // NEW: track selected files for batch operations
    filters: {
      fileTypes: string[];
    };
    tagViewFilters: {
      tags: string[]; // tag IDs
    };
    sortConfig: {
      by: 'name' | 'added_at' | 'size' | 'extension';
      order: 'asc' | 'desc';
    };
    dragState: {
      isDragging: boolean;
      type: 'accept' | 'reject';
      message: string;
    };
    tagGroupModal: {
      visible: boolean;
      isEdit: boolean;
      id: string;
      name: string;
      color: string | null;
    };
  };
}

const initialLibraryState: LibraryState = {
  files: [],
  tags: [],
  groups: [],
  isLoading: false,
  ui: {
    searchQuery: '',
    cardScale: Number(localStorage.getItem('cardScale')) || 1.0,
    globalScale: Number(localStorage.getItem('globalScale')) || 1.0,
    isGridView: true,
    showFilterPanel: false,
    selectedFileIds: [],
    filters: {
      fileTypes: []
    },
    tagViewFilters: {
      tags: []
    },
    sortConfig: {
      by: 'added_at',
      order: 'desc'
    },
    dragState: {
      isDragging: false,
      type: 'accept',
      message: ''
    },
    tagGroupModal: {
      visible: false,
      isEdit: false,
      id: '',
      name: '',
      color: null
    }
  }
};

export const libraryStore = reactive<LibraryState>(initialLibraryState);

export const currentFiles = computed(() => {
  return libraryStore.files;
});

// Helper to get tag name by ID
export function getTagName(id: string): string {
  return libraryStore.tags.find(t => t.id === id)?.name || 'Unknown';
}

export function getTagById(id: string): Tag | undefined {
  return libraryStore.tags.find(t => t.id === id);
}

export function getGroupById(id: string): TagGroup | undefined {
  return libraryStore.groups.find(g => g.id === id);
}

export const actions = {
  async loadData() {
    libraryStore.isLoading = true;
    try {
      const data = await invoke<AppData>('get_initial_data');
      libraryStore.files = data.files;
      libraryStore.tags = data.tags;
      libraryStore.groups = data.groups;
    } catch (error) {
      console.error('Failed to load data:', error);
      notify(t('library.notify.loadDataFailed'), 'error');
    } finally {
      libraryStore.isLoading = false;
    }
  },

  async addFiles(paths: string[]) {
    try {
      const response = await invoke<AddFilesResponse>('add_files', { paths });
      
      // Update store with added files
      if (response.added_files.length > 0) {
        libraryStore.files.push(...response.added_files);
      }

      // Notifications logic
      const addedCount = response.added_files.length;
      const dupCount = response.skipped_duplicates.length;

      if (addedCount > 0) {
        if (dupCount === 0) {
          notify(t('library.notify.addedFiles', { count: addedCount }), 'success');
        } else {
          // Mixed result
          let msg = t('library.notify.addFilesResult', { added: addedCount });
          if (dupCount > 0) msg += ' ' + t('library.notify.skippedDuplicates', { count: dupCount });
          notify(msg, 'warning', 5000);
        }
      } else {
        // No files added
        if (dupCount > 0) {
          let msg = t('library.notify.noFilesAdded');
          msg += ' ' + t('library.notify.skippedDuplicates', { count: dupCount });
          notify(msg, 'error');
        }
      }

    } catch (error) {
      console.error('Failed to add files:', error);
      notify(t('library.notify.addFilesFailed'), 'error');
    }
  },

  async deleteFiles(ids: string[]) {
    if (ids.length === 0) return;
    try {
      await invoke('delete_files', { ids });
      libraryStore.files = libraryStore.files.filter(f => !ids.includes(f.id));
      // Clean up selectedFileIds to remove deleted files
      libraryStore.ui.selectedFileIds = libraryStore.ui.selectedFileIds.filter(id => !ids.includes(id));
      notify(t('library.notify.deletedFiles', { count: ids.length }), 'success');
    } catch (error) {
      console.error('Failed to delete files:', error);
      notify(t('library.notify.deleteFilesFailed'), 'error');
    }
  },

  async createTagGroup(name: string, color: string | null = null) {
    try {
      const group = await invoke<TagGroup>('create_tag_group', { name, color });
      libraryStore.groups.push(group);
      notify(t('library.notify.groupCreated'), 'success');
    } catch (error) {
      console.error('Failed to create group:', error);
      notify(t('library.notify.createGroupFailed'), 'error');
    }
  },

  async updateTagGroup(id: string, name: string, color: string | null) {
    try {
      await invoke('update_tag_group', { id, name, color });
      const group = libraryStore.groups.find(g => g.id === id);
      if (group) {
        group.name = name;
        group.color = color;
      }
      notify(t('library.notify.groupUpdated'), 'success');
    } catch (error) {
      console.error('Failed to update group:', error);
      notify(t('library.notify.updateGroupFailed'), 'error');
    }
  },

  async deleteTagGroup(id: string) {
    try {
      // Collect all tag IDs in this group to remove from selection
      const groupTagIds = new Set(
        libraryStore.tags.filter(t => t.group_id === id).map(t => t.id)
      );

      await invoke('delete_tag_group', { id });

      // Remove deleted tags from the filter selection
      libraryStore.ui.tagViewFilters.tags = libraryStore.ui.tagViewFilters.tags.filter(
        tagId => !groupTagIds.has(tagId)
      );

      await this.loadData(); // Reload to sync cascading changes
      notify(t('library.notify.groupDeleted'), 'success');
    } catch (error) {
      console.error('Failed to delete group:', error);
      notify(t('library.notify.deleteGroupFailed'), 'error');
    }
  },

  async createTag(name: string, parentId: string | null = null, groupId: string | null = null) {
    try {
      const tag = await invoke<Tag>('create_tag', { name, parentId, groupId });
      libraryStore.tags.push(tag);
      notify(t('library.notify.tagCreated'), 'success');
      return tag;
    } catch (error) {
      console.error('Failed to create tag:', error);
      // Backend returns string error message for duplicates
      notify(String(error), 'error'); 
      return null;
    }
  },

  async renameTag(id: string, name: string) {
    try {
      await invoke('rename_tag', { id, name });
      const tag = libraryStore.tags.find(t => t.id === id);
      if (tag) tag.name = name;
      notify(t('library.notify.tagRenamed'), 'success');
    } catch (error) {
      console.error('Failed to rename tag:', error);
      notify(String(error), 'error');
    }
  },

  async moveTag(id: string, parentId: string | null, groupId: string | null) {
    try {
      await invoke('move_tag', { id, parentId, groupId });
      const tag = libraryStore.tags.find(t => t.id === id);
      if (tag) {
        tag.parent_id = parentId;
        tag.group_id = groupId;

        // Recursively update children's group_id
        const updateChildrenGroup = (parentId: string, newGroupId: string | null) => {
          const children = libraryStore.tags.filter(t => t.parent_id === parentId);
          for (const child of children) {
            child.group_id = newGroupId;
            updateChildrenGroup(child.id, newGroupId);
          }
        };
        updateChildrenGroup(tag.id, groupId);
      }
      notify(t('library.notify.tagMoved'), 'success');
    } catch (error) {
      console.error('Failed to move tag:', error);
      notify(t('library.notify.moveTagFailed'), 'error');
    }
  },

  async deleteTag(id: string) {
    try {
      // Collect all tag IDs to remove from selection (the tag + its descendants)
      const collectDescendantIds = (parentId: string): string[] => {
        const children = libraryStore.tags.filter(t => t.parent_id === parentId);
        return children.flatMap(child => [child.id, ...collectDescendantIds(child.id)]);
      };
      const idsToRemove = new Set([id, ...collectDescendantIds(id)]);

      await invoke('delete_tag', { id });

      // Remove deleted tags from the filter selection
      libraryStore.ui.tagViewFilters.tags = libraryStore.ui.tagViewFilters.tags.filter(
        tagId => !idsToRemove.has(tagId)
      );

      await this.loadData(); // Reload to sync
      notify(t('library.notify.tagDeleted'), 'success');
    } catch (error) {
      console.error('Failed to delete tag:', error);
      notify(t('library.notify.deleteTagFailed'), 'error');
    }
  },

  // Attach tag to files (High-level: Creates tag if name doesn't exist)
  async attachTagByName(fileIds: string[], tagName: string) {
    let tag = libraryStore.tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
    
    if (!tag) {
      // Create new tag at root
      tag = await this.createTag(tagName) || undefined;
    }

    if (tag) {
      let successCount = 0;
      for (const fileId of fileIds) {
        const file = libraryStore.files.find(f => f.id === fileId);
        if (file && !file.tag_ids.includes(tag.id)) {
          await this.attachTag(fileId, tag.id);
          successCount++;
        }
      }
      if (successCount > 0) {
        // notify(`Tagged ${successCount} file(s)`, 'success');
        // attachTag already notifies? No, let's keep it quiet for bulk ops or single notify
      }
    }
  },

  async attachTag(fileId: string, tagId: string) {
    try {
      await invoke('attach_tag', { fileId, tagId });
      const file = libraryStore.files.find(f => f.id === fileId);
      if (file && !file.tag_ids.includes(tagId)) {
        file.tag_ids.push(tagId);
      }
    } catch (error) {
      console.error('Failed to attach tag:', error);
      notify(t('library.notify.attachTagFailed'), 'error');
    }
  },

  async detachTag(fileId: string, tagId: string) {
    try {
      await invoke('detach_tag', { fileId, tagId });
      const file = libraryStore.files.find(f => f.id === fileId);
      if (file) {
        file.tag_ids = file.tag_ids.filter(id => id !== tagId);
      }
    } catch (error) {
      console.error('Failed to detach tag:', error);
      notify(t('library.notify.detachTagFailed'), 'error');
    }
  },

  async openFile(path: string) {
    try {
      await invoke('open_file_default', { path });
    } catch (error) {
      console.error('Failed to open file:', error);
      notify(t('library.notify.openFileFailed'), 'error');
    }
  },

  async showInExplorer(path: string) {
    try {
      await invoke('show_in_explorer', { path });
    } catch (error) {
      console.error('Failed to show in explorer:', error);
      notify(t('library.notify.showInExplorerFailed'), 'error');
    }
  },

  async copyFile(path: string) {
    try {
      await invoke('copy_file_to_clipboard', { path });
      notify(t('library.notify.copiedToClipboard'), 'success');
    } catch (error) {
      console.error('Failed to copy file:', error);
      notify(t('library.notify.copyFileFailed'), 'error');
    }
  }
};
