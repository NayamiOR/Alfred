# Alfred

一个基于 Tauri + Vue 3 构建的高性能桌面文件管理应用，专注于提供结构化的文件组织与多维度的检索体验。

<!-- TODO: 添加应用主界面截图，推荐路径：docs/screenshots/main-ui.png -->

## ✨ 特性

### 1. 资源库管理 (Library Management)
- **异步导入**：支持文件/文件夹的拖拽导入与系统对话框选择，采用异步处理确保 UI 响应。
- **动态视图**：提供卡片 (Grid) 与列表 (List) 视图切换，支持实时缩放渲染。

### 2. 标签系统 (Tagging System)
- **多维过滤**：基于标签的交集过滤，快速定位目标文件。
- **批量处理**：支持多选实体的标签批量挂载与卸载。
- **元数据管理**：完整的标签生命周期管理，包括重命名、颜色分配及冗余清理。

### 3. 高级功能 (Advanced Features)
- **实时检索**：基于文件名与扩展名的全量即时搜索。
- **多维排序**：支持按名称、修改日期、文件大小及 MIME 类型进行复合排序。
- **原生预览**：集成图片、视频及文档 (PDF, Word, Excel, EPUB) 的原生/ Web 预览能力。

### 4. 国际化 (i18n)
- **多语言支持**：内置简体中文与英文支持。
- **自动感知**：基于系统 Locale 自动切换语言环境，并支持运行时手动覆盖。

### 5. 系统集成 (System Integration)
- **原生托盘**：支持系统托盘运行与快速唤醒。
- **自启动管理**：集成开机自启动配置能力。
- **主题同步**：深度集成系统深色/浅色模式切换。

## 🛠️ 技术栈

**前端 (Frontend)**:
- **Vue 3.5.13**: 核心 UI 框架 (Composition API)
- **TypeScript 5.6.2**: 静态类型检查
- **Vite 6.0.3**: 构建工具与开发服务器
- **Tailwind CSS 3.4.19**: 原子化 CSS 框架
- **Vue Router 4.6.4**: 路由管理
- **Vue i18n 9.14.5**: 国际化方案

**后端 (Backend)**:
- **Tauri 2.x**: 跨平台桌面应用框架
- **Rust 2021 edition**: 核心逻辑与系统级交互
- **Serde 1.x**: 高性能序列化/反序列化
- **Chrono 0.4.43**: 时间日期处理
- **Windows API (Win32)**: 深度 Windows 系统特性集成

## ⚙️ Prerequisites

在开始之前，请确保您的开发环境已安装以下工具：

- **Node.js**: v18.0.0+ (推荐使用 pnpm)
- **Rust**: 最新稳定版 (运行 `rustup update` 进行更新)
- **系统依赖**:
  - **Windows**: [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: `libwebkit2gtk-4.0-dev`, `build-essential`, `curl`, `wget`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

## 🚀 Getting Started

1. **克隆仓库**:
   ```bash
   git clone https://github.com/nayamior/alfred.git
   cd alfred
   ```

2. **安装依赖**:
   ```bash
   pnpm install
   ```

3. **启动开发环境**:
   ```bash
   pnpm tauri dev
   ```

4. **构建生产版本**:
   ```bash
   pnpm tauri build
   ```

## 📂 项目结构

```text
├── src/                # 前端 Vue 源码
│   ├── components/     # 可复用 UI 组件
│   ├── views/          # 页面级视图
│   ├── stores/         # 状态管理 (Reactive Store)
│   ├── i18n/           # 国际化语言包
│   └── assets/         # 静态资源 (样式、图片)
├── src-tauri/          # 后端 Rust 源码
│   ├── src/            # Rust 逻辑实现
│   ├── capabilities/   # Tauri 权限配置
│   └── Cargo.toml      # Rust 依赖管理
└── package.json        # 前端依赖与脚本配置
```

## 🤝 贡献

我们欢迎任何形式的贡献！在提交 Pull Request 之前，请先阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。

<!-- TODO: 添加更多功能演示截图或 GIF -->

