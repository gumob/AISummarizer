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

  /** Export the article extraction state update */
  (self as any).updateArticleExtractionState = (extracted: boolean) => {
    articleStore.setArticleExtracted(extracted);
    contextMenuService.createMenu();
  };
}

/** Event listener for the extension installation */
chrome.runtime.onInstalled.addListener(async details => {
  logger.debug('Extension installed');
  await initialize();
});

/** Event listener for the extension startup */
chrome.runtime.onStartup.addListener(async () => {
  logger.debug('Extension started');
  await initialize();
});

/** Global type definition */
declare global {
  interface ServiceWorkerGlobalScope {
    updateArticleExtractionState: (extracted: boolean) => void;
  }
}
