# CompetiPrd — 一键竞品分析报告生成器

> 浏览任意网站，一键生成结构化竞品分析报告。AI 产品经理专属浏览器扩展。

[![Tech Stack](https://img.shields.io/badge/WXT-0.19-2ea44f)](https://wxt.dev)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06b6d4)](https://tailwindcss.com)

---

## 功能

- **⚡ 一键生成**：打开竞品网页，点击按钮自动抓取并分析，15-30 秒出完整报告
- **💬 对话微调**：生成后可继续对话修改——"展开定价部分"、"和飞书对比"——AI 在已有报告基础上增量改进
- **📊 14 模块 PRD**：覆盖产品背景、目标、竞品分析、用户故事、功能需求、非功能需求、异常处理、边界条件、AI 可行性分析、数据需求、流程图、埋点、发布计划
- **🤖 AI 产品专属维度**：模型策略、Prompt 设计、数据策略、AI 风险评估
- **🤖 多模型支持**：Claude / OpenAI / DeepSeek / 豆包 / Kimi（自带 API Key）
- **📥 多格式导出**：Markdown / Word (.docx) / PDF（打印另存）
- **🔒 隐私安全**：所有数据存于本地浏览器，不上传任何服务器

---

## 默认输出格式

**答案：Markdown (`.md`)**

| 格式 | 使用方式 |
|------|---------|
| **Markdown** (`.md`) | 默认格式，点「📥 MD」下载。兼容语雀 / Notion / 飞书 / Obsidian，可直接粘贴渲染 |
| **Word** (`.docx`) | 点「📄 Word」下载，自动转好标题层级、粗体、列表，适合汇报 |
| **PDF** | 点「🖨 PDF」→ 弹出打印预览 → 在打印对话框选「另存为 PDF」即可 |
| **剪贴板** | 点「📋 复制到剪贴板」，随时粘贴到微信/钉钉/飞书/邮件 |

> 💡 **推荐工作流**：生成 Markdown → 对话微调 → 导出 Word 给老板，或复制粘贴到 Obsidian 积攒经验

---

## 安装

```bash
# 1. 克隆仓库
git clone https://github.com/YOUR_USERNAME/competiprd.git
cd competiprd

# 2. 安装依赖
npm install

# 3. 开发模式（热更新）
npm run dev
```

## 加载扩展

1. Chrome 地址栏输入 `chrome://extensions` 回车
2. 右上角开启 **「开发者模式」**
3. 左上角点 **「加载已解压的扩展程序」**
4. 选择项目的 `.output/chrome-mv3` 文件夹
5. 扩展图标出现在工具栏拼图 🧩 里，点图钉固定

> Edge 用户：`edge://extensions`，步骤相同。Firefox：`npm run build:firefox` 后加载 `.output/firefox-mv2`

---

## 使用

1. 🔌 点扩展图标 → 侧边栏滑出 → ⚙️ 设置 → 填入 API Key
2. 🌐 打开任意竞品网站（官网 / GitHub / 文档 / 应用商店……）
3. ⚡ 点击 **「一键生成竞品分析报告」**
4. 👀 侧边栏预览完整 Markdown 报告
5. 💬 不满意？输入框写"定价部分展开，加个和 XX 的对比"→ 发送
6. 📥 导出：MD / Word / PDF / 复制，四选一

### API Key 获取

| 模型 | 默认模型 | 申请地址 |
|------|---------|---------|
| Claude | `claude-sonnet-4-20250514` | [console.anthropic.com](https://console.anthropic.com/) |
| DeepSeek | `deepseek-chat` | [platform.deepseek.com](https://platform.deepseek.com/) |
| OpenAI | `gpt-4o` | [platform.openai.com](https://platform.openai.com/api-keys) |
| 豆包 | `doubao-pro-32k` | [console.volcengine.com](https://console.volcengine.com/ark) |
| Kimi | `moonshot-v1-8k` | [platform.moonshot.cn](https://platform.moonshot.cn/) |

---

## 项目结构

```
competiprd/
├── entrypoints/
│   ├── sidepanel/              # 侧边栏 UI (React + Tailwind)
│   │   ├── components/         # ChatInput, ChatMessages, MessageBubble,
│   │   │                       # ReportPreview, ExportBar, SettingsPanel,
│   │   │                       # PageInfoBar
│   │   ├── hooks/              # useChat (E2E pipeline), usePageInfo
│   │   └── stores/             # chatStore, settingsStore (Zustand)
│   ├── content/                # Content Script (Readability.js 页面抓取)
│   └── background/             # Service Worker (消息路由 + AI API + 导出)
├── shared/                     # 类型定义 + Prompt 模板 + chrome.storage 封装
├── public/icons/               # 扩展图标
├── wxt.config.ts               # WXT 配置
├── tailwind.css                # Tailwind CSS 入口
└── package.json
```

## 报告生成模块（14 个）

| # | 模块 | 内容 |
|---|------|------|
| 1 | 产品背景 | 市场趋势、用户痛点、业务价值 |
| 2 | 产品目标 | 可量化成功指标 (OKR) |
| 3 | 竞品分析 | 功能矩阵、优劣势、差异化机会 |
| 4 | 目标用户 | 用户画像、使用场景、核心需求 |
| 5 | 用户故事 | "作为 XX，我希望 XX，以便 XX" |
| 6 | 功能需求 | 核心功能、优先级 (P0/P1/P2) |
| 7 | 非功能需求 | 响应延迟、吞吐量、推理成本、公平性与伦理 |
| 8 | 异常处理 | 异常策略、提示文案、恢复路径 |
| 9 | 边界条件 | 输入长度、文件格式、语言范围、并发上限 |
| 10 | AI 可行性分析 | 输入弹性、规则语言化、示例可得性、容错空间 |
| 11 | 数据需求 | 数据来源、规模、标注规则、清洗规则、合规 |
| 12 | 产品流程图 | Mermaid 格式 |
| 13 | 数据埋点 | 追踪指标和埋点位置 |
| 14 | 发布计划 | 版本节奏、里程碑、灰度策略 |

> 针对 AI 产品额外包含：模型策略、Prompt 设计、数据策略、AI 风险评估

---

## 技术栈

| 层 | 选型 | 理由 |
|----|------|------|
| 扩展框架 | **WXT** | Vite 驱动，Chrome/Edge/Firefox 全兼容 |
| UI | **React 18 + TypeScript** | 类型安全，生态成熟 |
| 样式 | **Tailwind CSS 4** | 原子化 CSS，侧边栏空间精准控制 |
| 状态管理 | **Zustand 5** | 轻量 (<1KB)，适合插件场景 |
| 页面抓取 | **@mozilla/readability** | Mozilla 出品，正文提取业界标准 |
| Markdown | **marked + highlight.js** | 轻量渲染 + 代码高亮 |
| XSS 防护 | **DOMPurify** | AI 生成内容的输入净化 |
| Word 导出 | **docx + file-saver** | 纯前端 .docx 生成 |
| 存储 | **chrome.storage.local** | 所有数据本地，不上传 |

---

## 路线图

- [x] **v0.1 MVP** — 一键生成 + Claude + Markdown/Word/PDF + 对话微调 + 多模型
- [ ] **v0.2** — 右键菜单 + 素材池 + 批量竞品对比
- [ ] **v0.3** — 报告模板系统 + 模块选择性生成
- [ ] **v0.4** — Obsidian Vault 集成 + 复盘知识库
- [ ] **v0.5** — Chrome 内置 AI (Gemini Nano) + 多语言
- [ ] **v1.0** — 测试覆盖 + Chrome Web Store 上架

---

## License

MIT
