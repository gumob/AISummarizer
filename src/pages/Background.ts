import { db } from '@/db';
import { BackgroundThemeService, CleanupDBService, ContextMenuService } from '@/features/background/services';
import { ArticleService } from '@/features/content/services';
import { MessageAction } from '@/types';
import { logger } from '@/utils';

/**
 * Initialize the background script
 */
logger.debug('Initializing background script');

const themeService = new BackgroundThemeService();
const contextMenuService = new ContextMenuService();
const articleService = new ArticleService();
const cleanupService = new CleanupDBService();

/**
 * Initialize the extension
 */
const initialize = async () => {
  logger.debug('Initializing extension');
  themeService.initialize();
  cleanupService.startCleanup();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab.id && tab.url) {
    updateArticleExtractionState(tab.id, tab.url);
  } else {
    logger.error('Tab id or url is undefined');
  }
};

/**
 * Export the function to update the article extraction state
 */
const updateArticleExtractionState = async (tabId: number, url: string) => {
  logger.debug('Updating article extraction state', tabId, url);
  const isExist = await articleService.isArticleExtractedForUrl(url);
  logger.debug('url', url);
  logger.debug('Article exists', isExist);
  if (isExist) {
    chrome.action.setBadgeText({ text: '✓', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#999999', tabId });
  } else {
    chrome.action.setBadgeText({ text: '', tabId });
  }
  contextMenuService.createMenu();
};

/**
 * Event listener for when the extension is installed
 * @param details - The details of the installation
 */
const handleInstalled = async (_details: chrome.runtime.InstalledDetails) => {
  logger.debug('Extension installed');
  await initialize();
};

/**
 * Event listener for when the extension is started
 */
const handleStartup = async () => {
  logger.debug('Extension started');
  await initialize();
};

/**
 * Event listener for when the tab is activated
 * @param activeInfo - The information about the activated tab
 */
const handleTabActivated = async (activeInfo: chrome.tabs.TabActiveInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    logger.debug('Tab activated', tab.url, tab.status);
    if (tab.id) {
      updateArticleExtractionState(tab.id, tab.url);
    } else {
      logger.error('Tab id is undefined', tab.url);
    }
  }
};

/**
 * Event listener for when the tab is updated
 * @param tabId - The ID of the updated tab
 * @param changeInfo - The information about the updated tab
 * @param tab - The updated tab
 */
const handleTabUpdated = async (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    logger.debug('Tab updated', tab.url, tab.status);
    updateArticleExtractionState(tabId, tab.url);
  }
};

const handleMessage = async (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
  switch (message.action) {
    case MessageAction.EXTRACT_CONTENT_COMPLETE:
      logger.debug('Extracting content complete', message.result);
      if (message.result.isSuccess) {
        db.addArticle({
          url: message.result.url,
          title: message.result.title,
          content: message.result.content,
          date: new Date(),
          is_success: true,
        });
      }
      break;
    default:
      break;
  }
};

chrome.runtime.onInstalled.removeListener(handleInstalled);
chrome.runtime.onInstalled.addListener(handleInstalled);

chrome.runtime.onStartup.removeListener(handleStartup);
chrome.runtime.onStartup.addListener(handleStartup);

chrome.tabs.onActivated.removeListener(handleTabActivated);
chrome.tabs.onActivated.addListener(handleTabActivated);

chrome.tabs.onUpdated.removeListener(handleTabUpdated);
chrome.tabs.onUpdated.addListener(handleTabUpdated);

chrome.runtime.onMessage.removeListener(handleMessage);
chrome.runtime.onMessage.addListener(handleMessage);
