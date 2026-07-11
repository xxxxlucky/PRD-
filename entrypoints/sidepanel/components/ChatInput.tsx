import React, { useState } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useChat } from '../hooks/useChat';

export const ChatInput: React.FC = () => {
  const [input, setInput] = useState('');
  const isAnalyzing = useChatStore((s) => s.isAnalyzing);
  const loaded = useSettingsStore((s) => s.loaded);
  const { sendMessage } = useChat();

  const handleSend = () => {
    const text = input.trim();
    if (!text || isAnalyzing || !loaded) return;
    setInput('');
    sendMessage(text);
  };

  const handleOneClick = () => {
    if (isAnalyzing || !loaded) return;
    sendMessage('请生成完整的竞品分析报告');
  };

  return (
    <div className="border-t border-gray-200 p-3 bg-white shrink-0">
      <button
        onClick={handleOneClick}
        disabled={isAnalyzing || !loaded}
        className="w-full px-3 py-2 text-sm font-medium rounded-md bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-2"
      >
        ⚡ 一键生成竞品分析报告
      </button>

      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="微调报告，如：展开定价对比、加AI风险评估…"
          disabled={isAnalyzing || !loaded}
          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent disabled:bg-gray-100"
        />
        <button
          type="submit"
          disabled={!input.trim() || isAnalyzing || !loaded}
          className="shrink-0 px-4 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isAnalyzing ? '⏳' : '发送'}
        </button>
      </form>
    </div>
  );
};
