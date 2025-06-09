import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/constants';
import { AIService, ContentExtractionTiming, FloatPanelPosition, MessageAction, TabBehavior } from '@/types';
import { logger } from '@/utils';

export interface SettingsState {
  prompts: {
    [key in AIService]: string;
  };
  tabBehavior: TabBehavior;
  floatPanelPosition: FloatPanelPosition;
  contentExtractionTiming: ContentExtractionTiming;
  extractionDenylist: string[];
  saveArticleOnClipboard: boolean;
  isShowMessage: boolean;
  isShowBadge: boolean;
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
  tabBehavior: TabBehavior.NEW_TAB,
  floatPanelPosition: FloatPanelPosition.BOTTOM_RIGHT,
  contentExtractionTiming: ContentExtractionTiming.AUTOMATIC,
  extractionDenylist: [
    /** AI services */
    '(https?)\\:\\/\\/(www\\.)?(chatgpt\\.com|gemini\\.com|grok\\.com|perplexity\\.com|deepseek\\.com|claude\\.ai)',
    /** Search engines */
    '(https?)\\:\\/\\/(www\\.)?(google|facebook|bing|yahoo|duckduckgo|baidu|yandex|ask|)\\.(co\\.[a-z]{2}|[a-z]{2,3})',
    /** E-commerce sites */
    '(https?)\\:\\/\\/(www\\.)?(amazon|shop|etsy|ebay|walmart|bestbuy|shopify|target|costoco|apple|flipkart|wix|rakuten|mercari|alibaba|aliexpress|shein|taobao|qoo10|)\\.(co\\.[a-z]{2}|[a-z]{2,3})',
  ],
  saveArticleOnClipboard: false,
  isShowMessage: false,
  isShowBadge: true,
};

