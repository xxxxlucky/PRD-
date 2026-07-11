import type { AppSettings, AnalysisHistory } from './types';
import { DEFAULT_SETTINGS } from './types';

const SETTINGS_KEY = 'competiprd_settings';
const HISTORY_KEY = 'competiprd_history';
const MAX_HISTORY = 50;

export async function getSettings(): Promise<AppSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  const stored = result[SETTINGS_KEY] as Partial<AppSettings> | undefined;
  if (!stored) return { ...DEFAULT_SETTINGS };
  // Deep merge: preserve nested defaults that aren't in stored
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    providers: { ...DEFAULT_SETTINGS.providers, ...stored.providers },
    obsidian: { ...DEFAULT_SETTINGS.obsidian, ...stored.obsidian },
  };
}

export async function saveSettings(partial: Partial<AppSettings>): Promise<void> {
  const current = await getSettings();
  // Deep merge: top-level + nested providers and obsidian
  const merged: AppSettings = {
    ...current,
    ...partial,
    providers: partial.providers
      ? { ...current.providers, ...partial.providers }
      : current.providers,
    obsidian: partial.obsidian
      ? { ...current.obsidian, ...partial.obsidian }
      : current.obsidian,
  };
  await chrome.storage.local.set({ [SETTINGS_KEY]: merged });
}

export async function getHistory(): Promise<AnalysisHistory[]> {
  const result = await chrome.storage.local.get(HISTORY_KEY);
  return result[HISTORY_KEY] || [];
}

export async function addHistory(entry: AnalysisHistory): Promise<void> {
  const history = await getHistory();
  history.unshift(entry);
  // Keep only last MAX_HISTORY
  const trimmed = history.slice(0, MAX_HISTORY);
  await chrome.storage.local.set({ [HISTORY_KEY]: trimmed });
}

export async function clearHistory(): Promise<void> {
  await chrome.storage.local.remove(HISTORY_KEY);
}
