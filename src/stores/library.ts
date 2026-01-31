import { reactive, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { notify } from './notification';

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
  skipped_unsupported: string[];
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
    isGridView: boolean;
    showFilterPanel: boolean;
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
    cardScale: 1.0,
    isGridView: true,
    showFilterPanel: false,
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
      notify('Failed to load library data', 'error');
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
      const unsuppCount = response.skipped_unsupported.length;

      if (addedCount > 0) {
        if (dupCount === 0 && unsuppCount === 0) {
          notify(`Successfully added ${addedCount} file(s)`, 'success');
        } else {
          // Mixed result
          let msg = `Added ${addedCount} file(s).`;
          if (dupCount > 0) msg += ` Skipped ${dupCount} duplicate(s).`;
          if (unsuppCount > 0) msg += ` Skipped ${unsuppCount} unsupported file(s).`;
          notify(msg, 'warning', 5000);
        }
      } else {
        // No files added
        if (dupCount > 0 || unsuppCount > 0) {
          let msg = 'No files added.';
          if (dupCount > 0) msg += ` ${dupCount} duplicate(s).`;
          if (unsuppCount > 0) msg += ` ${unsuppCount} unsupported.`;
          notify(msg, 'error');
        }
      }

    } catch (error) {
      console.error('Failed to add files:', error);
      notify('Failed to add files', 'error');
    }
  },

  async deleteFiles(ids: string[]) {
    if (ids.length === 0) return;
    try {
      await invoke('delete_files', { ids });
      libraryStore.files = libraryStore.files.filter(f => !ids.includes(f.id));
      notify(`Deleted ${ids.length} file(s)`, 'success');
    } catch (error) {
      console.error('Failed to delete files:', error);
      notify('Failed to delete files', 'error');
    }
  },

  async createTagGroup(name: string, color: string | null = null) {
    try {
      const group = await invoke<TagGroup>('create_tag_group', { name, color });
      libraryStore.groups.push(group);
      notify('Group created successfully', 'success');
    } catch (error) {
      console.error('Failed to create group:', error);
      notify('Failed to create group', 'error');
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
      notify('Group updated', 'success');
    } catch (error) {
      console.error('Failed to update group:', error);
      notify('Failed to update group', 'error');
    }
  },

  async deleteTagGroup(id: string) {
    try {
      await invoke('delete_tag_group', { id });
      await this.loadData(); // Reload to sync cascading changes
      notify('Group deleted', 'success');
    } catch (error) {
      console.error('Failed to delete group:', error);
      notify('Failed to delete group', 'error');
    }
  },

  async createTag(name: string, parentId: string | null = null, groupId: string | null = null) {
    try {
      const tag = await invoke<Tag>('create_tag', { name, parentId, groupId });
      libraryStore.tags.push(tag);
      notify('Tag created successfully', 'success');
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
      notify('Tag renamed', 'success');
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
      notify('Tag moved', 'success');
    } catch (error) {
      console.error('Failed to move tag:', error);
      notify('Failed to move tag', 'error');
    }
  },

  async deleteTag(id: string) {
    try {
      await invoke('delete_tag', { id });
      await this.loadData(); // Reload to sync
      notify('Tag deleted', 'success');
    } catch (error) {
      console.error('Failed to delete tag:', error);
      notify('Failed to delete tag', 'error');
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
      notify('Failed to attach tag', 'error');
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
      notify('Failed to detach tag', 'error');
    }
  },

  async openFile(path: string) {
    try {
      await invoke('open_file_default', { path });
    } catch (error) {
      console.error('Failed to open file:', error);
      notify('Failed to open file', 'error');
    }
  },

  async showInExplorer(path: string) {
    try {
      await invoke('show_in_explorer', { path });
    } catch (error) {
      console.error('Failed to show in explorer:', error);
      notify('Failed to show in explorer', 'error');
    }
  },

  async copyFile(path: string) {
    try {
      await invoke('copy_file_to_clipboard', { path });
      notify('Copied to clipboard', 'success');
    } catch (error) {
      console.error('Failed to copy file:', error);
      notify('Failed to copy file', 'error');
    }
  }
};