interface SettingsStore extends SettingsState {
  promptFor: (service: AIService) => Promise<string>;
  setPromptFor: (service: AIService, prompt: string) => Promise<void>;
  setTabBehavior: (tabBehavior: TabBehavior) => Promise<void>;
  setFloatPanelPosition: (floatPanelPosition: FloatPanelPosition) => Promise<void>;
  setContentExtractionTiming: (contentExtractionTiming: ContentExtractionTiming) => Promise<void>;
  setExtractionDenylist: (extractionDenylist: string[]) => Promise<void>;
  setIsShowMessage: (isShowMessage: boolean) => Promise<void>;
  setIsShowBadge: (isShowBadge: boolean) => Promise<void>;
  setSaveArticleOnClipboard: (saveArticleOnClipboard: boolean) => Promise<void>;
  getTabBehavior: () => Promise<TabBehavior>;
  getContentExtractionTiming: () => Promise<ContentExtractionTiming>;
  getExtractionDenylist: () => Promise<string[]>;
  getSaveArticleOnClipboard: () => Promise<boolean>;
  getFloatPanelPosition: () => Promise<FloatPanelPosition>;
  exportSettings: () => Promise<{ success: boolean; error?: Error }>;
  importSettings: (file: File) => Promise<{ success: boolean; error?: Error }>;
  restoreSettings: () => Promise<{ success: boolean; error?: Error }>;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      promptFor: async (service: AIService) => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.prompts?.[service] ?? DEFAULT_SETTINGS.prompts[service];
      },
      setPromptFor: async (service: AIService, prompt: string) => {
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
      setFloatPanelPosition: async (floatPanelPosition: FloatPanelPosition) => {
        set(() => ({ floatPanelPosition }));
        await sendSettingsUpdate();
      },
      setContentExtractionTiming: async (contentExtractionTiming: ContentExtractionTiming) => {
        set(() => ({ contentExtractionTiming }));
        await sendSettingsUpdate();
      },
      setExtractionDenylist: async (extractionDenylist: string[]) => {
        set(() => ({ extractionDenylist }));
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
      getTabBehavior: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.tabBehavior ?? DEFAULT_SETTINGS.tabBehavior;
      },
      getContentExtractionTiming: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.contentExtractionTiming ?? DEFAULT_SETTINGS.contentExtractionTiming;
      },
      getExtractionDenylist: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.extractionDenylist ?? DEFAULT_SETTINGS.extractionDenylist;
      },
      getSaveArticleOnClipboard: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.saveArticleOnClipboard ?? DEFAULT_SETTINGS.saveArticleOnClipboard;
      },
      getFloatPanelPosition: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.floatPanelPosition ?? DEFAULT_SETTINGS.floatPanelPosition;
      },
      exportSettings: async (): Promise<{ success: boolean; error?: Error }> => {
        try {
          /** Get the extension version */
          const manifestData = chrome.runtime.getManifest();
          const extensionVersion = manifestData.version;

          /** Get the settings */
          const settings = get();

          /** Create the backup data */
          const backupData = {
            version: extensionVersion,
            settings: {
              prompt: settings.prompts || {},
              tabBehavior: settings.tabBehavior || '',
              floatPanelPosition: settings.floatPanelPosition || '',
              contentExtractionTiming: settings.contentExtractionTiming || '',
              extractionDenylist: settings.extractionDenylist || [],
              saveArticleOnClipboard: settings.saveArticleOnClipboard || false,
              isShowMessage: settings.isShowMessage || false,
              isShowBadge: settings.isShowBadge || false,
            },
          };

          /** Create the backup file */
          const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;

          /** Create the download file name */
          const now = new Date();
          const dateStr =
            now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') +
            '-' +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');
          a.download = `ai-summarizer-settings-${dateStr}.json`;

          /** Download the backup file */
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          return { success: true };
        } catch (error) {
          logger.error('🏪⚙️', '[SettingsStore.ts]', '[exportSettings]', 'Failed to export settings:', error);
          return { success: false, error: error as Error };
        }
      },
      importSettings: async (file: File): Promise<{ success: boolean; error?: Error }> => {
        try {
          /** Read the backup file */
          const text = await file.text();
          const backupData = JSON.parse(text);

          /** Check if the backup file is valid */
          if (!backupData || typeof backupData !== 'object' || !backupData.settings) {
            throw new Error('Invalid backup file format');
          }

          /** Check if the backup file is compatible with the current version */
          // const manifestData = chrome.runtime.getManifest();
          // const currentVersion = manifestData.version;

          /** Import settings */
          for (const [service, prompt] of Object.entries(backupData.settings.prompt)) {
            await get().setPromptFor(service as AIService, prompt as string);
          }
          await get().setTabBehavior(backupData.settings.tabBehavior as TabBehavior);
          await get().setFloatPanelPosition(backupData.settings.floatPanelPosition as FloatPanelPosition);
          await get().setContentExtractionTiming(backupData.settings.contentExtractionTiming as ContentExtractionTiming);
          await get().setExtractionDenylist(backupData.settings.extractionDenylist);
          await get().setSaveArticleOnClipboard(backupData.settings.saveArticleOnClipboard);
          await get().setIsShowMessage(backupData.settings.isShowMessage);
          await get().setIsShowBadge(backupData.settings.isShowBadge);

          /** Send settings update to content script */
          await sendSettingsUpdate();

          return { success: true };
        } catch (error) {
          logger.error('🏪⚙️', '[SettingsStore.ts]', '[importSettings]', 'Failed to import settings:', error);
          return { success: false, error: error as Error };
        }
      },
      restoreSettings: async (): Promise<{ success: boolean; error?: Error }> => {
        try {
          /** Restore settings */
          for (const [service, prompt] of Object.entries(DEFAULT_SETTINGS.prompts)) {
            await get().setPromptFor(service as AIService, prompt as string);
          }
          await get().setTabBehavior(DEFAULT_SETTINGS.tabBehavior);
          await get().setFloatPanelPosition(DEFAULT_SETTINGS.floatPanelPosition);
          await get().setContentExtractionTiming(DEFAULT_SETTINGS.contentExtractionTiming);
          await get().setExtractionDenylist(DEFAULT_SETTINGS.extractionDenylist);
          await get().setSaveArticleOnClipboard(DEFAULT_SETTINGS.saveArticleOnClipboard);
          await get().setIsShowMessage(DEFAULT_SETTINGS.isShowMessage);
          await get().setIsShowBadge(DEFAULT_SETTINGS.isShowBadge);

          /** Send settings update to content script */
          await sendSettingsUpdate();

          return { success: true };
        } catch (error) {
          logger.error('🏪⚙️', '[SettingsStore.ts]', '[restoreSettings]', 'Failed to reset settings:', error);
          return { success: false, error: error as Error };
        }
      },
    }),
    {
      name: STORAGE_KEYS.SETTINGS,
      storage: {
        getItem: async (name: string) => {
          const result = await chrome.storage.local.get(name);
          if (!result[name]) {
            // Initialize with DEFAULT_SETTINGS if storage is empty
            await chrome.storage.local.set({
              [name]: {
                state: DEFAULT_SETTINGS,
                version: 0,
              },
            });
            return {
              state: DEFAULT_SETTINGS,
              version: 0,
            };
          }
          return result[name];
        },
        setItem: async (name: string, value: any) => {
          await chrome.storage.local.set({ [name]: value });
        },
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
      logger.warn('🏪⚙️', '[SettingsStore.ts]', '[sendSettingsUpdate]', 'No active tab found');
      return;
    }

    logger.debug('🏪⚙️', '[SettingsStore.ts]', '[sendSettingsUpdate]', 'Sending settings update message to content script');
    const settings = useSettingsStore.getState();
    await chrome.runtime.sendMessage({
      action: MessageAction.SETTINGS_UPDATED,
      payload: {
        prompts: settings.prompts,
        tabBehavior: settings.tabBehavior,
        floatPanelPosition: settings.floatPanelPosition,
        contentExtractionTiming: settings.contentExtractionTiming,
        extractionDenylist: settings.extractionDenylist,
        saveArticleOnClipboard: settings.saveArticleOnClipboard,
        isShowMessage: settings.isShowMessage,
        isShowBadge: settings.isShowBadge,
      },
    });
  } catch (error) {
    logger.error('🏪⚙️', '[SettingsStore.ts]', '[sendSettingsUpdate]', 'Failed to send settings update message:', error);
  }
};
