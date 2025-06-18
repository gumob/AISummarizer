import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/constants';
import { AIService, ContentExtractionTiming, FloatPanelPosition, MessageAction, TabBehavior } from '@/types';
import { logger } from '@/utils';

export interface SettingsState {
  prompts: {
    [key in AIService]: string;
  };
  serviceStatus: {
    [key in AIService]: boolean;
  };
  tabBehavior: TabBehavior;
  floatPanelPosition: FloatPanelPosition;
  contentExtractionTiming: ContentExtractionTiming;
  extractionDenylist: string;
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
    [AIService.AI_STUDIO]: DEFAULT_PROMPT,
    [AIService.CLAUDE]: DEFAULT_PROMPT,
    [AIService.GROK]: DEFAULT_PROMPT,
    [AIService.PERPLEXITY]: DEFAULT_PROMPT,
    [AIService.DEEPSEEK]: DEFAULT_PROMPT,
  },
  serviceStatus: {
    [AIService.CHATGPT]: true,
    [AIService.GEMINI]: true,
    [AIService.AI_STUDIO]: true,
    [AIService.CLAUDE]: true,
    [AIService.GROK]: true,
    [AIService.PERPLEXITY]: true,
    [AIService.DEEPSEEK]: true,
  },
  tabBehavior: TabBehavior.NEW_TAB,
  floatPanelPosition: FloatPanelPosition.BOTTOM_RIGHT,
  contentExtractionTiming: ContentExtractionTiming.AUTOMATIC,
  extractionDenylist: `/** Search engines */
(https?)\\:\\/\\/(www\\.)?(google|facebook|bing|yahoo|duckduckgo|baidu|yandex|ask|)\\.(co\\.[a-z]{2}|[a-z]{2,3})
/** E-commerce sites */
(https?)\\:\\/\\/(www\\.)?(amazon|shop|etsy|ebay|walmart|bestbuy|shopify|target|costoco|apple|flipkart|wix|rakuten|mercari|alibaba|aliexpress|shein|taobao|qoo10|)\\.(co\\.[a-z]{2}|[a-z]{2,3})
`,
  saveArticleOnClipboard: false,
  isShowMessage: false,
  isShowBadge: true,
};

