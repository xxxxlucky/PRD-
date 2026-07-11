import { create } from 'zustand';
import type { AppSettings, AIProvider } from '../../../shared/types';
import { DEFAULT_SETTINGS } from '../../../shared/types';
import { getSettings, saveSettings } from '../../../shared/storage';

interface SettingsState {
  settings: AppSettings;
  loaded: boolean;

  loadSettings: () => Promise<void>;
  setApiKey: (provider: AIProvider, apiKey: string, model?: string, baseUrl?: string) => Promise<void>;
  setActiveProvider: (provider: AIProvider) => Promise<void>;
  updateObsidian: (obsidian: Partial<AppSettings['obsidian']>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  loadSettings: async () => {
    const stored = await getSettings();
    set({ settings: stored, loaded: true });
  },

  setApiKey: async (provider, apiKey, model?, baseUrl?) => {
    const { settings } = get();
    const updated = {
      ...settings,
      providers: {
        ...settings.providers,
        [provider]: {
          provider,
          apiKey,
          model: model || getDefaultModel(provider),
          baseUrl,
        },
      },
    };
    set({ settings: updated });
    await saveSettings({ providers: updated.providers });
  },

  setActiveProvider: async (provider) => {
    set((s) => ({ settings: { ...s.settings, activeProvider: provider } }));
    await saveSettings({ activeProvider: provider });
  },

  updateObsidian: async (obsidian) => {
    set((s) => ({
      settings: { ...s.settings, obsidian: { ...s.settings.obsidian, ...obsidian } },
    }));
    await saveSettings({ obsidian: get().settings.obsidian });
  },
}));

function getDefaultModel(provider: AIProvider): string {
  switch (provider) {
    case 'claude': return 'claude-sonnet-4-20250514';
    case 'openai': return 'gpt-4o';
    case 'deepseek': return 'deepseek-chat';
    case 'doubao': return 'doubao-pro-32k';
    case 'kimi': return 'moonshot-v1-8k';
    case 'gemini-nano': return 'gemini-nano';
  }
}
