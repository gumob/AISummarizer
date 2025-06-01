import { ArticleExtractionService } from '@/services/article/ArticleExtractionService';
import { ContextMenuService } from '@/services/contextMenu';
import { CleanupDBService } from '@/services/database/CleanupDBService';
import { BackgroundThemeService } from '@/services/theme';
import { logger } from '@/utils';

async function initialize() {
  logger.debug('Initializing background script');

  const themeService = new BackgroundThemeService();
  const contextMenuService = new ContextMenuService();
  const articleExtractionService = new ArticleExtractionService();
  const cleanupService = new CleanupDBService();

  await themeService.initialize();
  await contextMenuService.createMenu();
  await cleanupService.startCleanup();

  // 記事抽出状態の更新をエクスポート
  (self as any).updateArticleExtractionState = async (tabId: number, url: string) => {
    const isExtracted = await articleExtractionService.checkArticleExtraction(url);
    if (isExtracted) {
      chrome.action.setBadgeText({ text: '✓', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
    contextMenuService.createMenu();
  };
}

// 拡張機能のインストール時のイベントリスナー
chrome.runtime.onInstalled.addListener(async details => {
  logger.debug('Extension installed');
  await initialize();
});

// 拡張機能の起動時のイベントリスナー
chrome.runtime.onStartup.addListener(async () => {
  logger.debug('Extension started');
  await initialize();
});

// タブの状態変更を監視
chrome.tabs.onActivated.addListener(async activeInfo => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    (self as any).updateArticleExtractionState(tab.id, tab.url);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    (self as any).updateArticleExtractionState(tabId, tab.url);
  }
});

// グローバル型定義
declare global {
  interface ServiceWorkerGlobalScope {
    updateArticleExtractionState: (tabId: number, url: string) => Promise<void>;
  }
}
