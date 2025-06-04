import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/constants';
import { AIService, ContentExtractionTiming, FloatButtonPosition, TabBehavior } from '@/types';

interface SettingsState {
  prompts: {
    [key in AIService]: string;
  };
  tabBehavior: TabBehavior;
  floatButtonPosition: FloatButtonPosition;
  contentExtractionTiming: ContentExtractionTiming;
  isShowMessage: boolean;
  isShowBadge: boolean;
  saveArticleOnClipboard: boolean;
}

const DEFAULT_PROMPT = `Extract each theme from the following text without omission and summarize the main points in Japanese.

# Title
{title}

# URL
{url}

# Content
{content}`;

const DEFAULT_SETTINGS: SettingsState = {
  prompts: {
    [AIService.CHATGPT]: DEFAULT_PROMPT,
    [AIService.GEMINI]: DEFAULT_PROMPT,
    [AIService.CLAUDE]: DEFAULT_PROMPT,
    [AIService.GROK]: DEFAULT_PROMPT,
    [AIService.PERPLEXITY]: DEFAULT_PROMPT,
    [AIService.DEEPSEEK]: DEFAULT_PROMPT,
  },
  tabBehavior: TabBehavior.CURRENT_TAB,
  floatButtonPosition: FloatButtonPosition.HIDE,
  contentExtractionTiming: ContentExtractionTiming.AUTOMATIC,
  isShowMessage: true,
  isShowBadge: true,
  saveArticleOnClipboard: true,
};

interface SettingsStore extends SettingsState {
  prompt: (service: AIService) => Promise<string>;
  setPrompt: (service: AIService, prompt: string) => Promise<void>;
  setTabBehavior: (tabBehavior: TabBehavior) => Promise<void>;
  setFloatButtonPosition: (floatButtonPosition: FloatButtonPosition) => Promise<void>;
  setContentExtractionTiming: (contentExtractionTiming: ContentExtractionTiming) => Promise<void>;
  setIsShowMessage: (isShowMessage: boolean) => Promise<void>;
  setIsShowBadge: (isShowBadge: boolean) => Promise<void>;
  setSaveArticleOnClipboard: (saveArticleOnClipboard: boolean) => Promise<void>;
  getContentExtractionTiming: () => Promise<ContentExtractionTiming>;
  getSaveArticleOnClipboard: () => Promise<boolean>;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      prompt: async (service: AIService) => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.prompts?.[service] ?? DEFAULT_SETTINGS.prompts[service];
      },
      setPrompt: async (service: AIService, prompt: string) =>
        set(state => ({
          prompts: {
            ...state.prompts,
            [service]: prompt,
          },
        })),
      setTabBehavior: async (tabBehavior: TabBehavior) =>
        set(() => ({
          tabBehavior,
        })),
      setFloatButtonPosition: async (floatButtonPosition: FloatButtonPosition) =>
        set(() => ({
          floatButtonPosition,
        })),
      setContentExtractionTiming: async (contentExtractionTiming: ContentExtractionTiming) =>
        set(() => ({
          contentExtractionTiming,
        })),
      setIsShowMessage: async (isShowMessage: boolean) =>
        set(() => ({
          isShowMessage,
        })),
      setIsShowBadge: async (isShowBadge: boolean) =>
        set(() => ({
          isShowBadge,
        })),
      setSaveArticleOnClipboard: async (saveArticleOnClipboard: boolean) =>
        set(() => ({
          saveArticleOnClipboard,
        })),
      getContentExtractionTiming: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.contentExtractionTiming ?? DEFAULT_SETTINGS.contentExtractionTiming;
      },
      getSaveArticleOnClipboard: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.saveArticleOnClipboard ?? DEFAULT_SETTINGS.saveArticleOnClipboard;
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      storage: {
        /**
         * Custom storage getter that loads data from Chrome storage
         * Handles errors and logs them appropriately
         */
        getItem: async (name: string) => {
          const result = await chrome.storage.local.get(name);
          return result[name];
        },
        /**
         * Custom storage setter that saves data to Chrome storage
         * Handles errors and logs them appropriately
         */
        setItem: async (name: string, value: any) => {
          await chrome.storage.local.set({ [name]: value });
        },
        /**
         * Custom storage remover that deletes data from Chrome storage
         * Handles errors and logs them appropriately
         */
        removeItem: async (name: string) => {
          await chrome.storage.local.remove(name);
        },
      },
    }
  )
);
