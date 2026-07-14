import React, { useEffect, useState } from 'react';
import { PageInfoBar } from './components/PageInfoBar';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { ExportBar } from './components/ExportBar';
import { SettingsPanel } from './components/SettingsPanel';
import { usePageInfo } from './hooks/usePageInfo';
import { useSettingsStore } from './stores/settingsStore';

const App: React.FC = () => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const loadSettings = useSettingsStore((s) => s.loadSettings);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  usePageInfo();

  return (
    <div className="flex flex-col h-screen max-h-screen bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-violet-500 text-white shrink-0">
        <h1 className="text-sm font-bold tracking-wide">CompetiPrd</h1>
        <div className="flex items-center gap-2">
          <span className="text-[10px] opacity-75">竞品分析报告</span>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-white/80 hover:text-white text-sm transition-colors"
            title="设置"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Page info bar */}
      <PageInfoBar />

      {/* Chat messages */}
      <ChatMessages />

      {/* Export bar */}
      <ExportBar />

      {/* Chat input */}
      <ChatInput />

      {/* Settings panel */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default App;
