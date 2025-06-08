import { STORAGE_KEYS } from '@/constants';
import { db } from '@/db';
import { BackgroundThemeService, CleanupDBService, ContextMenuService } from '@/features/background/services';
import { useArticleStore, useSettingsStore } from '@/stores';
import { DEFAULT_SETTINGS } from '@/stores/SettingsStore';
import { AIService, ContentExtractionTiming, formatArticleForClipboard, getSummarizeUrl, Message, MessageAction, TabBehavior } from '@/types';
import { logger } from '@/utils';

class Background {
  themeService = new BackgroundThemeService();
  contextMenuService = new ContextMenuService(this.onContextMenuClicked.bind(this));
  cleanupService = new CleanupDBService();

  constructor() {
    logger.debug('📄🤐', '[Background.ts]', '[constructor]', 'Background initialized');
    this.themeService.initialize();
    this.cleanupService.startCleanup();

    // chrome.tabs.onActivated.removeListener(handleTabActivated);
    // chrome.tabs.onActivated.addListener(handleTabActivated);

    chrome.tabs.onUpdated.removeListener(this.handleTabUpdated.bind(this));
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));

    chrome.runtime.onMessage.removeListener(this.handleChromeMessage.bind(this));
    chrome.runtime.onMessage.addListener(this.handleChromeMessage.bind(this));
  }

  /**************************************************
   * Event listeners
   **************************************************/

  /**
   * Event listener for when the tab is updated
   * @description This event is triggered when the tab is newly created, url updated or reloaded
   * @param tabId - The ID of the updated tab
   * @param changeInfo - The information about the updated tab
   * @param tab - The updated tab
   */
  async handleTabUpdated(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    if (changeInfo.status !== 'complete' || !tab.url) return;
    logger.debug('📄🤐', '[Background.ts]', '[handleTabUpdated]', 'Tab updated', tab.url, tab.status);
    await this.updateStateAndLoadArticle(tabId, tab.url);
  }

  /**
   * Event listener for when the message is sent from the content script
   * @param message - The message sent from the content script
   * @param sender - The sender of the message
   * @param sendResponse - The response to the message
   */
  async handleChromeMessage(message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
    logger.debug('📄🤐', '[Background.ts]', '[handleChromeMessage]', 'message', message.action);
    switch (message.action) {
      case MessageAction.EXTRACT_CONTENT_COMPLETE:
        this.updateArticle(sender.tab?.id, sender.tab?.url, message.payload.result);
        break;

      case MessageAction.SUMMARIZE_CONTENT_START:
        this.executeSummarization(message.payload.service, message.payload.tabId, message.payload.url);
        break;

      case MessageAction.SUMMARIZE_CONTENT_COMPLETE:
        break;

      default:
        break;
    }
  }

  async onContextMenuClicked(service: AIService, tabId: number, url: string) {
    logger.debug('📄🤐', '[Background.ts]', '[onContextMenuClicked]', service, tabId, url);
    await this.executeSummarization(service, tabId, url);
  }

  /**************************************************
   * Event listeners
   **************************************************/

  async toggleContextMenu(tabId: number, isArticleExist: boolean) {
    if (isArticleExist) {
    } else {
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
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js'],
      });

      /** Send the message to the content script */
      await chrome.tabs.sendMessage(tabId, {
        action: MessageAction.EXTRACT_CONTENT_START,
        payload: { tabId: tabId, url: url },
      });
    }
  }

  async executeSummarization(service: AIService, tabId: number, url: string) {
    logger.debug('📄🤐', '[Background.ts]', '[executeSummarization]', service, tabId, url);
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
      logger.warn('📄🤐', '[Background.ts]', '[onContextMenuClicked]', 'Article not found', url);
    }
  }

  /**
   * Reload the article extraction state
   * @param tabId - The ID of the tab
   * @param url - The URL of the tab
   */

  async updateStateAndLoadArticle(tabId: number, url: string) {
    /** TODO: ここが繰り返し呼ばれてしまうのでsetTimeoutで遅延を設ける */
    try {
      logger.debug('📄🤐', '[Background.ts]', '[updateStateAndLoadArticle]', 'tabId:', tabId, 'url:', url);

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
      logger.error('📄🤐', '[Background.ts]', 'Failed to update article extraction state', error);
    }
  }

  async updateArticle(tabId?: number, tabUrl?: string, result?: any) {
    // Only process messages from content scripts
    if (!tabId) {
      logger.warn('📄🤐', '[Background.ts]', '[updateArticle]', 'Ignoring EXTRACT_CONTENT_COMPLETE from non-content script');
      return;
    }
    if (tabUrl !== result.url) {
      logger.warn('📄🤐', '[Background.ts]', '[updateArticle]', 'Ignoring EXTRACT_CONTENT_COMPLETE for different url', tabUrl, result.url);
      return;
    }
    logger.debug('📄🤐', '[Background.ts]', '[updateArticle]', 'Extracting article complete', result);
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
          await chrome.tabs.sendMessage(tab.id, {
            action: MessageAction.COPY_ARTICLE_TO_CLIPBOARD,
            payload: { text: formatArticleForClipboard(result) },
          });
        }
      }
    }
  }
}

new Background();
