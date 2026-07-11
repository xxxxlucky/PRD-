import { defineConfig } from 'wxt';

export default defineConfig({
  // WXT auto-detects React from dependencies — no explicit module needed
  manifest: {
    name: 'CompetiPrd — 竞品分析报告生成器',
    description: '浏览任意网站，一键生成结构化竞品分析报告（Markdown），AI产品经理专属',
    permissions: ['activeTab', 'storage', 'sidePanel', 'scripting', 'downloads'],
    host_permissions: ['<all_urls>', 'https://api.anthropic.com/*'],
    side_panel: {
      default_path: 'entrypoints/sidepanel/index.html',
    },
    action: {
      default_title: 'CompetiPrd — 竞品分析',
    },
  },
});
