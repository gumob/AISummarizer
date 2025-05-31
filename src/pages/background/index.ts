import { ContextMenuService } from '@/services/contextMenu';
import { BackgroundThemeService } from '@/services/theme';
import { logger } from '@/utils';

async function initialize() {
  logger.debug('Initializing background script');

  const themeService = new BackgroundThemeService();
  const contextMenuService = new ContextMenuService();

  await themeService.initialize();
  await contextMenuService.createMenu();

  // 記事抽出状態の更新をエクスポート
  (self as any).updateArticleExtractionState = (extracted: boolean) => {
    // useArticleStore.getState().setArticleExtracted(extracted);
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
