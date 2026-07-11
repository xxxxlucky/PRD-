// ========== Report Modules ==========
export type ReportModule =
  | 'background'
  | 'goals'
  | 'competitor-analysis'
  | 'target-users'
  | 'user-stories'
  | 'functional-requirements'
  | 'non-functional-requirements'
  | 'error-handling'
  | 'boundary-conditions'
  | 'ai-feasibility'
  | 'data-requirements'
  | 'product-flow'
  | 'data-tracking'
  | 'release-plan';

export const ALL_MODULES: ReportModule[] = [
  'background', 'goals', 'competitor-analysis', 'target-users',
  'user-stories', 'functional-requirements', 'non-functional-requirements',
  'error-handling', 'boundary-conditions', 'ai-feasibility',
  'data-requirements', 'product-flow', 'data-tracking', 'release-plan',
];

export const MODULE_LABELS: Record<ReportModule, string> = {
  'background': '产品背景',
  'goals': '产品目标',
  'competitor-analysis': '竞品分析',
  'target-users': '目标用户',
  'user-stories': '用户故事',
  'functional-requirements': '功能需求',
  'non-functional-requirements': '非功能需求',
  'error-handling': '异常处理',
  'boundary-conditions': '边界条件',
  'ai-feasibility': 'AI 可行性分析',
  'data-requirements': '数据需求',
  'product-flow': '产品流程图',
  'data-tracking': '数据埋点',
  'release-plan': '发布计划',
};

// ========== Page Content ==========
export interface PageInfo {
  url: string;
  title: string;
  description: string;
  bodyText: string;       // extracted by Readability, max 25000 chars
  truncated?: boolean;    // true when bodyText was truncated to fit 25000 chars
  ogImage?: string;
  pageType: PageType;
}

export type PageType = 'official-site' | 'docs' | 'github' | 'app-store' | 'media' | 'unknown';

// ========== Chat ==========
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;        // user: plain text; assistant: markdown string
  timestamp: number;
  isStreaming?: boolean;  // true while assistant response still arriving
}

// ========== Analysis ==========
export interface AnalysisRequest {
  pageInfo: PageInfo;
  userInstruction: string;
  selectedModules: ReportModule[];
  customTemplate?: string;  // user overrides default system prompt
}

export interface AnalysisResponse {
  reportMarkdown: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// ========== AI Provider ==========
export type AIProvider = 'claude' | 'openai' | 'deepseek' | 'doubao' | 'kimi' | 'gemini-nano';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;  // for proxies / DeepSeek / Kimi
}

// ========== Settings ==========
export interface AppSettings {
  activeProvider: AIProvider;
  providers: Partial<Record<AIProvider, AIProviderConfig>>;
  obsidian: {
    vaultPath: string;
    reportDir: string;     // default: "竞品分析"
    reviewDir: string;     // default: "复盘"
    autoTag: boolean;
  };
  language: 'zh' | 'en';
}

export const DEFAULT_SETTINGS: AppSettings = {
  activeProvider: 'claude',
  providers: {},
  obsidian: {
    vaultPath: '',
    reportDir: '竞品分析',
    reviewDir: '复盘',
    autoTag: true,
  },
  language: 'zh',
};

// ========== History ==========
export interface AnalysisHistory {
  id: string;
  title: string;
  url: string;
  createdAt: number;
  snippet: string;        // first 200 chars of the report
}
