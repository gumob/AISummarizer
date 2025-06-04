import {
  BackgroundThemeService,
  CleanupDBService,
  ContextMenuService,
} from '@/features/background/services';
import { ArticleService } from '@/features/content/services';
import { logger } from '@/utils';

/**
 * Initialize the background script
 */
async function initialize() {
  logger.debug('Initializing background script');

  const themeService = new BackgroundThemeService();
  const contextMenuService = new ContextMenuService();
  const articleService = new ArticleService();
  const cleanupService = new CleanupDBService();

  await themeService.initialize();
  await contextMenuService.createMenu();
  await cleanupService.startCleanup();

  /**
   * Export the function to update the article extraction state
   */
  (self as any).updateArticleExtractionState = async (tabId: number, url: string) => {
    logger.debug('Updating article extraction state', tabId, url);
    const isSuccess = await articleService.isArticleExtractedForUrl(url);
    logger.debug('url', url);
    logger.debug('Article is extracted', isSuccess);
    if (isSuccess) {
      chrome.action.setBadgeText({ text: '✓', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
    contextMenuService.createMenu();
  };
}

/**
 * Event listener for when the extension is installed
 * @param details - The details of the installation
 */
chrome.runtime.onInstalled.addListener(async (_details: chrome.runtime.InstalledDetails) => {
  logger.debug('Extension installed');
  await initialize();
});

/**
 * Event listener for when the extension is started
 */
chrome.runtime.onStartup.addListener(async () => {
  logger.debug('Extension started');
  await initialize();
});

/**
 * Event listener for when the tab is activated
 * @param activeInfo - The information about the activated tab
 */
chrome.tabs.onActivated.addListener(async (activeInfo: chrome.tabs.TabActiveInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    logger.debug('Tab activated', tab.url, tab.status);
    (self as any).updateArticleExtractionState(tab.id, tab.url);
  }
});

/**
 * Event listener for when the tab is updated
 * @param tabId - The ID of the updated tab
 * @param changeInfo - The information about the updated tab
 * @param tab - The updated tab
 */
chrome.tabs.onUpdated.addListener(async (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    logger.debug('Tab updated', tab.url, tab.status);
    (self as any).updateArticleExtractionState(tabId, tab.url);
  }
});
