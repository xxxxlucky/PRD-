import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';

export const ChatMessages: React.FC = () => {
  const messages = useChatStore((s) => s.messages);
  const error = useChatStore((s) => s.error);
  const isAnalyzing = useChatStore((s) => s.isAnalyzing);
  const setError = useChatStore((s) => s.setError);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { sendMessage } = useChat();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, error]);

  const handleRetry = () => {
    const { messages: currentMsgs } = useChatStore.getState();
    const lastUserMsg = [...currentMsgs].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      setError(null);
      sendMessage(lastUserMsg.content);
    }
  };

  if (messages.length === 0 && !isAnalyzing && !error) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-4">
        <div className="text-center">
          <p className="text-3xl mb-2">🔍</p>
          <p>打开任意竞品网页</p>
          <p className="mt-1">点击下方「一键生成」开始分析</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-3">
          <p className="mb-2">⚠️ {error}</p>
          <button
            onClick={handleRetry}
            className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 rounded border border-red-300 transition-colors"
          >
            🔄 重试
          </button>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
