import { chromeAPI } from '@/api';
import { MENU_ITEMS } from '@/models';
import { ArticleStore } from '@/store';
import { logger } from '@/utils';

export class ContextMenuService {
  constructor(private articleStore: ArticleStore) {
    this.setupClickHandler();
  }

  async createMenu() {
    logger.debug('Creating context menu');
    await chrome.contextMenus.removeAll();

    if (this.articleStore.getState().isArticleExtracted) {
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
    chrome.contextMenus.onClicked.addListener((info, tab) => {
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
