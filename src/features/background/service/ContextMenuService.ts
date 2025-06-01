import { chromeAPI } from '@/api';
import { ArticleExtractionService } from '@/features/content/service/ArticleExtractionService';
import { MENU_ITEMS } from '@/models';
import { useArticleStore } from '@/stores/ArticleStore';
import { logger } from '@/utils';

export class ContextMenuService {
  private articleExtractionService: ArticleExtractionService;

  constructor() {
    this.articleExtractionService = new ArticleExtractionService();
    this.setupClickHandler();
  }

  async createMenu() {
    logger.debug('Creating context menu');
    await chrome.contextMenus.removeAll();

    if (useArticleStore.getState().isArticleExtracted) {
      this.createFullMenu();
    } else {
      this.createBasicMenu();
    }
  }

  private createFullMenu() {
    const root = chrome.contextMenus.create({
      id: MENU_ITEMS.ROOT.id,
      title: MENU_ITEMS.ROOT.title,
      contexts: ['page' as chrome.contextMenus.ContextType],
    });

    // Create AI service menu items
    for (const service of MENU_ITEMS.AI_SERVICES) {
      chrome.contextMenus.create({
        id: service.id,
        title: service.title,
        contexts: ['page' as chrome.contextMenus.ContextType],
        parentId: root,
      });
    }

    // Create first divider
    chrome.contextMenus.create({
      type: 'separator',
      contexts: ['page' as chrome.contextMenus.ContextType],
      parentId: root,
      id: 'divider1',
    });

    // Create copy option
    chrome.contextMenus.create({
      id: MENU_ITEMS.COPY.id,
      title: MENU_ITEMS.COPY.title,
      contexts: ['page' as chrome.contextMenus.ContextType],
      parentId: root,
    });

    // Create extract option
    chrome.contextMenus.create({
      id: MENU_ITEMS.EXTRACT.id,
      title: MENU_ITEMS.EXTRACT.title,
      contexts: ['page' as chrome.contextMenus.ContextType],
      parentId: root,
    });

    // Create second divider
    chrome.contextMenus.create({
      type: 'separator',
      contexts: ['page' as chrome.contextMenus.ContextType],
      parentId: root,
      id: 'divider2',
    });

    // Create settings option
    chrome.contextMenus.create({
      id: MENU_ITEMS.SETTINGS.id,
      title: MENU_ITEMS.SETTINGS.title,
      contexts: ['page' as chrome.contextMenus.ContextType],
      parentId: root,
    });
  }

  private createBasicMenu() {
    const root = chrome.contextMenus.create({
      id: MENU_ITEMS.NOT_AVAILABLE.id,
      title: MENU_ITEMS.NOT_AVAILABLE.title,
      contexts: ['page' as chrome.contextMenus.ContextType],
    });
    chrome.contextMenus.create({
      id: MENU_ITEMS.SETTINGS.id,
      title: MENU_ITEMS.SETTINGS.title,
      contexts: ['page' as chrome.contextMenus.ContextType],
      parentId: root,
    });
  }

  private setupClickHandler() {
    chrome.contextMenus.onClicked.addListener(async (info, tab) => {
      if (!tab?.id) return;

      switch (info.menuItemId) {
        case 'chatgpt':
          logger.debug('ChatGPT clicked');
          break;
        case 'gemini':
          logger.debug('Gemini clicked');
          break;
        case 'claude':
          logger.debug('Claude clicked');
          break;
        case 'grok':
          logger.debug('Grok clicked');
          break;
        case 'perplexity':
          logger.debug('Perplexity clicked');
          break;
        case 'deepseek':
          logger.debug('Deepseek clicked');
          break;
        case 'copy':
          logger.debug('Copy clicked');
          break;
        case 'extract':
          logger.debug('Extract clicked');
          if (tab) {
            const isExtracted = await this.articleExtractionService.extractArticle(tab);
            if (isExtracted) {
              (self as any).updateArticleExtractionState(tab.id, tab.url!);
            }
          }
          break;
        case 'settings':
          logger.debug('Settings clicked');
          if (tab?.id) {
            chromeAPI.openSidePanel(tab.windowId);
          }
          break;
      }
    });
  }
}
