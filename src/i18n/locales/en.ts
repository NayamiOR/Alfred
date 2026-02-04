export default {
  routes: {
    library: 'Library',
    settings: 'Settings',
    tags: 'Tags'
  },
  settings: {
    title: 'Settings',
    globalScale: {
      label: 'Global Scale',
      desc: 'Adjust UI element size (Shortcut: Ctrl +/-)'
    },
    autostart: {
      label: 'Run on Startup',
      desc: 'Automatically start Alfred when you log in'
    }
  },
  sidebar: {
    filters: 'Filters',
    tags: 'Tags',
    untagged: 'Untagged',
    otherTags: 'Other Tags',
    searchTags: 'Search tags...',
    noTags: 'No tags found.',
    selectAll: 'Select All',
    manageTags: 'Manage Tags',
    delete: 'Delete',
    selected: 'Selected',
    clear: 'Clear'
  },
  tagManage: {
    title: 'Manage Tags & Groups',
    back: 'Back',
    noTags: 'No tags or groups found. Create one to get started.',
    rename: 'Rename',
    delete: 'Delete',
    renameTitle: 'Rename Tag',
    newName: 'New name',
    cancel: 'Cancel',
    save: 'Save',
    files: 'files',
    addGroup: 'New Group',
    addTag: 'New Tag',
    duplicateGroupError: 'A group with this name already exists.',
    deleteGroupTitle: 'Delete Group',
    deleteGroupMessage: 'Are you sure you want to delete this group? Tags will be ungrouped.'
  },
  shortcutBar: {
    resourceLibrary: 'Files',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    settings: 'Settings'
  },
  language: {
    title: 'Language',
    en: 'English',
    zh: '中文'
  },
  common: {
    minimize: 'Minimize',
    maximize: 'Maximize',
    restore: 'Restore',
    close: 'Close'
  },
  library: {
    searchPlaceholder: 'Search files...',
    cardSize: 'Card Size',
    add: 'Add',
    addFiles: 'Add Files',
    addFolders: 'Add Folders',
    toggleSidebar: 'Toggle Sidebar',
    cardView: 'Card View',
    listView: 'List View',
    tagInputPlaceholder: 'Type tag and press Enter',
    dragMessage: 'Drop files here to add',
    emptyNoFiles: 'No files found.',
    emptyNoFilesDesc: 'Drag files here or click + to add.',
    editTags: 'Edit Tags',
    editTagsMulti: 'Edit Tags ({n} items)',
    done: 'Done',
    open: 'Open',
    openFileLocation: 'Open File Location',
    copyFile: 'Copy File',
    delete: 'Delete',
    deleteMulti: 'Delete {n} items',
    contextEditTags: 'Edit Tags...',
    contextEditTagsMulti: 'Edit Tags ({n} items)...',
    previewNotAvailable: 'Preview not available',
    openFile: 'Open File',
    notify: {
      addedFiles: 'Successfully added {count} file(s)',
      deletedFiles: 'Deleted {count} file(s)',
      groupCreated: 'Group created successfully',
      groupUpdated: 'Group updated',
      groupDeleted: 'Group deleted',
      tagCreated: 'Tag created successfully',
      tagRenamed: 'Tag renamed',
      tagMoved: 'Tag moved',
      tagDeleted: 'Tag deleted',
      copiedToClipboard: 'Copied to clipboard',
      loadDataFailed: 'Failed to load library data',
      addFilesFailed: 'Failed to add files',
      deleteFilesFailed: 'Failed to delete files',
      createGroupFailed: 'Failed to create group',
      updateGroupFailed: 'Failed to update group',
      deleteGroupFailed: 'Failed to delete group',
      moveTagFailed: 'Failed to move tag',
      deleteTagFailed: 'Failed to delete tag',
      attachTagFailed: 'Failed to attach tag',
      detachTagFailed: 'Failed to detach tag',
      openFileFailed: 'Failed to open file',
      showInExplorerFailed: 'Failed to show in explorer',
      copyFileFailed: 'Failed to copy file',
      addFilesResult: 'Added {added} file(s).',
      skippedDuplicates: 'Skipped {count} duplicate(s).',
      skippedUnsupported: 'Skipped {count} unsupported file(s).',
      noFilesAdded: 'No files added.'
    }
  },
  filter: {
    title: 'Sort & Filter',
    sortBy: 'Sort By',
    name: 'Name',
    dateAdded: 'Date Added',
    size: 'Size',
    type: 'Type',
    ascending: 'Ascending',
    descending: 'Descending',
    fileTypes: 'File Types',
    all: 'All',
    none: 'None',
    resetDefaults: 'Reset Defaults',
    categories: {
      image: 'Images',
      video: 'Videos',
      audio: 'Audio',
      document: 'Documents',
      archive: 'Archives',
      other: 'Other'
    },
    formats: {
      folder: 'Folder'
    }
  },
  tray: {
    show: 'Open Alfred',
    quit: 'Quit'
  },
  drag: {
    accept: 'Drop to add files',
    reject: 'Cannot drop here'
  }
};
