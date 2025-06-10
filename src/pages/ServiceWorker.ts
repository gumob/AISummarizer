import { STORAGE_KEYS } from '@/constants';
import {
  ArticleRecord,
  db,
} from '@/db';
import {
  CleanupDBService,
  ContextMenuService,
  ThemeService,
} from '@/features/serviceworker/services';
import {
  useArticleStore,
  useSettingsStore,
} from '@/stores';
import { DEFAULT_SETTINGS } from '@/stores/SettingsStore';
import {
  AIService,
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
  themeService = new ThemeService();
  contextMenuService = new ContextMenuService(this.handleContextMenuClicked.bind(this));
  cleanupService = new CleanupDBService();

  constructor() {
    logger.debug('📄🤐', '[ServiceWorker.ts]', '[constructor]', 'ServiceWorker initialized');
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
        logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleContextMenuClicked]', 'Extract clicked');
        try {
          /** Check if the content script is injected */
          logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleContextMenuClicked]', 'Tab:', tab);
          if (tab.id === undefined || tab.id === null || tab.url === undefined || tab.url === null) throw new Error('No active tab found');

          const service = getAIServiceFromString(info.menuItemId);
          await this.executeSummarization(service, tab.id, tab.url);
        } catch (error) {
          logger.error('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleContextMenuClicked]', 'Failed to send message:', error);
        }
        break;
      case 'copy':
        logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleContextMenuClicked]', 'Copy clicked');
        await this.readArticleForClipboard(tab.id, tab.url);
        break;

      case 'extract':
        logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleContextMenuClicked]', 'Extract clicked');
        try {
          /** Send the message to the content script */
          await chrome.tabs.sendMessage(tab.id, {
            action: MessageAction.EXTRACT_ARTICLE_START,
            payload: { tabId: tab.id, url: tab.url },
          });
        } catch (error: any) {
          logger.error('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleContextMenuClicked]', 'Failed to send message to content script:', error);
        }
        break;
      case 'settings':
        if (!tab.windowId) throw new Error('No window id found');
        logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleContextMenuClicked]', 'Settings clicked');
        chrome.sidePanel.open({ windowId: tab.windowId });
        break;
    }
  }

  /**
   * Event listener for when the tab is activated
   * @param activeInfo - The information about the activated tab
   */
  async handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo) {
    // logger.debug('📄🤐', '[ServiceWorker.ts]', '[handleTabActivated]', 'Tab activated', activeInfo);
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
    logger.debug('📄🤐', '[ServiceWorker.ts]', '[handleTabUpdated]', 'Tab updated', tab.url, tab.status);
    await this.updateStateAndLoadArticle(tabId, tab.url);
  }

  /**
   * Event listener for when the message is sent from the content script
   * @param message - The message sent from the content script
   * @param sender - The sender of the message
   * @param sendResponse - The response to the message
   */
  async handleChromeMessage(message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
    logger.debug('📄🤐', '[ServiceWorker.ts]', '[handleChromeMessage]', 'message', message.action);
    switch (message.action) {
      case MessageAction.EXTRACT_ARTICLE_COMPLETE:
        this.updateArticle(sender.tab?.id, sender.tab?.url, message.payload.result);
        break;

      case MessageAction.SUMMARIZE_ARTICLE_START:
        this.executeSummarization(message.payload.service, message.payload.tabId, message.payload.url);
        break;

      case MessageAction.SUMMARIZE_ARTICLE_COMPLETE:
        break;

      case MessageAction.READ_ARTICLE_FOR_CLIPBOARD:
        this.readArticleForClipboard(message.payload.tabId, message.payload.url);
        break;

      default:
        break;
    }
  }

  /**************************************************
   * Functions
   **************************************************/

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

  async toggleBadge(tabId: number, isArticleExist: boolean) {
    const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    const isShowBadge = settings[STORAGE_KEYS.SETTINGS]?.state?.isShowBadge ?? DEFAULT_SETTINGS.isShowBadge;
    if (isShowBadge && isArticleExist) {
      chrome.action.setBadgeText({ text: '✓', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#999999', tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  }

  async executeExtraction(tabId: number, url: string, isExist: boolean) {
    if (isExist) {
      return;
    }

    const contentExtractionTiming = await useSettingsStore.getState().getContentExtractionTiming();
    if (contentExtractionTiming === ContentExtractionTiming.AUTOMATIC) {
      /** Inject the content script */
      // await chrome.scripting.executeScript({
      //   target: { tabId: tabId },
      //   files: ['content.js'],
      // });

      /** Send the message to the content script */
      await chrome.tabs.sendMessage(tabId, {
        action: MessageAction.EXTRACT_ARTICLE_START,
        payload: { tabId: tabId, url: url },
      });
    }
  }

  async executeSummarization(service: AIService, tabId: number, url: string) {
    logger.debug('📄🤐', '[ServiceWorker.ts]', '[executeSummarization]', service, tabId, url);
    const article = await db.getArticleByUrl(url);
    if (article?.is_success) {
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
    } else {
      logger.warn('📄🤐', '[ServiceWorker.ts]', '[onContextMenuClicked]', 'Article not found', url);
    }
  }

  /**
   * Reload the article extraction state
   * @param tabId - The ID of the tab
   * @param url - The URL of the tab
   */

  async updateStateAndLoadArticle(tabId: number, url: string) {
    try {
      logger.debug('📄🤐', '[ServiceWorker.ts]', '[updateStateAndLoadArticle]', 'tabId:', tabId, 'url:', url);

      /** Get the article from the database */
      const article = await useArticleStore.getState().getArticleByUrl(url);
      const isArticleExtracted = article?.is_success ?? false;

      /** Toggle the context menu */
      this.contextMenuService.createMenu();

      /** Toggle the badge */
      this.toggleBadge(tabId, isArticleExtracted);

      /** Extract the article */
      await this.executeExtraction(tabId, url, isArticleExtracted);

      /** Send the message to the content script */
      await chrome.tabs.sendMessage(tabId, {
        action: MessageAction.TAB_UPDATED,
        payload: { tabId: tabId, url: url, article: article },
      });
    } catch (error: any) {
      logger.error('📄🤐', '[ServiceWorker.ts]', 'Failed to update article extraction state', error);
    }
  }

  async updateArticle(tabId?: number, tabUrl?: string, result?: any) {
    // Only process messages from content scripts
    if (!tabId) {
      logger.warn('📄🤐', '[ServiceWorker.ts]', '[updateArticle]', 'Ignoring EXTRACT_ARTICLE_COMPLETE from non-content script');
      return;
    }
    if (tabUrl !== result.url) {
      logger.warn('📄🤐', '[ServiceWorker.ts]', '[updateArticle]', 'Ignoring EXTRACT_ARTICLE_COMPLETE for different url', tabUrl, result.url);
      return;
    }

    /** Toggle the context menu */
    this.contextMenuService.createMenu();

    logger.debug('📄🤐', '[ServiceWorker.ts]', '[updateArticle]', 'Extracting article complete', result);
    if (result.isSuccess) {
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
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab.id) {
          await chrome.runtime.sendMessage({
            action: MessageAction.READ_ARTICLE_FOR_CLIPBOARD,
            payload: { tabId: tabId, url: tabUrl },
          });
        }
      }
    }
  }
}

new ServiceWorker();
