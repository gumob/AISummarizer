import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/constants';
import {
  AIService,
  ContentExtractionTiming,
  FloatPanelPosition,
  MessageAction,
  TabBehavior,
} from '@/types';
import { logger } from '@/utils';

export interface SettingsState {
  prompts: {
    [key in AIService]: string;
  };
  tabBehavior: TabBehavior;
  floatButtonPosition: FloatPanelPosition;
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

export const DEFAULT_SETTINGS: SettingsState = {
  prompts: {
    [AIService.CHATGPT]: DEFAULT_PROMPT,
    [AIService.GEMINI]: DEFAULT_PROMPT,
    [AIService.CLAUDE]: DEFAULT_PROMPT,
    [AIService.GROK]: DEFAULT_PROMPT,
    [AIService.PERPLEXITY]: DEFAULT_PROMPT,
    [AIService.DEEPSEEK]: DEFAULT_PROMPT,
  },
  tabBehavior: TabBehavior.CURRENT_TAB,
  floatButtonPosition: FloatPanelPosition.HIDE,
  contentExtractionTiming: ContentExtractionTiming.AUTOMATIC,
  isShowMessage: true,
  isShowBadge: true,
  saveArticleOnClipboard: true,
};

interface SettingsStore extends SettingsState {
  prompt: (service: AIService) => Promise<string>;
  setPrompt: (service: AIService, prompt: string) => Promise<void>;
  setTabBehavior: (tabBehavior: TabBehavior) => Promise<void>;
  setFloatButtonPosition: (floatButtonPosition: FloatPanelPosition) => Promise<void>;
  setContentExtractionTiming: (contentExtractionTiming: ContentExtractionTiming) => Promise<void>;
  setIsShowMessage: (isShowMessage: boolean) => Promise<void>;
  setIsShowBadge: (isShowBadge: boolean) => Promise<void>;
  setSaveArticleOnClipboard: (saveArticleOnClipboard: boolean) => Promise<void>;
  getContentExtractionTiming: () => Promise<ContentExtractionTiming>;
  getSaveArticleOnClipboard: () => Promise<boolean>;
  getFloatButtonPosition: () => Promise<FloatPanelPosition>;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      prompt: async (service: AIService) => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.prompts?.[service] ?? DEFAULT_SETTINGS.prompts[service];
      },
      setPrompt: async (service: AIService, prompt: string) => {
        set(state => ({
          prompts: {
            ...state.prompts,
            [service]: prompt,
          },
        }));
        await sendSettingsUpdate();
      },
      setTabBehavior: async (tabBehavior: TabBehavior) => {
        set(() => ({ tabBehavior }));
        await sendSettingsUpdate();
      },
      setFloatButtonPosition: async (floatButtonPosition: FloatPanelPosition) => {
        set(() => ({ floatButtonPosition }));
        logger.debug('🏪⚙️', 'setFloatButtonPosition', 'floatButtonPosition', floatButtonPosition);
        await sendSettingsUpdate();
      },
      setContentExtractionTiming: async (contentExtractionTiming: ContentExtractionTiming) => {
        set(() => ({ contentExtractionTiming }));
        await sendSettingsUpdate();
      },
      setIsShowMessage: async (isShowMessage: boolean) => {
        set(() => ({ isShowMessage }));
        await sendSettingsUpdate();
      },
      setIsShowBadge: async (isShowBadge: boolean) => {
        set(() => ({ isShowBadge }));
        await sendSettingsUpdate();
      },
      setSaveArticleOnClipboard: async (saveArticleOnClipboard: boolean) => {
        set(() => ({ saveArticleOnClipboard }));
        await sendSettingsUpdate();
      },
      getContentExtractionTiming: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.contentExtractionTiming ?? DEFAULT_SETTINGS.contentExtractionTiming;
      },
      getSaveArticleOnClipboard: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.saveArticleOnClipboard ?? DEFAULT_SETTINGS.saveArticleOnClipboard;
      },
      getFloatButtonPosition: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.floatButtonPosition ?? DEFAULT_SETTINGS.floatButtonPosition;
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

/**
 * Send settings update to content script
 */
const sendSettingsUpdate = async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      logger.warn('🏪⚙️', 'No active tab found');
      return;
    }

    const settings = useSettingsStore.getState();
    await chrome.tabs.sendMessage(tab.id, {
      action: MessageAction.SETTINGS_UPDATED,
      payload: {
        prompts: settings.prompts,
        tabBehavior: settings.tabBehavior,
        floatButtonPosition: settings.floatButtonPosition,
        contentExtractionTiming: settings.contentExtractionTiming,
        isShowMessage: settings.isShowMessage,
        isShowBadge: settings.isShowBadge,
        saveArticleOnClipboard: settings.saveArticleOnClipboard,
      },
    });
    logger.debug('🏪⚙️', 'Settings update message sent to content script');
  } catch (error) {
    logger.error('🏪⚙️', 'Failed to send settings update message:', error);
  }
};
