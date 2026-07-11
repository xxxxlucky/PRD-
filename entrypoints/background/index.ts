import { defineBackground } from 'wxt/sandbox';
import type { PageInfo, AIProviderConfig } from '../../shared/types';
import { buildUserPrompt, DEFAULT_SYSTEM_PROMPT, REFINE_SYSTEM_PROMPT } from '../../shared/prompts';

// ========== Module-scoped state ==========
// Concurrency lock: only one analysis call at a time.
let isAnalyzing = false;

export default defineBackground(() => {
  // ========== Message Types ==========
  const MSG_CAPTURE_PAGE = 'competiprd:capture-page';
  const MSG_ANALYZE = 'competiprd:analyze';
  const MSG_EXPORT_MD = 'competiprd:export-md';
  const MSG_GET_TAB_INFO = 'competiprd:get-tab-info';
  const MSG_COPY_TO_CLIPBOARD = 'competiprd:copy-clipboard';

  interface AnalyzePayload {
    pageInfo: PageInfo;
    userInstruction: string;
    providerConfig: AIProviderConfig;
    /** Previous conversation messages (for refinement/follow-up turns) */
    conversationHistory?: Array<{ role: string; content: string }>;
  }

  // ========== Extension Lifecycle ==========
  chrome.runtime.onInstalled.addListener(() => {
    console.log('[CompetiPrd] Extension installed');
  });

  // Extension icon click -> open Side Panel
  chrome.action.onClicked.addListener((tab) => {
    if (tab.windowId) {
      chrome.sidePanel.open({ windowId: tab.windowId });
    }
  });

  // ========== Message Router ==========
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { type, payload } = message;

    switch (type) {
      case MSG_GET_TAB_INFO:
        handleGetTabInfo(sender).then(sendResponse);
        return true; // async response

      case MSG_CAPTURE_PAGE:
        handleCapturePage(sender).then(sendResponse);
        return true;

      case MSG_ANALYZE:
        handleAnalyze(payload, sender).then(sendResponse);
        return true;

      case MSG_EXPORT_MD:
        handleExportMD(payload).then(sendResponse);
        return true;

      case MSG_COPY_TO_CLIPBOARD:
        handleCopyToClipboard(payload).then(sendResponse);
        return true;

      default:
        return false;
    }
  });

  // ========== Handlers ==========

  async function handleGetTabInfo(sender: chrome.runtime.MessageSender): Promise<{ url: string; title: string }> {
    const tabId = sender.tab?.id;
    if (!tabId) {
      // Fallback: query active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return { url: tab?.url || '', title: tab?.title || '' };
    }
    const tab = await chrome.tabs.get(tabId);
    return { url: tab.url || '', title: tab.title || '' };
  }

  async function handleCapturePage(sender: chrome.runtime.MessageSender): Promise<PageInfo | { error: string }> {
    let tabId = sender.tab?.id;

    // When called from Side Panel, sender.tab is undefined — fall back to active tab.
    if (!tabId) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = activeTab?.id;
    }

    if (!tabId) {
      console.error('[CompetiPrd] Capture page failed: no tab ID');
      return { error: '无法获取当前标签页' };
    }

    // WXT auto-injects registered content scripts based on manifest matching.
    // No manual chrome.scripting.executeScript needed — just send a message.
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId!, { type: 'competiprd:extract-content' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[CompetiPrd] Content script message failed:', chrome.runtime.lastError.message);
          resolve({ error: `页面内容提取失败: ${chrome.runtime.lastError.message}` });
          return;
        }
        resolve(response || { error: '页面内容为空' });
      });
    });
  }

  async function handleAnalyze(
    payload: AnalyzePayload,
    _sender: chrome.runtime.MessageSender,
  ): Promise<{ markdown: string } | { error: string }> {
    // Concurrency lock: only one analysis at a time.
    if (isAnalyzing) {
      return { error: '已有分析任务在进行中，请稍后重试' };
    }

    const { pageInfo, userInstruction, providerConfig } = payload;

    isAnalyzing = true;
    try {
      switch (providerConfig.provider) {
        case 'claude':
          return await callClaudeAPI(pageInfo, userInstruction, providerConfig, payload.conversationHistory);
        case 'deepseek':
        case 'openai':
        case 'doubao':
        case 'kimi':
          // All use OpenAI-compatible chat completions format
          return await callOpenAICompatibleAPI(pageInfo, userInstruction, providerConfig, payload.conversationHistory);
        default:
          console.error('[CompetiPrd] Unsupported AI provider:', providerConfig.provider);
          return { error: `不支持的 AI 模型: ${providerConfig.provider}` };
      }
    } finally {
      isAnalyzing = false;
    }
  }

  async function callClaudeAPI(
    pageInfo: PageInfo,
    userInstruction: string,
    config: AIProviderConfig,
    conversationHistory?: Array<{ role: string; content: string }>,
  ): Promise<{ markdown: string } | { error: string }> {
    const userPrompt = buildUserPrompt(pageInfo, userInstruction);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000); // 60s timeout

    // Build messages: if there's prior conversation, include it so the model can
    // improve the existing report instead of starting from scratch.
    const messages: Array<{ role: string; content: string }> = [];
    if (conversationHistory && conversationHistory.length > 0) {
      for (const m of conversationHistory) {
        messages.push({ role: m.role, content: m.content });
      }
    }
    messages.push({ role: 'user', content: userPrompt });

    const systemPrompt = (conversationHistory && conversationHistory.length > 0)
      ? REFINE_SYSTEM_PROMPT
      : DEFAULT_SYSTEM_PROMPT;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model || 'claude-sonnet-4-20250514',
          max_tokens: 8192,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        console.error('[CompetiPrd] Claude API error', response.status, errText);

        let errMsg: string;
        if (response.status === 401) {
          errMsg = 'API Key 无效，请在设置中重新配置';
        } else if (response.status === 429) {
          errMsg = 'API 额度已用完或请求过于频繁，请稍后重试或更换 Key';
        } else if (response.status === 403) {
          errMsg = 'API Key 无权限访问该模型，请检查账户权限';
        } else {
          errMsg = `Claude API 错误 (${response.status}): ${errText.slice(0, 200)}`;
        }
        return { error: errMsg };
      }

      const data = await response.json();
      const markdown = data.content?.[0]?.text || '';
      if (!markdown.trim()) {
        return { error: 'AI 返回内容为空，请尝试刷新页面后重试' };
      }
      return { markdown };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { error: 'AI 响应超时（60 秒），请稍后重试。如持续超时，建议选择较短的报告模块' };
      }
      console.error('[CompetiPrd] Claude API network failure:', err);
      return { error: `网络请求失败: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  // ========== OpenAI-Compatible API (DeepSeek / OpenAI / 豆包 / Kimi) ==========
  async function callOpenAICompatibleAPI(
    pageInfo: PageInfo,
    userInstruction: string,
    config: AIProviderConfig,
    conversationHistory?: Array<{ role: string; content: string }>,
  ): Promise<{ markdown: string } | { error: string }> {
    const userPrompt = buildUserPrompt(pageInfo, userInstruction);
    const controller = new AbortController();

    // Build messages with conversation history for refinement turns
    const apiMessages: Array<{ role: string; content: string }> = [];
    if (conversationHistory && conversationHistory.length > 0) {
      // Include system prompt as first message for OpenAI-compatible APIs
      apiMessages.push({ role: 'system', content: REFINE_SYSTEM_PROMPT });
      for (const m of conversationHistory) {
        apiMessages.push({ role: m.role, content: m.content });
      }
    } else {
      apiMessages.push({ role: 'system', content: DEFAULT_SYSTEM_PROMPT });
    }
    apiMessages.push({ role: 'user', content: userPrompt });
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    // Resolve base URL per provider
    const baseUrl = config.baseUrl || getProviderBaseUrl(config.provider);
    const model = config.model || getProviderDefaultModel(config.provider);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 8192,
          messages: apiMessages,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[CompetiPrd] ${config.provider} API error`, response.status, errText);

        let errMsg: string;
        if (response.status === 401) {
          errMsg = 'API Key 无效，请在设置中重新配置';
        } else if (response.status === 429) {
          errMsg = 'API 额度已用完或请求过于频繁，请稍后重试或更换 Key';
        } else {
          errMsg = `${config.provider} API 错误 (${response.status}): ${errText.slice(0, 200)}`;
        }
        return { error: errMsg };
      }

      const data = await response.json();
      const markdown = data.choices?.[0]?.message?.content || '';
      if (!markdown.trim()) {
        return { error: 'AI 返回内容为空，请尝试刷新页面后重试' };
      }
      return { markdown };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { error: 'AI 响应超时（60 秒），请稍后重试。如持续超时，建议选择较短的报告模块' };
      }
      console.error(`[CompetiPrd] ${config.provider} API network failure:`, err);
      return { error: `网络请求失败: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  function getProviderBaseUrl(provider: string): string {
    switch (provider) {
      case 'deepseek': return 'https://api.deepseek.com/v1';
      case 'openai':   return 'https://api.openai.com/v1';
      case 'doubao':   return 'https://ark.cn-beijing.volces.com/api/v3';
      case 'kimi':     return 'https://api.moonshot.cn/v1';
      default:         return 'https://api.openai.com/v1';
    }
  }

  function getProviderDefaultModel(provider: string): string {
    switch (provider) {
      case 'deepseek': return 'deepseek-chat';
      case 'openai':   return 'gpt-4o';
      case 'doubao':   return 'doubao-pro-32k';
      case 'kimi':     return 'moonshot-v1-8k';
      default:         return 'gpt-4o';
    }
  }

  async function handleExportMD(payload: { markdown: string; filename: string }): Promise<{ success: true } | { error: string }> {
    try {
      // Use data URL instead of Blob URL. Service Workers can be terminated at any
      // time, so setTimeout-based Blob URL cleanup is unreliable. Data URLs are
      // self-contained and avoid this class of bug entirely.
      const encoded = encodeURIComponent(payload.markdown);
      const dataUrl = `data:text/markdown;charset=utf-8,${encoded}`;

      await chrome.downloads.download({
        url: dataUrl,
        filename: payload.filename,
        saveAs: true,
      });

      return { success: true };
    } catch (err) {
      console.error('[CompetiPrd] Export MD failed:', err);
      return { error: `文件下载失败: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  async function handleCopyToClipboard(_payload: { text: string }): Promise<{ success: true } | { error: string }> {
    // In MV3 Service Workers, we don't have direct clipboard access.
    // This is handled by the Side Panel which has DOM access.
    return { error: 'Copy must be handled by Side Panel' };
  }
});