export interface SettingsStore extends SettingsState {
  updateSettings: (settings: Partial<SettingsState>) => Promise<void>;
  setPromptFor: (service: AIService, prompt: string) => Promise<void>;
  getPromptFor: (service: AIService) => Promise<string>;
  setServiceStatus: (service: AIService, status: boolean) => Promise<void>;
  getServiceStatus: (service: AIService) => Promise<boolean>;
  setTabBehavior: (tabBehavior: TabBehavior) => Promise<void>;
  getTabBehavior: () => Promise<TabBehavior>;
  setFloatPanelPosition: (floatPanelPosition: FloatPanelPosition) => Promise<void>;
  getFloatPanelPosition: () => Promise<FloatPanelPosition>;
  setContentExtractionTiming: (contentExtractionTiming: ContentExtractionTiming) => Promise<void>;
  getContentExtractionTiming: () => Promise<ContentExtractionTiming>;
  setExtractionDenylist: (extractionDenylist: string) => Promise<void>;
  getExtractionDenylist: () => Promise<string>;
  setIsShowMessage: (isShowMessage: boolean) => Promise<void>;
  getIsShowMessage: () => Promise<boolean>;
  setIsShowBadge: (isShowBadge: boolean) => Promise<void>;
  getIsShowBadge: () => Promise<boolean>;
  setSaveArticleOnClipboard: (saveArticleOnClipboard: boolean) => Promise<void>;
  getSaveArticleOnClipboard: () => Promise<boolean>;
  exportSettings: () => Promise<{ success: boolean; error?: Error }>;
  importSettings: (file: File) => Promise<{ success: boolean; error?: Error }>;
  restoreSettings: () => Promise<{ success: boolean; error?: Error }>;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,
      updateSettings: async (settings: Partial<SettingsState>) => {
        set((state: SettingsState) => ({
          ...state,
          ...settings,
        }));
        await sendSettingsUpdate();
      },
      setPromptFor: async (service: AIService, prompt: string) => {
        await get().updateSettings({
          prompts: {
            ...get().prompts,
            [service]: prompt,
          },
        });
      },
      getPromptFor: async (service: AIService) => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.prompts?.[service] ?? DEFAULT_SETTINGS.prompts[service];
      },
      setServiceStatus: async (service: AIService, status: boolean) => {
        await get().updateSettings({
          serviceStatus: {
            ...get().serviceStatus,
            [service]: status,
          },
        });
        await sendSettingsUpdate();
      },
      getServiceStatus: async (service: AIService) => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.serviceStatus?.[service] ?? DEFAULT_SETTINGS.serviceStatus[service];
      },
      setTabBehavior: async (tabBehavior: TabBehavior) => {
        await get().updateSettings({ tabBehavior });
      },
      getTabBehavior: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.tabBehavior ?? DEFAULT_SETTINGS.tabBehavior;
      },
      setFloatPanelPosition: async (floatPanelPosition: FloatPanelPosition) => {
        await get().updateSettings({ floatPanelPosition });
      },
      getFloatPanelPosition: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.floatPanelPosition ?? DEFAULT_SETTINGS.floatPanelPosition;
      },
      setContentExtractionTiming: async (contentExtractionTiming: ContentExtractionTiming) => {
        await get().updateSettings({ contentExtractionTiming });
      },
      getContentExtractionTiming: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.contentExtractionTiming ?? DEFAULT_SETTINGS.contentExtractionTiming;
      },
      setExtractionDenylist: async (extractionDenylist: string) => {
        await get().updateSettings({ extractionDenylist });
      },
      getExtractionDenylist: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.extractionDenylist ?? DEFAULT_SETTINGS.extractionDenylist;
      },
      setSaveArticleOnClipboard: async (saveArticleOnClipboard: boolean) => {
        await get().updateSettings({ saveArticleOnClipboard });
      },
      getSaveArticleOnClipboard: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.saveArticleOnClipboard ?? DEFAULT_SETTINGS.saveArticleOnClipboard;
      },
      setIsShowMessage: async (isShowMessage: boolean) => {
        await get().updateSettings({ isShowMessage });
      },
      getIsShowMessage: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.isShowMessage ?? DEFAULT_SETTINGS.isShowMessage;
      },
      setIsShowBadge: async (isShowBadge: boolean) => {
        await get().updateSettings({ isShowBadge });
      },
      getIsShowBadge: async () => {
        const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
        return settings[STORAGE_KEYS.SETTINGS]?.state?.isShowBadge ?? DEFAULT_SETTINGS.isShowBadge;
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

          /** Import settings */
          await get().updateSettings({
            prompts: backupData.settings.prompt,
            tabBehavior: backupData.settings.tabBehavior as TabBehavior,
            floatPanelPosition: backupData.settings.floatPanelPosition as FloatPanelPosition,
            contentExtractionTiming: backupData.settings.contentExtractionTiming as ContentExtractionTiming,
            extractionDenylist: backupData.settings.extractionDenylist,
            saveArticleOnClipboard: backupData.settings.saveArticleOnClipboard,
            isShowMessage: backupData.settings.isShowMessage,
            isShowBadge: backupData.settings.isShowBadge,
          });

          return { success: true };
        } catch (error) {
          logger.error('🏪⚙️', '[SettingsStore.ts]', '[importSettings]', 'Failed to import settings:', error);
          return { success: false, error: error as Error };
        }
      },
      restoreSettings: async (): Promise<{ success: boolean; error?: Error }> => {
        try {
          /** Restore settings */
          await get().updateSettings({
            prompts: DEFAULT_SETTINGS.prompts,
            tabBehavior: DEFAULT_SETTINGS.tabBehavior,
            floatPanelPosition: DEFAULT_SETTINGS.floatPanelPosition,
            contentExtractionTiming: DEFAULT_SETTINGS.contentExtractionTiming,
            extractionDenylist: DEFAULT_SETTINGS.extractionDenylist,
            saveArticleOnClipboard: DEFAULT_SETTINGS.saveArticleOnClipboard,
            isShowMessage: DEFAULT_SETTINGS.isShowMessage,
            isShowBadge: DEFAULT_SETTINGS.isShowBadge,
          });

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

    // logger.debug('🏪⚙️', '[SettingsStore.ts]', '[sendSettingsUpdate]', 'Sending settings update message to content script');
    const settings = useSettingsStore.getState();
    await chrome.runtime.sendMessage({
      action: MessageAction.SETTINGS_UPDATED,
      payload: {
        prompts: settings.prompts,
        serviceStatus: settings.serviceStatus,
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
