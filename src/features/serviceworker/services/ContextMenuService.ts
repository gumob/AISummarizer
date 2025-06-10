import { db } from '@/db/Database';
import { MENU_ITEMS } from '@/models';
import {
  isBrowserSpecificUrl,
  isExtractionDenylistUrl,
  logger,
} from '@/utils';

export class ContextMenuService {
  constructor(onClick: (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => void) {
    chrome.contextMenus.onClicked.addListener(onClick.bind(this));
  }

  async createMenu() {
    await this.removeMenu();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url && !isBrowserSpecificUrl(tab.url) && !(await isExtractionDenylistUrl(tab.url))) {
      this.createFullMenu();
    } else {
      this.createBasicMenu();
    }
  }

  private async removeMenu() {
    try {
      await chrome.contextMenus.removeAll();
    } catch (error) {
      logger.error('🧑‍🍳📃', '[ContextMenuService.tsx]', '[removeMenu]', 'Failed to remove context menu:', error);
    }
  }

  private async createFullMenu() {
    try {
      logger.debug('🧑‍🍳📃', '[ContextMenuService.tsx]', '[createFullMenu]', 'Creating full menu');
      const root = chrome.contextMenus.create({
        id: MENU_ITEMS.ROOT.id,
        title: MENU_ITEMS.ROOT.title,
        contexts: ['page' as chrome.contextMenus.ContextType],
      });

      /** Create AI service menu items */
      for (const service of MENU_ITEMS.AI_SERVICES) {
        chrome.contextMenus.create({
          id: service.id,
          title: service.title,
          contexts: ['page' as chrome.contextMenus.ContextType],
          parentId: root,
        });
      }

      /** Create first divider */
      chrome.contextMenus.create({
        type: 'separator',
        contexts: ['page' as chrome.contextMenus.ContextType],
        parentId: root,
        id: 'divider1',
      });

      /** Create copy option */
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url && (await db.getArticleByUrl(tab.url))?.is_success) {
        chrome.contextMenus.create({
          id: MENU_ITEMS.COPY.id,
          title: MENU_ITEMS.COPY.title,
          contexts: ['page' as chrome.contextMenus.ContextType],
          parentId: root,
        });
      }

      /** Create extract option */
      chrome.contextMenus.create({
        id: MENU_ITEMS.EXTRACT.id,
        title: MENU_ITEMS.EXTRACT.title,
        contexts: ['page' as chrome.contextMenus.ContextType],
        parentId: root,
      });

      /** Create second divider */
      chrome.contextMenus.create({
        type: 'separator',
        contexts: ['page' as chrome.contextMenus.ContextType],
        parentId: root,
        id: 'divider2',
      });

      /** Create settings option */
      chrome.contextMenus.create({
        id: MENU_ITEMS.SETTINGS.id,
        title: MENU_ITEMS.SETTINGS.title,
        contexts: ['page' as chrome.contextMenus.ContextType],
        parentId: root,
      });
    } catch (error) {
      logger.error('🧑‍🍳📃', '[ContextMenuService.tsx]', '[createFullMenu]', 'Failed to create full menu:', error);
    }
  }

  private createBasicMenu() {
    try {
      logger.debug('🧑‍🍳📃', '[ContextMenuService.tsx]', '[createBasicMenu]', 'Creating basic menu');
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
    } catch (error) {
      logger.error('🧑‍🍳📃', '[ContextMenuService.tsx]', '[createBasicMenu]', 'Failed to create basic menu:', error);
    }
  }
}
