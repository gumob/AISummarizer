import { STORAGE_KEYS } from '@/constants';
import {
  ArticleRecord,
  db,
} from '@/db';
import {
  CleanupDBService,
  ContextMenuService,
  ServiceWorkerThemeService,
} from '@/features/serviceworker/services';
import {
  useArticleStore,
  useSettingsStore,
} from '@/stores';
import { DEFAULT_SETTINGS } from '@/stores/SettingsStore';
import {
  AIService,
  ArticleExtractionResult,
  ContentExtractionTiming,
  formatArticleForClipboard,
  getAIServiceFromString,
  getSummarizeUrl,
  Message,
  MessageAction,
  TabBehavior,
} from '@/types';
import { logger } from '@/utils';

class ServiceWorker {
  themeService = new ServiceWorkerThemeService();
  contextMenuService = new ContextMenuService(this.handleContextMenuClicked.bind(this));
  cleanupService = new CleanupDBService();

  constructor() {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[constructor]', 'ServiceWorker initialized');
    this.themeService.initialize();
    this.cleanupService.startCleanup();

    chrome.tabs.onActivated.removeListener(this.handleTabActivated.bind(this));
    chrome.tabs.onActivated.addListener(this.handleTabActivated.bind(this));

    chrome.tabs.onUpdated.removeListener(this.handleTabUpdated.bind(this));
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));

    chrome.runtime.onMessage.removeListener(this.handleServiceWorkerMessage.bind(this));
    chrome.runtime.onMessage.addListener(this.handleServiceWorkerMessage.bind(this));
  }

  /**************************************************
   * Event listeners
   **************************************************/

  /**
   * Event listener for when the tab is activated
   * @param activeInfo - The information about the activated tab
   */
  async handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo) {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleTabActivated]', activeInfo);

    /** Wait for 500ms */
    await new Promise(resolve => setTimeout(resolve, 500));

    /** Get the active tab */
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    /** Update the UI state */
    this.toggleUIState(activeInfo.tabId, tab.url);

    /** Notify the current tab state to the content script */
    this.notifyCurrentTabState(activeInfo.tabId, tab.url);
  }

  /**
   * Event listener for when the tab is updated
   * @description This event is triggered when the tab is newly created, url updated or reloaded
   * @param tabId - The ID of the updated tab
   * @param changeInfo - The information about the updated tab
   * @param tab - The updated tab
   */
  async handleTabUpdated(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    if (changeInfo.status !== 'complete' || !tab.url) return;
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleTabUpdated]', tab.url, tab.status);

    /** Execute the extraction */
    await this.executeExtraction(tabId, tab.url, true);

    /** Update the UI state */
    this.toggleUIState(tabId, tab.url);

    /** Notify the current tab state */
    this.notifyCurrentTabState(tabId, tab.url);
  }

  /**
   * Event listener for when the message is sent from the content script
   * @param message - The message sent from the content script
   * @param sender - The sender of the message
   * @param sendResponse - The response to the message
   */
  async handleServiceWorkerMessage(message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleServiceWorkerMessage]', message.action);
    switch (message.action) {
      case MessageAction.SUMMARIZE_ARTICLE:
        this.executeSummarization(message.payload.service, message.payload.tabId, message.payload.url);
        break;

      case MessageAction.READ_ARTICLE_FOR_CLIPBOARD:
        await this.readArticleForClipboard(message.payload.tabId, message.payload.url, true);
        break;

      default:
        break;
    }
  }

  /**
   * Event listener for when the context menu is clicked
   *
   * @param info - The information about the clicked context menu
   * @param tab - The tab that the context menu was clicked on
   */
  private async handleContextMenuClicked(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleContextMenuClicked]', info);
    if (!tab?.id || !tab?.url) {
      logger.warn('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleContextMenuClicked]', 'No active tab found');
      return;
    }

    switch (info.menuItemId) {
      case 'chatgpt':
      case 'gemini':
      case 'claude':
      case 'grok':
      case 'perplexity':
      case 'deepseek':
        this.executeSummarization(getAIServiceFromString(info.menuItemId), tab.id, tab.url);
        break;

      case 'copy':
        this.readArticleForClipboard(tab.id, tab.url, true);
        break;

      case 'extract':
        /** Execute the extraction */
        await this.executeExtraction(tab.id, tab.url, true);

        /** Update the UI state */
        this.toggleUIState(tab.id, tab.url);

        /** Notify the current tab state */
        this.notifyCurrentTabState(tab.id, tab.url);
        break;

      case 'settings':
        if (tab.windowId) chrome.sidePanel.open({ windowId: tab.windowId });
        break;
    }
  }

  /**************************************************
   * Functions
   **************************************************/

  /**
   * Execute the extraction
   * @param tabId - The ID of the tab
   * @param url - The URL of the tab
   * @param forcibly - Whether to forcibly extract the article
   * @returns The article record
   */
  async executeExtraction(tabId: number, url: string, forcibly: boolean = false) {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[executeExtraction]', 'tabId:', tabId, 'url:', url);
    try {
      /** Get the article from the database */
      const doesArticleExist: boolean = (await useArticleStore.getState().getArticleByUrl(url))?.is_success ?? false;

      /** Check if the article should be extracted */
      let shouldExtract = await (async (doesArticleExist: boolean): Promise<boolean> => {
        if (forcibly) return true;
        if (doesArticleExist) return false;
        const contentExtractionTiming = await useSettingsStore.getState().getContentExtractionTiming();
        if (contentExtractionTiming === ContentExtractionTiming.AUTOMATIC) return true;
        return false;
      })(doesArticleExist);

      /** Extract the article */
      if (shouldExtract) {
        /** Send the message to the content script */
        const response = await chrome.tabs.sendMessage(tabId, {
          action: MessageAction.EXTRACT_ARTICLE,
          payload: { tabId: tabId, url: url },
        });

        /** Handle the response from the content script */
        const payload = response.payload as { tabId: number; url: string; result: ArticleExtractionResult };
        if (response.success && payload && payload.result.isSuccess) {
          /** Save the article to the database */
          await db.addArticle({
            url: payload.result.url ?? payload.url,
            title: payload.result.title,
            content: payload.result.content,
            date: new Date(),
            is_success: true,
          });

          /** Copy the article to the clipboard */
          this.readArticleForClipboard(payload.tabId, payload.url, false);
        }
      }
    } catch (error: any) {
      logger.error('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleContextMenuClicked]', 'Failed to send message to content script:', error);
    }
  }

  async executeSummarization(service: AIService, tabId: number, url: string): Promise<boolean> {
    try {
      logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[executeSummarization]', service, tabId, url);
      const article = await db.getArticleByUrl(url);
      if (!article?.is_success) {
        logger.warn('🧑‍🍳📃', '[ServiceWorker.ts]', '[executeSummarization]', 'Article not found', url);
        return false;
      }
      const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
      const tabBehavior = settings[STORAGE_KEYS.SETTINGS]?.state?.tabBehavior ?? DEFAULT_SETTINGS.tabBehavior;
      const summarizeUrl = getSummarizeUrl(service, article.id.toString());
      switch (tabBehavior) {
        case TabBehavior.CURRENT_TAB:
          chrome.tabs.update(tabId, { url: summarizeUrl });
          break;

        case TabBehavior.NEW_TAB:
          chrome.tabs.create({ url: summarizeUrl });
          break;

        case TabBehavior.NEW_PRIVATE_TAB:
          const windows = await chrome.windows.getAll({ populate: true });
          const incognitoWindow = windows.find(w => w.incognito);
          if (incognitoWindow) {
            chrome.tabs.create({ windowId: incognitoWindow.id, url: summarizeUrl });
          } else {
            chrome.windows.create({ url: summarizeUrl, incognito: true });
          }
          break;

        default:
          break;
      }
      return true;
    } catch (error) {
      logger.error('🧑‍🍳📃', '[ServiceWorker.ts]', '[executeSummarization]', 'Failed to execute summarization:', error);
      return false;
    }
  }

  /**
   * Reload the article extraction state
   * @param tabId - The ID of the tab
   * @param url - The URL of the tab
   */
  async toggleUIState(tabId: number, tabUrl?: string) {
    try {
      /** Toggle the context menu */
      this.contextMenuService.createMenu();

      logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[toggleUIState]');

      /** Get the article from the database */
      const doesArticleExist = (await useArticleStore.getState().getArticleByUrl(tabUrl))?.is_success ?? false;

      /** Toggle the badge */
      const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
      const isShowBadge = settings[STORAGE_KEYS.SETTINGS]?.state?.isShowBadge ?? DEFAULT_SETTINGS.isShowBadge;
      if (isShowBadge && doesArticleExist) {
        chrome.action.setBadgeText({ text: '✓', tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#999999', tabId: tabId });
      } else {
        chrome.action.setBadgeText({ text: '', tabId: tabId });
      }
    } catch (error: any) {
      logger.error('🧑‍🍳📃', '[ServiceWorker.ts]', 'Failed to update article extraction state', error);
    }
  }

  /**
   * Notify the current tab state
   * @param tabId - The ID of the tab
   * @param url - The URL of the tab
   * @param article - The article to notify
   */
  async notifyCurrentTabState(tabId: number, url?: string) {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[notifyCurrentTabState]', 'tabId:', tabId, 'url:', url);
    /** Get the article from the database */
    const article = await db.getArticleByUrl(url);

    /** Send the message to the content script */
    const response = await chrome.tabs.sendMessage(tabId, {
      action: MessageAction.TAB_UPDATED,
      payload: { tabId: tabId, url: url, article: article },
    });
    logger.debug('🧑‍🍳📃🟣🟣🟣🟣🟣🟣', '[ServiceWorker.ts]', '[notifyCurrentTabState]', 'response:', response);
  }

  /**
   * Read the article for clipboard
   * @param tabId - The ID of the tab
   * @param url - The URL of the tab
   * @param forcibly - Whether to forcibly copy the article
   * @returns Whether the article was copied successfully
   */
  async readArticleForClipboard(tabId: number, url: string, forcibly: boolean = false): Promise<boolean> {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[readArticleForClipboard]', 'tabId:', tabId, 'url:', url, 'forcibly:', forcibly);
    /** Check if the article should be copied to the clipboard */
    const shouldCopy = await (async (): Promise<boolean> => {
      const saveArticleOnClipboard = await useSettingsStore.getState().getSaveArticleOnClipboard();
      if (forcibly) return true;
      if (saveArticleOnClipboard) return true;
      return false;
    })();

    /** Get the article from the database */
    const article: ArticleRecord | undefined = await db.getArticleByUrl(url);

    /** Copy the article to the clipboard */
    if (shouldCopy && article && article.is_success) {
      const text = formatArticleForClipboard(article);
      const response = await chrome.tabs.sendMessage(tabId, {
        action: MessageAction.WRITE_ARTICLE_TO_CLIPBOARD,
        payload: { tabId: tabId, url: url, text: text },
      });
      logger.debug('🧑‍🍳📃🟣🟣🟣🟣🟣🟣', '[ServiceWorker.ts]', '[readArticleForClipboard]', 'response:', response);
      return true;
    } else {
      logger.warn('�‍🍳�', '[ServiceWorker.ts]', '[readArticleForClipboard]', 'Ignoring message: article is', article);
      return false;
    }
  }
}

new ServiceWorker();
