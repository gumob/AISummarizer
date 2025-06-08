import { STORAGE_KEYS } from '@/constants';
import { db } from '@/db';
import { BackgroundThemeService, CleanupDBService, ContextMenuService } from '@/features/background/services';
import { useArticleStore, useSettingsStore } from '@/stores';
import { DEFAULT_SETTINGS } from '@/stores/SettingsStore';
import { AIService, ContentExtractionTiming, formatArticleForClipboard, getSummarizeUrl, MessageAction, TabBehavior } from '@/types';
import { isBrowserSpecificUrl, logger } from '@/utils';

/**
 * Initialize the background script
 */
logger.debug('📄🀫', 'Initializing background script');

/**
 * Initialize the extension
 */
const initialize = async () => {
  logger.debug('📄🀫', '[initialize]', 'Initializing extension');
  themeService.initialize();
  cleanupService.startCleanup();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.id && tab.url) {
    reload(tab.id, tab.url);
  } else {
    logger.warn('Tab id or url is undefined');
  }
};

/**
 * Reload timer
 */
let reloadTimer: NodeJS.Timeout | null = null;

/**
 * Reload the article extraction state
 * @param tabId - The ID of the tab
 * @param url - The URL of the tab
 */
const reload = async (tabId: number, url: string) => {
  logger.debug('📄🀫', '[_reload]', 'tabId:', tabId, 'url:', url);
  if (reloadTimer) {
    clearTimeout(reloadTimer);
  }
  reloadTimer = setTimeout(() => {
    _reload(tabId, url);
  }, 200);
};

const _reload = async (tabId: number, url: string) => {
  /** TODO: ここが繰り返し呼ばれてしまうのでsetTimeoutで遅延を設ける */
  try {
    logger.debug('📄🀫', '[_reload]', 'tabId:', tabId, 'url:', url);
    /** Skip processing for Chrome extension pages */
    if (isBrowserSpecificUrl(url)) {
      logger.warn('📄🀫', 'Skipping processing for browser-specific URLs', url);
      contextMenuService.createMenu();
      return;
    }

    logger.debug('📄🀫', '[_reload]', 'Updating article extraction state', 'tabId:', tabId, 'url:', url);

    /** Check if the article exists */
    const isExist = await useArticleStore.getState().isArticleExtractedForUrl(url);

    /** Get the article from the database */
    const article = await useArticleStore.getState().getArticleByUrl(url);
    logger.debug('📄🀫', '[_reload]', 'Article', article?.is_success);

    /** Send the message to the content script */
    await chrome.tabs.sendMessage(tabId, {
      action: MessageAction.TAB_UPDATED,
      payload: { tabId: tabId, url: url, article: article },
    });

    const settings = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    const isShowBadge = settings[STORAGE_KEYS.SETTINGS]?.state?.isShowBadge ?? DEFAULT_SETTINGS.isShowBadge;
    if (isExist && isShowBadge) {
      /** Set the badge text */
      chrome.action.setBadgeText({ text: '✓', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#999999', tabId });
    } else {
      /** Set the badge text */
      chrome.action.setBadgeText({ text: '', tabId });

      /** Get the content extraction timing */
      const contentExtractionTiming = await useSettingsStore.getState().getContentExtractionTiming();
      logger.debug('📄🀫', '[_reload]', 'Content extraction timing', contentExtractionTiming);

      /** Handle the content extraction timing */
      switch (contentExtractionTiming) {
        case ContentExtractionTiming.AUTOMATIC:
          logger.debug('📄🀫', '[_reload]', 'Injecting content script', tabId, url);

          /** Inject the content script */
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js'],
          });

          /** Send the message to the content script */
          await chrome.tabs.sendMessage(tabId, {
            action: MessageAction.EXTRACT_CONTENT_START,
            url: url,
          });
          break;

        case ContentExtractionTiming.MANUAL:
          break;

        default:
          break;
      }
    }
    contextMenuService.createMenu();
  } catch (error: any) {
    logger.error('📄🀫', 'Failed to update article extraction state', error);
  }
};

/**
 * Event listener for when the extension is installed
 * @param details - The details of the installation
 */
