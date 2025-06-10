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

    chrome.runtime.onMessage.removeListener(this.handleChromeMessage.bind(this));
    chrome.runtime.onMessage.addListener(this.handleChromeMessage.bind(this));
  }

  /**************************************************
   * Event listeners
   **************************************************/

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
        this.readArticleForClipboard(tab.id, tab.url);
        break;

      case 'extract':
        this.executeExtraction(tab.id, tab.url);
        break;

      case 'settings':
        if (tab.windowId) chrome.sidePanel.open({ windowId: tab.windowId });
        break;
    }
  }

  /**
   * Event listener for when the tab is activated
   * @param activeInfo - The information about the activated tab
   */
  async handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo) {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleTabActivated]', activeInfo);
    this.contextMenuService.createMenu();
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
    await this.toggleUIState(tabId, tab.url);
  }

  /**
   * Event listener for when the message is sent from the content script
   * @param message - The message sent from the content script
   * @param sender - The sender of the message
   * @param sendResponse - The response to the message
   */
  async handleChromeMessage(message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleChromeMessage]', message.action);
    switch (message.action) {
      case MessageAction.EXTRACT_ARTICLE_COMPLETE:
        this.updateArticle(message.payload.tabId, message.payload.url, message.payload.result);
        break;

      case MessageAction.SUMMARIZE_ARTICLE_START:
        this.executeSummarization(message.payload.service, message.payload.tabId, message.payload.url);
        break;

      case MessageAction.SUMMARIZE_ARTICLE_COMPLETE:
        break;

      case MessageAction.READ_ARTICLE_FOR_CLIPBOARD:
        await this.readArticleForClipboard(message.payload.tabId, message.payload.url);
        break;

      default:
        break;
    }
  }

  /**************************************************
   * Functions
   **************************************************/

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

  async executeExtraction(tabId: number, url: string): Promise<boolean> {
    try {
      /** Send the message to the content script */
      await chrome.tabs.sendMessage(tabId, {
        action: MessageAction.EXTRACT_ARTICLE_START,
        payload: { tabId: tabId, url: url },
      });
      return true;
    } catch (error: any) {
      logger.error('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleContextMenuClicked]', 'Failed to send message to content script:', error);
      return false;
    }
  }

  /**
   * Reload the article extraction state
   * @param tabId - The ID of the tab
   * @param url - The URL of the tab
   */

  async toggleUIState(tabId: number, url: string) {
    try {
      logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[toggleUIState]', 'tabId:', tabId, 'url:', url);

      /** Toggle the context menu */
      this.contextMenuService.createMenu();

      /** Get the article from the database */
      const article = await useArticleStore.getState().getArticleByUrl(url);

      /** Toggle the badge */
      const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
      const isShowBadge = settings[STORAGE_KEYS.SETTINGS]?.state?.isShowBadge ?? DEFAULT_SETTINGS.isShowBadge;
      if (isShowBadge && article?.is_success) {
        chrome.action.setBadgeText({ text: '✓', tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#999999', tabId });
      } else {
        chrome.action.setBadgeText({ text: '', tabId });
      }

      /** Extract the article */
      if (!article?.is_success) {
        const contentExtractionTiming = await useSettingsStore.getState().getContentExtractionTiming();
        if (contentExtractionTiming === ContentExtractionTiming.AUTOMATIC) {
          this.executeExtraction(tabId, url);
        }
      }

      /** Send the message to the content script */
      await chrome.tabs.sendMessage(tabId, {
        action: MessageAction.TAB_UPDATED,
        payload: { tabId: tabId, url: url, article: article },
      });
    } catch (error: any) {
      logger.error('🧑‍🍳📃', '[ServiceWorker.ts]', 'Failed to update article extraction state', error);
    }
  }

  async updateArticle(tabId: number, tabUrl: string, result: ArticleExtractionResult) {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[updateArticle]', 'tabId:', tabId, 'tabUrl:', tabUrl, 'result:', result);
    /** Toggle the context menu */
    this.contextMenuService.createMenu();

    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[updateArticle]', 'Extracting article complete', result);
    if (result.isSuccess && result.url) {
      /** Save the article to the database */
      db.addArticle({
        url: result.url,
        title: result.title,
        content: result.content,
        date: new Date(),
        is_success: true,
      });

      /** Copy the article to the clipboard */
      const saveArticleOnClipboard = await useSettingsStore.getState().getSaveArticleOnClipboard();
      if (saveArticleOnClipboard) {
        await this.readArticleForClipboard(tabId, tabUrl);
      }
    }
  }

  async readArticleForClipboard(tabId: number, url: string): Promise<boolean> {
    const record: ArticleRecord | undefined = await db.getArticleByUrl(url);
    logger.debug('🫳💬', '[ServiceWorker.ts]', '[readArticleForClipboard]', 'url', url);
    logger.debug('🫳💬', '[ServiceWorker.ts]', '[readArticleForClipboard]', 'record', record);
    if (record && record.is_success) {
      const text = formatArticleForClipboard(record);
      chrome.tabs.sendMessage(tabId, {
        action: MessageAction.WRITE_ARTICLE_TO_CLIPBOARD,
        payload: { tabId: tabId, url: url, text: text },
      });
      return true;
    } else {
      logger.warn('🫳💬', '[ServiceWorker.ts]', '[readArticleForClipboard]', 'Ignoring message: article is', record);
      return false;
    }
  }
}

new ServiceWorker();
