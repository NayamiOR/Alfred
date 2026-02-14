# 贡献指南

感谢您对 InchBox 项目的兴趣！我们欢迎任何形式的贡献，包括但不限于 Bug 报告、功能建议、代码提交和文档改进。

## 报告 Bug

如果您发现了 Bug，请通过以下方式报告：

1. **使用 GitHub Issues**
    - 访问 [Issues 页面](../../issues)
    - 搜索现有 Issue，避免重复报告
    - 如果没有找到相关问题，点击 "New Issue"

2. **提供详细信息**
    - 清晰的标题和描述
    - 复现步骤（一步一步说明）
    - 期望行为和实际行为
    - 环境信息：
        - 操作系统和版本
        - Node.js 版本 (`node --version`)
        - Rust 版本 (`rustc --version`)
        - 应用版本
    - 相关截图或日志（如有）

## 提交 Pull Request

我们欢迎 Pull Request！请遵循以下流程：

1. **Fork 项目**
   ```bash
   # 在 GitHub 上点击 Fork 按钮
   ```

2. **克隆您的 Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/InchBox.git
   cd InchBox
   ```

3. **创建 Feature 分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

4. **提交变更**
    - 遵循代码风格（见下方"代码风格"章节）
    - 使用清晰的提交信息（见下方"提交信息规范"）
    - 确保代码可以通过 lint 检查

5. **推送到您的 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **创建 Pull Request**
    - 访问原仓库的 Pull Requests 页面
    - 点击 "New Pull Request"
    - 选择您的分支和原仓库的主分支
    - 填写清晰的标题和描述
    - 关联相关 Issue（如有）：`Fixes #123`

## 代码风格

为了保持代码一致性，请遵循以下规范：

### 前端代码 (Vue/TypeScript)

- **运行 Lint 检查**
  ```bash
  pnpm lint
  ```

- **遵循项目 ESLint 配置**
    - 项目使用 `@eslint/js` 和 `eslint-plugin-vue`
    - 配置位于项目根目录的 ESLint 配置文件中

- **TypeScript 规范**
    - 启用严格模式
    - 避免使用 `any` 类型
    - 为函数参数和返回值添加类型注解

### 后端代码 (Rust)

- **遵循 Rust 标准风格**
    - 使用 `cargo fmt` 格式化代码
    - 使用 `cargo clippy` 检查代码

- **文档注释**
    - 为公共 API 添加文档注释 (`///`)
    - 为复杂逻辑添加行内注释

## 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范来保持提交历史的清晰：

### 格式

```
<type>(<scope>): <subject>

<body> (可选)

<footer> (可选)
```

### Type 类型

- **feat**: 新功能
- **fix**: Bug 修复
- **docs**: 文档更新
- **style**: 代码风格调整（不影响功能）
- **refactor**: 代码重构
- **perf**: 性能优化
- **test**: 测试相关
- **chore**: 构建过程或辅助工具的变动

### 示例

```
feat: add dark mode toggle

Implement system-wide dark mode support that syncs with OS preference.

Closes #42
```

```
fix(library): resolve file import error on Windows

Fixed path handling issue that caused imports to fail on Windows
systems with non-ASCII characters in path names.

Fixes #156
```

```
docs: update README with new prerequisites

Added detailed Node.js and Rust version requirements.
```

## 开发流程

### 本地开发

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **启动开发服务器**
   ```bash
   pnpm tauri dev
   ```

3. **运行 Lint 检查**
   ```bash
   pnpm lint
   ```

4. **构建生产版本**
   ```bash
   pnpm tauri build
   ```

### 提交前检查清单

在提交 Pull Request 之前，请确认：

- [ ] 代码可以通过 `pnpm lint` 检查
- [ ] TypeScript 类型检查通过 (`vue-tsc --noEmit`)
- [ ] 功能在本地测试通过
- [ ] 提交信息符合规范
- [ ] 文档已更新（如有需要）

## 功能建议

如果您有新功能的想法，建议先：

1. 在 Issues 中讨论，获取维护者的反馈
2. 等待批准后再开始编码
3. 确保新功能与项目整体方向一致

## 代码审查

所有 Pull Request 都需要经过代码审查。审查者可能会：

- 提出问题或建议
- 要求修改代码
- 讨论实现方案

请保持耐心和专业，积极回应反馈。

## 行为准则

参与本项目即表示您同意遵守以下准则：

- 保持友善和尊重
- 欢迎新手，耐心指导
- 专注于技术讨论，避免人身攻击
- 尊重不同的观点和经验

## 获取帮助

如果您在贡献过程中遇到问题：

- 查看 [Issues](../../issues) 中是否有类似问题
- 在 Issue 中提问
- 联系项目维护者

---

**再次感谢您的贡献！** 每一个 PR、每一个 Issue、每一条建议都让 InchBox 变得更好。

<!-- TODO: 补充以下内容（可选）:
- 更详细的代码审查流程
- 测试覆盖率要求
- CI/CD 流程说明
- 版本发布流程
- 安全漏洞报告流程
-->