const handleInstalled = async (_details: chrome.runtime.InstalledDetails) => {
  logger.debug('📄🀫', '[handleInstalled]', 'Extension installed');
  await initialize();
};

/**
 * Event listener for when the extension is started
 */
const handleStartup = async () => {
  logger.debug('📄🀫', '[handleStartup]', 'Extension started');
  await initialize();
};

/**
 * Event listener for when the tab is activated
 * @param activeInfo - The information about the activated tab
 */
const handleTabActivated = async (activeInfo: chrome.tabs.TabActiveInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    logger.debug('📄🀫', '[handleTabActivated]', 'Tab activated', tab.url, tab.status);
    if (tab.id) {
      reload(tab.id, tab.url);
    } else {
      logger.warn('Tab id is undefined', tab.url);
    }
  }
};

const handleAIService = async (service: AIService, tabId: number, url: string) => {
  logger.debug('📄🀫', '[handleAIService]', service, tabId, url);
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
    logger.warn('📄🀫', 'Article not found', url);
  }
};

/**
 * Event listener for when the tab is updated
 * @description This event is triggered when the tab is newly created, url updated or reloaded
 * @param tabId - The ID of the updated tab
 * @param changeInfo - The information about the updated tab
 * @param tab - The updated tab
 */
const handleTabUpdated = async (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    logger.debug('📄🀫', '[handleTabUpdated]', 'Tab updated', tab.url, tab.status);
    /** TODO: ここが繰り返し呼ばれてしまうのでsetTimeoutで遅延を設ける */
    reload(tabId, tab.url);
  }
};

const handleMessage = async (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
  switch (message.action) {
    case MessageAction.EXTRACT_CONTENT_COMPLETE:
      // Only process messages from content scripts
      if (!sender.tab?.id) {
        logger.warn('📄🀫', 'Ignoring EXTRACT_CONTENT_COMPLETE from non-content script');
        return;
      }
      if (sender.tab?.url !== message.result.url) {
        logger.warn('📄🀫', 'Ignoring EXTRACT_CONTENT_COMPLETE for different url', sender.tab?.url, message.result.url);
        return;
      }
      logger.debug('📄🀫', '[handleMessage]', 'Extracting content complete', message.result);
      if (message.result.isSuccess) {
        /** Save the article to the database */
        db.addArticle({
          url: message.result.url,
          title: message.result.title,
          content: message.result.content,
          date: new Date(),
          is_success: true,
        });
        /** Copy the article to the clipboard */
        const saveArticleOnClipboard = await useSettingsStore.getState().getSaveArticleOnClipboard();
        if (saveArticleOnClipboard) {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              action: MessageAction.COPY_ARTICLE_TO_CLIPBOARD,
              payload: { text: formatArticleForClipboard(message.result) },
            });
          }
        }
      }
      break;

    case MessageAction.SUMMARIZE_CONTENT_START:
      logger.debug('📄🀫', '[handleMessage]', 'Summarizing content start', message.payload);
      handleAIService(message.payload.service, message.payload.tabId, message.payload.url);
      break;

    case MessageAction.SUMMARIZE_CONTENT_COMPLETE:
      logger.debug('📄🀫', '[handleMessage]', 'Summarizing content complete', message.result);
      break;

    default:
      break;
  }
};

chrome.runtime.onInstalled.removeListener(handleInstalled);
chrome.runtime.onInstalled.addListener(handleInstalled);

chrome.runtime.onStartup.removeListener(handleStartup);
chrome.runtime.onStartup.addListener(handleStartup);

// chrome.tabs.onActivated.removeListener(handleTabActivated);
// chrome.tabs.onActivated.addListener(handleTabActivated);

chrome.tabs.onUpdated.removeListener(handleTabUpdated);
chrome.tabs.onUpdated.addListener(handleTabUpdated);

chrome.runtime.onMessage.removeListener(handleMessage);
chrome.runtime.onMessage.addListener(handleMessage);

const themeService = new BackgroundThemeService();
const contextMenuService = new ContextMenuService(handleAIService);
const cleanupService = new CleanupDBService();
