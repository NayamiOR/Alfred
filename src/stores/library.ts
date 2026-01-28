import { reactive, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';

export interface Library {
  id: string;
  name: string;
  icon: string;
  created_at: number;
}

export interface FileItem {
  id: string;
  library_id: string;
  name: string;
  path: string;
  extension: string;
  size: number;
  mime_type: string;
  added_at: number;
}

interface LibraryState {
  libraries: Library[];
  files: FileItem[];
  currentLibraryId: string | null;
  isLoading: boolean;
}

export const libraryStore = reactive<LibraryState>({
  libraries: [],
  files: [],
  currentLibraryId: null,
  isLoading: false,
});

export const currentFiles = computed(() => {
  return libraryStore.files;
});

export const actions = {
  async loadLibraries() {
    libraryStore.isLoading = true;
    try {
      libraryStore.libraries = await invoke<Library[]>('get_libraries');
      if (libraryStore.libraries.length > 0 && !libraryStore.currentLibraryId) {
        // Select first library by default
        libraryStore.currentLibraryId = libraryStore.libraries[0].id;
        await this.loadFiles(libraryStore.currentLibraryId);
      }
    } catch (error) {
      console.error('Failed to load libraries:', error);
    } finally {
      libraryStore.isLoading = false;
    }
  },

  async createLibrary(name: string) {
    try {
      const newLib = await invoke<Library>('create_library', { name });
      libraryStore.libraries.push(newLib);
      this.selectLibrary(newLib.id);
    } catch (error) {
      console.error('Failed to create library:', error);
    }
  },

  async deleteLibrary(id: string) {
    try {
      await invoke('delete_library', { id });
      libraryStore.libraries = libraryStore.libraries.filter(l => l.id !== id);
      if (libraryStore.currentLibraryId === id) {
        libraryStore.currentLibraryId = libraryStore.libraries[0]?.id || null;
        if (libraryStore.currentLibraryId) {
          await this.loadFiles(libraryStore.currentLibraryId);
        } else {
          libraryStore.files = [];
        }
      }
    } catch (error) {
      console.error('Failed to delete library:', error);
    }
  },

  async selectLibrary(id: string) {
    libraryStore.currentLibraryId = id;
    await this.loadFiles(id);
  },

  async loadFiles(libraryId: string) {
    try {
      const files = await invoke<FileItem[]>('get_files', { libraryId });
      libraryStore.files = files; 
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  },

  async addFiles(paths: string[]) {
    if (!libraryStore.currentLibraryId) return;
    try {
      const newFiles = await invoke<FileItem[]>('add_files', { 
        libraryId: libraryStore.currentLibraryId, 
        paths 
      });
      libraryStore.files.push(...newFiles);
    } catch (error) {
      console.error('Failed to add files:', error);
    }
  },

  async deleteFile(id: string) {
    try {
      await invoke('delete_file', { id });
      libraryStore.files = libraryStore.files.filter(f => f.id !== id);
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  },

  async deleteFiles(ids: string[]) {
    if (ids.length === 0) return;
    try {
      await invoke('delete_files', { ids });
      libraryStore.files = libraryStore.files.filter(f => !ids.includes(f.id));
    } catch (error) {
      console.error('Failed to delete files:', error);
    }
  },

  async openFile(path: string) {
    try {
      await invoke('open_file_default', { path });
    } catch (error) {
      console.error('Failed to open file:', error);
    }
  },

  async showInExplorer(path: string) {
    try {
      await invoke('show_in_explorer', { path });
    } catch (error) {
      console.error('Failed to show in explorer:', error);
    }
  },

  async copyFile(path: string) {
    try {
      await invoke('copy_file_to_clipboard', { path });
    } catch (error) {
      console.error('Failed to copy file:', error);
    }
  }
};
