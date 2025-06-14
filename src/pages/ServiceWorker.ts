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
  AI_SERVICE_QUERY_KEY,
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
import {
  isAIServiceUrl,
  isInvalidUrl,
  logger,
} from '@/utils';

class ServiceWorker {
  themeService = new ServiceWorkerThemeService();
  contextMenuService = new ContextMenuService(this.handleContextMenuClicked.bind(this));
  cleanupService = new CleanupDBService();

  constructor() {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[constructor]', 'ServiceWorker initialized');
    this.themeService.initialize();
    this.cleanupService.startCleanup();

    /** Remove the event listeners */
    chrome.tabs.onActivated.removeListener(this.handleTabActivated.bind(this));
    chrome.tabs.onActivated.addListener(this.handleTabActivated.bind(this));

    chrome.tabs.onUpdated.removeListener(this.handleTabUpdated.bind(this));
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));

    /** Add the event listeners */
    chrome.runtime.onMessage.removeListener(this.handleServiceWorkerMessage.bind(this));
    chrome.runtime.onMessage.addListener(this.handleServiceWorkerMessage.bind(this));
  }

  /**************************************************
   * Event listeners
   **************************************************/

  /**
   * Event listener for when the tab is activated
   * @description This event is triggered when the tab is focused
   * @param activeInfo - The information about the activated tab
   */
  async handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo) {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleTabActivated]', activeInfo);

    /** Wait for 500ms */
    await new Promise(resolve => setTimeout(resolve, 500));

    /** Get the active tab */
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id || !tab.url) {
      logger.warn('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleTabActivated]', 'No active tab found');
      return;
    }

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

    await new Promise(resolve => setTimeout(resolve, 500));

    /** Execute the extraction */
    if (isAIServiceUrl(tab.url)) {
      this.executeInjection(tabId, tab.url);
    } else {
      this.executeExtraction(tabId, tab.url, true);
    }

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
      case MessageAction.EXTRACT_ARTICLE:
        this.executeExtraction(message.payload.tabId, message.payload.tabUrl, true);
        break;

      case MessageAction.OPEN_AI_SERVICE:
        this.openAIService(message.payload.service, message.payload.tabId, message.payload.tabUrl);
        break;

      case MessageAction.READ_ARTICLE_FOR_CLIPBOARD:
        await this.readArticleForClipboard(message.payload.tabId, message.payload.tabUrl, true);
        break;

      case MessageAction.OPEN_SETTINGS:
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          if (tab.id && tab.windowId) {
            chrome.sidePanel.setOptions({ path: 'options.html', enabled: true });
            chrome.sidePanel.open({ windowId: tab.windowId });
          }
        });
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
        this.openAIService(getAIServiceFromString(info.menuItemId), tab.id, tab.url);
        break;

      case 'copy':
        this.readArticleForClipboard(tab.id, tab.url, true);
        break;

      case 'extract':
        /** Execute the extraction */
        this.executeExtraction(tab.id, tab.url, true);

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
   * @param tabUrl - The URL of the tab
   * @param forcibly - Whether to forcibly extract the article
   * @returns The article record
   */
  async executeExtraction(tabId: number, tabUrl: string, forcibly: boolean = false) {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[executeExtraction]', 'tabId:', tabId, 'tabUrl:', tabUrl);
    try {
      /** Get the article from the database */
      const doesArticleExist: boolean = (await useArticleStore.getState().getArticleByUrl(tabUrl))?.is_success ?? false;

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
          payload: { tabId: tabId, tabUrl: tabUrl },
        });

        /** Handle the response from the content script */
        const payload = response.payload as { tabId: number; tabUrl: string; result: ArticleExtractionResult };
        if (response.success && payload && payload.result.isSuccess) {
          /** Save the article to the database */
          await db.addArticle({
            url: payload.result.url ?? payload.tabUrl,
            title: payload.result.title,
            content: payload.result.content,
            date: new Date(),
            is_success: true,
          });

          /** Copy the article to the clipboard */
          this.readArticleForClipboard(payload.tabId, payload.tabUrl, false);
        }
      }
    } catch (error: any) {
      logger.error('🧑‍🍳📃', '[ServiceWorker.ts]', '[handleContextMenuClicked]', 'Failed to send message to content script:', error);
    }
  }

  /**
   * Open the AI service
   * @param service - The AI service to open
   * @param tabId - The ID of the tab
   * @param tabUrl - The URL of the tab
   * @returns Whether the AI service was opened successfully
   */
  async openAIService(service: AIService, tabId: number, tabUrl: string): Promise<boolean> {
    try {
      logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[openAIService]', service, tabId, tabUrl);
      const article = await db.getArticleByUrl(tabUrl);
      if (!article?.is_success) {
        logger.warn('🧑‍🍳📃', '[ServiceWorker.ts]', '[openAIService]', 'Article not found', tabUrl);
        return false;
      }
      const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
      const tabBehavior = settings[STORAGE_KEYS.SETTINGS]?.state?.tabBehavior ?? DEFAULT_SETTINGS.tabBehavior;
      const summarizeUrl = getSummarizeUrl(service, article.id.toString());
      switch (tabBehavior) {
        case TabBehavior.CURRENT_TAB:
          await chrome.tabs.update(tabId, { url: summarizeUrl });
          break;

        case TabBehavior.NEW_TAB:
          await chrome.tabs.create({ url: summarizeUrl });
          break;

        case TabBehavior.NEW_PRIVATE_TAB:
          const windows = await chrome.windows.getAll({ populate: true });
          const incognitoWindow = windows.find(w => w.incognito);
          if (incognitoWindow) {
            await chrome.tabs.create({ windowId: incognitoWindow.id, url: summarizeUrl });
          } else {
            await chrome.windows.create({ url: summarizeUrl, incognito: true });
          }
          break;

        default:
          break;
      }

      return true;
    } catch (error) {
      logger.error('🧑‍🍳📃', '[ServiceWorker.ts]', '[openAIService]', 'Failed to execute summarization:', error);
      return false;
    }
  }

  /**
   * Execute the extraction
   * @param tabId - The ID of the tab
   * @param tabUrl - The URL of the tab
   * @returns The article record
   */
  async executeInjection(tabId: number, tabUrl: string) {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[executeInjection]', 'tabId:', tabId, 'tabUrl:', tabUrl);
    try {
      /** If the URL is an AI service URL, manipulate the web page to inject article */
      if (!isAIServiceUrl(tabUrl)) return;

      const params = new URL(tabUrl).searchParams;
      const articleId = params.get(AI_SERVICE_QUERY_KEY);

      /** If the article ID is not found, return */
      if (!articleId) return;

      /** Get the article from the database */
      const article = await db.getArticleById(articleId);
      if (!article) return;
      logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[executeInjection]', 'article:', article);
      const response = await chrome.tabs.sendMessage(tabId, {
        action: MessageAction.INJECT_ARTICLE,
        payload: { tabId: tabId, tabUrl: tabUrl, article: article },
      });
      logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[executeInjection]', 'response:', response);
      /** Insert the article into the web page */
    } catch (error: any) {
      logger.error('🧑‍🍳📃', '[ServiceWorker.ts]', '[executeInjection]', 'Failed to execute summarization:', error);
    }
  }

  /**
   * Reload the article extraction state
   * @param tabId - The ID of the tab
   * @param tabUrl - The URL of the tab
   */
  async toggleUIState(tabId: number, tabUrl?: string) {
    try {
      logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[toggleUIState]');

      /** Get the article from the database */
      const doesArticleExist = (await useArticleStore.getState().getArticleByUrl(tabUrl))?.is_success ?? false;

      /** Toggle the context menu */
      await this.contextMenuService.createMenu(doesArticleExist, tabUrl);

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
      logger.error('🧑‍🍳📃', '[ServiceWorker.ts]', '[toggleUIState]', 'Failed to update article extraction state', error);
    }
  }

  /**
   * Notify the current tab state
   * @param tabId - The ID of the tab
   * @param tabUrl - The URL of the tab
   */
  async notifyCurrentTabState(tabId: number, tabUrl?: string) {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[notifyCurrentTabState]', 'tabId:', tabId, 'tabUrl:', tabUrl);
    try {
      if (tabUrl && (await isInvalidUrl(tabUrl))) {
        logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[notifyCurrentTabState]', 'Ignoring content script message: tabUrl is invalid', tabUrl);
        return;
      }

      /** Get the article from the database */
      const article = await db.getArticleByUrl(tabUrl);

      /** Send the message to the content script */
      const response = await chrome.tabs.sendMessage(tabId, {
        action: MessageAction.TAB_UPDATED,
        payload: { tabId: tabId, tabUrl: tabUrl, article: article },
      });
      logger.debug('🧑‍🍳📃🟣🟣🟣🟣🟣🟣', '[ServiceWorker.ts]', '[notifyCurrentTabState]', 'response:', response);
    } catch (error) {
      logger.warn('🧑‍🍳📃', '[ServiceWorker.ts]', '[notifyCurrentTabState]', 'Failed to notify current tab state:', error);
    }
  }

  /**
   * Read the article for clipboard
   * @param tabId - The ID of the tab
   * @param tabUrl - The URL of the tab
   * @param forcibly - Whether to forcibly copy the article
   * @returns Whether the article was copied successfully
   */
  async readArticleForClipboard(tabId: number, tabUrl: string, forcibly: boolean = false): Promise<boolean> {
    logger.debug('🧑‍🍳📃', '[ServiceWorker.ts]', '[readArticleForClipboard]', 'tabId:', tabId, 'tabUrl:', tabUrl, 'forcibly:', forcibly);
    /** Check if the article should be copied to the clipboard */
    const shouldCopy = await (async (): Promise<boolean> => {
      const saveArticleOnClipboard = await useSettingsStore.getState().getSaveArticleOnClipboard();
      if (forcibly) return true;
      if (saveArticleOnClipboard) return true;
      return false;
    })();

    /** Get the article from the database */
    const article: ArticleRecord | undefined = await db.getArticleByUrl(tabUrl);

    /** Copy the article to the clipboard */
    if (shouldCopy && article && article.is_success) {
      const text = formatArticleForClipboard(article);
      const response = await chrome.tabs.sendMessage(tabId, {
        action: MessageAction.WRITE_ARTICLE_TO_CLIPBOARD,
        payload: { tabId: tabId, tabUrl: tabUrl, text: text },
      });
      logger.debug('🧑‍🍳📃🟣🟣🟣🟣🟣🟣', '[ServiceWorker.ts]', '[readArticleForClipboard]', 'response:', response);
      return true;
    } else {
      logger.warn('🧑‍🍳📃', '[ServiceWorker.ts]', '[readArticleForClipboard]', 'Ignoring message: article is not found or not successful', article);
      return false;
    }
  }
}

new ServiceWorker();
