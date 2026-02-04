export default {
  routes: {
    library: '文件库',
    settings: '设置',
    tags: '标签'
  },
  settings: {
    title: '设置',
    globalScale: {
      label: '全局缩放',
      desc: '调整界面元素大小（快捷键：Ctrl +/-）'
    },
    autostart: {
      label: '开机启动',
      desc: '登录时自动启动 Alfred'
    }
  },
  sidebar: {
    filters: '筛选',
    tags: '标签',
    untagged: '未标记',
    otherTags: '其他标签',
    searchTags: '搜索标签...',
    noTags: '暂无标签',
    selectAll: '全选',
    manageTags: '管理标签',
    delete: '删除',
    selected: '已选择',
    clear: '清除'
  },
  tagManage: {
    title: '标签与分组管理',
    back: '返回',
    noTags: '暂无标签或分组。请创建以开始使用。',
    rename: '重命名',
    delete: '删除',
    renameTitle: '重命名标签',
    newName: '新名称',
    cancel: '取消',
    save: '保存',
    files: '个文件',
    addGroup: '新建分组',
    addTag: '新建标签',
    duplicateGroupError: '分组名称已存在',
    deleteGroupTitle: '删除分组',
    deleteGroupMessage: '确定要删除此分组吗？其中的标签将变为未分组状态。'
  },
  shortcutBar: {
    resourceLibrary: '文件库',
    lightMode: '浅色模式',
    darkMode: '深色模式',
    settings: '设置'
  },
  language: {
    title: '语言',
    en: 'English',
    zh: '中文'
  },
  common: {
    minimize: '最小化',
    maximize: '最大化',
    restore: '还原',
    close: '关闭'
  },
  library: {
    searchPlaceholder: '搜索文件...',
    cardSize: '卡片大小',
    add: '添加',
    addFiles: '添加文件',
    addFolders: '添加文件夹',
    toggleSidebar: '切换侧边栏',
    cardView: '卡片视图',
    listView: '列表视图',
    tagInputPlaceholder: '输入标签后回车',
    dragMessage: '拖放文件到此处添加',
    emptyNoFiles: '暂无文件',
    emptyNoFilesDesc: '拖放文件到此处或点击 + 添加',
    editTags: '编辑标签',
    editTagsMulti: '编辑标签 ({n} 个项目)',
    done: '完成',
    open: '打开',
    openFileLocation: '打开文件所在位置',
    copyFile: '复制文件',
    delete: '删除',
    deleteMulti: '删除 {n} 个项目',
    contextEditTags: '编辑标签...',
    contextEditTagsMulti: '编辑标签 ({n} 个项目)...',
    previewNotAvailable: '预览不可用',
    openFile: '打开文件',
    notify: {
      addedFiles: '成功添加 {count} 个文件',
      deletedFiles: '删除 {count} 个文件',
      groupCreated: '分组创建成功',
      groupUpdated: '分组已更新',
      groupDeleted: '分组已删除',
      tagCreated: '标签创建成功',
      tagRenamed: '标签已重命名',
      tagMoved: '标签已移动',
      tagDeleted: '标签已删除',
      copiedToClipboard: '已复制到剪贴板',
      loadDataFailed: '加载库数据失败',
      addFilesFailed: '添加文件失败',
      deleteFilesFailed: '删除文件失败',
      createGroupFailed: '创建分组失败',
      updateGroupFailed: '更新分组失败',
      deleteGroupFailed: '删除分组失败',
      moveTagFailed: '移动标签失败',
      deleteTagFailed: '删除标签失败',
      attachTagFailed: '添加标签失败',
      detachTagFailed: '移除标签失败',
      openFileFailed: '打开文件失败',
      showInExplorerFailed: '打开所在位置失败',
      copyFileFailed: '复制文件失败',
      addFilesResult: '添加了 {added} 个文件。',
      skippedDuplicates: '跳过 {count} 个重复文件。',
      skippedUnsupported: '跳过 {count} 个不支持的文件。',
      noFilesAdded: '未添加文件。'
    }
  },
  filter: {
    title: '排序与筛选',
    sortBy: '排序方式',
    name: '名称',
    dateAdded: '添加日期',
    size: '大小',
    type: '类型',
    ascending: '升序',
    descending: '降序',
    fileTypes: '文件类型',
    all: '全部',
    none: '无',
    resetDefaults: '恢复默认'
  },
  tray: {
    show: '打开 Alfred',
    quit: '退出'
  },
  drag: {
    accept: '拖放以添加文件',
    reject: '此处不支持添加文件'
  }
};
