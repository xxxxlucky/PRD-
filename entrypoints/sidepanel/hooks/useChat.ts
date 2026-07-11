import { useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { PageInfo } from '../../../shared/types';

/**
 * useChat — Core hook that wires the full E2E analysis pipeline:
 * Side Panel → Background SW (capture page, call Claude, export) → render.
 */
export function useChat() {
  const addMessage = useChatStore((s) => s.addMessage);
  const updateLastMessage = useChatStore((s) => s.updateLastMessage);
  const setAnalyzing = useChatStore((s) => s.setAnalyzing);
  const setError = useChatStore((s) => s.setError);
  const pageInfo = useChatStore((s) => s.pageInfo);
  const setPageInfo = useChatStore((s) => s.setPageInfo);
  const settings = useSettingsStore((s) => s.settings);

  /**
   * Send a user instruction through the full E2E pipeline:
   *   1. Capture the current page content via Background SW
   *   2. Send page content + instruction to Claude via Background SW
   *   3. Update the chat with the rendered markdown report
   */
  const sendMessage = useCallback(
    async (userInstruction: string) => {
      // ── Guard: settings loaded + API key configured ──
      const activeConfig = settings.providers[settings.activeProvider];
      if (!activeConfig?.apiKey) {
        setError('请先在设置中配置 API Key');
        return;
      }

      // ── Guard: prevent concurrent analysis ──
      const { isAnalyzing } = useChatStore.getState();
      if (isAnalyzing) return;

      setAnalyzing(true);
      setError(null);

      // ── Add user message ──
      addMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content: userInstruction,
        timestamp: Date.now(),
      });

      // ── Add placeholder assistant message (isStreaming for future v0.2) ──
      const assistantId = crypto.randomUUID();
      addMessage({
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      });

      try {
        // ── Step 1: Capture page content ──
        let currentPageInfo: PageInfo | null = pageInfo;

        try {
          const captureResult: unknown = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
              { type: 'competiprd:capture-page', payload: {} },
              (response) => resolve(response),
            );
          });

          if (captureResult && typeof captureResult === 'object' && !(captureResult as any).error) {
            currentPageInfo = captureResult as PageInfo;
            setPageInfo(currentPageInfo);
          }
        } catch {
          // Capture failed silently — proceed with whatever pageInfo we already have
        }

        if (!currentPageInfo) {
          setError('无法获取页面信息，请确保在有效网页上使用');
          setAnalyzing(false);
          return;
        }

        // ── Build conversation history from previous messages ──
        // If the user already has a report and is refining it, pass the full
        // dialog so the AI can improve the existing report rather than restarting.
        const { messages: existingMessages } = useChatStore.getState();
        const conversationHistory: Array<{ role: string; content: string }> = [];
        if (existingMessages.length > 0) {
          for (const msg of existingMessages) {
            if (msg.role === 'user' || msg.role === 'assistant') {
              // Skip the placeholder assistant message (empty content, isStreaming)
              if (msg.isStreaming && !msg.content) continue;
              conversationHistory.push({ role: msg.role, content: msg.content });
            }
          }
        }

        // ── Step 2: Call AI analysis ──
        const analysisResult: unknown = await new Promise((resolve) => {
          chrome.runtime.sendMessage(
            {
              type: 'competiprd:analyze',
              payload: {
                pageInfo: currentPageInfo,
                userInstruction,
                providerConfig: activeConfig,
                conversationHistory,
              },
            },
            (response) => resolve(response),
          );
        });

        if (
          analysisResult &&
          typeof analysisResult === 'object' &&
          (analysisResult as any).error
        ) {
          setError((analysisResult as any).error);
          // Remove the placeholder assistant message on error
          const { messages } = useChatStore.getState();
          useChatStore.setState({
            messages: messages.filter((m) => m.id !== assistantId),
            isAnalyzing: false,
          });
          return;
        }

        // ── Step 3: Update assistant message with result ──
        const { messages } = useChatStore.getState();
        const updatedMsgs = messages.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  typeof analysisResult === 'object' &&
                  analysisResult !== null
                    ? (analysisResult as any).markdown || ''
                    : '',
                isStreaming: false,
              }
            : m,
        );
        useChatStore.setState({ messages: updatedMsgs, isAnalyzing: false, error: null });
      } catch (err) {
        setError(`分析失败: ${err instanceof Error ? err.message : String(err)}`);
        // Remove the placeholder assistant message on error
        const { messages: ms } = useChatStore.getState();
        useChatStore.setState({
          messages: ms.filter((m) => m.id !== assistantId),
          isAnalyzing: false,
        });
      }
    },
    [settings, pageInfo, addMessage, setAnalyzing, setError, setPageInfo],
  );

  return { sendMessage };
}
