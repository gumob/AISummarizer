import { ContextMenuService } from '@/services/contextMenu';
import { BackgroundThemeService } from '@/services/theme';
import {
  ArticleStore,
  ThemeStore,
} from '@/store';
import { logger } from '@/utils';

async function initialize() {
  logger.debug('Initializing background script');

  const themeStore = new ThemeStore();
  const articleStore = new ArticleStore();

  const themeService = new BackgroundThemeService(themeStore);
  const contextMenuService = new ContextMenuService(articleStore);

  await themeService.initialize();
  await contextMenuService.createMenu();

  // 記事抽出状態の更新をエクスポート
  (self as any).updateArticleExtractionState = (extracted: boolean) => {
    articleStore.setArticleExtracted(extracted);
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

// グローバル型定義
declare global {
  interface ServiceWorkerGlobalScope {
    updateArticleExtractionState: (extracted: boolean) => void;
  }
}
