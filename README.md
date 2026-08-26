# Typora-WZS

一款类 Typora 的 Markdown 桌面编辑器，基于 Electron + React + ProseMirror 构建。

## 功能特性

- **所见即所得编辑** — ProseMirror 驱动的富文本编辑，支持标题、列表、表格、代码块、数学公式（KaTeX）、Mermaid 图表等
- **源码模式 & 分屏预览** — 一键切换源码编辑，或使用分屏模式实时对照预览
- **双向 Wiki 链接** — `[[目标]]` 或 `[[目标|显示文本]]` 语法，点击跳转到对应文件，侧边栏显示反向链接
- **文件树管理** — 右键菜单支持新建文件/文件夹、重命名、删除、复制路径
- **多标签页** — 同时打开多个文件，快速切换
- **查找替换** — 支持正则表达式和大小写匹配
- **工作区** — 创建和管理多个工作区
- **主题切换** — 内置 4 套主题，支持自定义背景图片
- **国际化** — 中文 / English 双语支持
- **导出** — 支持导出为 HTML 和 PDF

## 技术栈

| 层 | 技术 |
|---|---|
| 桌面框架 | Electron 33 |
| 前端框架 | React 18 + TypeScript |
| 富文本编辑 | ProseMirror |
| Markdown 渲染 | markdown-it |
| 数学公式 | KaTeX |
| 图表 | Mermaid |
| 代码高亮 | highlight.js |
| 样式 | Tailwind CSS v4 |
| 国际化 | i18next |
| 构建工具 | Vite + vite-plugin-electron |
| 打包 | electron-builder |

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式（Vite + Electron 热重载）
npm run electron:dev

# 仅启动 Vite 开发服务器（浏览器预览，无 Electron API）
npm run dev

# 构建生产版本
npm run electron:build
```

## 项目结构

```
typora-wzs/
├── electron/
│   ├── main.ts          # Electron 主进程（窗口、菜单、IPC、文件操作）
│   └── preload.ts       # contextBridge 预加载脚本
├── src/
│   ├── App.tsx           # 根组件
│   ├── main.tsx          # React 入口
│   ├── components/
│   │   ├── Editor/       # ProseMirrorEditor, SourceEditor, MarkdownPreview, SearchReplace
│   │   ├── Sidebar/      # FileTree, BacklinksPanel
│   │   ├── Toolbar/      # 工具栏
│   │   ├── Tabs/         # 标签栏
│   │   ├── StatusBar/    # 状态栏
│   │   ├── Settings/     # 设置对话框
│   │   └── Workspace/    # 工作区管理
│   ├── editor/           # ProseMirror schema, markdown 解析/序列化, 输入规则
│   ├── hooks/            # useEditorState 等自定义 Hook
│   ├── i18n/             # 国际化配置（中/英）
│   ├── styles/           # 全局样式
│   └── themes/           # 主题定义
├── vite.config.ts
└── package.json
```

## 快捷键

| 快捷键 | 功能 |
|---|---|
| `Cmd/Ctrl + S` | 保存 |
| `Cmd/Ctrl + F` | 查找 |
| `Cmd/Ctrl + B` | 加粗 |
| `Cmd/Ctrl + I` | 斜体 |
| `Cmd/Ctrl + Shift + S` | 删除线 |
| `` Cmd/Ctrl + ` `` | 行内代码 |

## 许可证

MIT
