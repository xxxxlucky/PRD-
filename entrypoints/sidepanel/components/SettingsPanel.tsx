import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import type { AIProvider } from '../../../shared/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS: { id: AIProvider; label: string }[] = [
  { id: 'claude', label: 'Claude (Anthropic)' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'doubao', label: '豆包 (字节)' },
  { id: 'kimi', label: 'Kimi (月之暗面)' },
];

export const SettingsPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const settings = useSettingsStore((s) => s.settings);
  const loaded = useSettingsStore((s) => s.loaded);
  const setApiKey = useSettingsStore((s) => s.setApiKey);
  const setActiveProvider = useSettingsStore((s) => s.setActiveProvider);

  const [localKeys, setLocalKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    if (loaded) {
      const keys: Record<string, string> = {};
      for (const [provider, config] of Object.entries(settings.providers)) {
        if (config) keys[provider] = config.apiKey;
      }
      setLocalKeys(keys);
    }
  }, [loaded, settings.providers]);

  if (!isOpen) return null;

  const activeConfig = settings.providers[settings.activeProvider];

  return (
    <div className="fixed inset-0 z-50 bg-black/30" onClick={onClose}>
      <div
        className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl border-l border-gray-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-800">⚙️ 设置</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Provider selection */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">默认 AI 模型</label>
            <select
              value={settings.activeProvider}
              onChange={(e) => setActiveProvider(e.target.value as AIProvider)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* API Keys */}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1.5">API Keys</label>
            {PROVIDERS.map((p) => (
              <div key={p.id} className="mb-2">
                <label className="text-[11px] text-gray-500 block mb-0.5">{p.label}</label>
                <input
                  type="password"
                  value={localKeys[p.id] || ''}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setLocalKeys((prev) => ({ ...prev, [p.id]: newValue }));
                    setApiKey(p.id, newValue);
                  }}
                  placeholder={p.id === settings.activeProvider ? '输入 API Key...' : '可选'}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-300"
                />
              </div>
            ))}
          </div>

          {/* Status */}
          <div className={`text-xs px-2 py-1.5 rounded ${
            activeConfig?.apiKey
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}>
            {activeConfig?.apiKey
              ? `✅ ${PROVIDERS.find(p => p.id === settings.activeProvider)?.label} 已配置`
              : `⚠️ 请配置 ${PROVIDERS.find(p => p.id === settings.activeProvider)?.label} 的 API Key`
            }
          </div>
        </div>
      </div>
    </div>
  );
};
